import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { catalogItems } from "@/db/schema";
import { eq, and, desc, ilike, sql } from "drizzle-orm";
import { validateCatalogItem } from "@/lib/catalog-validator";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const aktifParam = searchParams.get("aktif");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    // Build query filters
    const conditions = [eq(catalogItems.tenantId, tenantId)];

    if (search.trim()) {
      conditions.push(ilike(catalogItems.nama, `%${search.trim()}%`));
    }

    if (aktifParam === "true") {
      conditions.push(eq(catalogItems.aktif, true));
    } else if (aktifParam === "false") {
      conditions.push(eq(catalogItems.aktif, false));
    }

    const whereClause = and(...conditions);

    // Get total items count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(catalogItems)
      .where(whereClause);
    const total = Number(totalResult[0]?.count || 0);

    // Fetch paginated items
    const items = await db.query.catalogItems.findMany({
      where: whereClause,
      orderBy: [desc(catalogItems.createdAt)],
      limit,
      offset,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/catalog-items error:", error);
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

    // Validate request body against catalog fields configuration
    const validation = await validateCatalogItem(tenantId, body);

    if (!validation.isValid || !validation.cleanedData) {
      return NextResponse.json({ error: validation.error || "Validasi gagal" }, { status: 400 });
    }

    const { nama, harga, aktif, data } = validation.cleanedData;

    const newItem = await db.insert(catalogItems).values({
      tenantId,
      nama,
      harga,
      aktif,
      data,
    }).returning();

    return NextResponse.json(newItem[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/catalog-items error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
