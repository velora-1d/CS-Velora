import { db } from "@/lib/db";
import { products, faqs, promos, aiSettings, tenants, paymentMethods, orders, consultationSlots, clients, chatLogs, catalogItems } from "@/db/schema";
import { eq, and, asc, gte, desc } from "drizzle-orm";

// In-memory cache untuk context bot per tenant (TTL 5 menit)
const contextCache = new Map<string, { data: Awaited<ReturnType<typeof _getBotContextRaw>>; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

async function executeTool(
  toolName: string,
  args: any,
  tenantId: string,
  fromNumber?: string,
  fromName?: string,
  context?: any
): Promise<string> {
  if (toolName === "escalate_to_human") {
    try {
      await db.insert(chatLogs).values({
        tenantId,
        fromNumber: fromNumber || "unknown",
        message: "",
        reply: `[SISTEM] AI diberhentikan sejenak (Eskalasi Sentimen/Konteks: ${args.reason}). Segera balas secara manual untuk mengambil alih sesi ini.`,
        isAi: false,
        isHuman: true, // men-trigger batas waktu cooldown 2 jam
      });
      return "Sukses: Obrolan telah dialihkan ke Admin.";
    } catch (e: any) {
      console.error("Tool escalate error:", e);
      return `Error: ${e.message || String(e)}`;
    }
  }

  if (toolName === "create_order") {
    try {
      let product = await db.query.products.findFirst({ where: eq(products.id, args.product_id) });
      let isCatalogItem = false;
      
      if (!product) {
        const catalogItem = await db.query.catalogItems.findFirst({ where: eq(catalogItems.id, args.product_id) });
        if (catalogItem) {
          isCatalogItem = true;
          const data = catalogItem.data as Record<string, unknown>;
          product = {
            id: catalogItem.id,
            tenantId: catalogItem.tenantId,
            nama: catalogItem.nama,
            harga: catalogItem.harga || 0,
            aktif: catalogItem.aktif,
            tipe: (data?.tipe as string) || "fisik",
            hargaCoret: (data?.hargaCoret as number) || null,
            diskonPersen: (data?.diskonPersen as number) || null,
            deskripsi: (data?.deskripsi as string) || null,
            stok: (data?.stok as number) || null,
            durasi: (data?.durasi as string) || null,
            createdAt: catalogItem.createdAt,
            updatedAt: catalogItem.createdAt,
          } as any;
        }
      }
      
      if (!product) {
        return "Gagal: Produk tidak ditemukan.";
      }

      const hargaAsli = product.harga * args.jumlah;
      const today = new Date().toISOString().split("T")[0]; // format YYYY-MM-DD

      // Cari promo aktif yang berlaku untuk produk ini
      const activePromos = await db.query.promos.findMany({
        where: and(
          eq(promos.tenantId, tenantId),
          eq(promos.aktif, true),
        ),
        with: { promoProducts: true },
      });

      let appliedPromo: typeof activePromos[0] | null = null;
      let diskonAmount = 0;

      for (const promo of activePromos) {
        if (today < promo.tanggalMulai || today > promo.tanggalBerakhir) continue;
        if (promo.minPembelian && hargaAsli < promo.minPembelian) continue;
        const isTargetAll = promo.targetTipe === "all";
        const isTargetProduct = (promo as any).promoProducts?.some((pp: any) => 
          pp.productId === product.id || pp.catalogItemId === product.id
        );
        if (!isTargetAll && !isTargetProduct) continue;

        let rawDiskon = 0;
        if (promo.diskonTipe === "persen") {
          rawDiskon = Math.floor((hargaAsli * promo.diskonValue) / 100);
        } else {
          rawDiskon = promo.diskonValue * args.jumlah;
        }
        if (promo.maxPotongan && rawDiskon > promo.maxPotongan) rawDiskon = promo.maxPotongan;

        appliedPromo = promo;
        diskonAmount = rawDiskon;
        break;
      }

      const totalHarga = Math.max(0, hargaAsli - diskonAmount);

      const orderResult = await db.insert(orders).values({
        tenantId,
        fromNumber: fromNumber || "unknown",
        fromName: fromName || null,
        productId: isCatalogItem ? null : product.id,
        catalogItemId: isCatalogItem ? product.id : null,
        jumlah: args.jumlah,
        hargaAsli,
        diskonAmount,
        totalHarga,
        promoId: appliedPromo?.id || null,
        alamat: args.alamat || null,
        status: "pending",
      }).returning({ id: orders.id });

      const orderId = orderResult[0].id;
      const diskonInfo = diskonAmount > 0 
        ? ` (Diskon ${appliedPromo?.judul}: -Rp ${diskonAmount.toLocaleString("id-ID")})` 
        : "";
      let replyContent = `Sukses. Order ID: ORD-${orderId.substring(0, 8)}. Harga asli: Rp ${hargaAsli.toLocaleString("id-ID")}${diskonInfo}. Total bayar: Rp ${totalHarga.toLocaleString("id-ID")}. `;

      if (context?.tenant?.pakasirProjectSlug) {
        const checkoutUrl = `https://app.pakasir.com/pay/${context.tenant.pakasirProjectSlug}/${totalHarga}?order_id=ORD-${orderId}&title=Order-${encodeURIComponent(product.nama.substring(0, 50))}`;
        replyContent += `Berikan BERITA BAIK ke pelanggan bahwa pesanan berhasil dicatat dan arahkan mereka untuk membayar melalui link berikut: ${checkoutUrl}`;
      } else {
        replyContent += `Minta pelanggan mentransfer sesuai instruksi pembayaran yang tersedia.`;
      }

      return replyContent;
    } catch (e: any) {
      console.error("Tool execution error:", e);
      return `Error: ${e.message || String(e)}`;
    }
  }

  return `Gagal: Tool ${toolName} tidak dikenal.`;
}

export async function getAiCompletion(
  tenantId: string, 
  userMessage: string, 
  history: { role: string; content: string }[] = [],
  overrides?: Partial<{ systemPrompt: string; namaAgent: string; model: string; tone: string }>,
  fromNumber?: string,
  fromName?: string,
  imageUrl?: string
) {
  const settings = await db.query.aiSettings.findFirst({
    where: eq(aiSettings.tenantId, tenantId),
  });

  const finalSettings = {
    systemPrompt: overrides?.systemPrompt ?? settings?.systemPrompt ?? "You are a helpful assistant.",
    namaAgent: overrides?.namaAgent ?? settings?.namaAgent ?? "Velora",
    // Model HARUS dikonfigurasi dari dashboard, tidak ada fallback hardcoded
    model: overrides?.model ?? settings?.model ?? "",
    tone: overrides?.tone ?? settings?.tone ?? "semi-formal",
    aktif: settings?.aktif ?? true,
    provider: settings?.provider || "openai",
    apiKey: settings?.apiKey,
    baseUrl: settings?.baseUrl,
  };

  if (!finalSettings.aktif && !overrides) {
    return null;
  }

  // Handle Client Interaction (Database Client & Memory)
  const clientInfo = fromNumber ? await handleClientInteraction(tenantId, fromNumber, fromName) : null;
  const clientStatusContext = clientInfo 
    ? `STATUS PELANGGAN: ${clientInfo.isNew ? "PELANGGAN BARU" : "PELANGGAN LAMA"}\nKONTAK: ${clientInfo.nomor}${clientInfo.nama ? ` (Nama: ${clientInfo.nama})` : ""}${clientInfo.catatan ? `\nCATATAN INTERNAL: ${clientInfo.catatan}` : ""}`
    : "";

  const context = await getBotContext(tenantId, fromNumber);
  const systemPrompt = `
JANGAN PERNAH MEMBERIKAN INFORMASI SELAIN YANG ADA DI KONTEKS DI BAWAH INI.
JIKA KONTAK BERTANYA TENTANG HAL DI LUAR KONTEKS, ARAHKAN UNTUK MENUNGGU ADMIN.

${finalSettings.systemPrompt}

TENTANG TOKO KAMI:
${context.profile}

${clientStatusContext}

NAMA AGENT: ${finalSettings.namaAgent}
TONE: ${finalSettings.tone}

PRODUK/LAYANAN KAMI:
(Perhatikan ID dari tiap produk jika ingin membuat pesanan)
${context.products}

FAQ:
${context.faqs}

PROMO BERJALAN:
${context.promos}

METODE PEMBAYARAN:
${context.payments}

SLOT KONSULTASI TERSEDIA:
${context.slots}

${context.orderHistory ? `RIWAYAT ORDER PELANGGAN INI:\n${context.orderHistory}` : ""}

DETAIL CLIENT (DATABASE):
AI harus mengenali jika ini pelanggan lama dan bersikap lebih akrab jika sesuai tone.
Data Client: ${clientStatusContext || "Baru terdeteksi"}

ATURAN KOMUNIKASI:
1. Jawablah dengan ramah sesuai tone (${finalSettings.tone}).
2. Fokus pada informasi produk dan promo yang tersedia.
3. JIKA PELANGGAN SETUJU MEMBELI: panggil fungsi \`create_order\` dengan ID produk yang sesuai lalu berikan link checkout yang didapat ke pelanggan.
4. Jika ditanya soal biaya/pembayaran (tanpa order langsung), infokan metode: ${context.payments}.
5. Gunakan Bahasa Indonesia yang baik dan manusiawi.
6. Jika pelanggan sudah pernah order, referensikan riwayat ordernya.
7. Jika ada slot konsultasi tersedia, tawarkan secara proaktif.
8. PENTING: Jika pengguna terdeteksi emosi, komplain kasar, ngotot, atau terang-terangan meminta bicara dengan admin, panggil fungsi \`escalate_to_human\` agar admin asli mengambil alih, dan berikan balasan penenang pendek seperti "Mohon maaf atas ketidaknyamanan Anda. Mohon ditunggu, tim CS kami akan segera masuk membantu Anda."
`;

  // Do NOT fallback to global environment keys anymore, only use tenant-specific credentials
  let apiKey = finalSettings.apiKey;
  let baseUrl = finalSettings.baseUrl;

  if (!apiKey || apiKey === "••••••••••••") {
    console.warn(`[AI] Tenant ${tenantId} has not configured their API Key. Skipping.`);
    return null; // Silent skip — user must configure API Key in dashboard
  }

  if (!finalSettings.model) {
    console.warn(`[AI] Tenant ${tenantId} has not configured an AI Model. Skipping.`);
    return null; // Silent skip — user must select a model in dashboard
  }
  
  if (!baseUrl) {
    if (finalSettings.provider === "openai") {
      baseUrl = "https://api.openai.com/v1";
    } else if (finalSettings.provider === "anthropic") {
      baseUrl = "https://api.anthropic.com/v1";
    } else {
      console.warn(`[AI] Tenant ${tenantId} selected custom provider but did not specify Base URL.`);
      return null;
    }
  }

  const isAnthropicStyle = finalSettings.provider === "anthropic" || finalSettings.provider === "anthropic_compatible";
  let apiEndpoint = "";

  if (isAnthropicStyle) {
    if (finalSettings.provider === "anthropic") {
      apiEndpoint = "https://api.anthropic.com/v1/messages";
    } else {
      const base = baseUrl.replace(/\/$/, "");
      apiEndpoint = base.endsWith("/messages") ? base : `${base}/messages`;
    }
  } else {
    if (finalSettings.provider === "openai") {
      apiEndpoint = "https://api.openai.com/v1/chat/completions";
    } else {
      const base = baseUrl.replace(/\/$/, "");
      apiEndpoint = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
    }
  }

  const tools = [
    {
      type: "function",
      function: {
        name: "escalate_to_human",
        description: "Gunakan SECARA OTOMATIS dan LANGSUNG jika pengguna marah, emosi negatif tinggi, mengancam refund/blokir, komplain parah, atau meminta bicara dengan admin manusia. Berfungsi untuk mendiamkan bot sementara agar admin riil bisa segera masuk menangani keluhan.",
        parameters: {
          type: "object",
          properties: {
            reason: { type: "string", description: "Alasan eskalasi, contoh: 'Pelanggan marah', 'Klaim Retur', 'Minta Admin'" }
          },
          required: ["reason"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "create_order",
        description: "Membuat pesanan baru untuk pelanggan. Gunakan fungsi ini jika pelanggan mengonfirmasi ingin membeli produk tertentu.",
        parameters: {
          type: "object",
          properties: {
            product_id: { type: "string", description: "ID produk yang ingin dipesan (dari daftar produk)" },
            jumlah: { type: "integer", description: "Jumlah barang yang dipesan" },
            alamat: { type: "string", description: "Alamat pengiriman jika ada, kosongi jika tidak ada" }
          },
          required: ["product_id", "jumlah"]
        }
      }
    }
  ];

  let userMessageContent: string | any = userMessage;
  if (imageUrl) {
    userMessageContent = [
      { type: "text", text: userMessage || "[Gambar Lampiran]" },
      { type: "image_url", image_url: { url: imageUrl } }
    ];
  }

  const currentMessages: any[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessageContent },
  ];

  // -------------------------------------------------------------
  // PROVIDER 1: ANTHROPIC CLAUDE STYLE
  // -------------------------------------------------------------
  if (isAnthropicStyle) {
    const anthropicTools = tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));

    // Filter messages for Anthropic (no system role in messages, must alternate roles)
    let anthropicMessages = currentMessages.filter((m: any) => m.role !== "system").map((m: any) => {
      let content = m.content;
      if (Array.isArray(content)) {
        content = content.map((c: any) => {
          if (c.type === "image_url") {
            const base64Data = c.image_url?.url?.split("base64,")[1] || "";
            return {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Data,
              },
            };
          }
          return c;
        });
      }
      return { role: m.role, content };
    });

    for (let i = 0; i < 2; i++) {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "x-api-key": apiKey!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: finalSettings.model,
          system: systemPrompt,
          messages: anthropicMessages,
          max_tokens: 1024,
          tools: anthropicTools,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Anthropic API Error:", err);
        throw new Error(`Anthropic Provider failed: ${err}`);
      }

      const data = await response.json();
      const assistantContent = data.content;
      
      anthropicMessages.push({ role: "assistant", content: assistantContent });

      // Find tool_use block
      const toolUseBlock = assistantContent.find((c: any) => c.type === "tool_use");

      if (toolUseBlock) {
        const toolName = toolUseBlock.name;
        const toolArgs = toolUseBlock.input;
        const toolId = toolUseBlock.id;
        
        const toolResult = await executeTool(toolName, toolArgs, tenantId, fromNumber, fromName, context);
        
        anthropicMessages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolId,
              content: toolResult,
            },
          ],
        });
      } else {
        const textBlock = assistantContent.find((c: any) => c.type === "text");
        return textBlock?.text || "";
      }
    }
    
    // Fallback if loop ends
    const lastMsg = anthropicMessages[anthropicMessages.length - 1];
    if (lastMsg && Array.isArray(lastMsg.content)) {
      const textBlock = lastMsg.content.find((c: any) => c.type === "text");
      return textBlock?.text || "";
    }
    return "Maaf, sistem sedang memproses pesanan Anda. Mohon tunggu sebentar.";
  }

  // -------------------------------------------------------------
  // PROVIDER 2: OPENAI OR CUSTOM COMPATIBLE
  // -------------------------------------------------------------
  for (let i = 0; i < 2; i++) {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: finalSettings.model,
        messages: currentMessages,
        temperature: 0.7,
        tools: tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI API Error:", err);
      throw new Error(`AI Provider failed: ${err}`);
    }

    const data = await response.json();
    const responseMessage = data.choices[0].message;

    if (responseMessage.tool_calls) {
      currentMessages.push(responseMessage); // Save to history

      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const replyContent = await executeTool(toolName, toolArgs, tenantId, fromNumber, fromName, context);
        currentMessages.push({ role: "tool", tool_call_id: toolCall.id, content: replyContent });
      }
    } else {
      return responseMessage.content;
    }
  }

  return "Maaf, sistem sedang memproses pesanan Anda. Mohon tunggu sebentar.";
}

