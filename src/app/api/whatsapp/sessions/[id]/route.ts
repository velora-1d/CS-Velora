import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { waSessions, tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getEnvFallback } from "@/lib/env";

// DELETE /api/whatsapp/sessions/[id] — Logout & hapus sesi WA
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { id } = await context.params;

  // Pastikan session milik tenant ini
  const waSession = await db.query.waSessions.findFirst({
    where: and(eq(waSessions.id, id), eq(waSessions.tenantId, tenantId)),
  });

  if (!waSession) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  // Ambil API Key Tenant
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { waApiKey: true },
  });

  const wahaBaseUrl = getEnvFallback("WAHA_URL") || getEnvFallback("WAHA_API_URL") || "http://localhost:3000";
  const wahaApiKey = getEnvFallback("WAHA_API_KEY") || "";

  // Hapus/Delete session secara permanen di WAHA server
  try {
    await fetch(`${wahaBaseUrl}/api/sessions/${waSession.sessionId}`, {
      method: "DELETE",
      headers: {
        "X-Api-Key": wahaApiKey,
      },
    });
  } catch (err) {
    // Lanjutkan hapus dari DB meskipun WAHA gagal direspons
    console.warn("WAHA delete session gagal, tetap hapus dari DB:", err);
  }

  // Hapus dari DB
  await db.delete(waSessions).where(eq(waSessions.id, id));

  return NextResponse.json({ success: true, message: "Sesi WhatsApp berhasil dihapus." });
}

// GET /api/whatsapp/sessions/[id]/qr — Ambil QR Code dari WAHA
export async function GET(
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
    columns: { sessionId: true },
  });

  if (!waSession) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { waApiKey: true },
  });

  const wahaBaseUrl = process.env.WAHA_API_URL || "http://localhost:3000";
  const wahaApiKey = process.env.WAHA_API_KEY || "";

  // Proxy QR code dari WAHA (ambil format image PNG)
  const qrRes = await fetch(
    `${wahaBaseUrl}/api/${waSession.sessionId}/auth/qr?format=image`,
    { headers: { "X-Api-Key": wahaApiKey } }
  );

  if (!qrRes.ok) {
    return NextResponse.json({ error: "QR Code belum tersedia" }, { status: 503 });
  }

  const imageBuffer = Buffer.from(await qrRes.arrayBuffer());

  return new Response(imageBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

// PATCH /api/whatsapp/sessions/[id] — Update / link session ke business profile
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { id } = await context.params;

  try {
    const { businessProfileId, label } = await req.json();

    const updateData: Record<string, any> = {};
    if (businessProfileId !== undefined) {
      updateData.businessProfileId = businessProfileId || null;
    }
    if (label !== undefined) {
      updateData.label = label.trim() || null;
    }

    const [updatedSession] = await db
      .update(waSessions)
      .set(updateData)
      .where(and(eq(waSessions.id, id), eq(waSessions.tenantId, tenantId)))
      .returning();

    if (!updatedSession) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memperbarui sesi" }, { status: 500 });
  }
}
