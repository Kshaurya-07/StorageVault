import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { getTelegramService } from "@/lib/telegram/telegramService";
import { decryptData } from "@/lib/crypto";

/**
 * GET /api/files/[id]/download
 * Streams file securely from authenticated user's Telegram Saved Messages.
 * Strict ownership check: Never returns another user's file.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Verify file exists and belongs to this user
    const file = await prisma.file.findFirst({
      where: {
        id: params.id,
        ownerUserId: session.userId,
      },
    });

    if (!file || !file.telegramMessageId) {
      return NextResponse.json(
        { error: "File not found or access denied." },
        { status: 404 }
      );
    }

    // 2. Resolve user's authorized Telegram connection
    const conn = await prisma.telegramConnection.findUnique({
      where: { userId: session.userId },
    });

    if (
      !conn ||
      conn.connectionStatus !== "CONNECTED" ||
      !conn.encryptedSessionReference
    ) {
      return NextResponse.json(
        {
          error:
            "Telegram session is not active. Please reconnect your Telegram account.",
        },
        { status: 400 }
      );
    }

    // 3. Decrypt user's personal MTProto session string
    const sessionString = decryptData(conn.encryptedSessionReference);

    // 4. Download file from user's personal Saved Messages
    const telegramService = await getTelegramService();
    const result = await telegramService.downloadFromSavedMessages({
      sessionString,
      messageId: file.telegramMessageId,
    });

    // 5. Stream securely to the user's browser
    // Inline preview is only allowed for safe, directly renderable media types.
    // Everything else (HTML, SVG, scripts, executables, …) is forced to
    // download as an attachment so a malicious upload can never execute
    // in the vault's origin.
    const INLINE_MIME_ALLOWLIST: RegExp[] = [
      /^image\/(png|jpe?g|gif|webp|bmp)$/i,
      /^audio\//i,
      /^video\//i,
    ];
    const servedMime =
      file.mimeType || result.mimeType || "application/octet-stream";
    const requestedInline = req.nextUrl.searchParams.get("inline") === "true";
    const isInline =
      requestedInline && INLINE_MIME_ALLOWLIST.some((re) => re.test(servedMime));
    const dispositionType = isInline ? "inline" : "attachment";
    const safeAscii = file.originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const encodedFilename = encodeURIComponent(file.originalFilename);

    const headers = new Headers();
    headers.set("Content-Type", servedMime);
    headers.set(
      "Content-Disposition",
      `${dispositionType}; filename="${safeAscii}"; filename*=UTF-8''${encodedFilename}`
    );
    headers.set("Content-Length", (result.size || result.buffer.length).toString());
    headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    // Defense-in-depth: never let the browser sniff this response as HTML/JS.
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("File download error:", error);
    // Generic message: raw Telegram/crypto errors can leak internals.
    return NextResponse.json(
      { error: "Failed to download file from Telegram." },
      { status: 500 }
    );
  }
}
