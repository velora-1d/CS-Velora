import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// PUT update paket
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, harga, deskripsi, features,
      maxWaAccounts, maxBotReplies, maxCatalogItems, maxFaqs, maxPromos,
      isActive, sortOrder
    } = body;

    const result = await db.execute(sql`
      UPDATE packages SET
        name              = ${name},
        harga             = ${harga},
        deskripsi         = ${deskripsi || null},
        features          = ${JSON.stringify(features || [])}::jsonb,
        max_wa_accounts   = ${maxWaAccounts ?? 1},
        max_bot_replies   = ${maxBotReplies ?? -1},
        max_catalog_items = ${maxCatalogItems ?? -1},
        max_faqs          = ${maxFaqs ?? -1},
        max_promos        = ${maxPromos ?? -1},
        is_active         = ${isActive ?? true},
        sort_order        = ${sortOrder ?? 99},
        updated_at        = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("PUT /api/owner/packages/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE hapus paket
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cek key — jangan hapus basic/pro yang built-in
    const pkg = await db.execute(sql`SELECT key FROM packages WHERE id = ${params.id}`);
    if (pkg.rows.length === 0) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }
    if (["basic", "pro"].includes((pkg.rows[0] as any).key)) {
      return NextResponse.json({ error: "Paket bawaan (basic/pro) tidak bisa dihapus" }, { status: 400 });
    }

    await db.execute(sql`DELETE FROM packages WHERE id = ${params.id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/owner/packages/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
