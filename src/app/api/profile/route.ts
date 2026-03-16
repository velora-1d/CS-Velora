import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      namaToko: tenant.namaToko,
      deskripsi: tenant.deskripsi,
      logoUrl: tenant.logoUrl,
      linkShopee: tenant.linkShopee,
      linkTiktok: tenant.linkTiktok,
      waNumber: tenant.waNumber,
      waProvider: tenant.waProvider,
      paket: tenant.paket,
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();

    const updated = await db.update(tenants).set({
      namaToko: body.namaToko,
      deskripsi: body.deskripsi,
      linkShopee: body.linkShopee,
      linkTiktok: body.linkTiktok,
    }).where(eq(tenants.id, tenantId)).returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
