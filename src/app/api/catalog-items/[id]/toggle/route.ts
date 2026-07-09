import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { catalogItems } from "@/db/schema";
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

    const existingItem = await db.query.catalogItems.findFirst({
      where: and(eq(catalogItems.id, id), eq(catalogItems.tenantId, tenantId)),
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
    }

    const updatedItem = await db.update(catalogItems).set({
      aktif: !existingItem.aktif,
      updatedAt: new Date(),
    }).where(and(eq(catalogItems.id, id), eq(catalogItems.tenantId, tenantId))).returning();

    return NextResponse.json(updatedItem[0]);
  } catch (error) {
    console.error("PATCH /api/catalog-items/[id]/toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
