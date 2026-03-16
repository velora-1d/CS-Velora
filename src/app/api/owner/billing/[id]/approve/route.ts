import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { subscriptions, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/owner/billing/[id]/approve
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, id),
    columns: { id: true, tenantId: true, paket: true, status: true, endDate: true },
  });

  if (!sub) {
    return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
  }

  if (sub.status !== "pending") {
    return NextResponse.json({ error: "Tagihan sudah diproses sebelumnya" }, { status: 400 });
  }

  // Tentukan maxWaAccounts berdasarkan paket
  const maxWaAccounts = sub.paket === "pro" ? 3 : 1;

  // Update subscription → active
  await db
    .update(subscriptions)
    .set({ status: "active", confirmedAt: new Date() })
    .where(eq(subscriptions.id, id));

  // Upgrade tenant → paket & maxWaAccounts & status active
  await db
    .update(tenants)
    .set({
      paket: sub.paket,
      maxWaAccounts,
      status: "active",
    })
    .where(eq(tenants.id, sub.tenantId));

  return NextResponse.json({
    success: true,
    message: `Pembayaran disetujui. Tenant diupgrade ke paket ${sub.paket.toUpperCase()}.`,
  });
}
