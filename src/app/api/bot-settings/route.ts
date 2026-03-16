import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { botSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    
    let settings = await db.query.botSettings.findFirst({
      where: eq(botSettings.tenantId, tenantId),
    });

    if (!settings) {
        const newSettings = await db.insert(botSettings).values({
            tenantId,
            greeting: "Halo! Ada yang bisa kami bantu?",
            pesanOffline: "Maaf, kami sedang offline.",
            jamBuka: "08:00:00",
            jamTutup: "17:00:00"
        }).returning();
        settings = newSettings[0];
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/bot-settings error:", error);
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

    const updatedSettings = await db.update(botSettings).set({
      greeting: body.greeting,
      pesanOffline: body.pesanOffline,
      jamBuka: body.jamBuka,
      jamTutup: body.jamTutup,
      delayMin: body.delayMin,
      delayMax: body.delayMax,
      typingIndicator: body.typingIndicator,
      aiEnabled: body.aiEnabled,
      bahasaDefault: body.bahasaDefault,
    }).where(eq(botSettings.tenantId, tenantId)).returning();
    
    if (updatedSettings.length === 0) {
        return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updatedSettings[0]);
  } catch (error) {
    console.error("PUT /api/bot-settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
