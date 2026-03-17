import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { promos, promoProducts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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

    // Map to include selectedProducts array for frontend
    const mappedPromos = allPromos.map(p => ({
      ...p,
      selectedProducts: (p as any).promoProducts?.map((pp: any) => pp.productId) || []
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

      // 2. If choice target, insert to promo_products
      if (body.targetTipe === 'pilihan' && body.selectedProducts?.length > 0) {
        const productEntries = body.selectedProducts.map((pid: string) => ({
          promoId: newPromo.id,
          productId: pid,
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
