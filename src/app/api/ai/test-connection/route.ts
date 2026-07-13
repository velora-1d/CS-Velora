import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { aiSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    const body = await req.json().catch(() => ({}));
    let { provider, apiKey, baseUrl } = body;

    // Load saved settings if apiKey is masked or undefined
    if (apiKey === undefined || apiKey === "••••••••••••") {
      const saved = await db.query.aiSettings.findFirst({
        where: eq(aiSettings.tenantId, tenantId),
      });
      apiKey = saved?.apiKey;
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key wajib diisi" }, { status: 400 });
    }

    const isAnthropic = provider === "anthropic" || provider === "anthropic_compatible";

    if (isAnthropic) {
      let endpoint = "https://api.anthropic.com/v1/messages";
      if (provider === "anthropic_compatible" && baseUrl) {
        const base = baseUrl.replace(/\/$/, "");
        endpoint = base.endsWith("/messages") ? base : `${base}/messages`;
      }

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            messages: [{ role: "user", content: "Ping" }],
            max_tokens: 1,
          }),
        });

        if (res.ok) {
          return NextResponse.json({ success: true, message: "Koneksi Anthropic berhasil terhubung!" });
        } else {
          // Attempt to parse readable error from Anthropic
          const errText = await res.text();
          let msg = res.statusText || "Gagal";
          try {
            const parsed = JSON.parse(errText);
            if (parsed.error?.message) msg = parsed.error.message;
          } catch {
            if (errText) msg = errText.substring(0, 150);
          }
          return NextResponse.json({ success: false, error: `Anthropic: ${msg}` });
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Kesalahan Jaringan: ${err.message || String(err)}` });
      }
    } else {
      // OpenAI or OpenAI Compatible
      let endpoint = "https://api.openai.com/v1";
      if (provider === "openai_compatible" && baseUrl) {
        endpoint = baseUrl;
      }

      const cleanUrl = endpoint.replace(/\/$/, "");
      const modelsUrl = `${cleanUrl}/models`;

      try {
        const res = await fetch(modelsUrl, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          return NextResponse.json({ success: true, message: "Koneksi OpenAI/Compatible berhasil terhubung!" });
        } else {
          const errText = await res.text();
          let msg = res.statusText || "Gagal";
          try {
            const parsed = JSON.parse(errText);
            if (parsed.error?.message) msg = parsed.error.message;
          } catch {
            if (errText) msg = errText.substring(0, 150);
          }
          return NextResponse.json({ success: false, error: `OpenAI/Compatible: ${msg}` });
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Kesalahan Jaringan: ${err.message || String(err)}` });
      }
    }
  } catch (error: any) {
    console.error("POST /api/ai/test-connection error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
