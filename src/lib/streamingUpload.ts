import { NextRequest } from "next/server";
import Busboy from "busboy";
import { Readable } from "stream";
import { createWriteStream, promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Maximum upload size: 2GB (Telegram limit).
// Guard against misconfiguration: a non-numeric env value would make
// parseInt return NaN, and `size > NaN` is always false (limit silently off).
const DEFAULT_MAX_FILE_SIZE = 2097152000;
const _parsedMaxSize = parseInt(
  process.env.MAX_FILE_SIZE_BYTES || String(DEFAULT_MAX_FILE_SIZE),
  10
);
export const MAX_FILE_SIZE =
  Number.isFinite(_parsedMaxSize) && _parsedMaxSize > 0
    ? _parsedMaxSize
    : DEFAULT_MAX_FILE_SIZE;

export interface ParsedUpload {
  /** Absolute path of the temp file on disk holding the uploaded bytes. */
  filePath: string;
  /** Exact byte count observed while streaming. */
  fileSize: number;
  /** Client-supplied original filename (basename only). */
  originalFilename: string;
  /** Client-supplied MIME type. */
  mimeType: string;
  /** Raw value of the optional "tags" form field, if present. */
  tags: string | null;
}

export class UploadParseError extends Error {
  code: "NO_FILE" | "FILE_TOO_LARGE" | "BAD_REQUEST";
  constructor(code: "NO_FILE" | "FILE_TOO_LARGE" | "BAD_REQUEST", message: string) {
    super(message);
    this.code = code;
  }
}

function getTempUploadDir(): string {
  const configured = process.env.TEMP_UPLOAD_DIR || "./tmp/uploads";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

/**
 * Parses a multipart/form-data request WITHOUT buffering the file in memory.
 *
 * The file part is streamed straight to a temp file under TEMP_UPLOAD_DIR
 * while a running byte counter enforces MAX_FILE_SIZE mid-stream, so a
 * multi-GB upload can never OOM the server. The caller owns the returned
 * temp file and must delete it when done (see `cleanupUpload`).
 *
 * Compatible with the previous `req.formData()` behavior: expects a single
 * "file" field plus an optional "tags" text field.
 */
export async function parseMultipartUpload(
  req: NextRequest
): Promise<ParsedUpload> {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw new UploadParseError(
      "BAD_REQUEST",
      "Expected a multipart/form-data request."
    );
  }

  const tmpDir = getTempUploadDir();
  await fs.mkdir(tmpDir, { recursive: true });

  return new Promise<ParsedUpload>((resolve, reject) => {
    let settled = false;
    const settleReject = async (err: Error) => {
      if (settled) return;
      settled = true;
      if (tmpPath) await fs.unlink(tmpPath).catch(() => {});
      reject(err);
    };
    const settleResolve = (value: ParsedUpload) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    let tmpPath: string | null = null;
    let fileSize = 0;
    let originalFilename = "unnamed_file";
    let mimeType = "application/octet-stream";
    let tags: string | null = null;
    let sawFilePart = false;
    let fileLimitHit = false;
    let writeError: Error | null = null;

    const busboy = Busboy({
      headers: { "content-type": contentType },
      limits: {
        files: 1,
        fileSize: MAX_FILE_SIZE,
        fields: 10,
        fieldSize: 4096,
        fieldNameSize: 100,
      },
    });

    busboy.on("file", (_name, fileStream, info) => {
      // Only the first "file" part is accepted; anything else is drained.
      if (_name !== "file" || sawFilePart) {
        fileStream.resume();
        return;
      }
      sawFilePart = true;

      // Basename only: the filename is later stored/displayed, never used as a path.
      const rawName = info.filename || "unnamed_file";
      originalFilename = path.basename(rawName) || "unnamed_file";
      mimeType = info.mimeType || "application/octet-stream";

      tmpPath = path.join(
        tmpDir,
        `upload-${crypto.randomBytes(16).toString("hex")}.tmp`
      );
      const out = createWriteStream(tmpPath);

      // When the size cap is hit we must NOT destroy the parse stream —
      // busboy would hang and never emit "finish". Instead: stop writing to
      // disk, drain (discard) the remaining bytes, and reject at "finish".
      const abortFile = () => {
        if (fileLimitHit) return;
        fileLimitHit = true;
        fileStream.unpipe(out);
        out.destroy();
        fileStream.resume(); // drain the rest so the parser can finish
      };
      fileStream.on("limit", abortFile);
      fileStream.on("data", (chunk: Buffer) => {
        if (fileLimitHit) return; // draining after abort — discard
        fileSize += chunk.length;
        // Defense in depth: enforce the cap even if the parser's own limit
        // misbehaves, and stop writing to disk immediately.
        if (fileSize > MAX_FILE_SIZE) {
          abortFile();
        }
      });
      out.on("error", (err) => {
        writeError = err;
        // Abort the whole parse; the "error" handler below settles the promise.
        busboy.destroy(err);
      });
      fileStream.pipe(out);
    });

    busboy.on("field", (name, value) => {
      if (name === "tags" && tags === null) {
        tags = value;
      }
    });

    busboy.on("filesLimit", () => {
      // Extra file parts are ignored (drained above); not an error.
    });

    busboy.on("error", (err: Error) => {
      void settleReject(
        new UploadParseError("BAD_REQUEST", `Failed to parse upload: ${err.message}`)
      );
    });

    busboy.on("finish", () => {
      if (writeError) {
        void settleReject(
          new UploadParseError("BAD_REQUEST", "Failed to write uploaded file.")
        );
        return;
      }
      if (fileLimitHit || fileSize > MAX_FILE_SIZE) {
        void settleReject(
          new UploadParseError(
            "FILE_TOO_LARGE",
            `File size exceeds the maximum limit of ${(
              MAX_FILE_SIZE /
              (1024 * 1024 * 1024)
            ).toFixed(1)} GB.`
          )
        );
        return;
      }
      if (!sawFilePart || !tmpPath) {
        void settleReject(new UploadParseError("NO_FILE", "No file provided"));
        return;
      }
      settleResolve({
        filePath: tmpPath,
        fileSize,
        originalFilename,
        mimeType,
        tags,
      });
    });

    const body = req.body;
    if (!body) {
      void settleReject(new UploadParseError("BAD_REQUEST", "Empty request body."));
      return;
    }
    // Convert the Web ReadableStream into a Node stream for busboy.
    // Nothing is buffered here: chunks flow straight through to the temp file.
    const nodeStream = Readable.fromWeb(body as any);
    nodeStream.on("error", (err) => {
      busboy.destroy(err);
    });
    nodeStream.pipe(busboy);
  });
}

/** Deletes the temp file produced by `parseMultipartUpload`. Safe to call twice. */
export async function cleanupUpload(parsed: ParsedUpload | null): Promise<void> {
  if (!parsed) return;
  await fs.unlink(parsed.filePath).catch(() => {});
}
