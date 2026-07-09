import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { promos, promoProducts, catalogItems } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const allPromos = await db.query.promos.findMany({
      where: eq(promos.tenantId, tenantId),
      orderBy: [desc(promos.createdAt)],
      with: {
        promoProducts: true,
      }
    });

    // Map to include selectedProducts array for frontend (supporting both product and catalog item IDs)
    const mappedPromos = allPromos.map(p => ({
      ...p,
      selectedProducts: (p as any).promoProducts?.map((pp: any) => pp.productId || pp.catalogItemId).filter(Boolean) || []
    }));

    return NextResponse.json(mappedPromos);
  } catch (error) {
    console.error("GET /api/promos error:", error);
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

    const result = await db.transaction(async (tx) => {
      // 1. Insert promo
      const [newPromo] = await tx.insert(promos).values({
        tenantId,
        judul: body.judul,
        deskripsi: body.deskripsi || "",
        tipe: body.tipe,
        kodeVoucher: body.kodeVoucher || null,
        diskonTipe: body.diskonTipe,
        diskonValue: parseInt(body.diskonValue, 10) || 0,
        minPembelian: body.minPembelian ? parseInt(body.minPembelian, 10) : 0,
        maxPotongan: body.maxPotongan ? parseInt(body.maxPotongan, 10) : null,
        targetTipe: body.targetTipe,
        tanggalMulai: body.tanggalMulai,
        tanggalBerakhir: body.tanggalBerakhir,
        aktif: true,
      }).returning();

      // 2. If choice target, insert to promo_products (mapping to product or catalog item accordingly)
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
          promoId: newPromo.id,
          productId: catalogIds.has(pid) ? null : pid,
          catalogItemId: catalogIds.has(pid) ? pid : null,
        }));
        
        await tx.insert(promoProducts).values(productEntries);
      }

      return newPromo;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/promos error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
