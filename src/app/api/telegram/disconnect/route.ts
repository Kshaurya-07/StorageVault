import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.telegramConnection.update({
      where: { userId: session.userId },
      data: {
        encryptedSessionReference: null,
        phoneCodeHash: null,
        connectionStatus: "DISCONNECTED",
        connectedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Telegram account disconnected successfully.",
    });
  } catch (error: any) {
    console.error("Telegram disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Telegram account" },
      { status: 500 }
    );
  }
}
