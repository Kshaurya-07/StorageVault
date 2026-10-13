import { NextRequest } from "next/server";
import Busboy from "busboy";
import { Readable } from "stream";
import { createWriteStream, promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "./db";

// ---------------------------------------------------------------------------
// Chunked upload constants
// ---------------------------------------------------------------------------

/** Telegram single-file hard limit: chunks must stay at/below this. */
export const TELEGRAM_SINGLE_FILE_LIMIT = 2097152000; // 2GB

/** Default chunk size for client-side splitting: 512MB. */
export const DEFAULT_CHUNK_SIZE = 512 * 1024 * 1024;

/**
 * Hard cap per chunk request (640MB): rejects anything bigger before it can
 * fill the disk. Chunks are expected to be <= DEFAULT_CHUNK_SIZE, with slack
 * for clients that pick a slightly different size.
 */
export const MAX_CHUNK_BYTES = 640 * 1024 * 1024;

/** Maximum total file size for a chunked upload. Overridable via env. */
const _parsedMaxChunked = parseInt(
  process.env.MAX_CHUNKED_FILE_SIZE_BYTES || String(50 * 1024 * 1024 * 1024),
  10
);
export const MAX_CHUNKED_FILE_SIZE =
  Number.isFinite(_parsedMaxChunked) && _parsedMaxChunked > 0
    ? _parsedMaxChunked
    : 50 * 1024 * 1024 * 1024; // 50GB

/** Sanity caps for the init payload. */
export const MAX_TOTAL_CHUNKS = 200; // 200 x 512MB = 100GB headroom above the 50GB cap
export const MAX_FILENAME_LENGTH = 255;
export const MAX_FINGERPRINT_LENGTH = 128;

/** Stale UPLOADING sessions older than this are swept to FAILED. */
export const STALE_UPLOAD_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Init payload validation (pure — unit tested)
// ---------------------------------------------------------------------------

export interface ChunkedInitInput {
  fileName: unknown;
  mimeType: unknown;
  totalSize: unknown;
  chunkSize: unknown;
  totalChunks: unknown;
  fingerprint: unknown;
}

export interface ValidatedChunkedInit {
  fileName: string;
  mimeType: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  fingerprint: string;
}

export class ChunkedUploadError extends Error {
  code:
    | "BAD_REQUEST"
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "CONFLICT"
    | "INCOMPLETE"
    | "GONE";
  constructor(
    code: ChunkedUploadError["code"],
    message: string
  ) {
    super(message);
    this.code = code;
  }
}

/** Basename-only filename, mirroring the direct-upload sanitization. */
export function sanitizeFileName(raw: unknown): string {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) throw new ChunkedUploadError("BAD_REQUEST", "fileName is required.");
  const base = path.basename(name);
  if (!base || base === "." || base === "..") {
    throw new ChunkedUploadError("BAD_REQUEST", "Invalid fileName.");
  }
  return base.slice(0, MAX_FILENAME_LENGTH);
}

function asFiniteInt(value: unknown, field: string): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new ChunkedUploadError("BAD_REQUEST", `${field} must be an integer.`);
  }
  return n;
}

export function validateChunkedInit(input: ChunkedInitInput): ValidatedChunkedInit {
  const fileName = sanitizeFileName(input.fileName);
  const mimeType =
    typeof input.mimeType === "string" && input.mimeType.trim()
      ? input.mimeType.trim().slice(0, 128)
      : "application/octet-stream";
  const totalSize = asFiniteInt(input.totalSize, "totalSize");
  const chunkSize = asFiniteInt(input.chunkSize, "chunkSize");
  const totalChunks = asFiniteInt(input.totalChunks, "totalChunks");
  const fingerprint =
    typeof input.fingerprint === "string" ? input.fingerprint.trim() : "";
  if (!fingerprint || fingerprint.length > MAX_FINGERPRINT_LENGTH) {
    throw new ChunkedUploadError("BAD_REQUEST", "fingerprint is required (max 128 chars).");
  }
  if (totalSize <= 0) {
    throw new ChunkedUploadError("BAD_REQUEST", "totalSize must be positive.");
  }
  if (totalSize > MAX_CHUNKED_FILE_SIZE) {
    throw new ChunkedUploadError(
      "BAD_REQUEST",
      `totalSize exceeds the ${(MAX_CHUNKED_FILE_SIZE / 1073741824).toFixed(0)}GB limit.`
    );
  }
  if (chunkSize <= 0 || chunkSize > MAX_CHUNK_BYTES) {
    throw new ChunkedUploadError(
      "BAD_REQUEST",
      `chunkSize must be between 1 and ${MAX_CHUNK_BYTES} bytes.`
    );
  }
  if (totalChunks <= 0 || totalChunks > MAX_TOTAL_CHUNKS) {
    throw new ChunkedUploadError(
      "BAD_REQUEST",
      `totalChunks must be between 1 and ${MAX_TOTAL_CHUNKS}.`
    );
  }
  const expectedChunks = Math.ceil(totalSize / chunkSize);
  if (totalChunks !== expectedChunks) {
    throw new ChunkedUploadError(
      "BAD_REQUEST",
      `totalChunks (${totalChunks}) does not match totalSize/chunkSize (${expectedChunks}).`
    );
  }
  return { fileName, mimeType, totalSize, chunkSize, totalChunks, fingerprint };
}

