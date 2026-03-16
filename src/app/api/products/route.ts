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

    const newProduct = await db.insert(products).values({
      tenantId,
      nama: body.nama,
      tipe: body.tipe,
      harga: Number(body.harga),
      deskripsi: body.deskripsi || null,
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
