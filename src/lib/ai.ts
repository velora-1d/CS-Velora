import { db } from "@/lib/db";
import { products, faqs, promos, aiSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getAiCompletion(tenantId: string, userMessage: string, history: { role: string; content: string }[] = []) {
  const settings = await db.query.aiSettings.findFirst({
    where: eq(aiSettings.tenantId, tenantId),
  });

  if (!settings || !settings.aktif) {
    return null;
  }

  const context = await getBotContext(tenantId);
  const systemPrompt = `
${settings.systemPrompt}

Nama Agent: ${settings.namaAgent}
Tone: ${settings.tone}

BERIKUT ADALAH INFORMASI BISNIS KAMI (GUNAKAN UNTUK MENJAWAB PERTANYAAN):

PRODUK/LAYANAN:
${context.products}

FAQ:
${context.faqs}

PROMO BERJALAN:
${context.promos}

ATURAN:
1. Jawablah dengan ramah sesuai tone.
2. Fokus pada informasi produk dan promo yang tersedia.
3. Jika tidak tahu, arahkan untuk menunggu admin manusia.
4. Gunakan bahasa Indonesia yang baik.
`;

  const baseUrl = process.env.SEED_AI_URL || "https://ai.sumopod.com/v1";
  const apiKey = process.env.SEED_AI_API_KEY;

  if (!apiKey) throw new Error("SEED_AI_API_KEY is not configured");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: settings.model || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("AI API Error:", err);
    throw new Error(`AI Provider failed: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function getBotContext(tenantId: string) {
  const [allProducts, allFaqs, allPromos] = await Promise.all([
    db.query.products.findMany({ where: and(eq(products.tenantId, tenantId), eq(products.aktif, true)) }),
    db.query.faqs.findMany({ where: and(eq(faqs.tenantId, tenantId), eq(faqs.aktif, true)) }),
    db.query.promos.findMany({ where: and(eq(promos.tenantId, tenantId), eq(promos.aktif, true)) }),
  ]);

  const productsContext = allProducts.map(p => 
    `- ${p.nama} (${p.tipe}): Rp ${p.harga.toLocaleString("id-ID")}. ${p.deskripsi || ""}`
  ).join("\n");

  const faqsContext = allFaqs.map(f => 
    `Q: ${f.pertanyaan}\nA: ${f.jawaban}`
  ).join("\n\n");

  const promosContext = allPromos.map(p => 
    `- ${p.judul}: ${p.deskripsi}`
  ).join("\n");

  return {
    products: productsContext || "Tidak ada data produk.",
    faqs: faqsContext || "Tidak ada data FAQ.",
    promos: promosContext || "Tidak ada promo saat ini.",
  };
}
