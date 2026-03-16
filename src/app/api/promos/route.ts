import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { promos } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const allPromos = await db.query.promos.findMany({
      where: eq(promos.tenantId, tenantId),
      orderBy: [desc(promos.createdAt)],
    });

    return NextResponse.json(allPromos);
  } catch (error) {
    console.error("GET /api/promos error:", error);
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

    const newPromo = await db.insert(promos).values({
      tenantId,
      judul: body.judul,
      deskripsi: body.deskripsi,
      tanggalMulai: body.tanggalMulai, // Format: YYYY-MM-DD
      tanggalBerakhir: body.tanggalBerakhir,
      aktif: true,
    }).returning();

    return NextResponse.json(newPromo[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/promos error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