async function getBotContext(tenantId: string, fromNumber?: string) {
  // fromNumber bersifat personal, jadi tidak ikut di-cache
  const cacheKey = tenantId;
  const cached = contextCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    // Inject order history secara real-time (tidak di-cache karena per-user)
    const history = fromNumber ? await getOrderHistory(tenantId, fromNumber) : "";
    return { ...cached.data, orderHistory: history };
  }

  const fresh = await _getBotContextRaw(tenantId);
  contextCache.set(cacheKey, { data: fresh, expiresAt: now + CACHE_TTL_MS });

  const history = fromNumber ? await getOrderHistory(tenantId, fromNumber) : "";
  return { ...fresh, orderHistory: history };
}

async function getOrderHistory(tenantId: string, fromNumber: string) {
  const userOrders = await db.query.orders.findMany({
    where: and(eq(orders.tenantId, tenantId), eq(orders.fromNumber, fromNumber)),
    orderBy: [desc(orders.createdAt)],
    limit: 5,
  });
  return userOrders.length > 0
    ? userOrders.map(o => `- Order #${o.id.substring(0, 8)} | Status: ${o.status} | Total: Rp ${o.totalHarga.toLocaleString("id-ID")} | Tanggal: ${new Date(o.createdAt).toLocaleDateString("id-ID")}`).join("\n")
    : "";
}

