import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { paymentMethods } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    const existingAccount = await db.query.paymentMethods.findFirst({
      where: and(eq(paymentMethods.id, id), eq(paymentMethods.tenantId, tenantId)),
    });

    if (!existingAccount) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    const updatedAccount = await db.update(paymentMethods).set({
      aktif: !existingAccount.aktif,
    }).where(and(eq(paymentMethods.id, id), eq(paymentMethods.tenantId, tenantId))).returning();

    return NextResponse.json(updatedAccount[0]);
  } catch (error) {
    console.error("PATCH /api/bank-accounts/[id]/toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
