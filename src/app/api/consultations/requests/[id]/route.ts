import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { consultationRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { id } = await params;
    const body = await req.json();

    if (!['approved', 'rejected', 'pending'].includes(body.status)) {
       return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedRequest = await db.update(consultationRequests).set({
      status: body.status,
      catatanAdmin: body.catatanAdmin || null,
    }).where(and(eq(consultationRequests.id, id), eq(consultationRequests.tenantId, tenantId))).returning();

    if (updatedRequest.length === 0) {
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updatedRequest[0]);
  } catch (error) {
    console.error("PATCH /api/consultations/requests/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
