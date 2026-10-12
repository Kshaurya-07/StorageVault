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

    const { phoneCode } = await req.json();
    if (!phoneCode || typeof phoneCode !== "string") {
      return NextResponse.json(
        { error: "Confirmation code is required." },
        { status: 400 }
      );
    }

    const conn = await prisma.telegramConnection.findUnique({
      where: { userId: session.userId },
    });

    if (!conn || !conn.phoneNumber || !conn.phoneCodeHash) {
      return NextResponse.json(
        { error: "No pending verification found. Please request a new code." },
        { status: 400 }
      );
    }

    const telegramService = await getTelegramService();
    const result = await telegramService.signIn({
      phoneNumber: conn.phoneNumber,
      phoneCodeHash: conn.phoneCodeHash,
      phoneCode: phoneCode.trim(),
    });

    if (result.needs2FA) {
      await prisma.telegramConnection.update({
        where: { userId: session.userId },
        data: {
          connectionStatus: "PENDING_2FA",
        },
      });

      return NextResponse.json({
        success: true,
        needs2FA: true,
        message: "Two-step verification is enabled on this Telegram account. Please enter your cloud password.",
      });
    }

    if (!result.sessionString) {
      return NextResponse.json(
        { error: "Failed to establish Telegram session." },
        { status: 500 }
      );
    }

    // Encrypt the session string with AES-256-GCM before saving to database
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
      message: "Telegram account connected successfully to your personal Saved Messages!",
    });
  } catch (error: any) {
    console.error("Telegram verify-code error:", error);
    return NextResponse.json(
      { error: error.message || "Invalid Telegram verification code" },
      { status: 400 }
    );
  }
}
