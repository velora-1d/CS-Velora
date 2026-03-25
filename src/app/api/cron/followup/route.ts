import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, clients, orders, chatLogs } from "@/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { getAiCompletion } from "@/lib/ai";
import { checkBotAvailability } from "@/lib/bot-logic";

export async function GET(req: Request) {
  try {
    // Pengamanan API Endpoint (bisa pakai token rahasia dari Cron Service)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    // Syarat: interaksi berlangsung minimal 2 jam lalu dan maksimal 24 jam lalu
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Ambil tenant yang AI-nya menyala
    const activeTenants = await db.query.tenants.findMany({
      where: eq(tenants.status, "active")
    });

    let followUpCount = 0;

    for (const tenant of activeTenants) {
      const { available } = await checkBotAvailability(tenant.id);
      if (!available) continue;

      // Cari pelanggan yang terakhir kali chat di rentang 2-24 jam yg lalu
      const targetClients = await db.query.clients.findMany({
        where: and(
          eq(clients.tenantId, tenant.id),
          gte(clients.lastInteraction, twentyFourHoursAgo),
          lte(clients.lastInteraction, twoHoursAgo)
        )
      });

      for (const client of targetClients) {
        // Cek: Apakah pelanggan ini terdata membikin pesanan (checkout) dalam 24 jam terakhir?
        const recentOrders = await db.query.orders.findMany({
          where: and(
            eq(orders.tenantId, tenant.id),
            eq(orders.fromNumber, client.nomor),
            gte(orders.createdAt, twentyFourHoursAgo)
          ),
          limit: 1,
        });

        if (recentOrders.length > 0) continue; // Jangan difollow up, sudah belanja

        // Cek: Apakah AI atau Admin secara manual / auto sudah mengirim follow up ke nomor ini 24 jam terakhir?
        const recentFollowUps = await db.query.chatLogs.findMany({
          where: and(
            eq(chatLogs.tenantId, tenant.id),
            eq(chatLogs.fromNumber, client.nomor),
            gte(chatLogs.timestamp, twentyFourHoursAgo),
            // Pattern follow up
            sql`${chatLogs.reply} LIKE '%[SISTEM] Auto Follow-up terkirim%'`
          ),
          limit: 1,
        });

        if (recentFollowUps.length > 0) continue; // Sudah pernah dibalas fallback followup

        // Cek: Apakah obrolan pelanggan ini merupakan obrolan yang sedang "dijaga" oleh admin manusia? (Manual Handover)
        const manualReplies = await db.query.chatLogs.findMany({
          where: and(
            eq(chatLogs.tenantId, tenant.id),
            eq(chatLogs.fromNumber, client.nomor),
            eq(chatLogs.isHuman, true),
            gte(chatLogs.timestamp, twentyFourHoursAgo)
          ),
          limit: 1,
        });

        if (manualReplies.length > 0) continue; // Admin campur tangan 24j terakhir, abaikan auto followup biar gak aneh.

        // Generate pesan Follow-up ramah langsung dari GPT
        const promptOverrides = {
          systemPrompt: "Anda adalah CS Sales yang super ramah pembawaan santai. Tugas Anda saat ini hanyalah memulai pesan sapaan FOLLOW-UP kepada klien yang kemarin atau tadi sempat bertanya tapi tampaknya lupa check-out (abandoned cart). Sapa namanya dengan akrab jika ada, ingatkan mereka soal promo yang kita miliki saat ini, tawarkan apakah ada hal yang perlu dibantu. Pesan WAJIB pendek, maksimal 2 paragraf saja, dan mengakhiri dengan kalimat tanya terbuka (cth: 'Gimana kak, masih ragu di ongkir?')."
        };

        const aiReply = await getAiCompletion(
          tenant.id, 
          "Buatkan pesan follow-up natural hari ini untuk pelanggan bernama " + (client.nama || "Pelanggan"), 
          [], 
          promptOverrides, 
          client.nomor, 
          client.nama || ""
        );

        if (aiReply) {
          try {
            await sendWhatsAppMessage(tenant.id, client.nomor, aiReply);
            
            // Catat log pengiriman follow up
            await db.insert(chatLogs).values({
              tenantId: tenant.id,
              fromNumber: client.nomor,
              message: "",
              reply: aiReply + "\n\n[SISTEM] Auto Follow-up terkirim.",
              isAi: true,
              isHuman: false,
            });
            
            followUpCount++;
          } catch (e) {
            console.error(`Gagal mengirim rekapan follow up ke ${client.nomor}:`, e);
          }
        }
      }
    }

    return NextResponse.json({ status: "success", follow_ups_sent: followUpCount });
  } catch (error) {
    console.error("Cron followup batch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
