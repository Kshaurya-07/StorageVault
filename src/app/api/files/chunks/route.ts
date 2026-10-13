import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getTelegramService } from "@/lib/telegram/telegramService";
import {
  parseChunkUpload,
  cleanupChunk,
  expectedChunkSize,
  validateChunkIndex,
  ChunkedUploadError,
  ParsedChunk,
} from "@/lib/chunkedUpload";
import {
  requireChunkUser,
  requireTelegramSessionString,
  chunkedErrorResponse,
  checkChunkRateLimit,
} from "./_lib";
import type { UserSession } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/files/chunks
 * Uploads ONE chunk of a chunked session.
 * Multipart fields: `uploadId`, `chunkIndex`, plus a single `file` part
 * holding the raw chunk bytes (streamed to disk, never buffered in RAM).
 *
 * Idempotent: re-uploading an already-stored chunkIndex returns the existing
 * record (code "DUPLICATE") instead of creating a second Telegram message —
 * this is what makes client retries and resume safe.
 */
export async function POST(req: NextRequest) {
  const maybeSession = await requireChunkUser(req);
  if (maybeSession instanceof NextResponse) return maybeSession;
  const session = maybeSession as UserSession;

  const limited = checkChunkRateLimit(req, session, "chunk");
  if (limited) return limited;

  let parsed: ParsedChunk | null = null;
  try {
    parsed = await parseChunkUpload(req);
  } catch (err) {
    return chunkedErrorResponse(err);
  }

  try {
    // Owner-scoped: one user can never write into another user's session.
    const upload = await prisma.chunkedUpload.findFirst({
      where: { id: parsed.uploadId, ownerUserId: session.userId },
    });
    if (!upload) {
      throw new ChunkedUploadError("NOT_FOUND", "Upload session not found.");
    }
    if (upload.status !== "UPLOADING") {
      throw new ChunkedUploadError(
        "CONFLICT",
        `Upload session is ${upload.status}; cannot accept chunks.`
      );
    }

    const chunkIndex = validateChunkIndex(parsed.chunkIndex, upload.totalChunks);

    // The chunk must be exactly the expected size (browsers slice exactly);
    // anything else is a buggy or malicious client.
    const expected = expectedChunkSize(
      chunkIndex,
      upload.chunkSize,
      Number(upload.totalSize)
    );
    if (parsed.fileSize !== expected) {
      throw new ChunkedUploadError(
        "BAD_REQUEST",
        `Chunk size mismatch: expected ${expected} bytes, got ${parsed.fileSize}.`
      );
    }

    // Idempotency: chunk already stored (retry / resume overlap).
    const existing = await prisma.fileChunk.findUnique({
      where: {
        uploadId_chunkIndex: { uploadId: upload.id, chunkIndex },
      },
    });
    if (existing) {
      return NextResponse.json({
        chunkIndex,
        telegramMessageId: existing.telegramMessageId,
        duplicate: true,
      });
    }

    const sessionString = await requireTelegramSessionString(session.userId);
    const telegramService = await getTelegramService();

    const partName = `${upload.fileName}.part${String(chunkIndex).padStart(5, "0")}`;
    let telegramMessageId: number;
    let telegramFileReference: string | null = null;
    try {
      const result = await telegramService.uploadToSavedMessages({
        sessionString,
        filePath: parsed.filePath,
        fileSizeBytes: parsed.fileSize,
        fileName: partName,
        // Chunks are opaque slices; the real type is restored from the
        // parent File row on download.
        mimeType: "application/octet-stream",
      });
      telegramMessageId = result.telegramMessageId;
      telegramFileReference = result.telegramFileReference ?? null;
    } catch (err) {
      // Retryable: the client re-sends this chunk (up to its retry budget).
      console.error("Chunk Telegram upload failed:", err);
      return NextResponse.json(
        { error: "Failed to store chunk. Please retry.", code: "RETRYABLE" },
        { status: 500 }
      );
    }

    try {
      const chunk = await prisma.fileChunk.create({
        data: {
          uploadId: upload.id,
          chunkIndex,
          telegramMessageId,
          telegramFileReference,
          size: parsed.fileSize,
        },
      });
      // Touch the session so the 24h stale sweep measures real activity.
      await prisma.chunkedUpload.update({
        where: { id: upload.id },
        data: { updatedAt: new Date() },
      });
      return NextResponse.json({
        chunkIndex,
        telegramMessageId: chunk.telegramMessageId,
        duplicate: false,
      });
    } catch (err: any) {
      // Lost race: a parallel retry stored the same chunk first (P2002).
      if (err?.code === "P2002") {
        const winner = await prisma.fileChunk.findUnique({
          where: {
            uploadId_chunkIndex: { uploadId: upload.id, chunkIndex },
          },
        });
        return NextResponse.json({
          chunkIndex,
          telegramMessageId: winner?.telegramMessageId ?? telegramMessageId,
          duplicate: true,
        });
      }
      throw err;
    }
  } catch (err) {
    return chunkedErrorResponse(err);
  } finally {
    await cleanupChunk(parsed);
  }
}
