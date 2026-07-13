import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { businessProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PUT /api/business-profiles/[id] - Update business profile
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tenantId = session.user.tenantId;

  try {
    const body = await req.json();
    const { name, greeting, pesanOffline, aiEnabled, systemPrompt, model, tenantTypeId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama bisnis wajib diisi" }, { status: 400 });
    }

    const [updatedProfile] = await db
      .update(businessProfiles)
      .set({
        name: name.trim(),
        tenantTypeId: tenantTypeId || null,
        greeting,
        pesanOffline,
        aiEnabled: aiEnabled !== false,
        systemPrompt,
        model,
      })
      .where(and(eq(businessProfiles.id, id), eq(businessProfiles.tenantId, tenantId)))
      .returning();

    if (!updatedProfile) {
      return NextResponse.json({ error: "Profil bisnis tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memperbarui profil bisnis" }, { status: 500 });
  }
}

// DELETE /api/business-profiles/[id] - Delete business profile
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tenantId = session.user.tenantId;

  try {
    const [deletedProfile] = await db
      .delete(businessProfiles)
      .where(and(eq(businessProfiles.id, id), eq(businessProfiles.tenantId, tenantId)))
      .returning();

    if (!deletedProfile) {
      return NextResponse.json({ error: "Profil bisnis tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Profil bisnis berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menghapus profil bisnis" }, { status: 500 });
  }
}
