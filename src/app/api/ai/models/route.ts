import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { aiSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const settings = await db.query.aiSettings.findFirst({
      where: eq(aiSettings.tenantId, tenantId),
    });

    const provider = settings?.provider || "openai";
    let apiKey = settings?.apiKey;
    let baseUrl = settings?.baseUrl;

    // Jika tenant belum mengatur API Key di dashboard, jangan berikan daftar model apapun (jangan fallback ke env)
    if (!apiKey || apiKey === "••••••••••••") {
      return NextResponse.json({ data: [] });
    }

    if (provider === "anthropic" || provider === "anthropic_compatible") {
      // Anthropic does not have a public endpoint to query active models list dynamically, return static list.
      return NextResponse.json({
        data: [
          { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", object: "model" },
          { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", object: "model" },
          { id: "claude-3-opus-20240229", name: "Claude 3 Opus", object: "model" }
        ]
      });
    }

    if (!baseUrl) {
      if (provider === "openai") {
        baseUrl = "https://api.openai.com/v1";
      } else {
        // OpenAI Compatible kustom mewajibkan Base URL
        return NextResponse.json({ data: [] });
      }
    }

    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch models from AI provider", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/ai/models error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
