import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Basic protection to ensure it's not randomly hit by users
    const body = await req.json().catch(() => ({}));
    if (body.secret !== process.env.NEXTAUTH_SECRET && body.secret !== "INIT_OWNER_123") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingOwner = await db.query.users.findFirst({
      where: eq(users.role, "owner")
    });

    if (existingOwner) {
      return NextResponse.json({ message: "Owner already exists", email: existingOwner.email });
    }

    const hashedPassword = await bcrypt.hash("Owner123!", 10);
    
    await db.insert(users).values({
      email: "owner@csvelora.com",
      password: hashedPassword,
      nama: "Owner CS Velora",
      role: "owner",
      aktif: true,
    });

    return NextResponse.json({ 
      message: "Owner created successfully", 
      email: "owner@csvelora.com", 
      defaultPassword: "Owner123!" 
    });

  } catch(error) {
    console.error("[SEED_OWNER_ERROR]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
