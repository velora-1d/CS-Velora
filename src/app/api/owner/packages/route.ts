import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// GET semua paket
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const packages = await db.execute(
      sql`SELECT * FROM packages ORDER BY sort_order ASC`
    );

    return NextResponse.json(packages.rows);
  } catch (error: any) {
    console.error("GET /api/owner/packages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST buat paket baru
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      key, name, harga, deskripsi, features,
      maxWaAccounts, maxBotReplies, maxCatalogItems, maxFaqs, maxPromos,
      isActive, sortOrder
    } = body;

    if (!key || !name || harga === undefined) {
      return NextResponse.json({ error: "key, name, dan harga wajib diisi" }, { status: 400 });
    }

    const result = await db.execute(sql`
      INSERT INTO packages (
        key, name, harga, deskripsi, features,
        max_wa_accounts, max_bot_replies, max_catalog_items, max_faqs, max_promos,
        is_active, sort_order
      ) VALUES (
        ${key}, ${name}, ${harga}, ${deskripsi || null},
        ${JSON.stringify(features || [])}::jsonb,
        ${maxWaAccounts ?? 1}, ${maxBotReplies ?? -1}, ${maxCatalogItems ?? -1},
        ${maxFaqs ?? -1}, ${maxPromos ?? -1},
        ${isActive ?? true}, ${sortOrder ?? 99}
      )
      RETURNING *
    `);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("POST /api/owner/packages error:", error);
    if (error.message?.includes("unique")) {
      return NextResponse.json({ error: "Key paket sudah digunakan" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
