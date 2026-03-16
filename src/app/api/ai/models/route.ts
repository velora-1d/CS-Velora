import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.SEED_AI_API_KEY;
    const baseUrl = process.env.SEED_AI_URL || "https://ai.sumopod.com/v1";

    if (!apiKey) {
      return NextResponse.json({ error: "AI API Key not configured" }, { status: 500 });
    }

    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch models from AI provider", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Sort and filter models if needed, or just return as is
    // Sumopod/OpenAI usually returns { data: [...] }
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/ai/models error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
