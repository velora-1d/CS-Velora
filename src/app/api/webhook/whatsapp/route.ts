import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, chatLogs, waSessions } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
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
    };

    // 1. Parse Provider Payload
    if (body.event === "message.created") {
      // WAHA
      messageData = {
        from: body.payload.from.split("@")[0],
        body: body.payload.body,
        provider: "waha",
        identifier: body.session,
        name: body.payload.pushName || "",
      };
      // Skip if message is from the bot itself
      if (body.payload.fromMe) return NextResponse.json({ status: "skipped_from_me" });
    } else if (body.sender && body.message && body.device) {
      // Fonnte
      messageData = {
        from: body.sender,
        body: body.message,
        provider: "fonnte",
        identifier: body.device,
        name: body.name || "",
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

    // 4. Log Incoming Message
    await db.insert(chatLogs).values({
      tenantId: tenant.id,
      fromNumber: messageData.from,
      message: messageData.body,
      isAi: false,
      isHuman: true,
    });

    // 5. Check Bot Availability & AI Settings
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

      const history = historyLogs.reverse().map(log => ({
        role: log.isAi ? "assistant" : "user",
        content: log.message || log.reply || "",
      }));

      // Delay mengikuti setting dari dashboard Bot Settings (tanpa cap)
      const delayMin = settings?.delayMin || 1000;
      const delayMax = settings?.delayMax || 3000;
      const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;

      // Start typing indicator BEFORE AI call
      if (settings?.typingIndicator !== false) {
        await setWhatsAppPresence(tenant.id, messageData.from, "typing");
      }

      // Jalankan delay dan AI completion secara paralel
      const [aiReply] = await Promise.all([
        getAiCompletion(tenant.id, messageData.body, history, undefined, messageData.from, messageData.name),
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
