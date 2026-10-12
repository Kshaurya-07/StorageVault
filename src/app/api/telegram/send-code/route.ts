import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { getTelegramService } from "@/lib/telegram/telegramService";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumber } = await req.json();
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "Valid international phone number is required (e.g. +1234567890)." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.trim();
    const telegramService = await getTelegramService();

    // Call MTProto sendCode
    const result = await telegramService.sendCode(cleanPhone);

    // Save phone & phoneCodeHash to user's TelegramConnection
    await prisma.telegramConnection.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        phoneNumber: cleanPhone,
        phoneCodeHash: result.phoneCodeHash,
        connectionStatus: "PENDING_CODE",
      },
      update: {
        phoneNumber: cleanPhone,
        phoneCodeHash: result.phoneCodeHash,
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
      { error: error.message || "Failed to send Telegram confirmation code" },
      { status: 400 }
    );
  }
}
