import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tenants, subscriptions } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Total Tenants & Growth
    const [tenantStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where status = 'active')`,
        trial: sql<number>`count(*) filter (where status = 'trial')`,
        suspended: sql<number>`count(*) filter (where status = 'suspended' or status = 'expired')`,
      })
      .from(tenants);

    // 2. Paket Distribution
    const [paketStats] = await db
      .select({
        basic: sql<number>`count(*) filter (where paket = 'basic')`,
        pro: sql<number>`count(*) filter (where paket = 'pro')`,
      })
      .from(tenants);

    // 3. Revenue Data (Total Confirmed Subscriptions)
    const [revenueStats] = await db
      .select({
        total: sql<number>`COALESCE(sum(amount), 0)`,
        thisMonth: sql<number>`COALESCE(sum(amount) filter (where date_trunc('month', confirmed_at) = date_trunc('month', current_date)), 0)`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    return NextResponse.json({
      tenants: {
        total: Number(tenantStats.total),
        active: Number(tenantStats.active),
        trial: Number(tenantStats.trial),
        suspended: Number(tenantStats.suspended),
      },
      paket: {
        basic: Number(paketStats.basic),
        pro: Number(paketStats.pro),
      },
      revenue: {
        total: Number(revenueStats.total),
        thisMonth: Number(revenueStats.thisMonth),
      }
    });

  } catch (error) {
    console.error("[OWNER_REPORTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
