import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { catalogFields } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
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
    const body = await req.json();

    const existingField = await db.query.catalogFields.findFirst({
      where: and(
        eq(catalogFields.id, id),
        eq(catalogFields.tenantId, tenantId)
      ),
    });

    if (!existingField) {
      return NextResponse.json({ error: "Field tidak ditemukan" }, { status: 404 });
    }

    const { label, isRequired, isActive, sortOrder, options } = body;

    // Validate label if passed
    if (label !== undefined && !label.trim()) {
      return NextResponse.json({ error: "Label tidak boleh kosong" }, { status: 400 });
    }

    // Prepare update data
    const updateData: Partial<typeof catalogFields.$inferInsert> = {};

    if (label !== undefined) updateData.label = label.trim();
    if (isActive !== undefined) updateData.isActive = !!isActive;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

    // Restrictions for System Fields vs Non-System Fields
    if (existingField.isSystem) {
      // For system fields, we ONLY allow editing label, isActive, and sortOrder.
      // fieldKey, fieldType, options, isRequired are set by system template and immutable.
    } else {
      // Non-system fields can edit options and isRequired
      if (isRequired !== undefined) updateData.isRequired = !!isRequired;
      
      if (existingField.fieldType === "select") {
        if (options !== undefined) {
          if (!Array.isArray(options) || options.length === 0) {
            return NextResponse.json({ error: "Pilihan (options) wajib diisi untuk tipe select" }, { status: 400 });
          }
          updateData.options = options;
        }
      }
    }

    updateData.updatedAt = new Date();

    const updatedField = await db
      .update(catalogFields)
      .set(updateData)
      .where(and(eq(catalogFields.id, id), eq(catalogFields.tenantId, tenantId)))
      .returning();

    return NextResponse.json(updatedField[0]);
  } catch (error) {
    console.error("PUT /api/catalog-fields/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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
      where: and(
        eq(catalogFields.id, id),
        eq(catalogFields.tenantId, tenantId)
      ),
    });

    if (!existingField) {
      return NextResponse.json({ error: "Field tidak ditemukan" }, { status: 404 });
    }

    if (existingField.isSystem) {
      return NextResponse.json({ error: "Field sistem tidak dapat dihapus" }, { status: 400 });
    }

    await db
      .delete(catalogFields)
      .where(and(eq(catalogFields.id, id), eq(catalogFields.tenantId, tenantId)));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("DELETE /api/catalog-fields/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
