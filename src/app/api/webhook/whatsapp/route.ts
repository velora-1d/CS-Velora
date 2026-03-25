import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, chatLogs, waSessions } from "@/db/schema";
import { eq, or, and, isNotNull, gte, desc } from "drizzle-orm";
import { sendWhatsAppMessage, setWhatsAppPresence } from "@/lib/whatsapp";
import { getAiCompletion } from "@/lib/ai";
import { checkBotAvailability } from "@/lib/bot-logic";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // max 30 requests per minute per number
const RATE_WINDOW = 60 * 1000; // 1 minute

// ID Tenant Owner khusus untuk Fonnte CS — ambil dari env var, fallback ke hardcoded
const OWNER_TENANT_ID = process.env.OWNER_TENANT_ID || "be8272d9-b74f-4184-9d4b-63322b07dfef";

function isRateLimited(fromNumber: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(fromNumber);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(fromNumber, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return true;
  }

  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Security check: WAHA or Fonnte secret validation
    const wahaSecret = req.headers.get("x-waha-secret") || req.headers.get("x-api-key");
    const fonnteSecret = req.headers.get("x-fonnte-secret");
    
    const envSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    
    if (envSecret && wahaSecret !== envSecret && fonnteSecret !== envSecret) {
      console.warn("Unauthorized webhook attempt blocked.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Incoming Webhook:", JSON.stringify(body, null, 2));

    let messageData = {
      from: "",
      body: "",
      provider: "",
      identifier: "", // session for WAHA, device for Fonnte
      name: "", // pushName or sender name
      isFromMe: false,
      hasMedia: false,
      mediaUrl: "",
      mediaType: "",
    };

    // 1. Parse Provider Payload
    if (body.event === "message.created") {
      // WAHA
      const payloadType = body.payload.type || "text";
      const hasMedia = payloadType !== "chat" && payloadType !== "text";
      
      messageData = {
        from: body.payload.fromMe ? body.payload.to?.split("@")[0] || "" : body.payload.from?.split("@")[0] || "",
        body: body.payload.body || "",
        provider: "waha",
        identifier: body.session,
        name: body.payload.pushName || "",
        isFromMe: body.payload.fromMe === true,
        hasMedia: hasMedia,
        mediaUrl: "", // WAHA local API URL tidak public, fallback ke teks
        mediaType: payloadType,
      };
    } else if (body.sender && body.device) {
      // Fonnte
      messageData = {
        from: body.sender,
        body: body.message || "",
        provider: "fonnte",
        identifier: body.device,
        name: body.name || "",
        isFromMe: false, // Fonnte jarang kirim webhook dari pengirim, default false
        hasMedia: !!body.url,
        mediaUrl: body.url || "",
        mediaType: body.url ? "file" : "text",
      };
    } else {
      return NextResponse.json({ error: "Unsupported provider payload" }, { status: 400 });
    }

    // 2. Rate Limiting
    if (isRateLimited(messageData.from)) {
      console.warn(`Rate limited: ${messageData.from}`);
      return NextResponse.json({ status: "rate_limited" }, { status: 429 });
    }

    // 3. Find Tenant — cari dari waSessions (Multi-WA) atau fallback ke kolom lama
    let tenant = await db.query.tenants.findFirst({
      where: or(
        eq(tenants.waSessionId, messageData.identifier),
        eq(tenants.waNumber, messageData.identifier)
      ),
    });

    if (!tenant) {
      // Cari via tabel waSessions (Multi-WA)
      const waSession = await db.query.waSessions.findFirst({
        where: or(
          eq(waSessions.sessionId, messageData.identifier),
          eq(waSessions.waNumber, messageData.identifier),
          // Fallback: cleaning number
          eq(waSessions.waNumber, messageData.from)
        ),
        columns: { tenantId: true },
      });

      if (waSession) {
        tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, waSession.tenantId),
        });
      }
    }

    // fallback mapping untuk Fonnte owner / khusus
    if (!tenant) {
      if (messageData.provider === "fonnte") {
        console.log("Fonnte provider detected without specific mapping, routing to Owner CS.");
        tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, OWNER_TENANT_ID)
        });
      } else {
        console.log("No tenant found, checking global mapping for identifier:", messageData.identifier);
        // Jika identifier (device) adalah nomor WA, coba cari di tenants.waNumber
        tenant = await db.query.tenants.findFirst({
          where: eq(tenants.waNumber, messageData.identifier)
        });
      }
    }

    if (!tenant) {
      console.error("Tenant not found for identifier:", messageData.identifier, "from:", messageData.from);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Media Context Extractor & Fallback Injection
    let imageUrlForAi: string | undefined = undefined;
    
    if (messageData.hasMedia) {
      const isImage = 
        messageData.provider === "waha" ? messageData.mediaType === "image" :
        (messageData.mediaUrl ? !!messageData.mediaUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) : false);

      const isAudio = 
        messageData.provider === "waha" ? (messageData.mediaType === "audio" || messageData.mediaType === "ptt") :
        (messageData.mediaUrl ? !!messageData.mediaUrl.match(/\.(ogg|mp3|mp4|wav|m4a|aac)$/i) : false);

      const isPdf = 
        (messageData.mediaUrl ? !!messageData.mediaUrl.match(/\.pdf$/i) : false) || messageData.mediaType === "document";
        
      if (isImage && messageData.mediaUrl) {
        imageUrlForAi = messageData.mediaUrl;
      } else if (isAudio && messageData.mediaUrl) {
        // Transcribe Audio via Whisper
        try {
          const audioRes = await fetch(messageData.mediaUrl);
          if (!audioRes.ok) throw new Error("Gagal mengunduh audio dari provider");
          const audioBlob = await audioRes.blob();
          
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.ogg");
          formData.append("model", "whisper-1");
          
          const whisperBaseUrl = (process.env.SEED_AI_URL || "https://api.openai.com/v1").replace(/\/chat\/completions/, "").replace(/\/$/, "");
          const apiKey = process.env.SEED_AI_API_KEY || process.env.OPENAI_API_KEY;
          
          const transRes = await fetch(`${whisperBaseUrl}/audio/transcriptions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
            },
            body: formData,
          });
          
          if (transRes.ok) {
            const transData = await transRes.json();
            messageData.body = `[PELANGGAN MENGIRIM PESAN SUARA (VOICE NOTE)]\nTranskripsi Internal: "${transData.text}"\n\n${messageData.body}`;
          } else {
            console.error("Whisper error:", await transRes.text());
            throw new Error("Gagal transkripsi Whisper");
          }
        } catch (e) {
          console.error("Transcription error:", e);
          messageData.body += `\n\n[Sistem: Pelanggan mengirimkan Voice Note / Pesan Suara. Sistem AI Anda sementara gagal mendengarkannya. Tolong balas dengan sopan dan minta klien merangkumnya dalam bentuk teks.]`;
        }
      } else if (isPdf && messageData.mediaUrl) {
        // Ekstraksi Teks PDF
        try {
          const docRes = await fetch(messageData.mediaUrl);
          if (!docRes.ok) throw new Error("Gagal mengunduh dokumen dari provider");
          const arrayBuffer = await docRes.arrayBuffer();
          
          // Dynamic import agar tidak memberatkan loading awal rute
          const pdfParseModule = await import('pdf-parse');
          const pdfParse = (pdfParseModule as any).default || pdfParseModule;
          // Di Next.js Node runtime, pastikan buffer berbentuk Buffer NodeJS
          const pdfData = await pdfParse(Buffer.from(arrayBuffer));
          
          // Batasi maksimal teks ke API, misalnya 2000 karakter agar token tidak meledak
          const extractedText = pdfData.text.replace(/\n+/g, ' ').substring(0, 2000);
          messageData.body = `[PELANGGAN MENGIRIM DOKUMEN PDF]\nIsi Teks PDF (Otomatis Ekstrak): "${extractedText}"\n\n${messageData.body}`;
        } catch (e) {
          console.error("PDF Extraction error:", e);
          messageData.body += `\n\n[Sistem: Pelanggan mengirimkan sebuah dokumen PDF. Dokumen gagal terbaca isinya (mungkin diproteksi password / terlalu besar). Tolong penuhi kebutuhan pelanggan dan balas dengan ramah menanyakan apa tujuan dari PDF tersebut.]`;
        }
      } else {
        const attachType = messageData.mediaType || "file/lampiran";
        messageData.body += `\n\n[Sistem: Pelanggan mengirimkan ${attachType}. Anda belum memiliki akses untuk membaca isi dari file ini secara langsung. Tolong balas dengan ramah kepada pelanggan, mintalah mereka menjelaskan apa isi dokumen atau lampiran tersebut agar Anda bisa membantu lebih lanjut.]`;
      }
    }

    // 4. Handle fromMe (Manual Reply from Admin's phone)
    if (messageData.isFromMe) {
      await db.insert(chatLogs).values({
        tenantId: tenant.id,
        fromNumber: messageData.from,
        message: "", // Kosong karena ini adalah balasan
        reply: messageData.body,
        isAi: false,
        isHuman: true, // Tandai sebagai balasan dari admin manusia
      });
      return NextResponse.json({ status: "human_reply_logged" });
    }

    // 4.5 Log Incoming Message from Customer
    await db.insert(chatLogs).values({
      tenantId: tenant.id,
      fromNumber: messageData.from,
      message: messageData.body,
      isAi: false,
      isHuman: true,
    });

    // 5. Check Human Handover Cooldown (2 Hours)
    // Jika admin membalas secara manual kurang dari 2 jam yang lalu, jangan proses dengan AI.
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const lastHumanReply = await db.query.chatLogs.findFirst({
      where: and(
        eq(chatLogs.tenantId, tenant.id),
        eq(chatLogs.fromNumber, messageData.from),
        eq(chatLogs.isHuman, true),
        isNotNull(chatLogs.reply),
        gte(chatLogs.timestamp, twoHoursAgo)
      ),
      orderBy: [desc(chatLogs.timestamp)],
    });

    if (lastHumanReply) {
      console.log(`[Handover] Skipping AI for ${messageData.from} due to active human cooldown.`);
      return NextResponse.json({ status: "human_cooldown_active" });
    }

    // 6. Check Bot Availability & AI Settings
    const { available, settings } = await checkBotAvailability(tenant.id);
    
    if (!available) {
      const offlineMsg = settings?.pesanOffline || "Maaf, kami sedang offline.";
      await sendWhatsAppAndLog(tenant.id, messageData.from, offlineMsg, false);
      return NextResponse.json({ status: "offline_replied" });
    }

    // 6. Get AI Response
    try {
      // Get last 5 messages for context
      const historyLogs = await db.query.chatLogs.findMany({
        where: and(
          eq(chatLogs.tenantId, tenant.id),
          eq(chatLogs.fromNumber, messageData.from)
        ),
        orderBy: (chatLogs, { desc }) => [desc(chatLogs.timestamp)],
        limit: 20,
      });

      const history = historyLogs.reverse().map(log => {
        // Balasan admin (isHuman=true, isAi=false, message="") adalah asisten di mata AI
        // Customer (isHuman=true, isAi=false, message!=="") adalah user
        const isFromAdmin = log.isHuman === true && !log.message && !!log.reply;
        return {
          role: (log.isAi || isFromAdmin) ? "assistant" : "user",
          content: isFromAdmin ? `[Manajer/Admin sebelumnya membalas]: ${log.reply}` : (log.message || log.reply || ""),
        };
      });

      // Delay mengikuti setting dari dashboard Bot Settings (tanpa cap)
      const delayMin = settings?.delayMin || 1000;
      const delayMax = settings?.delayMax || 3000;
      const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;

      // Start typing indicator BEFORE AI call
      if (settings?.typingIndicator !== false) {
        await setWhatsAppPresence(tenant.id, messageData.from, "typing");
      }

      // Phase 5: Multi-Agent Triage (Klasifikasi Intent Cepat)
      let promptOverrides: any = undefined;
      try {
        const routerPrompt = `Kelasifikasikan intent pesan terakhir pengguna ke dalam 2 kategori:
1. "sales": Bertanya produk, harga, ketersediaan, stok, ingin beli, sapaan halo.
2. "support": Komplain, barang rusak, retur, marah, pengiriman lambat, masalah teknis, refund.
Balas HANYA dengan satu kata persis: "sales" atau "support".`;
        const baseUrl = process.env.SEED_AI_URL || "https://ai.sumopod.com/v1";
        const apiKey = process.env.SEED_AI_API_KEY;
        const routerRes = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{role: "system", content: routerPrompt}, {role: "user", content: messageData.body}], temperature: 0 })
        });
        if (routerRes.ok) {
          const routerData = await routerRes.json();
          const intent = routerData.choices[0].message.content.toLowerCase();
          
          if (intent.includes("support")) {
            promptOverrides = {
              systemPrompt: "Anda adalah asisten AI Customer Service. \n\n[MODE SUPPORT KOMPLAIN AKTIF: Sistem mendeteksi pelanggan ini sedang menyampaikan masalah. Tanggapi dengan NADA YANG SANGAT EMPATIK dan SANGAT MEMINTA MAAF jika ada ketidaknyamanan. JANGAN coba berjualan atau promosi apapun, fokus penuh pada mendengarkan masalah, meminta maaf, dan mencari jalan keluar / retur.]",
              tone: "empatik, simpatik, penuh maaf, dan profesional"
            };
          }
        }
      } catch (e) { console.error("Router triage error:", e); }

      // Jalankan delay dan AI completion secara paralel
      const [aiReply] = await Promise.all([
        getAiCompletion(tenant.id, messageData.body, history, promptOverrides, messageData.from, messageData.name, imageUrlForAi),
        new Promise(resolve => setTimeout(resolve, delay)),
      ]);

      if (aiReply) {
        // Stop typing indicator
        if (settings?.typingIndicator !== false) {
          await setWhatsAppPresence(tenant.id, messageData.from, "paused");
        }

        const sent = await sendWhatsAppAndLog(tenant.id, messageData.from, aiReply, true);
        return NextResponse.json({ status: sent ? "ai_replied" : "send_failed" });
      }
    } catch (aiError) {
      console.error("AI Error:", aiError);
    }

    return NextResponse.json({ status: "no_action" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function sendWhatsAppAndLog(tenantId: string, to: string, message: string, isAi: boolean): Promise<boolean> {
  try {
    await sendWhatsAppMessage(tenantId, to, message);
    
    await db.insert(chatLogs).values({
      tenantId,
      fromNumber: to,
      message: "",
      reply: message,
      isAi: isAi,
      isHuman: false,
    });
    return true;
  } catch (error) {
    console.error("Failed to send WA or log reply:", error);
    return false; // Kembalikan false agar caller tahu pengiriman gagal
  }
}
