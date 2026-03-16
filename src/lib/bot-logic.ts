import { db } from "@/lib/db";
import { botSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function checkBotAvailability(tenantId: string) {
  const settings = await db.query.botSettings.findFirst({
    where: eq(botSettings.tenantId, tenantId),
  });

  if (!settings) return { available: true, settings: null };

  // Cek apakah AI diaktifkan
  if (settings.aiEnabled === false) {
    return { available: false, settings };
  }

  const now = new Date();
  const currentTime = now.toTimeString().split(" ")[0]; // HH:mm:ss

  const isWithinHours = currentTime >= settings.jamBuka && currentTime <= settings.jamTutup;

  return {
    available: isWithinHours,
    settings,
  };
}
