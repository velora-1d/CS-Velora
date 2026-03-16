import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email wajib diisi" },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Return success even if email not found to prevent email enumeration
      return NextResponse.json({ success: true, message: "Jika email terdaftar, instruksi reset akan dikirim." });
    }

    // Di skenario nyata, ini akan men-generate reset token, simpan di DB,
    // lalu call API Fonnte/WAHA untuk kirim ke nomor WA yang teregister ke email ini.
    // 
    // Tapi sesuai flow MVP saat ini, kita return response success simulasi:
    console.log(`[AUTH:RESET] Simulasi kirim WA Reset Password ke ${user.nama} (${user.email})`);

    return NextResponse.json({ 
      success: true, 
      message: "Instruksi reset password telah dikirim ke WhatsApp Anda." 
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
