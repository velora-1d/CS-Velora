import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { businessProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/business-profiles - List all business profiles for tenant
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profiles = await db.query.businessProfiles.findMany({
      where: eq(businessProfiles.tenantId, session.user.tenantId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
    return NextResponse.json(profiles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memuat profil bisnis" }, { status: 500 });
  }
}

// POST /api/business-profiles - Create a new business profile
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, greeting, pesanOffline, aiEnabled, systemPrompt, model, tenantTypeId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama bisnis wajib diisi" }, { status: 400 });
    }

    const [newProfile] = await db.insert(businessProfiles).values({
      tenantId: session.user.tenantId,
      tenantTypeId: tenantTypeId || null,
      name: name.trim(),
      greeting: greeting || "Halo! Selamat datang di layanan kami. Ada yang bisa kami bantu?",
      pesanOffline: pesanOffline || "Maaf, saat ini kami sedang offline. Pesan Anda akan dibalas setelah kami online kembali.",
      aiEnabled: aiEnabled !== false,
      systemPrompt: systemPrompt || "Anda adalah asisten virtual yang ramah.",
      model: model || "qwen-vl-plus",
    }).returning();

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal membuat profil bisnis" }, { status: 500 });
  }
}
