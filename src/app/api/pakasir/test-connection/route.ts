import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json().catch(() => ({}));
    let { projectSlug, apiKey } = body;

    // Load saved settings if not provided or masked
    if (!projectSlug || !apiKey || apiKey === "••••••••••••") {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
      });
      if (tenant) {
        if (!projectSlug) projectSlug = tenant.pakasirProjectSlug;
        if (!apiKey || apiKey === "••••••••••••") apiKey = tenant.pakasirApiKey;
      }
    }

    if (!projectSlug || !apiKey) {
      return NextResponse.json({
        success: false,
        error: "Project Slug dan API Key Pakasir wajib diisi!"
      });
    }

    // Test hit API Pakasir
    try {
      const testRes = await fetch("https://app.pakasir.com/api/transactiondetail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: projectSlug,
          api_key: apiKey,
          order_id: "TEST-CONN-123"
        })
      });

      const data = await testRes.json();
      
      // Pakasir API key valid jika tidak return error authentication
      if (data.error && data.error.toLowerCase().includes("auth")) {
        return NextResponse.json({
          success: false,
          error: `Autentikasi gagal: ${data.error}`
        });
      }

      return NextResponse.json({
        success: true,
        message: "Koneksi ke API Pakasir berhasil terhubung! API Key & Slug valid.",
        details: {
          slug: projectSlug
        }
      });
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        error: `Gagal menghubungi API Pakasir: ${err.message}`
      });
    }
  } catch (error: any) {
    console.error("Test Pakasir Tenant error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
