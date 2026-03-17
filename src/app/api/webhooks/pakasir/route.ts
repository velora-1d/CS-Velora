import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, orders, tenants, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Verify payload from Pakasir
    // Biasanya webhook Pakasir mengirim data seperti order_id, status, total bayar dll.
    const { order_id, status, amount } = payload;

    if (!order_id) {
      return NextResponse.json({ error: "No order_id provided" }, { status: 400 });
    }

    // Check prefix
    if (order_id.startsWith("SUB-")) {
      // Owner Billing (Tenant upgrading package)
      const subscriptionId = order_id.replace("SUB-", "");
      
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, subscriptionId)
      });

      if (!sub) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }

      // Validasi ke Pakasir API menggunakan API Key Owner di .env
      const projectSlug = process.env.PAKASIR_PROJECT_SLUG;
      const apiKey = process.env.PAKASIR_API_KEY;
      
      if (!projectSlug || !apiKey) {
         console.error("Pakasir API Key / Slug not configured in .env");
         return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
      }

      const validationRes = await fetch("https://app.pakasir.com/api/transactiondetail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           username: projectSlug, // documentation might require slightly different payload.
           api_key: apiKey,
           order_id
        })
      });

      const validationData = await validationRes.json();
      
      // Update subscription
      await db.update(subscriptions)
        .set({ status: "active", confirmedAt: new Date() })
        .where(eq(subscriptions.id, subscriptionId));
      
      // Fetch tenant to get the name for notification
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, sub.tenantId)
      });
      
      const tenantName = tenant ? tenant.namaToko : "Unknown";

      // Telegram notification
      await sendTelegramNotification(
         `✅ <b>Pembayaran Langganan Berhasil!</b>\n\n<b>Tenant:</b> ${tenantName}\n<b>Paket:</b> ${sub.paket.toUpperCase()}\n<b>Nominal:</b> Rp${amount || sub.amount}`
      );

      // Extend tenant's status as active
      await db.update(tenants)
        .set({ status: "active", paket: sub.paket })
        .where(eq(tenants.id, sub.tenantId));

      return NextResponse.json({ success: true, message: "Subscription updated" });

    } else if (order_id.startsWith("ORD-")) {
      // Tenant Order (Customer buying product)
      const orderId = order_id.replace("ORD-", "");

      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const orderTenant = await db.query.tenants.findFirst({
         where: eq(tenants.id, order.tenantId)
      });

      if (!orderTenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }

      // Validasi ke Pakasir API menggunakan API Key dan Slug Tenant 
      const projectSlug = orderTenant.pakasirProjectSlug;
      const apiKey = orderTenant.pakasirApiKey;

      if (!projectSlug || !apiKey) {
         return NextResponse.json({ error: "Tenant Pakasir API Key not configured" }, { status: 400 });
      }

      const validationRes = await fetch("https://app.pakasir.com/api/transactiondetail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           username: projectSlug,
           api_key: apiKey,
           order_id
        })
      });

      const validationData = await validationRes.json();
      
      // Update order status
      await db.update(orders)
        .set({ status: "konfirmasi" })
        .where(eq(orders.id, orderId));

      // Jika tenant ini adalah toko milik owner sendiri (pembelian masuk ke bot owner), kirim notifikasi
      const isOwnerStore = await db.query.users.findFirst({
         where: and(eq(users.tenantId, order.tenantId), eq(users.role, "owner"))
      });

      if (isOwnerStore) {
        await sendTelegramNotification(
          `🛒 <b>Pesanan Baru di Toko Owner!</b>\n\n<b>Order ID:</b> ${order_id}\n<b>Pelanggan:</b> ${order.fromName || order.fromNumber}\n<b>Total:</b> Rp${amount || order.totalHarga}\n\nPembayaran telah lunas via Pakasir.`
        );
      }

      return NextResponse.json({ success: true, message: "Order updated" });
    }

    return NextResponse.json({ error: "Unknown order_id format" }, { status: 400 });

  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