/** Expected byte size of chunk `index` (last chunk may be smaller). */
export function expectedChunkSize(
  chunkIndex: number,
  chunkSize: number,
  totalSize: number
): number {
  const fullChunks = Math.floor(totalSize / chunkSize);
  if (chunkIndex < fullChunks) return chunkSize;
  const remainder = totalSize - fullChunks * chunkSize;
  return remainder === 0 ? chunkSize : remainder;
}

export function validateChunkIndex(chunkIndex: unknown, totalChunks: number): number {
  const idx = asFiniteInt(chunkIndex, "chunkIndex");
  if (idx < 0 || idx >= totalChunks) {
    throw new ChunkedUploadError(
      "BAD_REQUEST",
      `chunkIndex out of range (0..${totalChunks - 1}).`
    );
  }
  return idx;
}

/**
 * Verifies that the stored chunks cover every index 0..totalChunks-1 exactly
 * once (the completion gate). Throws ChunkedUploadError("INCOMPLETE") with a
 * count or the first missing index. Pure — unit tested.
 */
export function assertChunksComplete(
  chunkIndexes: number[],
  totalChunks: number
): void {
  if (chunkIndexes.length !== totalChunks) {
    throw new ChunkedUploadError(
      "INCOMPLETE",
      `${totalChunks - chunkIndexes.length} of ${totalChunks} chunks are still missing.`
    );
  }
  const sorted = [...chunkIndexes].sort((a, b) => a - b);
  for (let i = 0; i < totalChunks; i++) {
    if (sorted[i] !== i) {
      throw new ChunkedUploadError(
        "INCOMPLETE",
        `Chunk index ${i} is missing; upload is incomplete.`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Stale-session sweep (no cron needed: runs on init/status calls)
// ---------------------------------------------------------------------------

/**
 * Marks this user's UPLOADING sessions older than 24h as FAILED so abandoned
 * uploads don't linger forever. Scoped to the requesting user.
 *
 * NOTE: the staleness check runs in JS, not in the DB query. Prisma
 * serializes Date params with a space separator on SQLite
 * ("YYYY-MM-DD HH:MM:SS") while stored values use ISO "T" format, which
 * breaks lexicographic `<` comparisons. Filtering in JS is portable across
 * Postgres and SQLite.
 */
export async function sweepStaleUploads(ownerUserId: string): Promise<number> {
  const cutoff = Date.now() - STALE_UPLOAD_MS;
  const candidates = await prisma.chunkedUpload.findMany({
    where: { ownerUserId, status: "UPLOADING" },
    select: { id: true, updatedAt: true },
  });
  const staleIds = candidates
    .filter((c) => c.updatedAt.getTime() < cutoff)
    .map((c) => c.id);
  if (staleIds.length === 0) return 0;
  const res = await prisma.chunkedUpload.updateMany({
    where: { id: { in: staleIds } },
    data: { status: "FAILED" },
  });
  return res.count;
}

// ---------------------------------------------------------------------------
// Chunk multipart parsing (streams to disk — never buffers in RAM)
// ---------------------------------------------------------------------------

export interface ParsedChunk {
  filePath: string;
  fileSize: number;
  uploadId: string;
  chunkIndex: number;
  originalFilename: string;
}

function getTempUploadDir(): string {
  const configured = process.env.TEMP_UPLOAD_DIR || "./tmp/uploads";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

/**
 * Parses a chunk upload request: text fields `uploadId`, `chunkIndex` plus a
 * single `file` part holding the raw chunk bytes. The chunk streams straight
 * to a temp file (max MAX_CHUNK_BYTES) — server RAM stays flat.
 */
export async function parseChunkUpload(req: NextRequest): Promise<ParsedChunk> {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw new ChunkedUploadError("BAD_REQUEST", "Expected a multipart/form-data request.");
  }

  const tmpDir = getTempUploadDir();
  await fs.mkdir(tmpDir, { recursive: true });

  return new Promise<ParsedChunk>((resolve, reject) => {
    let settled = false;
    const settleReject = async (err: Error) => {
      if (settled) return;
      settled = true;
      if (tmpPath) await fs.unlink(tmpPath).catch(() => {});
      reject(err);
    };
    const settleResolve = (value: ParsedChunk) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    let tmpPath: string | null = null;
    let fileSize = 0;
    let uploadId = "";
    let chunkIndexRaw = "";
    let originalFilename = "chunk.bin";
    let sawFilePart = false;
    let fileLimitHit = false;
    let writeError: Error | null = null;

    const busboy = Busboy({
      headers: { "content-type": contentType },
      limits: {
        files: 1,
        fileSize: MAX_CHUNK_BYTES,
        fields: 10,
        fieldSize: 256,
        fieldNameSize: 64,
      },
    });

    busboy.on("field", (name, value) => {
      if (name === "uploadId" && !uploadId) uploadId = value.trim();
      else if (name === "chunkIndex" && !chunkIndexRaw) chunkIndexRaw = value.trim();
    });

    busboy.on("file", (_name, fileStream, info) => {
      if (_name !== "file" || sawFilePart) {
        fileStream.resume();
        return;
      }
      sawFilePart = true;
      originalFilename = path.basename(info.filename || "chunk.bin") || "chunk.bin";

      tmpPath = path.join(
        tmpDir,
        `chunk-${crypto.randomBytes(16).toString("hex")}.tmp`
      );
      const out = createWriteStream(tmpPath);

      // Same drain-don't-destroy pattern as the direct upload parser:
      // destroying the stream mid-parse makes busboy hang forever.
      const abortFile = () => {
        if (fileLimitHit) return;
        fileLimitHit = true;
        fileStream.unpipe(out);
        out.destroy();
        fileStream.resume();
      };
      fileStream.on("limit", abortFile);
      fileStream.on("data", (chunk: Buffer) => {
        if (fileLimitHit) return;
        fileSize += chunk.length;
        if (fileSize > MAX_CHUNK_BYTES) abortFile();
      });
      out.on("error", (err) => {
        writeError = err;
        busboy.destroy(err);
      });
      fileStream.pipe(out);
    });

    busboy.on("error", (err: Error) => {
      void settleReject(
        new ChunkedUploadError("BAD_REQUEST", `Failed to parse chunk: ${err.message}`)
      );
    });

    busboy.on("finish", () => {
      if (writeError) {
        void settleReject(new ChunkedUploadError("BAD_REQUEST", "Failed to write chunk."));
        return;
      }
      if (fileLimitHit || fileSize > MAX_CHUNK_BYTES) {
        void settleReject(
          new ChunkedUploadError(
            "BAD_REQUEST",
            `Chunk exceeds the ${(MAX_CHUNK_BYTES / 1048576).toFixed(0)}MB per-chunk limit.`
          )
        );
        return;
      }
      if (!sawFilePart || !tmpPath) {
        void settleReject(new ChunkedUploadError("BAD_REQUEST", "No chunk file provided."));
        return;
      }
      if (!uploadId) {
        void settleReject(new ChunkedUploadError("BAD_REQUEST", "uploadId is required."));
        return;
      }
      let chunkIndex: number;
      try {
        chunkIndex = asFiniteInt(chunkIndexRaw, "chunkIndex");
      } catch (e: any) {
        void settleReject(e);
        return;
      }
      settleResolve({
        filePath: tmpPath,
        fileSize,
        uploadId,
        chunkIndex,
        originalFilename,
      });
    });

    const body = req.body;
    if (!body) {
      void settleReject(new ChunkedUploadError("BAD_REQUEST", "Empty request body."));
      return;
    }
    const nodeStream = Readable.fromWeb(body as any);
    nodeStream.on("error", (err) => busboy.destroy(err));
    nodeStream.pipe(busboy);
  });
}

/** Deletes the temp file produced by `parseChunkUpload`. Safe to call twice. */
export async function cleanupChunk(parsed: ParsedChunk | null): Promise<void> {
  if (!parsed) return;
  await fs.unlink(parsed.filePath).catch(() => {});
}

// ---------------------------------------------------------------------------
// Download reassembly: ordered chunk streams -> one ReadableStream
// ---------------------------------------------------------------------------

/**
 * Builds a Web ReadableStream that yields every chunk's bytes IN ORDER.
 * `fetchChunkStream(i)` must resolve to an async iterable of Buffers for
 * chunk index i. Nothing is buffered: bytes flow chunk-by-chunk to the client.
 */
export function assembleChunkedDownload(
  totalChunks: number,
  fetchChunkStream: (chunkIndex: number) => Promise<AsyncIterable<Buffer>>
): ReadableStream<Uint8Array> {
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let i = 0; i < totalChunks; i++) {
          if (cancelled) break;
          const stream = await fetchChunkStream(i);
          for await (const buf of stream) {
            if (cancelled) break;
            controller.enqueue(new Uint8Array(buf));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      cancelled = true;
    },
  });
}
