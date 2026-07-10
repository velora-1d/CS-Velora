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

    const tenantId = session.user.tenantId;
    
    let settings = await db.query.aiSettings.findFirst({
      where: eq(aiSettings.tenantId, tenantId),
    });

    if (!settings) {
        // Create default if not exists
        const newSettings = await db.insert(aiSettings).values({
            tenantId,
            systemPrompt: "",
            namaAgent: "Velora",
            model: "",
            provider: "openai",
        }).returning();
        settings = newSettings[0];
    }

    // Mask API Key for security
    const responseSettings = { ...settings };
    if (responseSettings.apiKey) {
      responseSettings.apiKey = "••••••••••••";
    }

    return NextResponse.json(responseSettings);
  } catch (error) {
    console.error("GET /api/ai-settings error:", error);
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

    const updateData: any = {
      systemPrompt: body.systemPrompt,
      namaAgent: body.namaAgent,
      model: body.model,
      tone: body.tone,
      aktif: body.aktif,
      provider: body.provider || "openai",
      baseUrl: body.baseUrl || null,
    };

    if (body.apiKey && body.apiKey !== "••••••••••••") {
      updateData.apiKey = body.apiKey;
    }

    const updatedSettings = await db.update(aiSettings).set(updateData).where(eq(aiSettings.tenantId, tenantId)).returning();
    
    if (updatedSettings.length === 0) {
        const insertData: any = {
            tenantId,
            systemPrompt: body.systemPrompt,
            namaAgent: body.namaAgent,
            model: body.model || "",
            tone: body.tone || "semi-formal",
            aktif: body.aktif !== undefined ? body.aktif : true,
            provider: body.provider || "openai",
            baseUrl: body.baseUrl || null,
        };
        if (body.apiKey && body.apiKey !== "••••••••••••") {
            insertData.apiKey = body.apiKey;
        }
        const newSettings = await db.insert(aiSettings).values(insertData).returning();
        
        const responseSettings = { ...newSettings[0] };
        if (responseSettings.apiKey) {
          responseSettings.apiKey = "••••••••••••";
        }
        return NextResponse.json(responseSettings);
    }

    const responseSettings = { ...updatedSettings[0] };
    if (responseSettings.apiKey) {
      responseSettings.apiKey = "••••••••••••";
    }
    return NextResponse.json(responseSettings);
  } catch (error) {
    console.error("PUT /api/ai-settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
