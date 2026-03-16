import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { faqs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const body = await req.json();

    if (!body.pertanyaan?.trim() || !body.jawaban?.trim()) {
      return NextResponse.json({ error: "Pertanyaan dan jawaban wajib diisi" }, { status: 400 });
    }

    const updated = await db.update(faqs)
      .set({
        pertanyaan: body.pertanyaan.trim(),
        jawaban: body.jawaban.trim(),
      })
      .where(and(eq(faqs.id, id), eq(faqs.tenantId, tenantId)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "FAQ tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PUT /api/faqs/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const deleted = await db.delete(faqs)
      .where(and(eq(faqs.id, id), eq(faqs.tenantId, tenantId)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "FAQ tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/faqs/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
