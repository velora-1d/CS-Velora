import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tenants, tenantTypes, catalogFields, ownerSettings } from "@/db/schema";
import type { CatalogFieldTemplate } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const [tenant, webhookSetting] = await Promise.all([
      db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        with: {
          tenantType: true,
        },
      }),
      db.query.ownerSettings.findFirst({
        where: eq(ownerSettings.key, "pakasir_webhook_url"),
      })
    ]);

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
      waApiKey: tenant.waApiKey,
      paket: tenant.paket,
      pakasirProjectSlug: tenant.pakasirProjectSlug,
      pakasirApiKey: tenant.pakasirApiKey,
      tenantTypeId: tenant.tenantTypeId,
      catalogLabel: tenant.catalogLabel,
      orderLabel: tenant.orderLabel,
      tenantType: tenant.tenantType,
      pakasirWebhookUrl: webhookSetting?.value || "https://cs.ve-lora.my.id/api/webhooks/pakasir",
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

    // Check if tenantTypeId is being updated
    const currentTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!currentTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Neon HTTP driver tidak support transactions — gunakan sequential queries
    let tenantTypeId = body.tenantTypeId;
    let catalogLabel = body.catalogLabel || currentTenant.catalogLabel;
    let orderLabel = body.orderLabel || currentTenant.orderLabel;

    // Jika tenant type berubah, sinkron catalog fields dari template
    if (tenantTypeId && tenantTypeId !== currentTenant.tenantTypeId) {
      const template = await db.query.tenantTypes.findFirst({
        where: eq(tenantTypes.id, tenantTypeId),
      });

      if (!template) {
        return NextResponse.json({ error: "Template tipe bisnis tidak ditemukan" }, { status: 400 });
      }

      // Label dari template (kecuali user sudah custom isi manual)
      catalogLabel = body.catalogLabel || template.catalogLabel;
      orderLabel = body.orderLabel || template.orderLabel;

      // Hapus catalog fields lama tenant ini
      await db.delete(catalogFields).where(eq(catalogFields.tenantId, tenantId));

      // Insert catalog fields baru dari template
      const templateFields: CatalogFieldTemplate[] = template.fieldTemplate || [];
      for (let i = 0; i < templateFields.length; i++) {
        const field = templateFields[i];
        await db.insert(catalogFields).values({
          tenantId,
          label: field.label,
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          options: field.options || null,
          isRequired: !!field.isRequired,
          isSystem: !!field.isSystem,
          isActive: true,
          sortOrder: i,
        });
      }
    }

    // Update tenant data
    const updateData: any = {
      namaToko: body.namaToko,
      deskripsi: body.deskripsi,
      linkShopee: body.linkShopee,
      linkTiktok: body.linkTiktok,
      pakasirProjectSlug: body.pakasirProjectSlug || null,
      pakasirApiKey: body.pakasirApiKey || null,
      tenantTypeId: tenantTypeId || currentTenant.tenantTypeId,
      catalogLabel,
      orderLabel,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : currentTenant.logoUrl,
    };

    if (session.user.role === "owner") {
      if (body.waProvider !== undefined) {
        updateData.waProvider = body.waProvider;
      }
      if (body.waApiKey !== undefined) {
        updateData.waApiKey = body.waApiKey || null;
      }
    }

    const [updated] = await db.update(tenants).set(updateData).where(eq(tenants.id, tenantId)).returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}


