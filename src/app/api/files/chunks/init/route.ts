import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  validateChunkedInit,
  sweepStaleUploads,
} from "@/lib/chunkedUpload";
import {
  requireChunkUser,
  chunkedErrorResponse,
  checkChunkRateLimit,
} from "../_lib";
import type { UserSession } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/files/chunks/init
 * Starts (or resumes) a chunked upload session for a large file.
 * Body: { fileName, mimeType, totalSize, chunkSize, totalChunks, fingerprint }
 *
 * Resume: if the user already has an UPLOADING session with the same
 * fingerprint (name+size+lastModified), the existing uploadId is returned
 * instead of creating a duplicate — the client then asks /status which
 * chunks are still missing.
 */
export async function POST(req: NextRequest) {
  const maybeSession = await requireChunkUser(req);
  if (maybeSession instanceof NextResponse) return maybeSession;
  const session = maybeSession as UserSession;

  const limited = checkChunkRateLimit(req, session, "init");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let validated;
  try {
    validated = validateChunkedInit((body ?? {}) as any);
  } catch (err) {
    return chunkedErrorResponse(err);
  }

  try {
    // No cron needed: abandoned sessions are swept on init/status calls.
    await sweepStaleUploads(session.userId);

    const existing = await prisma.chunkedUpload.findFirst({
      where: {
        ownerUserId: session.userId,
        fingerprint: validated.fingerprint,
        status: "UPLOADING",
      },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { chunks: true } } },
    });

    if (existing) {
      return NextResponse.json({
        uploadId: existing.id,
        resumed: true,
        fileName: existing.fileName,
        mimeType: existing.mimeType,
        totalSize: Number(existing.totalSize),
        chunkSize: existing.chunkSize,
        totalChunks: existing.totalChunks,
        uploadedChunks: existing._count.chunks,
      });
    }

    const created = await prisma.chunkedUpload.create({
      data: {
        ownerUserId: session.userId,
        fileName: validated.fileName,
        mimeType: validated.mimeType,
        totalSize: validated.totalSize,
        chunkSize: validated.chunkSize,
        totalChunks: validated.totalChunks,
        fingerprint: validated.fingerprint,
        status: "UPLOADING",
      },
    });

    return NextResponse.json(
      {
        uploadId: created.id,
        resumed: false,
        fileName: created.fileName,
        mimeType: created.mimeType,
        totalSize: validated.totalSize,
        chunkSize: created.chunkSize,
        totalChunks: created.totalChunks,
        uploadedChunks: 0,
      },
      { status: 201 }
    );
  } catch (err) {
    return chunkedErrorResponse(err);
  }
}
