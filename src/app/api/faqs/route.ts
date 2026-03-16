import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { faqs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const allFaqs = await db.query.faqs.findMany({
      where: eq(faqs.tenantId, tenantId),
      orderBy: [desc(faqs.createdAt)],
    });

    return NextResponse.json(allFaqs);
  } catch (error) {
    console.error("GET /api/faqs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();

    if (!body.pertanyaan?.trim() || !body.jawaban?.trim()) {
      return NextResponse.json({ error: "Pertanyaan dan jawaban wajib diisi" }, { status: 400 });
    }

    const newFaq = await db.insert(faqs).values({
      tenantId,
      pertanyaan: body.pertanyaan.trim(),
      jawaban: body.jawaban.trim(),
      aktif: true,
    }).returning();

    return NextResponse.json(newFaq[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/faqs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
