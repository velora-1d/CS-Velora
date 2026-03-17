import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tenants, users } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allTenants = await db.query.tenants.findMany({
      orderBy: [desc(tenants.createdAt)],
    });

    const tenantIds = allTenants.map(t => t.id);
    if (tenantIds.length === 0) return NextResponse.json([]);

    const tenantOwners = await db.query.users.findMany({
      where: (users, { inArray, and, eq }) => 
        and(inArray(users.tenantId, tenantIds), eq(users.role, "tenant"))
    });

    const data = allTenants.map(t => ({
      ...t,
      owner: tenantOwners.find(u => u.tenantId === t.id)
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/owner/tenants error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
