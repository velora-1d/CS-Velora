import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { catalogFields, catalogFieldTypeEnum } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    const fields = await db.query.catalogFields.findMany({
      where: eq(catalogFields.tenantId, tenantId),
      orderBy: [asc(catalogFields.sortOrder)],
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error("GET /api/catalog-fields error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();

    const { label, fieldKey, fieldType, options, isRequired, isActive, sortOrder } = body;

    // Validation
    if (!label?.trim()) {
      return NextResponse.json({ error: "Label wajib diisi" }, { status: 400 });
    }

    if (!fieldKey?.trim()) {
      return NextResponse.json({ error: "Field key wajib diisi" }, { status: 400 });
    }

    // snake_case validation
    const snakeCaseRegex = /^[a-z0-9_]+$/;
    if (!snakeCaseRegex.test(fieldKey)) {
      return NextResponse.json({ error: "Field key harus dalam format snake_case (huruf kecil, angka, dan underscore saja)" }, { status: 400 });
    }

    // Check valid fieldType
    const validFieldTypes = catalogFieldTypeEnum.enumValues;
    if (!validFieldTypes.includes(fieldType)) {
      return NextResponse.json({ error: `Tipe field harus salah satu dari: ${validFieldTypes.join(", ")}` }, { status: 400 });
    }

    // If type is select, options is required
    if (fieldType === "select" && (!Array.isArray(options) || options.length === 0)) {
      return NextResponse.json({ error: "Pilihan (options) wajib diisi untuk tipe select" }, { status: 400 });
    }

    // Check uniqueness of fieldKey for this tenant
    const existingField = await db.query.catalogFields.findFirst({
      where: and(
        eq(catalogFields.tenantId, tenantId),
        eq(catalogFields.fieldKey, fieldKey.trim())
      ),
    });

    if (existingField) {
      return NextResponse.json({ error: `Field key '${fieldKey}' sudah digunakan` }, { status: 400 });
    }

    // Get max sortOrder if not provided
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const maxOrder = await db
        .select({ max: sql<number>`max(${catalogFields.sortOrder})` })
        .from(catalogFields)
        .where(eq(catalogFields.tenantId, tenantId));
      finalSortOrder = (maxOrder[0]?.max || 0) + 1;
    }

    const newField = await db.insert(catalogFields).values({
      tenantId,
      label: label.trim(),
      fieldKey: fieldKey.trim(),
      fieldType,
      options: fieldType === "select" ? options : null,
      isRequired: !!isRequired,
      isActive: isActive !== false,
      isSystem: false, // Custom field created via POST cannot be system field
      sortOrder: finalSortOrder,
    }).returning();

    return NextResponse.json(newField[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/catalog-fields error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
