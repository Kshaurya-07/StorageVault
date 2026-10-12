import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { getTelegramService } from "@/lib/telegram/telegramService";
import { decryptData } from "@/lib/crypto";

/**
 * GET /api/files/[id]
 * Retrieves details for a specific file.
 * Strictly verifies ownership.
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

    const file = await prisma.file.findFirst({
      where: {
        id: params.id,
        ownerUserId: session.userId,
      },
      include: {
        tags: { select: { tag: true } },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({
      file: {
        id: file.id,
        ownerUserId: file.ownerUserId,
        telegramMessageId: file.telegramMessageId,
        originalFilename: file.originalFilename,
        displayFilename: file.displayFilename,
        mimeType: file.mimeType,
        fileSizeBytes: Number(file.fileSizeBytes),
        category: file.category,
        uploadStatus: file.uploadStatus,
        isFavorite: file.isFavorite,
        uploadedAt: file.uploadedAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
        tags: file.tags.map((t) => t.tag),
      },
    });
  } catch (error: any) {
    console.error("Get file error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/files/[id]
 * Updates display filename or favorite status.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { displayFilename, isFavorite } = body;

    const file = await prisma.file.findFirst({
      where: {
        id: params.id,
        ownerUserId: session.userId,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (typeof displayFilename === "string" && displayFilename.trim()) {
      dataToUpdate.displayFilename = displayFilename.trim();
    }
    if (typeof isFavorite === "boolean") {
      dataToUpdate.isFavorite = isFavorite;
    }

    const updated = await prisma.file.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      file: {
        id: updated.id,
        displayFilename: updated.displayFilename,
        isFavorite: updated.isFavorite,
      },
    });
  } catch (error: any) {
    console.error("Update file error:", error);
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
  }
}

/**
 * DELETE /api/files/[id]
 * Deletes file from user's Telegram Saved Messages and the database.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = await prisma.file.findFirst({
      where: {
        id: params.id,
        ownerUserId: session.userId,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
    }

    // Attempt to delete message in Telegram if connected
    const conn = await prisma.telegramConnection.findUnique({
      where: { userId: session.userId },
    });

    if (
      conn?.encryptedSessionReference &&
      conn.connectionStatus === "CONNECTED" &&
      file.telegramMessageId
    ) {
      try {
        const sessionString = decryptData(conn.encryptedSessionReference);
        const telegramService = await getTelegramService();
        await telegramService.deleteFromSavedMessages({
          sessionString,
          messageId: file.telegramMessageId,
        });
      } catch (tgError) {
        console.warn("Warning: Could not delete from Telegram directly (may already be deleted):", tgError);
      }
    }

    // Delete record from database
    await prisma.file.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "File permanently deleted from Telegram Saved Messages and your vault.",
    });
  } catch (error: any) {
    console.error("Delete file error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
