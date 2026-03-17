import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paket } = await req.json();

    if (!paket || !["basic", "pro"].includes(paket)) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 });
    }

    // Hitung nominal tagihan
    const amount = paket === "basic" ? 35000 : 99000;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create a pending subscription in DB
    const [sub] = await db.insert(subscriptions).values({
      tenantId: session.user.tenantId as string,
      paket: paket as "basic" | "pro",
      amount: amount,
      startDate: startDate,
      endDate: endDate,
      status: "pending",
    }).returning();

    const projectSlug = process.env.PAKASIR_PROJECT_SLUG;
    
    if (!projectSlug) {
      console.error("PAKASIR_PROJECT_SLUG is not configured.");
      return NextResponse.json({ error: "Fitur pembayaran belum diatur oleh sistem" }, { status: 500 });
    }

    // Format Link: https://app.pakasir.com/pay/{slug}/{amount}?order_id=SUB-{id}
    const orderId = `SUB-${sub.id}`;
    const checkoutUrl = `https://app.pakasir.com/pay/${projectSlug}/${amount}?order_id=${orderId}`;

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutUrl
    }, { status: 201 });

  } catch (error: any) {
    console.error("Billing checkout error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat membuat tagihan." },
      { status: 500 }
    );
  }
}
