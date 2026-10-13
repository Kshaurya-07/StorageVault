import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { getTelegramService } from "@/lib/telegram/telegramService";
import { encryptData } from "@/lib/crypto";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Brute-force guard: 10 code attempts per 10 minutes per user.
    const attemptLimit = checkRateLimit(
      `tg:verifycode:user:${session.userId}`,
      10,
      10 * 60 * 1000
    );
    if (!attemptLimit.allowed) return rateLimitedResponse(attemptLimit.retryAfterMs);

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

    // Pending codes expire (prevents replay of stale code hashes).
    if (conn.codeExpiresAt && conn.codeExpiresAt.getTime() < Date.now()) {
      await prisma.telegramConnection.update({
        where: { userId: session.userId },
        data: {
          phoneCodeHash: null,
          codeExpiresAt: null,
          connectionStatus: "DISCONNECTED",
        },
      });
      return NextResponse.json(
        { error: "This code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const telegramService = await getTelegramService();
    const result = await telegramService.signIn({
      phoneNumber: conn.phoneNumber,
      phoneCodeHash: conn.phoneCodeHash,
      phoneCode: phoneCode.trim(),
      userId: session.userId,
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
        codeExpiresAt: null,
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
