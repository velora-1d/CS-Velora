import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { waSessions, tenants } from "@/db/schema";
import { eq, count } from "drizzle-orm";

// GET /api/whatsapp/sessions — Ambil semua sesi WA milik Tenant
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  const sessions = await db.query.waSessions.findMany({
    where: eq(waSessions.tenantId, tenantId),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  return NextResponse.json(sessions);
}

// POST /api/whatsapp/sessions — Tambah sesi WAHA baru (generate session)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { label } = await req.json();

  // Ambil info tenant (paket & maxWaAccounts)
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { id: true, maxWaAccounts: true, waApiKey: true, waProvider: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });
  }

  // Enforce limit berdasarkan paket
  const [{ count: currentCount }] = await db
    .select({ count: count() })
    .from(waSessions)
    .where(eq(waSessions.tenantId, tenantId));

  if (Number(currentCount) >= tenant.maxWaAccounts) {
    return NextResponse.json(
      {
        error: `Batas akun WhatsApp tercapai. Paket Anda hanya memperbolehkan ${tenant.maxWaAccounts} akun. Upgrade ke Pro untuk menambah lebih banyak.`,
        limitReached: true,
      },
      { status: 403 }
    );
  }

  // Generate session ID unik
  const sessionId = `cs-velora-${tenantId.slice(0, 8)}-${Date.now()}`;

  // Panggil WAHA API untuk start session
  const wahaBaseUrl = process.env.WAHA_API_URL || "http://localhost:3000";
  const wahaApiKey = tenant.waApiKey || process.env.WAHA_API_KEY || "";

  try {
    const wahaRes = await fetch(`${wahaBaseUrl}/api/sessions/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": wahaApiKey,
      },
      body: JSON.stringify({ name: sessionId }),
    });

    if (!wahaRes.ok) {
      const err = await wahaRes.text();
      console.error("WAHA start session error:", err);
      return NextResponse.json(
        { error: "Gagal memulai sesi WAHA. Periksa koneksi server WhatsApp Anda." },
        { status: 502 }
      );
    }

    // Simpan session ke DB
    const [newSession] = await db
      .insert(waSessions)
      .values({
        tenantId,
        sessionId,
        waNumber: "", // Belum diketahui sampai scan QR
        label: label || `Akun WA ${Number(currentCount) + 1}`,
        status: "qr_pending",
      })
      .returning();

    return NextResponse.json({
      success: true,
      session: newSession,
      qrUrl: `${wahaBaseUrl}/api/${sessionId}/auth/qr?format=image`,
    });
  } catch (error) {
    console.error("Error starting WA session:", error);
    return NextResponse.json(
      { error: "Gagal terhubung ke WAHA server." },
      { status: 500 }
    );
  }
}
