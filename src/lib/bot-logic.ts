import { db } from "@/lib/db";
import { botSettings, businessProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function checkBotAvailability(tenantId: string, businessProfileId?: string) {
  const settings = await db.query.botSettings.findFirst({
    where: eq(botSettings.tenantId, tenantId),
  });

  let businessProfile = null;
  if (businessProfileId) {
    businessProfile = await db.query.businessProfiles.findFirst({
      where: eq(businessProfiles.id, businessProfileId),
    });
  }

  // Cek apakah AI diaktifkan (prioritaskan setting di businessProfile)
  const aiEnabled = businessProfile ? businessProfile.aiEnabled : (settings?.aiEnabled !== false);
  if (!aiEnabled) {
    return { available: false, settings, businessProfile };
  }

  if (!settings) return { available: true, settings: null, businessProfile };

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const currentTime = formatter.format(now); // HH:mm:ss

  const isWithinHours = currentTime >= settings.jamBuka && currentTime <= settings.jamTutup;

  return {
    available: isWithinHours,
    settings,
    businessProfile,
  };
}
