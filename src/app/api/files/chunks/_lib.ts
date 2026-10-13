import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { decryptData } from "@/lib/crypto";
import {
  checkRateLimit,
  rateLimitedResponse,
} from "@/lib/rateLimit";
import { ChunkedUploadError } from "@/lib/chunkedUpload";
import type { UserSession } from "@/lib/types";

/**
 * Chunked-upload API shared helpers.
 * Every route: auth first, owner-scoped queries only, generic 500s.
 */

/** 401 when no valid session, otherwise the session. */
export async function requireChunkUser(
  req: NextRequest
): Promise<UserSession | NextResponse> {
  const session = await getCurrentUser(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

/**
 * Resolves the user's decrypted Telegram MTProto session string.
 * Throws ChunkedUploadError("GONE", ...) when Telegram is not connected —
 * mapped to a 400 with a safe client-facing message.
 */
export async function requireTelegramSessionString(
  userId: string
): Promise<string> {
  const conn = await prisma.telegramConnection.findUnique({
    where: { userId },
  });
  if (
    !conn ||
    conn.connectionStatus !== "CONNECTED" ||
    !conn.encryptedSessionReference
  ) {
    throw new ChunkedUploadError(
      "GONE",
      "Telegram account is not connected. Please connect your personal Telegram account to enable Saved Messages storage."
    );
  }
  try {
    return decryptData(conn.encryptedSessionReference);
  } catch {
    throw new ChunkedUploadError(
      "GONE",
      "Failed to decrypt Telegram authorization. Please reconnect your Telegram account."
    );
  }
}

/** Maps ChunkedUploadError codes to HTTP statuses; everything else is a generic 500. */
export function chunkedErrorResponse(err: unknown): NextResponse {
  if (err instanceof ChunkedUploadError) {
    const status =
      err.code === "NOT_FOUND"
        ? 404
        : err.code === "FORBIDDEN"
          ? 403
          : err.code === "CONFLICT"
            ? 409
            : 400;
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status }
    );
  }
  console.error("Chunked upload error:", err);
  return NextResponse.json(
    { error: "Chunked upload request failed." },
    { status: 500 }
  );
}

/**
 * Rate limits for chunked endpoints. Chunked uploads legitimately make many
 * requests (one per 512MB chunk), so the per-chunk bucket is generous
 * (600/10min per user); init/complete/status stay tight.
 */
export function checkChunkRateLimit(
  req: NextRequest,
  session: UserSession,
  bucket: "init" | "chunk" | "control"
): NextResponse | null {
  const limits = {
    init: { max: 60, windowMs: 10 * 60 * 1000 },
    chunk: { max: 600, windowMs: 10 * 60 * 1000 },
    control: { max: 120, windowMs: 10 * 60 * 1000 },
  } as const;
  const { max, windowMs } = limits[bucket];
  const res = checkRateLimit(
    `chunks:${bucket}:${session.userId}`,
    max,
    windowMs
  );
  if (!res.allowed) return rateLimitedResponse(res.retryAfterMs);
  return null;
}
