import { db } from "@/lib/db";
import { tenants, waSessions, ownerSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getEnvFallback } from "@/lib/env";

export async function sendWhatsAppMessage(tenantId: string, to: string, message: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) throw new Error("Tenant not found");

  if (tenant.waProvider === "fonnte") {
    const ownerFonnteSetting = await db.query.ownerSettings.findFirst({
      where: eq(ownerSettings.key, "owner_fonnte_token"),
    });
    const fonnteKey = tenant.waApiKey 
      || ownerFonnteSetting?.value 
      || getEnvFallback("FONNTE_API_KEY") 
      || getEnvFallback("FONNTE_TOKEN") 
      || "";
    return sendFonnteMessage(fonnteKey, to, message);
  } else if (tenant.waProvider === "waha") {
    // Lookup active WAHA session from waSessions table (multi-device support)
    const activeSession = await db.query.waSessions.findFirst({
      where: and(
        eq(waSessions.tenantId, tenantId),
        eq(waSessions.status, "connected")
      ),
    });
    // Fallback to any session or legacy waSessionId if no connected session found
    const sessionId = activeSession?.sessionId || tenant.waSessionId || "default";
    return sendWahaMessage(sessionId, to, message);
  }
  
  throw new Error("No WA provider configured for tenant");
}

export async function setWhatsAppPresence(tenantId: string, to: string, presence: "typing" | "paused") {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) return;

  if (tenant.waProvider === "fonnte" && presence === "typing") {
    const ownerFonnteSetting = await db.query.ownerSettings.findFirst({
      where: eq(ownerSettings.key, "owner_fonnte_token"),
    });
    const fonnteKey = tenant.waApiKey 
      || ownerFonnteSetting?.value 
      || getEnvFallback("FONNTE_API_KEY") 
      || getEnvFallback("FONNTE_TOKEN") 
      || "";
    return setFonntePresence(fonnteKey, to);
  } else if (tenant.waProvider === "waha") {
    // Lookup active WAHA session from waSessions table (multi-device support)
    const activeSession = await db.query.waSessions.findFirst({
      where: and(
        eq(waSessions.tenantId, tenantId),
        eq(waSessions.status, "connected")
      ),
    });
    const sessionId = activeSession?.sessionId || tenant.waSessionId || "default";
    return setWahaPresence(sessionId, to, presence);
  }
}

async function sendFonnteMessage(apiKey: string, to: string, message: string) {
  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: apiKey,
    },
    body: new URLSearchParams({
      target: to,
      message: message,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Fonnte error:", err);
    throw new Error(`Fonnte API failed: ${err}`);
  }

  return res.json();
}

async function sendWahaMessage(session: string, to: string, message: string) {
  const baseUrl = getEnvFallback("WAHA_URL") || getEnvFallback("WAHA_API_URL") || "http://localhost:3000";
  const wahaSecret = getEnvFallback("WAHA_SECRET") || getEnvFallback("WAHA_API_KEY");

  const res = await fetch(`${baseUrl}/api/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(wahaSecret ? { "X-Api-Key": wahaSecret } : {}),
    },
    body: JSON.stringify({
      chatId: `${to}@c.us`,
      text: message,
      session: session,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("WAHA error:", err);
    throw new Error(`WAHA API failed: ${err}`);
  }

  return res.json();
}

async function setFonntePresence(apiKey: string, to: string) {
  try {
    await fetch("https://api.fonnte.com/typing", {
      method: "POST",
      headers: { Authorization: apiKey },
      body: new URLSearchParams({ target: to }),
    });
  } catch (error) {
    console.error("Fonnte presence error:", error);
  }
}

async function setWahaPresence(session: string, to: string, presence: "typing" | "paused") {
  try {
    const baseUrl = getEnvFallback("WAHA_URL") || getEnvFallback("WAHA_API_URL") || "http://localhost:3000";
    const wahaSecret = getEnvFallback("WAHA_SECRET") || getEnvFallback("WAHA_API_KEY");

    await fetch(`${baseUrl}/api/presence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(wahaSecret ? { "X-Api-Key": wahaSecret } : {}),
      },
      body: JSON.stringify({
        session,
        chatId: `${to}@c.us`,
        presence,
      }),
    });
  } catch (error) {
    console.error("WAHA presence error:", error);
  }
}
