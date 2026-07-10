import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { waSessions } from "@/db/schema";
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

    return NextResponse.json({ success: true, status: dbStatus, session: updated });
  } catch (error) {
    console.error("Sync session error:", error);
    return NextResponse.json({ error: "Gagal sync status sesi" }, { status: 500 });
  }
}
