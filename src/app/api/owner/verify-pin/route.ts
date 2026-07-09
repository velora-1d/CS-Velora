import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ownerSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: "PIN wajib diisi" }, { status: 400 });
    }

    const setting = await db.query.ownerSettings.findFirst({
      where: eq(ownerSettings.key, "owner_security_pin")
    });

    if (!setting) {
      return NextResponse.json({ error: "PIN keamanan sistem belum dikonfigurasi" }, { status: 500 });
    }

    const isValid = await bcrypt.compare(String(pin), setting.value);
    if (!isValid) {
      return NextResponse.json({ error: "PIN salah, akses ditolak" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/owner/verify-pin error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
