import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { getTelegramService } from "@/lib/telegram/telegramService";
import { encryptData } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json(
        { error: "Two-step verification cloud password is required." },
        { status: 400 }
      );
    }

    const conn = await prisma.telegramConnection.findUnique({
      where: { userId: session.userId },
    });

    if (!conn || conn.connectionStatus !== "PENDING_2FA") {
      return NextResponse.json(
        { error: "No pending 2FA challenge found. Please restart connection." },
        { status: 400 }
      );
    }

    const telegramService = await getTelegramService();
    const result = await telegramService.signIn2FA({
      password,
      phoneNumber: conn.phoneNumber || undefined,
    });

    if (!result.sessionString) {
      return NextResponse.json(
        { error: "Failed to establish Telegram session via 2FA." },
        { status: 500 }
      );
    }

    const encryptedSession = encryptData(result.sessionString);

    await prisma.telegramConnection.update({
      where: { userId: session.userId },
      data: {
        encryptedSessionReference: encryptedSession,
        telegramUserId: result.telegramUserId,
        telegramUsername: result.telegramUsername,
        telegramFirstName: result.telegramFirstName,
        connectionStatus: "CONNECTED",
        connectedAt: new Date(),
        phoneCodeHash: null,
      },
    });

    return NextResponse.json({
      success: true,
      connected: true,
      telegramUsername: result.telegramUsername,
      telegramFirstName: result.telegramFirstName,
      message: "Telegram 2FA verified. Connected successfully to your personal Saved Messages!",
    });
  } catch (error: any) {
    console.error("Telegram verify-2fa error:", error);
    return NextResponse.json(
      { error: error.message || "Invalid 2FA password." },
      { status: 400 }
    );
  }
}
