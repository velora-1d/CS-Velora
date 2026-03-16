import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, chatLogs } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { sendWhatsAppMessage, setWhatsAppPresence } from "@/lib/whatsapp";
import { getAiCompletion } from "@/lib/ai";
import { checkBotAvailability } from "@/lib/bot-logic";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // max 30 requests per minute per number
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(fromNumber: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(fromNumber);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(fromNumber, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return true;
  }

  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Security check: WAHA or Fonnte secret validation
    const wahaSecret = req.headers.get("x-waha-secret") || req.headers.get("x-api-key");
    const fonnteSecret = req.headers.get("x-fonnte-secret");
    
    const envSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    
    if (envSecret && wahaSecret !== envSecret && fonnteSecret !== envSecret) {
      console.warn("Unauthorized webhook attempt blocked.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Incoming Webhook:", JSON.stringify(body, null, 2));

    let messageData = {
      from: "",
      body: "",
      provider: "",
      identifier: "", // session for WAHA, device for Fonnte
    };

    // 1. Parse Provider Payload
    if (body.event === "message.created") {
      // WAHA
      messageData = {
        from: body.payload.from.split("@")[0],
        body: body.payload.body,
        provider: "waha",
        identifier: body.session,
      };
      // Skip if message is from the bot itself
      if (body.payload.fromMe) return NextResponse.json({ status: "skipped_from_me" });
    } else if (body.sender && body.message && body.device) {
      // Fonnte
      messageData = {
        from: body.sender,
        body: body.message,
        provider: "fonnte",
        identifier: body.device,
      };
    } else {
      return NextResponse.json({ error: "Unsupported provider payload" }, { status: 400 });
    }

    // 2. Rate Limiting
    if (isRateLimited(messageData.from)) {
      console.warn(`Rate limited: ${messageData.from}`);
      return NextResponse.json({ status: "rate_limited" }, { status: 429 });
    }

    // 3. Find Tenant
    const tenant = await db.query.tenants.findFirst({
      where: or(
        eq(tenants.waSessionId, messageData.identifier),
        eq(tenants.waNumber, messageData.identifier)
      ),
    });

    if (!tenant) {
      console.error("Tenant not found for identifier:", messageData.identifier);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 4. Log Incoming Message
    await db.insert(chatLogs).values({
      tenantId: tenant.id,
      fromNumber: messageData.from,
      message: messageData.body,
      isAi: false,
      isHuman: true,
    });

    // 5. Check Bot Availability & AI Settings
    const { available, settings } = await checkBotAvailability(tenant.id);
    
    if (!available) {
      const offlineMsg = settings?.pesanOffline || "Maaf, kami sedang offline.";
      await sendWhatsAppAndLog(tenant.id, messageData.from, offlineMsg, false);
      return NextResponse.json({ status: "offline_replied" });
    }

    // 6. Get AI Response
    try {
      // Get last 5 messages for context
      const historyLogs = await db.query.chatLogs.findMany({
        where: eq(chatLogs.fromNumber, messageData.from),
        orderBy: (chatLogs, { desc }) => [desc(chatLogs.timestamp)],
        limit: 5,
      });

      const history = historyLogs.reverse().map(log => ({
        role: log.isAi ? "assistant" : "user",
        content: log.message || log.reply || "",
      }));

      // Calculate delay with correct operator precedence
      const delayMin = settings?.delayMin || 2000;
      const delayMax = settings?.delayMax || 5000;
      const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
      const safeDelay = Math.min(delay, 8000); // cap at 8 seconds

      // Start typing indicator BEFORE delay
      if (settings?.typingIndicator !== false) {
        await setWhatsAppPresence(tenant.id, messageData.from, "typing");
      }

      const aiReply = await getAiCompletion(tenant.id, messageData.body, history, undefined, messageData.from);

      if (aiReply) {
        // Wait delay WHILE typing indicator is showing
        await new Promise(resolve => setTimeout(resolve, safeDelay));

        // Stop typing indicator THEN send message
        if (settings?.typingIndicator !== false) {
          await setWhatsAppPresence(tenant.id, messageData.from, "paused");
        }

        await sendWhatsAppAndLog(tenant.id, messageData.from, aiReply, true);
        return NextResponse.json({ status: "ai_replied" });
      }
    } catch (aiError) {
      console.error("AI Error:", aiError);
    }

    return NextResponse.json({ status: "no_action" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function sendWhatsAppAndLog(tenantId: string, to: string, message: string, isAi: boolean) {
  try {
    await sendWhatsAppMessage(tenantId, to, message);
    
    await db.insert(chatLogs).values({
      tenantId,
      fromNumber: to,
      message: "",
      reply: message,
      isAi: isAi,
      isHuman: false,
    });
  } catch (error) {
    console.error("Failed to send WA or log reply:", error);
  }
}
