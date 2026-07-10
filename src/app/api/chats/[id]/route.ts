import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chatLogs, waSessions } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fromNumber } = await params;
    const tenantId = session.user.tenantId;

    // 1. Cari sesi WAHA aktif
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
        const chatId = `${fromNumber}@c.us`;
        // Tarik 50 pesan terakhir dari WAHA untuk chat ini
        const wahaRes = await fetch(
          `${wahaBaseUrl}/api/${activeSession.sessionId}/messages?chatId=${encodeURIComponent(chatId)}&limit=50`,
          { headers: { ...(wahaApiKey ? { "X-Api-Key": wahaApiKey } : {}) } }
        );

        if (wahaRes.ok) {
          const wahaMessages = await wahaRes.json();
          if (Array.isArray(wahaMessages)) {
            for (const msg of wahaMessages) {
              const body = msg.body || "";
              if (!body) continue;

              const timestamp = msg.timestamp ? new Date(msg.timestamp * 1000) : new Date();
              
              // Cek apakah pesan sudah ter-log
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
                  fromName: null,
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
      } catch (wahaErr) {
        console.error("Gagal sinkronisasi histori pesan dari WAHA:", wahaErr);
      }
    }

    const messages = await db.query.chatLogs.findMany({
      where: and(
        eq(chatLogs.tenantId, tenantId),
        eq(chatLogs.fromNumber, fromNumber)
      ),
      orderBy: [asc(chatLogs.timestamp)],
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET /api/chats/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

