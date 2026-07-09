import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, products, catalogItems } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    
    // In future: join with customers and orderItems
    const allOrders = await db
      .select({
        id: orders.id,
        fromNumber: orders.fromNumber,
        fromName: orders.fromName,
        productId: orders.productId,
        catalogItemId: orders.catalogItemId,
        produk: sql<string>`COALESCE(${products.nama}, ${catalogItems.nama})`, // Ambil nama produk/katalog
        jumlah: orders.jumlah,
        total: orders.totalHarga,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(catalogItems, eq(orders.catalogItemId, catalogItems.id))
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json(allOrders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
