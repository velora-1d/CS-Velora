import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { promos, promoProducts, catalogItems } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

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

    const result = await db.transaction(async (tx) => {
      // 1. Update promo fields
      const [updatedPromo] = await tx.update(promos).set({
        judul: body.judul,
        deskripsi: body.deskripsi || "",
        tipe: body.tipe || "produk",
        kodeVoucher: body.kodeVoucher || null,
        diskonTipe: body.diskonTipe || "persen",
        diskonValue: body.diskonValue ? parseInt(body.diskonValue, 10) : 0,
        minPembelian: body.minPembelian ? parseInt(body.minPembelian, 10) : 0,
        maxPotongan: body.maxPotongan ? parseInt(body.maxPotongan, 10) : null,
        targetTipe: body.targetTipe,
        tanggalMulai: body.tanggalMulai,
        tanggalBerakhir: body.tanggalBerakhir,
      }).where(and(eq(promos.id, id), eq(promos.tenantId, tenantId))).returning();

      if (!updatedPromo) {
        throw new Error("Promo not found or unauthorized");
      }

      // 2. Synchronize promo_products
      // Delete existing
      await tx.delete(promoProducts).where(eq(promoProducts.promoId, id));

      // Insert new if target is pilihan
      if (body.targetTipe === 'pilihan' && body.selectedProducts?.length > 0) {
        const selectedIds = body.selectedProducts as string[];
        
        // Find which IDs belong to catalogItems
        const catalogMatches = await tx
          .select({ id: catalogItems.id })
          .from(catalogItems)
          .where(and(
            eq(catalogItems.tenantId, tenantId),
            inArray(catalogItems.id, selectedIds)
          ));
          
        const catalogIds = new Set(catalogMatches.map((c) => c.id));

        const productEntries = selectedIds.map((pid: string) => ({
          promoId: id,
          productId: catalogIds.has(pid) ? null : pid,
          catalogItemId: catalogIds.has(pid) ? pid : null,
        }));
        
        await tx.insert(promoProducts).values(productEntries);
      }

      return updatedPromo;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PUT /api/promos/[id] error:", error);
    if (error.message === "Promo not found or unauthorized") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
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

    // Table promo_products has onDelete: cascade, so deleting the promo is enough
    const deletedPromo = await db.delete(promos)
      .where(and(eq(promos.id, id), eq(promos.tenantId, tenantId)))
      .returning();

    if (deletedPromo.length === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("DELETE /api/promos/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
