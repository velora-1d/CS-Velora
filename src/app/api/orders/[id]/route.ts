import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
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

    const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
        // with: { customer: true, items: true, payment: true } // Akan ditambahkan kalau Schema Relation sudah ada
    });

    if (!order) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
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

    const allowedStatuses = ["pending", "konfirmasi", "proses", "selesai", "batal"];

    if (body.status && !allowedStatuses.includes(body.status)) {
       return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedOrder = await db.update(orders).set({
      status: body.status,
    }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId))).returning();

    if (updatedOrder.length === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
