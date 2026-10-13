import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { detectCategory } from "@/lib/fileCategories";
import { ChunkedUploadError, assertChunksComplete } from "@/lib/chunkedUpload";
import {
  requireChunkUser,
  chunkedErrorResponse,
  checkChunkRateLimit,
} from "../_lib";
import type { UserSession } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/files/chunks/complete
 * Finalizes a chunked upload: verifies EVERY chunk index 0..totalChunks-1 is
 * present for this user, then creates the single logical File row
 * (isChunked=true) that the rest of the app (lists, search, download)
 * already understands, and links it back to the session.
 * Body: { uploadId }
 */
export async function POST(req: NextRequest) {
  const maybeSession = await requireChunkUser(req);
  if (maybeSession instanceof NextResponse) return maybeSession;
  const session = maybeSession as UserSession;

  const limited = checkChunkRateLimit(req, session, "init");
  if (limited) return limited;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const uploadId = typeof body?.uploadId === "string" ? body.uploadId : "";
  if (!uploadId) {
    return NextResponse.json({ error: "uploadId is required." }, { status: 400 });
  }

  try {
    const upload = await prisma.chunkedUpload.findFirst({
      where: { id: uploadId, ownerUserId: session.userId },
      include: {
        chunks: { select: { chunkIndex: true }, orderBy: { chunkIndex: "asc" } },
      },
    });
    if (!upload) {
      throw new ChunkedUploadError("NOT_FOUND", "Upload session not found.");
    }

    // Idempotent: already completed (e.g. double-clicked Finish).
    if (upload.status === "COMPLETED" && upload.fileId) {
      const file = await prisma.file.findUnique({ where: { id: upload.fileId } });
      if (file) {
        return NextResponse.json({
          success: true,
          resumed: true,
          file: formatChunkedFile(file),
        });
      }
    }
    if (upload.status !== "UPLOADING") {
      throw new ChunkedUploadError(
        "CONFLICT",
        `Upload session is ${upload.status}; cannot complete.`
      );
    }

    // Every index 0..totalChunks-1 must exist exactly once.
    try {
      assertChunksComplete(
        upload.chunks.map((c: { chunkIndex: number }) => c.chunkIndex),
        upload.totalChunks
      );
    } catch (err) {
      return chunkedErrorResponse(err);
    }

    const category = detectCategory(upload.fileName, upload.mimeType);

    const createdFile = await prisma.file.create({
      data: {
        ownerUserId: session.userId,
        telegramMessageId: null, // chunks hold the individual message ids
        originalFilename: upload.fileName,
        displayFilename: upload.fileName,
        mimeType: upload.mimeType,
        fileSizeBytes: Number(upload.totalSize),
        category,
        uploadStatus: "COMPLETED",
        isChunked: true,
      },
    });

    // Optional tags, same bounds as the direct upload path (20 x 50 chars).
    const rawTags = typeof body?.tags === "string" ? body.tags : "";
    if (rawTags.trim()) {
      const tagsList = rawTags
        .split(",")
        .map((t: string) => t.trim().toLowerCase())
        .filter((t: string) => t.length > 0)
        .map((t: string) => t.slice(0, 50))
        .slice(0, 20);
      for (const tag of tagsList) {
        await prisma.fileTag
          .create({
            data: {
              ownerUserId: session.userId,
              fileId: createdFile.id,
              tag,
            },
          })
          .catch(() => {});
      }
    }

    await prisma.chunkedUpload.update({
      where: { id: upload.id },
      data: { status: "COMPLETED", fileId: createdFile.id },
    });

    return NextResponse.json(
      { success: true, file: formatChunkedFile(createdFile) },
      { status: 201 }
    );
  } catch (err) {
    return chunkedErrorResponse(err);
  }
}

function formatChunkedFile(f: any) {
  return {
    id: f.id,
    ownerUserId: f.ownerUserId,
    telegramMessageId: f.telegramMessageId,
    originalFilename: f.originalFilename,
    displayFilename: f.displayFilename,
    mimeType: f.mimeType,
    fileSizeBytes: Number(f.fileSizeBytes),
    category: f.category,
    uploadStatus: f.uploadStatus,
    isFavorite: f.isFavorite,
    isChunked: true,
    uploadedAt: f.uploadedAt.toISOString(),
  };
}
