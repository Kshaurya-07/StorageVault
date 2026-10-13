import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sweepStaleUploads, ChunkedUploadError } from "@/lib/chunkedUpload";
import {
  requireChunkUser,
  chunkedErrorResponse,
  checkChunkRateLimit,
} from "../_lib";
import type { UserSession } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/files/chunks/status?uploadId=
 * Returns the session state plus the exact list of uploaded chunk indexes —
 * this is what the client uses to resume (only missing chunks re-upload).
 */
export async function GET(req: NextRequest) {
  const maybeSession = await requireChunkUser(req);
  if (maybeSession instanceof NextResponse) return maybeSession;
  const session = maybeSession as UserSession;

  const limited = checkChunkRateLimit(req, session, "control");
  if (limited) return limited;

  const uploadId = new URL(req.url).searchParams.get("uploadId") || "";
  if (!uploadId) {
    return NextResponse.json({ error: "uploadId is required." }, { status: 400 });
  }

  try {
    await sweepStaleUploads(session.userId);

    const upload = await prisma.chunkedUpload.findFirst({
      where: { id: uploadId, ownerUserId: session.userId },
      include: {
        chunks: { select: { chunkIndex: true }, orderBy: { chunkIndex: "asc" } },
      },
    });
    if (!upload) {
      throw new ChunkedUploadError("NOT_FOUND", "Upload session not found.");
    }

    return NextResponse.json({
      uploadId: upload.id,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      totalSize: Number(upload.totalSize),
      chunkSize: upload.chunkSize,
      totalChunks: upload.totalChunks,
      fingerprint: upload.fingerprint,
      status: upload.status,
      uploadedChunkIndexes: upload.chunks.map((c) => c.chunkIndex),
      fileId: upload.fileId,
    });
  } catch (err) {
    return chunkedErrorResponse(err);
  }
}
