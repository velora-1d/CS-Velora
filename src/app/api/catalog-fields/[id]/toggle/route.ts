import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { catalogFields } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { id } = await params;

    const existingField = await db.query.catalogFields.findFirst({
      where: and(eq(catalogFields.id, id), eq(catalogFields.tenantId, tenantId)),
    });

    if (!existingField) {
      return NextResponse.json({ error: "Field tidak ditemukan" }, { status: 404 });
    }

    // System fields are required by default and shouldn't be disabled if they are required system fields,
    // but the roadmap says: "Tambah/edit/nonaktif/hapus field non-system. Tampilkan field system dan custom field."
    // Let's restrict toggling system fields.
    if (existingField.isSystem) {
      return NextResponse.json({ error: "Field sistem tidak dapat dinonaktifkan" }, { status: 400 });
    }

    const updatedField = await db.update(catalogFields).set({
      isActive: !existingField.isActive,
      updatedAt: new Date(),
    }).where(and(eq(catalogFields.id, id), eq(catalogFields.tenantId, tenantId))).returning();

    return NextResponse.json(updatedField[0]);
  } catch (error) {
    console.error("PATCH /api/catalog-fields/[id]/toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
