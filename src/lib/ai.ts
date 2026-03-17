import { db } from "@/lib/db";
import { products, faqs, promos, aiSettings, tenants, paymentMethods, orders, consultationSlots } from "@/db/schema";
import { eq, and, asc, gte, desc } from "drizzle-orm";

export async function getAiCompletion(
  tenantId: string, 
  userMessage: string, 
  history: { role: string; content: string }[] = [],
  overrides?: Partial<{ systemPrompt: string; namaAgent: string; model: string; tone: string }>,
  fromNumber?: string
) {
  const settings = await db.query.aiSettings.findFirst({
    where: eq(aiSettings.tenantId, tenantId),
  });

  const finalSettings = {
    systemPrompt: overrides?.systemPrompt ?? settings?.systemPrompt ?? "You are a helpful assistant.",
    namaAgent: overrides?.namaAgent ?? settings?.namaAgent ?? "Velora",
    model: overrides?.model ?? settings?.model ?? "gpt-4o",
    tone: overrides?.tone ?? settings?.tone ?? "semi-formal",
    aktif: settings?.aktif ?? true,
  };

  if (!finalSettings.aktif && !overrides) {
    return null;
  }

  const context = await getBotContext(tenantId, fromNumber);
  const systemPrompt = `
JANGAN PERNAH MEMBERIKAN INFORMASI SELAIN YANG ADA DI KONTEKS DI BAWAH INI.
JIKA KONTAK BERTANYA TENTANG HAL DI LUAR KONTEKS, ARAHKAN UNTUK MENUNGGU ADMIN.

${finalSettings.systemPrompt}

TENTANG TOKO KAMI:
${context.profile}

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

ATURAN KOMUNIKASI:
1. Jawablah dengan ramah sesuai tone (${finalSettings.tone}).
2. Fokus pada informasi produk dan promo yang tersedia.
3. JIKA PELANGGAN SETUJU MEMBELI: panggil fungsi \`create_order\` dengan ID produk yang sesuai lalu berikan link checkout yang didapat ke pelanggan.
4. Jika ditanya soal biaya/pembayaran (tanpa order langsung), infokan metode: ${context.payments}.
5. Gunakan Bahasa Indonesia yang baik dan manusiawi.
6. Jika pelanggan sudah pernah order, referensikan riwayat ordernya.
7. Jika ada slot konsultasi tersedia, tawarkan secara proaktif.
`;

  const baseUrl = process.env.SEED_AI_URL || "https://ai.sumopod.com/v1";
  const apiKey = process.env.SEED_AI_API_KEY;

  if (!apiKey) throw new Error("SEED_AI_API_KEY is not configured");

  const tools = [
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

  let currentMessages: any[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  // Loop untuk menghandle tool calling (maksimal 2 iterasi)
  for (let i = 0; i < 2; i++) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
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
      currentMessages.push(responseMessage); // Masukkan response tool_calls ke riwayat

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === "create_order") {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const product = await db.query.products.findFirst({ where: eq(products.id, args.product_id) });
            
            if (!product) {
              currentMessages.push({ role: "tool", tool_call_id: toolCall.id, content: "Gagal: Produk tidak ditemukan." });
              continue;
            }

            const totalHarga = product.harga * args.jumlah;
            const orderResult = await db.insert(orders).values({
              tenantId,
              fromNumber: fromNumber || "unknown",
              productId: product.id,
              jumlah: args.jumlah,
              totalHarga,
              alamat: args.alamat || null,
              status: "pending",
            }).returning({ id: orders.id });

            const orderId = orderResult[0].id;
            let replyContent = `Sukses. Order ID: ${orderId.substring(0, 8)}. Total: Rp ${totalHarga.toLocaleString("id-ID")}. `;

            if (context.tenant?.pakasirProjectSlug) {
              const checkoutUrl = `https://pakasir.com/p/${context.tenant.pakasirProjectSlug}?amount=${totalHarga}&ref=ORD-${orderId}&title=Order-${encodeURIComponent(product.nama.substring(0, 50))}`;
              replyContent += `Berikan BERITA BAIK ke pelanggan bahwa pesanan berhasil dicatat dan arahkan mereka untuk membayar melalui link berikut: ${checkoutUrl}`;
            } else {
              replyContent += `Minta pelanggan mentransfer sesuai instruksi pembayaran admin.`;
            }

            currentMessages.push({ role: "tool", tool_call_id: toolCall.id, content: replyContent });
          } catch (e: any) {
            console.error("Tool execution error:", e);
            currentMessages.push({ role: "tool", tool_call_id: toolCall.id, content: `Error: ${e.message}` });
          }
        }
      }
    } else {
      // Selesai jika tidak ada tool calls lagi
      return responseMessage.content;
    }
  }

  // Jika setelah 2 loop masih ada tool calls (fallback darurat)
  return "Maaf, sistem sedang memproses pesanan Anda. Mohon tunggu sebentar.";
}

async function getBotContext(tenantId: string, fromNumber?: string) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const [tenant, allProducts, allFaqs, allPromos, allPayments, availableSlots] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
    db.query.products.findMany({ where: and(eq(products.tenantId, tenantId), eq(products.aktif, true)) }),
    db.query.faqs.findMany({ where: and(eq(faqs.tenantId, tenantId), eq(faqs.aktif, true)) }),
    db.query.promos.findMany({ 
      where: and(
        eq(promos.tenantId, tenantId), 
        eq(promos.aktif, true),
        gte(promos.tanggalBerakhir, today) // Filter expired promos
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

  // Fetch order history for the specific user if fromNumber is provided
  let userOrders: typeof orders.$inferSelect[] = [];
  if (fromNumber) {
    userOrders = await db.query.orders.findMany({
      where: and(eq(orders.tenantId, tenantId), eq(orders.fromNumber, fromNumber)),
      orderBy: [desc(orders.createdAt)],
      limit: 5,
    });
  }

  const profileContext = tenant ? `Toko: ${tenant.namaToko}\nDeskripsi: ${tenant.deskripsi || "-"}\nLink Shopee: ${tenant.linkShopee || "-"}\nLink TikTok: ${tenant.linkTiktok || "-"}` : "Info toko tidak tersedia.";

  const productsContext = allProducts.map(p => 
    `- [ID: ${p.id}] ${p.nama} (${p.tipe}): Rp ${p.harga.toLocaleString("id-ID")}. ${p.deskripsi || ""}${p.stok !== null ? ` (Stok: ${p.stok})` : ""}${p.durasi ? ` (Durasi: ${p.durasi})` : ""}`
  ).join("\n");

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

  const orderHistoryContext = userOrders.length > 0
    ? userOrders.map(o => `- Order #${o.id.substring(0, 8)} | Status: ${o.status} | Total: Rp ${o.totalHarga.toLocaleString("id-ID")} | Tanggal: ${new Date(o.createdAt).toLocaleDateString("id-ID")}`).join("\n")
    : "";

  return {
    tenant,
    profile: profileContext,
    products: productsContext || "Tidak ada data produk.",
    faqs: faqsContext || "Tidak ada data FAQ.",
    promos: promosContext || "Tidak ada promo saat ini.",
    payments: paymentsContext || "Metode pembayaran akan diinfokan oleh admin.",
    slots: slotsContext || "Tidak ada slot konsultasi tersedia saat ini.",
    orderHistory: orderHistoryContext || "",
  };
}

export { getBotContext };
