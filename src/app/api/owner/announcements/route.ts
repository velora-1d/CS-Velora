import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { announcements } from "@/db/schema";
import { desc } from "drizzle-orm";

// GET /api/owner/announcements
export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await db.query.announcements.findMany({
      orderBy: [desc(announcements.createdAt)],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[ANNOUNCEMENTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/owner/announcements
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { judul, isi, prioritas, targetAll } = body;

    if (!judul || !isi) {
      return NextResponse.json({ error: "Judul dan isi wajib diisi" }, { status: 400 });
    }

    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        judul,
        isi,
        prioritas: prioritas || "medium",
        targetAll: targetAll === undefined ? true : targetAll,
      })
      .returning();

    return NextResponse.json(newAnnouncement);
  } catch (error) {
    console.error("[ANNOUNCEMENTS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
