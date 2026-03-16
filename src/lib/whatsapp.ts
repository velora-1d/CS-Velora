import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function sendWhatsAppMessage(tenantId: string, to: string, message: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) throw new Error("Tenant not found");

  if (tenant.waProvider === "fonnte") {
    return sendFonnteMessage(tenant.waApiKey || "", to, message);
  } else if (tenant.waProvider === "waha") {
    return sendWahaMessage(tenant.waSessionId || "default", to, message);
  }
  
  throw new Error("No WA provider configured for tenant");
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
  const baseUrl = process.env.WAHA_URL || "http://localhost:3000";
  const wahaSecret = process.env.WAHA_SECRET;

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
