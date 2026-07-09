import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, orderId, type } = await req.json();

    const projectSlug = process.env.PAKASIR_PROJECT_SLUG;
    const apiKey = process.env.PAKASIR_API_KEY;

    if (action === "test-connection") {
      if (!projectSlug || !apiKey) {
        return NextResponse.json({
          success: false,
          error: "Konfigurasi PAKASIR_PROJECT_SLUG atau PAKASIR_API_KEY di file .env server belum diset!"
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
            slug: projectSlug,
            apiRes: data
          }
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Gagal menghubungi API Pakasir: ${err.message}`
        });
      }
    }

    if (action === "simulate-callback") {
      if (!orderId) {
        return NextResponse.json({ error: "orderId wajib diisi untuk simulasi" }, { status: 400 });
      }

      // Validasi prefix
      if (!orderId.startsWith("SUB-") && !orderId.startsWith("ORD-")) {
        return NextResponse.json({ error: "ID pesanan harus diawali 'SUB-' atau 'ORD-'" }, { status: 400 });
      }

      const localWebhookUrl = `http://localhost:${process.env.PORT || 3000}/api/webhooks/pakasir`;

      try {
        // Panggil endpoint webhook lokal kita
        const response = await fetch(localWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            status: "success",
            amount: type === "sub" ? 99000 : 50000,
            simulated: true
          })
        });

        const result = await response.json();

        return NextResponse.json({
          success: response.ok,
          status: response.status,
          message: response.ok ? "Simulasi callback berhasil dikirim!" : "Simulasi ditolak oleh handler webhook.",
          response: result
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Gagal memicu callback lokal: ${err.message}. Pastikan server berjalan di port default.`
        });
      }
    }

    return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    console.error("Test Pakasir error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
