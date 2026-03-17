import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const allProducts = await db.query.products.findMany({
      where: eq(products.tenantId, tenantId),
      orderBy: [desc(products.createdAt)],
    });

    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("GET /api/products error:", error);
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

    // Validasi input wajib
    const VALID_TIPE = ["fisik", "digital", "jasa", "bundel"];
    if (!body.nama?.trim()) {
      return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });
    }
    if (!VALID_TIPE.includes(body.tipe)) {
      return NextResponse.json({ error: `Tipe harus salah satu: ${VALID_TIPE.join(", ")}` }, { status: 400 });
    }
    const harga = Number(body.harga);
    if (isNaN(harga) || harga < 0) {
      return NextResponse.json({ error: "Harga tidak valid" }, { status: 400 });
    }

    const newProduct = await db.insert(products).values({
      tenantId,
      nama: body.nama.trim(),
      tipe: body.tipe,
      harga,
      hargaCoret: body.hargaCoret ? parseInt(body.hargaCoret, 10) : null,
      diskonPersen: body.diskonPersen ? parseInt(body.diskonPersen, 10) : null,
      deskripsi: body.deskripsi?.trim() || null,
      stok: body.stok ? parseInt(body.stok, 10) : null,
      durasi: body.durasi || null,
      linkShopee: body.linkShopee || null,
      linkTiktok: body.linkTiktok || null,
      linkDelivery: body.linkDelivery || null,
      aktif: true,
    }).returning();

    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
