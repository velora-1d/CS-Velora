import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { waSessions, chatLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/whatsapp/sessions/[id]/sync — Sync status sesi dari WAHA ke DB
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { id } = await context.params;

  const waSession = await db.query.waSessions.findFirst({
    where: and(eq(waSessions.id, id), eq(waSessions.tenantId, tenantId)),
    columns: { id: true, sessionId: true },
  });

  if (!waSession) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const wahaBaseUrl = process.env.WAHA_API_URL || "http://localhost:3000";
  const wahaApiKey = process.env.WAHA_API_KEY || "";

  try {
    const wahaRes = await fetch(
      `${wahaBaseUrl}/api/sessions/${waSession.sessionId}`,
      { headers: { "X-Api-Key": wahaApiKey } }
    );

    if (!wahaRes.ok) {
      return NextResponse.json({ error: "Gagal mengambil status dari WAHA" }, { status: 502 });
    }

    const wahaData = await wahaRes.json();
    // WAHA status: WORKING = connected, STOPPED = disconnected, SCAN_QR_CODE = qr_pending
    const wahaStatus: string = wahaData.status || "";
    let dbStatus = "qr_pending";
    if (wahaStatus === "WORKING") dbStatus = "connected";
    else if (wahaStatus === "STOPPED" || wahaStatus === "FAILED") dbStatus = "disconnected";

    const phoneNumber: string = wahaData.me?.id?.split("@")[0] || wahaData.me?.phone || "";
    const updateData: Record<string, string> = { status: dbStatus };
    if (phoneNumber) updateData.waNumber = phoneNumber;

    const [updated] = await db
      .update(waSessions)
      .set(updateData)
      .where(eq(waSessions.id, id))
      .returning();

    // SINKRONISASI MASSAL HISTORI CHAT DARI WHATSAPP HP JIKA BARU TERHUBUNG
    if (dbStatus === "connected") {
      // Jalankan proses sinkronisasi secara asinkron (background) agar response API tetap cepat
      (async () => {
        try {
          console.log(`[WA Sync] Memulai impor riwayat chat untuk sesi: ${waSession.sessionId}`);
          const chatsRes = await fetch(`${wahaBaseUrl}/api/${waSession.sessionId}/chats`, {
            headers: { ...(wahaApiKey ? { "X-Api-Key": wahaApiKey } : {}) }
          });

          if (chatsRes.ok) {
            const chats = await chatsRes.json();
            if (Array.isArray(chats)) {
              // Batasi impor maksimal ke 15 kontak chat teratas agar tidak membebani server
              const activeChats = chats.slice(0, 15);
              for (const chat of activeChats) {
                const contactNumber = chat.id.split("@")[0];
                if (chat.id.includes("@g.us") || !contactNumber) continue;

                // Ambil hingga 30 riwayat pesan terakhir dari WhatsApp HP untuk kontak ini
                const messagesRes = await fetch(
                  `${wahaBaseUrl}/api/${waSession.sessionId}/messages?chatId=${encodeURIComponent(chat.id)}&limit=30`,
                  { headers: { ...(wahaApiKey ? { "X-Api-Key": wahaApiKey } : {}) } }
                );

                if (messagesRes.ok) {
                  const messagesList = await messagesRes.json();
                  if (Array.isArray(messagesList)) {
                    for (const msg of messagesList) {
                      const body = msg.body || "";
                      if (!body) continue;

                      const timestamp = msg.timestamp ? new Date(msg.timestamp * 1000) : new Date();

                      // Cek duplikasi log pesan
                      const existing = await db.query.chatLogs.findFirst({
                        where: and(
                          eq(chatLogs.tenantId, tenantId),
                          eq(chatLogs.fromNumber, contactNumber),
                          eq(chatLogs.timestamp, timestamp)
                        ),
                      });

                      if (!existing) {
                        await db.insert(chatLogs).values({
                          tenantId,
                          fromNumber: contactNumber,
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
              }
              console.log(`[WA Sync] Impor massal selesai untuk sesi: ${waSession.sessionId}`);
            }
          }
        } catch (syncErr) {
          console.error("Gagal melakukan impor riwayat chat dari HP:", syncErr);
        }
      })();
    }

    return NextResponse.json({ success: true, status: dbStatus, session: updated });
  } catch (error) {
    console.error("Sync session error:", error);
    return NextResponse.json({ error: "Gagal sync status sesi" }, { status: 500 });
  }
}

