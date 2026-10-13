import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { decryptData } from "@/lib/crypto";
import { getTelegramService } from "@/lib/telegram/telegramService";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await prisma.telegramConnection.findUnique({
      where: { userId: session.userId },
    });

    // Best-effort server-side revocation: terminate the MTProto authorization
    // on Telegram's servers so a stolen session string stops working.
    // Failure here must not block the local disconnect.
    if (conn?.encryptedSessionReference) {
      try {
        const sessionString = decryptData(conn.encryptedSessionReference);
        const telegramService = await getTelegramService();
        if (telegramService.revokeSession) {
          await telegramService.revokeSession(sessionString);
        }
      } catch (revokeError) {
        console.warn("Telegram session revocation failed (continuing disconnect):", revokeError);
      }
    }

    if (conn) {
      await prisma.telegramConnection.update({
        where: { userId: session.userId },
        data: {
          encryptedSessionReference: null,
          phoneCodeHash: null,
          codeExpiresAt: null,
          connectionStatus: "DISCONNECTED",
          connectedAt: null,
        },
      });
    }
    // No connection row: nothing to clear — still report success.

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
