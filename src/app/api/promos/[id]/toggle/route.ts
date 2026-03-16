import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { promos } from "@/db/schema";
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

    const existingPromo = await db.query.promos.findFirst({
      where: and(eq(promos.id, id), eq(promos.tenantId, tenantId)),
    });

    if (!existingPromo) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    const updatedPromo = await db.update(promos).set({
      aktif: !existingPromo.aktif,
    }).where(and(eq(promos.id, id), eq(promos.tenantId, tenantId))).returning();

    return NextResponse.json(updatedPromo[0]);
  } catch (error) {
    console.error("PATCH /api/promos/[id]/toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
