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
            systemPrompt: "You are a helpful assistant.",
            namaAgent: "Velora",
            model: "gpt-4o",
        }).returning();
        settings = newSettings[0];
    }

    return NextResponse.json(settings);
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

    const updatedSettings = await db.update(aiSettings).set({
      systemPrompt: body.systemPrompt,
      namaAgent: body.namaAgent,
      model: body.model,
      tone: body.tone,
      aktif: body.aktif,
    }).where(eq(aiSettings.tenantId, tenantId)).returning();
    
    if (updatedSettings.length === 0) {
        const newSettings = await db.insert(aiSettings).values({
            tenantId,
            systemPrompt: body.systemPrompt,
            namaAgent: body.namaAgent,
            model: body.model || "gpt-4o",
            tone: body.tone || "semi-formal",
            aktif: body.aktif !== undefined ? body.aktif : true,
        }).returning();
        return NextResponse.json(newSettings[0]);
    }

    return NextResponse.json(updatedSettings[0]);
  } catch (error) {
    console.error("PUT /api/ai-settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
