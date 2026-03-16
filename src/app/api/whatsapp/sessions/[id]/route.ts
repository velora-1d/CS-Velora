import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { waSessions, tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

  const wahaBaseUrl = process.env.WAHA_API_URL || "http://localhost:3000";
  const wahaApiKey = tenant?.waApiKey || process.env.WAHA_API_KEY || "";

  // Stop session di WAHA
  try {
    await fetch(`${wahaBaseUrl}/api/sessions/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": wahaApiKey,
      },
      body: JSON.stringify({ name: waSession.sessionId, logout: true }),
    });
  } catch (err) {
    // Lanjutkan hapus dari DB meskipun WAHA gagal direspons
    console.warn("WAHA stop session gagal, tetap hapus dari DB:", err);
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
  const wahaApiKey = tenant?.waApiKey || process.env.WAHA_API_KEY || "";

  // Proxy QR code dari WAHA
  const qrRes = await fetch(
    `${wahaBaseUrl}/api/${waSession.sessionId}/auth/qr?format=json`,
    { headers: { "X-Api-Key": wahaApiKey } }
  );

  if (!qrRes.ok) {
    return NextResponse.json({ error: "QR Code belum tersedia" }, { status: 503 });
  }

  const qrData = await qrRes.json();
  return NextResponse.json(qrData);
}
