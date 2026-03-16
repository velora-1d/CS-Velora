import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { consultationSlots } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { id } = await params;

    const existingSlot = await db.query.consultationSlots.findFirst({
      where: and(eq(consultationSlots.id, id), eq(consultationSlots.tenantId, tenantId)),
    });

    if (!existingSlot) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    if (existingSlot.status === "terbooking") {
      return NextResponse.json({ error: "Slot sudah terbooking, tidak bisa dihapus." }, { status: 400 });
    }

    const deletedSlot = await db.delete(consultationSlots)
      .where(and(eq(consultationSlots.id, id), eq(consultationSlots.tenantId, tenantId)))
      .returning();

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("DELETE /api/consultations/slots/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
