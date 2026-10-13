import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ChunkedUploadError } from "@/lib/chunkedUpload";
import {
  requireChunkUser,
  chunkedErrorResponse,
  checkChunkRateLimit,
} from "../_lib";
import type { UserSession } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/files/chunks/cancel
 * Cancels an in-progress chunked upload. Chunks already stored in the user's
 * own Telegram Saved Messages are left in place (harmless orphans the user
 * can delete from Telegram); the session is marked CANCELLED and the chunks
 * endpoint will refuse further uploads for it.
 * Body: { uploadId }
 */
export async function POST(req: NextRequest) {
  const maybeSession = await requireChunkUser(req);
  if (maybeSession instanceof NextResponse) return maybeSession;
  const session = maybeSession as UserSession;

  const limited = checkChunkRateLimit(req, session, "control");
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
    });
    if (!upload) {
      throw new ChunkedUploadError("NOT_FOUND", "Upload session not found.");
    }
    if (upload.status === "UPLOADING") {
      await prisma.chunkedUpload.update({
        where: { id: upload.id },
        data: { status: "CANCELLED" },
      });
    }
    return NextResponse.json({ success: true, status: "CANCELLED" });
  } catch (err) {
    return chunkedErrorResponse(err);
  }
}
