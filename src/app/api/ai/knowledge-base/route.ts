import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBotContext } from "@/lib/ai";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const context = await getBotContext(tenantId);

    return NextResponse.json(context);
  } catch (error) {
    console.error("GET /api/ai/knowledge-base error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
