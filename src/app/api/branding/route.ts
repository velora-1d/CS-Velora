import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settingsList = await db.query.ownerSettings.findMany();
    const result = {
      system_login_logo: "/logo-velora.png",
      system_favicon: "/logo-velora.png",
      system_sidebar_logo: "/logo-velora.png",
    };

    settingsList.forEach((s) => {
      if (s.key === "system_login_logo") result.system_login_logo = s.value;
      if (s.key === "system_favicon") result.system_favicon = s.value;
      if (s.key === "system_sidebar_logo") result.system_sidebar_logo = s.value;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[BRANDING_GET]", error);
    return NextResponse.json({
      system_login_logo: "/logo-velora.png",
      system_favicon: "/logo-velora.png",
      system_sidebar_logo: "/logo-velora.png",
    });
  }
}
