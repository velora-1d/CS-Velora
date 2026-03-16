import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      nama: user.nama,
      email: user.email,
      bahasa: user.bahasa,
    });
  } catch (error) {
    console.error("GET /api/account error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Update password
    if (body.currentPassword && body.newPassword) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });

      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const isValid = await bcrypt.compare(body.currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
      }

      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(body.newPassword, 10);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, session.user.id));
      return NextResponse.json({ success: true, message: "Password berhasil diperbarui" });
    }

    // Update bahasa
    if (body.bahasa) {
      await db.update(users).set({ bahasa: body.bahasa }).where(eq(users.id, session.user.id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No changes" }, { status: 400 });
  } catch (error) {
    console.error("PUT /api/account error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
