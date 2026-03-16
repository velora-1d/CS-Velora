import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAiCompletion } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { message, systemPrompt, namaAgent, model, tone } = body;

    if (!message) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    // Pass overrides to getAiCompletion to support testing unsaved settings
    const reply = await getAiCompletion(tenantId, message, [], {
      systemPrompt,
      namaAgent,
      model,
      tone,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("POST /api/ai/preview error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
