import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find tenant by user id (assuming user id is tenant id or linked somehow)
  // Usually in this app, session.user.id is the tenantId or we can find it
  const list = await db.query.clients.findMany({
    where: eq(clients.tenantId, session.user.id),
    orderBy: [desc(clients.lastInteraction)],
  });

  return NextResponse.json(list);
}
