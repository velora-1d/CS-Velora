import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chatLogs, waSessions } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // 1. Cari sesi WAHA yang aktif (connected) untuk tenant ini
    const activeSession = await db.query.waSessions.findFirst({
      where: and(
        eq(waSessions.tenantId, tenantId),
        eq(waSessions.status, "connected")
      ),
    });

    if (activeSession) {
      const wahaBaseUrl = process.env.WAHA_API_URL || "http://localhost:3000";
      const wahaApiKey = process.env.WAHA_API_KEY || "";
      
      try {
        // Panggil WAHA API untuk mengambil chats terbaru dari WhatsApp Web
        const wahaRes = await fetch(`${wahaBaseUrl}/api/${activeSession.sessionId}/chats`, {
          headers: { ...(wahaApiKey ? { "X-Api-Key": wahaApiKey } : {}) },
        });

        if (wahaRes.ok) {
          const wahaChats = await wahaRes.json();
          if (Array.isArray(wahaChats)) {
            // Batasi sinkronisasi ke 20 chat teraktif agar performa loading awal tetap cepat
            const activeChats = wahaChats.slice(0, 20);
            
            // Lakukan sinkronisasi pesan secara paralel/sekuensial cepat
            await Promise.all(
              activeChats.map(async (chat) => {
                const fromNumber = chat.id.split("@")[0];
                if (chat.id.includes("@g.us") || !fromNumber) return;

                // Cek apakah minimal ada 1 pesan dari kontak ini di DB lokal
                const hasMessages = await db.query.chatLogs.findFirst({
                  where: and(
                    eq(chatLogs.tenantId, tenantId),
                    eq(chatLogs.fromNumber, fromNumber)
                  ),
                });

                // Jika belum ada pesan sama sekali di DB lokal untuk kontak ini,
                // atau jika pesan terakhir di WAHA berbeda, tarik riwayat pesan terbarunya.
                if (!hasMessages) {
                  try {
                    const messagesRes = await fetch(
                      `${wahaBaseUrl}/api/${activeSession.sessionId}/messages?chatId=${encodeURIComponent(chat.id)}&limit=15`,
                      { headers: { ...(wahaApiKey ? { "X-Api-Key": wahaApiKey } : {}) } }
                    );

                    if (messagesRes.ok) {
                      const messagesList = await messagesRes.json();
                      if (Array.isArray(messagesList)) {
                        for (const msg of messagesList) {
                          const body = msg.body || "";
                          if (!body) continue;

                          const timestamp = msg.timestamp ? new Date(msg.timestamp * 1000) : new Date();

                          const existing = await db.query.chatLogs.findFirst({
                            where: and(
                              eq(chatLogs.tenantId, tenantId),
                              eq(chatLogs.fromNumber, fromNumber),
                              eq(chatLogs.timestamp, timestamp)
                            ),
                          });

                          if (!existing) {
                            await db.insert(chatLogs).values({
                              tenantId,
                              fromNumber,
                              fromName: chat.name || null,
                              message: msg.fromMe ? "" : body,
                              reply: msg.fromMe ? body : "",
                              isAi: false,
                              isHuman: msg.fromMe || false,
                              timestamp,
                            });
                          }
                        }
                      }
                    }
                  } catch (msgErr) {
                    console.error(`Gagal tarik histori pesan WAHA untuk ${fromNumber}:`, msgErr);
                  }
                } else {
                  // Jika sudah ada pesan, sinkronkan pesan paling terakhir saja
                  const lastMsg = chat.lastMessage?.body || "";
                  const timestamp = chat.lastMessage?.timestamp 
                    ? new Date(chat.lastMessage.timestamp * 1000) 
                    : new Date();

                  const existing = await db.query.chatLogs.findFirst({
                    where: and(
                      eq(chatLogs.tenantId, tenantId),
                      eq(chatLogs.fromNumber, fromNumber),
                      eq(chatLogs.message, lastMsg)
                    ),
                  });

                  if (!existing && lastMsg) {
                    await db.insert(chatLogs).values({
                      tenantId,
                      fromNumber,
                      fromName: chat.name || null,
                      message: chat.lastMessage?.fromMe ? "" : lastMsg,
                      reply: chat.lastMessage?.fromMe ? lastMsg : "",
                      isAi: false,
                      isHuman: chat.lastMessage?.fromMe || false,
                      timestamp,
                    });
                  }
                }
              })
            );
          }
        }
      } catch (wahaErr) {
        console.error("Gagal sinkronisasi chat dari WAHA API:", wahaErr);
      }
    }

    // Ambil daftar chat unik terbaru beserta detailnya secara akurat
    const threadsRaw = await db.execute(sql`
      WITH ranked_chats AS (
        SELECT 
          tenant_id,
          from_number,
          from_name,
          message,
          reply,
          timestamp,
          ROW_NUMBER() OVER (PARTITION BY from_number ORDER BY timestamp DESC) as rn,
          COUNT(*) OVER (PARTITION BY from_number) as msg_count
        FROM chat_logs
        WHERE tenant_id = ${tenantId}
      )
      SELECT 
        from_number as "fromNumber",
        from_name as "fromName",
        message as "lastMessage",
        reply as "lastReply",
        msg_count as "messageCount",
        timestamp as "lastTimestamp"
      FROM ranked_chats
      WHERE rn = 1
      ORDER BY timestamp DESC
    `);

    // Drizzle execute mengembalikan objek result dengan properti rows
    const threads = Array.isArray(threadsRaw) ? threadsRaw : (threadsRaw.rows || []);

    return NextResponse.json(threads);
  } catch (error) {
    console.error("GET /api/chats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

