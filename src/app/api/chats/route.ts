import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chatLogs } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Group chats by fromNumber and get latest message + count
    const threads = await db
      .select({
        fromNumber: chatLogs.fromNumber,
        lastMessage: sql<string>`MAX(${chatLogs.message})`,
        lastReply: sql<string>`MAX(${chatLogs.reply})`,
        messageCount: sql<number>`COUNT(*)::int`,
        lastTimestamp: sql<string>`MAX(${chatLogs.timestamp})`,
        fromName: sql<string>`MAX(${chatLogs.fromName})`,
      })
      .from(chatLogs)
      .where(eq(chatLogs.tenantId, tenantId))
      .groupBy(chatLogs.fromNumber)
      .orderBy(desc(sql`MAX(${chatLogs.timestamp})`));

    return NextResponse.json(threads);
  } catch (error) {
    console.error("GET /api/chats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
