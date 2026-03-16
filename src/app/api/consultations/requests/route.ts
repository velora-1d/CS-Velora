import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { consultationRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const requests = await db.query.consultationRequests.findMany({
      where: eq(consultationRequests.tenantId, tenantId),
      orderBy: [desc(consultationRequests.createdAt)],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/consultations/requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
