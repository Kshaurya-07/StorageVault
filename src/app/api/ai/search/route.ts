import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { executeAiSearch } from "@/lib/ai/aiSearchEngine";

/**
 * POST /api/ai/search
 * Privacy-First AI Search Engine for VAULT AI.
 * Natural language queries e.g.:
 * - "Find my Java notes"
 * - "Show PDFs uploaded last week"
 * - "Show videos larger than 100 MB"
 * - "Find my Navratri posters"
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = await executeAiSearch({
      userId: session.userId,
      query,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI search error:", error);
    return NextResponse.json({ error: "Failed to perform AI search" }, { status: 500 });
  }
}
