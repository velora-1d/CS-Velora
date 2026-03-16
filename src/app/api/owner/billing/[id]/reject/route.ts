import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/owner/billing/[id]/reject
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { reason } = await req.json().catch(() => ({ reason: "" }));

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, id),
    columns: { id: true, status: true },
  });

  if (!sub) {
    return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
  }

  if (sub.status !== "pending") {
    return NextResponse.json({ error: "Tagihan sudah diproses sebelumnya" }, { status: 400 });
  }

  await db
    .update(subscriptions)
    .set({ status: "rejected" })
    .where(eq(subscriptions.id, id));

  return NextResponse.json({
    success: true,
    message: "Tagihan ditolak.",
    reason: reason || null,
  });
}
