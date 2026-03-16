import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { faqs } from "@/db/schema";
import { eq, and, not } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const existing = await db.query.faqs.findFirst({
      where: and(eq(faqs.id, id), eq(faqs.tenantId, tenantId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "FAQ tidak ditemukan" }, { status: 404 });
    }

    const updated = await db.update(faqs)
      .set({ aktif: !existing.aktif })
      .where(eq(faqs.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PATCH /api/faqs/[id]/toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
