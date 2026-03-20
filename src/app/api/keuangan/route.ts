import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, products } from "@/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user.tenantId as string;
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const filters: any[] = [eq(orders.tenantId, tenantId)];
    if (start) filters.push(gte(orders.createdAt, new Date(start)));
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      filters.push(lte(orders.createdAt, endDate));
    }

    // Summary stats
    const [stats] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(total_harga), 0)`,
        totalDiskon: sql<number>`COALESCE(SUM(diskon_amount), 0)`,
        totalPesanan: sql<number>`COUNT(*)`,
        pesananLunas: sql<number>`COUNT(*) FILTER (WHERE status IN ('konfirmasi','proses','selesai'))`,
        pesananPending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
        pesananBatal: sql<number>`COUNT(*) FILTER (WHERE status = 'batal')`,
      })
      .from(orders)
      .where(and(...filters));

    // List detail orders
    const list = await db
      .select({
        id: orders.id,
        fromNumber: orders.fromNumber,
        fromName: orders.fromName,
        produk: products.nama,
        tipe: products.tipe,
        jumlah: orders.jumlah,
        hargaAsli: orders.hargaAsli,
        diskonAmount: orders.diskonAmount,
        total: orders.totalHarga,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .where(and(...filters))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({
      stats: {
        totalRevenue: Number(stats.totalRevenue),
        totalDiskon: Number(stats.totalDiskon),
        totalPesanan: Number(stats.totalPesanan),
        pesananLunas: Number(stats.pesananLunas),
        pesananPending: Number(stats.pesananPending),
        pesananBatal: Number(stats.pesananBatal),
      },
      list,
    });
  } catch (error) {
    console.error("GET /api/keuangan error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
