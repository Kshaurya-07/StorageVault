import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { getTelegramService } from "@/lib/telegram/telegramService";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rateLimit";

// E.164 international format: + followed by 8-15 digits.
const E164_RE = /^\+[1-9]\d{7,14}$/;
// Verification codes are valid for 15 minutes.
const CODE_TTL_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limits: 5 codes/hour per user; 1 per phone number per 5 minutes.
    // Prevents code-spam harassment of arbitrary numbers and API quota burn.
    const userLimit = checkRateLimit(
      `tg:sendcode:user:${session.userId}`,
      5,
      60 * 60 * 1000
    );
    if (!userLimit.allowed) return rateLimitedResponse(userLimit.retryAfterMs);

    const { phoneNumber } = await req.json();
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "Valid international phone number is required (e.g. +1234567890)." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.trim();
    if (!E164_RE.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Phone number must be in international format, e.g. +1234567890." },
        { status: 400 }
      );
    }

    const numberLimit = checkRateLimit(
      `tg:sendcode:number:${cleanPhone}`,
      1,
      5 * 60 * 1000
    );
    if (!numberLimit.allowed) return rateLimitedResponse(numberLimit.retryAfterMs);

    const telegramService = await getTelegramService();

    // Call MTProto sendCode (scoped to this user for pending-client isolation)
    const result = await telegramService.sendCode(cleanPhone, session.userId);

    // Save phone & phoneCodeHash to user's TelegramConnection
    await prisma.telegramConnection.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        phoneNumber: cleanPhone,
        phoneCodeHash: result.phoneCodeHash,
        codeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
        connectionStatus: "PENDING_CODE",
      },
      update: {
        phoneNumber: cleanPhone,
        phoneCodeHash: result.phoneCodeHash,
        codeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
        connectionStatus: "PENDING_CODE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Confirmation code sent to your Telegram app.",
      phoneCodeHash: result.phoneCodeHash,
      isCodeViaApp: result.isCodeViaApp,
    });
  } catch (error: any) {
    console.error("Telegram send-code error:", error);
    return NextResponse.json(
      { error: "Failed to send Telegram confirmation code" },
      { status: 400 }
    );
  }
}
