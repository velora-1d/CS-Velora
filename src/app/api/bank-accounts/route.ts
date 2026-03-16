import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { paymentMethods } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const accounts = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.tenantId, tenantId),
      orderBy: [desc(paymentMethods.createdAt)],
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("GET /api/bank-accounts error:", error);
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

    const newAccount = await db.insert(paymentMethods).values({
      tenantId,
      tipe: body.tipe || "transfer",
      namaBank: body.namaBank,
      nomorRekening: body.nomorRekening,
      namaPemilik: body.namaPemilik,
      gambarQris: body.gambarQris,
      aktif: body.aktif !== undefined ? body.aktif : true,
    }).returning();

    return NextResponse.json(newAccount[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/bank-accounts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
