import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ownerSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = ["system_login_logo", "system_favicon", "system_sidebar_logo"];
    const settingsList = await db.query.ownerSettings.findMany();
    
    const result: Record<string, string> = {
      system_login_logo: "/logo-velora.png",
      system_favicon: "/logo-velora.png",
      system_sidebar_logo: "/logo-velora.png",
    };

    settingsList.forEach((s) => {
      if (keys.includes(s.key)) {
        result[s.key] = s.value;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[OWNER_PLATFORM_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { system_login_logo, system_favicon, system_sidebar_logo } = body;

    const payload = [
      { key: "system_login_logo", value: system_login_logo || "/logo-velora.png" },
      { key: "system_favicon", value: system_favicon || "/logo-velora.png" },
      { key: "system_sidebar_logo", value: system_sidebar_logo || "/logo-velora.png" },
    ];

    for (const item of payload) {
      const existing = await db.query.ownerSettings.findFirst({
        where: eq(ownerSettings.key, item.key),
      });

      if (existing) {
        await db.update(ownerSettings).set({
          value: item.value,
          updatedAt: new Date(),
        }).where(eq(ownerSettings.key, item.key));
      } else {
        await db.insert(ownerSettings).values({
          key: item.key,
          value: item.value,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[OWNER_PLATFORM_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
