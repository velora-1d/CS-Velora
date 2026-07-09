// src/app/api/whatsapp/test-connection/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEnvFallback } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();
    
    // Ambil info tenant dari DB
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });
    }

    const provider = body.provider || tenant.waProvider || "waha";
    const userRole = session.user.role;

    // Proteksi: Hanya Owner yang boleh test Fonnte
    if (provider === "fonnte" && userRole !== "owner") {
      return NextResponse.json({ error: "Fonnte eksklusif untuk Owner" }, { status: 403 });
    }

    if (provider === "waha") {
      const wahaBaseUrl = getEnvFallback("WAHA_API_URL") || "http://localhost:3000";
      // WAHA menggunakan API Key server global
      const wahaApiKey = getEnvFallback("WAHA_API_KEY") || "";

      console.log("[WAHA TEST CONNECTION DIAGNOSTICS]");
      console.log("- wahaBaseUrl:", wahaBaseUrl);
      console.log("- env.WAHA_API_KEY:", wahaApiKey ? `${wahaApiKey.slice(0, 3)}...` : "(kosong)");

      try {
        console.log(`[WAHA Ping] Mencoba menghubungi server WAHA di ${wahaBaseUrl}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const res = await fetch(`${wahaBaseUrl}/api/version`, {
          method: "GET",
          headers: {
            "X-Api-Key": wahaApiKey,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          return NextResponse.json({
            success: true,
            message: "Koneksi ke Server WAHA berhasil terhubung!",
            details: `HTTP ${res.status} - Version: ${text.slice(0, 50)}`
          });
        } else {
          const errBody = await res.text();
          console.warn(`WAHA Ping failed with status ${res.status}:`, errBody);
          return NextResponse.json({
            success: false,
            message: `Server WAHA merespon dengan status error HTTP ${res.status}. Kredensial API Key atau konfigurasi server mungkin salah.`,
            details: errBody.slice(0, 100)
          });
        }
      } catch (err: any) {
        console.error("WAHA Ping Error:", err);
        return NextResponse.json({
          success: false,
          message: `Gagal terhubung ke Server WAHA. Pastikan server WAHA aktif di URL ${wahaBaseUrl}. (Error: ${err.message})`
        });
      }
    }

    if (provider === "fonnte") {
      // Ambil api key dari tenant DB first, fallback ke env
      const fonnteApiKey = tenant.waApiKey || getEnvFallback("FONNTE_API_KEY") || getEnvFallback("FONNTE_TOKEN") || "";
      
      console.log("[FONNTE TEST CONNECTION DIAGNOSTICS]");
      console.log("- tenant.waApiKey:", tenant.waApiKey ? `${tenant.waApiKey.slice(0, 3)}...` : "(kosong)");
      console.log("- env.FONNTE_API_KEY:", getEnvFallback("FONNTE_API_KEY") ? `${getEnvFallback("FONNTE_API_KEY").slice(0, 3)}...` : "(kosong)");
      console.log("- env.FONNTE_TOKEN:", getEnvFallback("FONNTE_TOKEN") ? `${getEnvFallback("FONNTE_TOKEN").slice(0, 3)}...` : "(kosong)");
      console.log("- fonnteApiKey Terpilih:", fonnteApiKey ? `${fonnteApiKey.slice(0, 3)}...` : "(kosong)");

      if (!fonnteApiKey) {
        return NextResponse.json({
          success: false,
          message: "API Key Fonnte tidak ditemukan di database maupun file .env server (FONNTE_API_KEY)."
        });
      }

      try {
        console.log(`[Fonnte Ping] Mencoba menghubungi API Fonnte...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch("https://api.fonnte.com/device", {
          method: "POST",
          headers: {
            Authorization: fonnteApiKey,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        
        if (res.ok && data.status === true) {
          return NextResponse.json({
            success: true,
            message: "Koneksi ke API Fonnte sukses terhubung!",
            details: `Device: ${data.device || "N/A"} - Status: ${data.device_status || "N/A"}`
          });
        } else {
          return NextResponse.json({
            success: false,
            message: `API Fonnte merespon dengan kegagalan. ${data.reason || "Kunci Token/API Key Fonnte salah atau kedaluwarsa."}`
          });
        }
      } catch (err: any) {
        console.error("Fonnte Ping Error:", err);
        return NextResponse.json({
          success: false,
          message: `Gagal menghubungi API Fonnte. Periksa koneksi internet atau status server Fonnte. (Error: ${err.message})`
        });
      }
    }

    return NextResponse.json({ error: "Provider tidak dikenali" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/whatsapp/test-connection error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
