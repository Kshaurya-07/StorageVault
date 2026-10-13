import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await prisma.telegramConnection.findUnique({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      connected: conn?.connectionStatus === "CONNECTED",
      status: conn?.connectionStatus || "DISCONNECTED",
      telegramUserId: conn?.telegramUserId || null,
      telegramUsername: conn?.telegramUsername || null,
      telegramFirstName: conn?.telegramFirstName || null,
      phoneNumber: conn?.phoneNumber ? conn.phoneNumber.replace(/(\d{3})\d+(\d{4})/, "$1****$2") : null,
      connectedAt: conn?.connectedAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error("Telegram status error:", error);
    return NextResponse.json({ error: "Failed to fetch Telegram status" }, { status: 500 });
  }
}
