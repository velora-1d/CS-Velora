import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ownerPaymentInfo } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/owner/settings
export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await db.query.ownerPaymentInfo.findFirst({
      where: eq(ownerPaymentInfo.aktif, true),
      orderBy: (ownerPaymentInfo, { desc }) => [desc(ownerPaymentInfo.createdAt)],
    });

    return NextResponse.json(settings || {});
  } catch (error) {
    console.error("[OWNER_SETTINGS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/owner/settings
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tipe, namaBank, nomorRekening, namaPemilik, gambarQris } = body;

    if (!tipe) {
      return NextResponse.json({ error: "Tipe pembayaran wajib diisi" }, { status: 400 });
    }

    // Cari setting yang sudah ada
    const existing = await db.query.ownerPaymentInfo.findFirst();

    if (existing) {
      // Update
      const [updated] = await db
        .update(ownerPaymentInfo)
        .set({
          tipe,
          namaBank,
          nomorRekening,
          namaPemilik,
          gambarQris,
          updatedAt: new Date(), // Jika ada field ini, jika tidak biarkan default
        } as any)
        .where(eq(ownerPaymentInfo.id, existing.id))
        .returning();
      
      return NextResponse.json(updated);
    } else {
      // Create
      const [newSettings] = await db
        .insert(ownerPaymentInfo)
        .values({
          tipe,
          namaBank,
          nomorRekening,
          namaPemilik,
          gambarQris,
          aktif: true,
        })
        .returning();
      
      return NextResponse.json(newSettings);
    }
  } catch (error) {
    console.error("[OWNER_SETTINGS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
