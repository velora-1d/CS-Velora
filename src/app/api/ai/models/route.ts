import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { aiSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const MASKED_API_KEY = "••••••••••••";

type SessionUser = {
  tenantId?: string;
};

type ModelsRequestBody = {
  provider?: string;
  apiKey?: string;
  baseUrl?: string | null;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = (session.user as SessionUser).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const settings = await db.query.aiSettings.findFirst({
      where: eq(aiSettings.tenantId, tenantId),
    });

    return getModels({
      provider: settings?.provider,
      apiKey: settings?.apiKey,
      baseUrl: settings?.baseUrl,
    });
  } catch (error) {
    console.error("GET /api/ai/models error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = (session.user as SessionUser).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({})) as ModelsRequestBody;
    const saved = await db.query.aiSettings.findFirst({
      where: eq(aiSettings.tenantId, tenantId),
    });

    const apiKey = body.apiKey !== undefined && body.apiKey !== MASKED_API_KEY
      ? body.apiKey
      : saved?.apiKey;

    return getModels({
      provider: body.provider || saved?.provider,
      apiKey,
      baseUrl: body.baseUrl ?? saved?.baseUrl,
    });
  } catch (error) {
    console.error("POST /api/ai/models error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function getModels({
  provider = "openai",
  apiKey,
  baseUrl,
}: {
  provider?: string | null;
  apiKey?: string | null;
  baseUrl?: string | null;
}) {
  if (!apiKey || apiKey === MASKED_API_KEY) {
    return NextResponse.json({ data: [] });
  }

  const isAnthropic = provider === "anthropic" || provider === "anthropic_compatible";
  const resolvedBaseUrl = baseUrl
    || (provider === "openai" ? "https://api.openai.com/v1" : null)
    || (provider === "anthropic" ? "https://api.anthropic.com/v1" : null);
  if (!resolvedBaseUrl) {
    return NextResponse.json({ data: [] });
  }

  const cleanBaseUrl = resolvedBaseUrl
    .replace(/\/(chat\/completions|messages)$/, "")
    .replace(/\/$/, "");
  const response = await fetch(`${cleanBaseUrl}/models`, {
    headers: isAnthropic
      ? {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        }
      : {
          Authorization: `Bearer ${apiKey}`,
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

  return NextResponse.json(await response.json());
}
