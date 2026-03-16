import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { consultationSlots } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const slots = await db.query.consultationSlots.findMany({
      where: eq(consultationSlots.tenantId, tenantId),
      orderBy: [desc(consultationSlots.tanggal), desc(consultationSlots.jamMulai)],
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("GET /api/consultations/slots error:", error);
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

    const newSlot = await db.insert(consultationSlots).values({
      tenantId,
      productId: body.productId,
      tanggal: body.tanggal, // Format: YYYY-MM-DD
      jamMulai: body.jamMulai, // Format: HH:MM:SS
      jamSelesai: body.jamSelesai,
      status: "tersedia",
    }).returning();

    return NextResponse.json(newSlot[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/consultations/slots error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
