import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chatLogs } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fromNumber } = await params;
    const tenantId = session.user.tenantId;

    const messages = await db.query.chatLogs.findMany({
      where: and(
        eq(chatLogs.tenantId, tenantId),
        eq(chatLogs.fromNumber, fromNumber)
      ),
      orderBy: [asc(chatLogs.timestamp)],
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET /api/chats/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
