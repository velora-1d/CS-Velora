import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders, chatLogs } from "@/db/schema";
import { sql, eq, and, gte } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!session?.user || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const dateFilter = [];
    if (start) dateFilter.push(gte(orders.createdAt, new Date(start)));
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.push(sql`${orders.createdAt} <= ${endDate.toISOString()}`);
    }

    // 1. Order Stats
    const [orderStats] = await db
      .select({
        total: sql<number>`count(*)`,
        success: sql<number>`count(*) filter (where status = 'selesai')`,
        pending: sql<number>`count(*) filter (where status = 'pending')`,
        cancelled: sql<number>`count(*) filter (where status = 'batal')`,
        revenue: sql<number>`COALESCE(sum(total_harga), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), ...dateFilter));

    // 2. Chat Stats
    const chatDateFilter = [];
    if (start) chatDateFilter.push(gte(chatLogs.timestamp, new Date(start)));
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      chatDateFilter.push(sql`${chatLogs.timestamp} <= ${endDate.toISOString()}`);
    }

    const [chatStats] = await db
      .select({
        totalSessions: sql<number>`count(distinct from_number)`,
        totalMessages: sql<number>`count(*)`,
      })
      .from(chatLogs)
      .where(and(eq(chatLogs.tenantId, tenantId), ...chatDateFilter));

    // 3. Order Trend (always 7 days for visual context or filtered?)
    // Let's make it follow the filter if provided, else last 7 days.
    const trendRange = start ? sql`${orders.createdAt} >= ${start}` : gte(orders.createdAt, sql`current_date - interval '7 days'`);

    const weeklyTrend = await db
      .select({
        date: sql<string>`date_trunc('day', created_at)::date`,
        count: sql<number>`count(*)`,
        revenue: sql<number>`COALESCE(sum(total_harga), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          trendRange
        )
      )
      .groupBy(sql`date_trunc('day', created_at)::date`)
      .orderBy(sql`date_trunc('day', created_at)::date`);

    // 4. Detail Orders (for export)
    const orderList = await db
      .select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), ...dateFilter))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(1000);

    return NextResponse.json({
      summary: {
        orders: {
          total: Number(orderStats.total),
          success: Number(orderStats.success),
          pending: Number(orderStats.pending),
          cancelled: Number(orderStats.cancelled),
          revenue: Number(orderStats.revenue),
        },
        chats: {
          sessions: Number(chatStats.totalSessions),
          messages: Number(chatStats.totalMessages),
        }
      },
      trends: weeklyTrend,
      export: {
        orders: orderList
      }
    });

  } catch (error) {
    console.error("[TENANT_REPORTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
