import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, chatLogs } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { getAiCompletion } from "@/lib/ai";
import { checkBotAvailability } from "@/lib/bot-logic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
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

    // 2. Find Tenant
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

    // 3. Log Incoming Message
    await db.insert(chatLogs).values({
      tenantId: tenant.id,
      fromNumber: messageData.from,
      message: messageData.body,
      isAi: false,
      isHuman: true,
    });

    // 4. Check Bot Availability & AI Settings
    const { available, settings } = await checkBotAvailability(tenant.id);
    
    if (!available) {
      const offlineMsg = settings?.pesanOffline || "Maaf, kami sedang offline.";
      await sendWhatsAppAndLog(tenant.id, messageData.from, offlineMsg, false);
      return NextResponse.json({ status: "offline_replied" });
    }

    // 5. Get AI Response
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

      const aiReply = await getAiCompletion(tenant.id, messageData.body, history);

      if (aiReply) {
        // Simulate thinking delay (typing indicator is handled by provider ideally)
        const delay = Math.floor(Math.random() * (settings?.delayMax || 5000 - (settings?.delayMin || 2000) + 1)) + (settings?.delayMin || 2000);
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)));

        await sendWhatsAppAndLog(tenant.id, messageData.from, aiReply, true);
        return NextResponse.json({ status: "ai_replied" });
      }
    } catch (aiError) {
      console.error("AI Error:", aiError);
      // Fallback or just ignore
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
      message: "", // The user didn't send this
      reply: message,
      isAi: isAi,
      isHuman: false,
    });
  } catch (error) {
    console.error("Failed to send WA or log reply:", error);
  }
}
