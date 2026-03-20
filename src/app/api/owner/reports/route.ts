import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tenants, subscriptions, orders } from "@/db/schema";
import { sql, eq, and, gte } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const dateFilter = [];
    if (start) dateFilter.push(gte(tenants.createdAt, new Date(start)));
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.push(sql`${tenants.createdAt} <= ${endDate.toISOString()}`);
    }

    const subDateFilter = [];
    if (start) subDateFilter.push(gte(subscriptions.confirmedAt, new Date(start)));
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      subDateFilter.push(sql`${subscriptions.confirmedAt} <= ${endDate.toISOString()}`);
    }

    // 1. Total Tenants & Growth
    const [tenantStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where status = 'active')`,
        trial: sql<number>`count(*) filter (where status = 'trial')`,
        suspended: sql<number>`count(*) filter (where status = 'suspended' or status = 'expired')`,
      })
      .from(tenants)
      .where(and(...dateFilter));

    // 2. Paket Distribution
    const [paketStats] = await db
      .select({
        basic: sql<number>`count(*) filter (where paket = 'basic')`,
        pro: sql<number>`count(*) filter (where paket = 'pro')`,
      })
      .from(tenants)
      .where(and(...dateFilter));

    // 3. Revenue Data (Total Confirmed Subscriptions)
    const [revenueStats] = await db
      .select({
        total: sql<number>`COALESCE(sum(amount), 0)`,
        thisMonth: sql<number>`COALESCE(sum(amount) filter (where date_trunc('month', confirmed_at) = date_trunc('month', current_date)), 0)`,
      })
      .from(subscriptions)
      .where(and(eq(subscriptions.status, 'active'), ...subDateFilter));

    // 4. GMV Data (Total Product Sales across all tenants via payment gateway / confirmed orders)
    const [gmvStats] = await db
      .select({
        total: sql<number>`COALESCE(sum(total_harga), 0)`,
        thisMonth: sql<number>`COALESCE(sum(total_harga) filter (where date_trunc('month', created_at) = date_trunc('month', current_date)), 0)`,
      })
      .from(orders)
      .where(and(sql`status IN ('konfirmasi', 'proses', 'selesai')`, ...dateFilter));

    // 4. Detail Tenants (for export)
    const tenantList = await db
      .select()
      .from(tenants)
      .where(and(...dateFilter))
      .orderBy(sql`${tenants.createdAt} DESC`);

    return NextResponse.json({
      tenants: {
        total: Number(tenantStats.total),
        active: Number(tenantStats.active),
        trial: Number(tenantStats.trial),
        suspended: Number(tenantStats.suspended),
        list: tenantList,
      },
      paket: {
        basic: Number(paketStats.basic),
        pro: Number(paketStats.pro),
      },
      revenue: {
        total: Number(revenueStats.total),
        thisMonth: Number(revenueStats.thisMonth),
      },
      gmv: {
        total: Number(gmvStats.total),
        thisMonth: Number(gmvStats.thisMonth),
      }
    });

  } catch (error) {
    console.error("[OWNER_REPORTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
