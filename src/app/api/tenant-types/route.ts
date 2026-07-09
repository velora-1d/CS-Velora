import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tenantTypes, catalogFields } from "@/db/schema";
import { eq, or, isNull, and } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Ambil template bawaan sistem (tenantId is null) ATAU kustom milik tenant ini
    const activeTypes = await db.query.tenantTypes.findMany({
      where: and(
        eq(tenantTypes.isActive, true),
        or(
          isNull(tenantTypes.tenantId),
          eq(tenantTypes.tenantId, tenantId)
        )
      ),
      orderBy: (tenantTypes, { asc }) => [asc(tenantTypes.createdAt)]
    });

    return NextResponse.json(activeTypes);
  } catch (error) {
    console.error("GET /api/tenant-types error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { name, catalogLabel, orderLabel } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama template wajib diisi" }, { status: 400 });
    }

    // Ambil field aktif saat ini dari database untuk disimpan sebagai template
    const currentFields = await db.query.catalogFields.findMany({
      where: eq(catalogFields.tenantId, tenantId),
      orderBy: (catalogFields, { asc }) => [asc(catalogFields.sortOrder)]
    });

    // Petakan ke format template
    const fieldTemplate = currentFields.map(f => ({
      label: f.label,
      fieldKey: f.fieldKey,
      fieldType: f.fieldType,
      options: f.options ?? undefined,
      isRequired: f.isRequired,
      isSystem: f.isSystem
    }));

    const key = `custom_${tenantId.substring(0, 8)}_${name.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    const [newTemplate] = await db.insert(tenantTypes).values({
      key,
      name: name.trim(),
      catalogLabel: catalogLabel || "Produk",
      orderLabel: orderLabel || "Pesanan",
      fieldTemplate,
      tenantId,
      isActive: true
    }).returning();

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tenant-types error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
