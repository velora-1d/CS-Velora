import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    const updatedProduct = await db.update(products).set({
      nama: body.nama,
      tipe: body.tipe,
      harga: Number(body.harga),
      hargaCoret: body.hargaCoret ? parseInt(body.hargaCoret, 10) : null,
      diskonPersen: body.diskonPersen ? parseInt(body.diskonPersen, 10) : null,
      deskripsi: body.deskripsi || null,
      stok: body.stok ? parseInt(body.stok, 10) : null,
      durasi: body.durasi || null,
      linkShopee: body.linkShopee || null,
      linkTiktok: body.linkTiktok || null,
      linkDelivery: body.linkDelivery || null,
    }).where(and(eq(products.id, id), eq(products.tenantId, tenantId))).returning();

    if (updatedProduct.length === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
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

    const deletedProduct = await db.delete(products)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .returning();

    if (deletedProduct.length === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
