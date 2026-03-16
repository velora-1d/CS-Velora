import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { announcements } from "@/db/schema";
import { eq } from "drizzle-orm";

// PUT /api/owner/announcements/[id]
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await context.params;
    const body = await req.json();
    const { judul, isi, prioritas, targetAll } = body;

    const [updated] = await db
      .update(announcements)
      .set({
        judul,
        isi,
        prioritas,
        targetAll,
      })
      .where(eq(announcements.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ANNOUNCEMENT_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/owner/announcements/[id]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await context.params;
    await db.delete(announcements).where(eq(announcements.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ANNOUNCEMENT_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