async function _getBotContextRaw(tenantId: string) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const [tenant, allProducts, allCatalogItems, allFaqs, allPromos, allPayments, availableSlots] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
    db.query.products.findMany({ where: and(eq(products.tenantId, tenantId), eq(products.aktif, true)) }),
    db.query.catalogItems.findMany({ where: and(eq(catalogItems.tenantId, tenantId), eq(catalogItems.aktif, true)) }),
    db.query.faqs.findMany({ where: and(eq(faqs.tenantId, tenantId), eq(faqs.aktif, true)) }),
    db.query.promos.findMany({ 
      where: and(
        eq(promos.tenantId, tenantId), 
        eq(promos.aktif, true),
        gte(promos.tanggalBerakhir, today)
      ) 
    }),
    db.query.paymentMethods.findMany({ where: and(eq(paymentMethods.tenantId, tenantId), eq(paymentMethods.aktif, true)), orderBy: [asc(paymentMethods.urutan)] }),
    db.query.consultationSlots.findMany({
      where: and(
        eq(consultationSlots.tenantId, tenantId),
        eq(consultationSlots.status, "tersedia"),
        gte(consultationSlots.tanggal, today)
      ),
      orderBy: [asc(consultationSlots.tanggal)],
      limit: 10,
    }),
  ]);

  const profileContext = tenant ? `Toko: ${tenant.namaToko}\nDeskripsi: ${tenant.deskripsi || "-"}\nLink Shopee: ${tenant.linkShopee || "-"}\nLink TikTok: ${tenant.linkTiktok || "-"}` : "Info toko tidak tersedia.";

  const legacyProductsCtx = allProducts.map(p => 
    `- [ID: ${p.id}] ${p.nama} (${p.tipe}): Rp ${p.harga.toLocaleString("id-ID")}. ${p.deskripsi || ""}${p.stok !== null ? ` (Stok: ${p.stok})` : ""}${p.durasi ? ` (Durasi: ${p.durasi})` : ""}`
  ).join("\n");

  const catalogItemsCtx = allCatalogItems.map(c => {
    const data = c.data as Record<string, unknown>;
    const tipe = (data?.tipe as string) || "fisik";
    const desc = (data?.deskripsi as string) || "";
    const stok = data?.stok;
    const durasi = data?.durasi;
    
    const customFieldsContext = Object.entries(data || {})
      .filter(([k]) => !["tipe", "deskripsi", "stok", "durasi", "legacy_product_id", "hargaCoret", "diskonPersen"].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
      
    const customInfo = customFieldsContext ? ` (${customFieldsContext})` : "";
    
    return `- [ID: ${c.id}] ${c.nama} (${tipe}): ${c.harga !== null ? `Rp ${c.harga.toLocaleString("id-ID")}` : "Hubungi Admin"}. ${desc}${stok !== undefined && stok !== null ? ` (Stok: ${stok})` : ""}${durasi ? ` (Durasi: ${durasi})` : ""}${customInfo}`;
  }).join("\n");

  const productsContext = [legacyProductsCtx, catalogItemsCtx].filter(Boolean).join("\n");

  const faqsContext = allFaqs.map(f => 
    `Q: ${f.pertanyaan}\nA: ${f.jawaban}`
  ).join("\n\n");

  const promosContext = allPromos.map(p => 
    `- ${p.judul}: ${p.deskripsi} (Berlaku s/d ${p.tanggalBerakhir})`
  ).join("\n");

  const paymentsContext = allPayments.map(p => {
    if (p.tipe === "transfer") {
        return `- Transfer ${p.namaBank}: ${p.nomorRekening} a/n ${p.namaPemilik}`;
    }
    return `- ${p.tipe.toUpperCase()}`;
  }).join("\n");

  const slotsContext = availableSlots.map(s =>
    `- ${s.tanggal} | ${s.jamMulai} - ${s.jamSelesai}`
  ).join("\n");

  return {
    tenant,
    profile: profileContext,
    products: productsContext || "Tidak ada data produk.",
    faqs: faqsContext || "Tidak ada data FAQ.",
    promos: promosContext || "Tidak ada promo saat ini.",
    payments: paymentsContext || "Metode pembayaran akan diinfokan oleh admin.",
    slots: slotsContext || "Tidak ada slot konsultasi tersedia saat ini.",
  };
}

async function handleClientInteraction(tenantId: string, fromNumber: string, fromName?: string) {
  try {
    const existingClient = await db.query.clients.findFirst({
      where: and(eq(clients.tenantId, tenantId), eq(clients.nomor, fromNumber)),
    });

    if (existingClient) {
      // Update last interaction and mark as returning
      const updated = await db.update(clients)
        .set({ 
          lastInteraction: new Date(), 
          isNew: false,
          // Update name if we get it now but didn't have it before
          ...(fromName && !existingClient.nama ? { nama: fromName } : {})
        })
        .where(eq(clients.id, existingClient.id))
        .returning();
      return updated[0];
    } else {
      // Create new client
      const inserted = await db.insert(clients).values({
        tenantId,
        nomor: fromNumber,
        nama: fromName || null,
        isNew: true,
        lastInteraction: new Date(),
      }).returning();
      return inserted[0];
    }
  } catch (error) {
    console.error("Error handling client interaction:", error);
    return null;
  }
}

export { getBotContext, handleClientInteraction };
