import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { catalogItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validateCatalogItem } from "@/lib/catalog-validator";

export async function PUT(
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
    const body = await req.json();

    // Check if item exists and belongs to the tenant
    const existingItem = await db.query.catalogItems.findFirst({
      where: and(
        eq(catalogItems.id, id),
        eq(catalogItems.tenantId, tenantId)
      ),
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
    }

    // Validate request body against catalog fields configuration
    const validation = await validateCatalogItem(tenantId, body);

    if (!validation.isValid || !validation.cleanedData) {
      return NextResponse.json({ error: validation.error || "Validasi gagal" }, { status: 400 });
    }

    const { nama, harga, aktif, data } = validation.cleanedData;

    const updatedItem = await db
      .update(catalogItems)
      .set({
        nama,
        harga,
        aktif,
        data,
        updatedAt: new Date(),
      })
      .where(and(eq(catalogItems.id, id), eq(catalogItems.tenantId, tenantId)))
      .returning();

    return NextResponse.json(updatedItem[0]);
  } catch (error) {
    console.error("PUT /api/catalog-items/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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

    const existingItem = await db.query.catalogItems.findFirst({
      where: and(
        eq(catalogItems.id, id),
        eq(catalogItems.tenantId, tenantId)
      ),
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
    }

    await db
      .delete(catalogItems)
      .where(and(eq(catalogItems.id, id), eq(catalogItems.tenantId, tenantId)));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("DELETE /api/catalog-items/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
