import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
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

    const existingProduct = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.tenantId, tenantId)),
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    const updatedProduct = await db.update(products).set({
      aktif: !existingProduct.aktif,
    }).where(and(eq(products.id, id), eq(products.tenantId, tenantId))).returning();

    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    console.error("PATCH /api/products/[id]/toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
