import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { consultationSlots } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
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
      return NextResponse.json({ error: "Slot sudah terbooking" }, { status: 400 });
    }

    const newStatus = existingSlot.status === "diblokir" ? "tersedia" : "diblokir";

    const updatedSlot = await db.update(consultationSlots).set({
      status: newStatus,
    }).where(and(eq(consultationSlots.id, id), eq(consultationSlots.tenantId, tenantId))).returning();

    return NextResponse.json(updatedSlot[0]);
  } catch (error) {
    console.error("PATCH /api/consultations/slots/[id]/block error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
