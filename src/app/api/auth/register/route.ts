import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const { namaToko, namaPemilik, email, password } = await req.json();

    if (!namaToko || !namaPemilik || !email || !password) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // 1. Cek email sudah terdaftar
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Trial berakhir 2 hari dari sekarang
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 2);

    // 2. Karena Neon HTTP driver Serverless tidak support transactions,
    // kita akan insert secara sequential.
    
    // Insert tenant
    const [newTenant] = await db.insert(tenants).values({
      namaToko,
      waProvider: "waha", // Default provider for tenant is WAHA
      paket: "basic", // Default paket is basic
      status: "trial", // Set status as trial
      trialEndsAt,
      maxWaAccounts: 1, // Default untuk basic plan
    }).returning();

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert user
    await db.insert(users).values({
      tenantId: newTenant.id,
      email,
      password: hashedPassword,
      nama: namaPemilik,
      role: "tenant", // Default role
      aktif: true,
    });

    // 5. Kirim Notifikasi Telegram ke Owner
    await sendTelegramNotification(
      `🚀 <b>Tenant Baru Mendaftar!</b>\n\n<b>Toko:</b> ${namaToko}\n<b>Pemilik:</b> ${namaPemilik}\n<b>Email:</b> ${email}`
    );

    return NextResponse.json(
      { success: true, message: "Pendaftaran berhasil" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
