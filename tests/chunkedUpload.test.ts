import {
  validateChunkedInit,
  sanitizeFileName,
  expectedChunkSize,
  validateChunkIndex,
  assertChunksComplete,
  assembleChunkedDownload,
  sweepStaleUploads,
  ChunkedUploadError,
  MAX_CHUNK_BYTES,
  DEFAULT_CHUNK_SIZE,
} from "../src/lib/chunkedUpload";
import prisma from "../src/lib/db";
import { MockTelegramService } from "../src/lib/telegram/mockTelegramService";

const GB = 1024 * 1024 * 1024;

function validInit(overrides: Record<string, unknown> = {}) {
  return {
    fileName: "movie-50gb.mkv",
    mimeType: "video/x-matroska",
    totalSize: 3 * GB,
    chunkSize: DEFAULT_CHUNK_SIZE,
    totalChunks: Math.ceil((3 * GB) / DEFAULT_CHUNK_SIZE),
    fingerprint: "abc123",
    ...overrides,
  };
}

describe("validateChunkedInit", () => {
  test("accepts a valid 3GB init payload", () => {
    const v = validateChunkedInit(validInit());
    expect(v.fileName).toBe("movie-50gb.mkv");
    expect(v.totalChunks).toBe(6);
  });

  test("rejects totalChunks that do not match totalSize/chunkSize", () => {
    expect(() => validateChunkedInit(validInit({ totalChunks: 5 }))).toThrow(
      ChunkedUploadError
    );
  });

  test("rejects totalSize above the 50GB cap", () => {
    const totalSize = 60 * GB;
    expect(() =>
      validateChunkedInit(
        validInit({
          totalSize,
          totalChunks: Math.ceil(totalSize / DEFAULT_CHUNK_SIZE),
        })
      )
    ).toThrow(/exceeds/);
  });

  test("rejects chunkSize above the per-chunk cap", () => {
    const chunkSize = MAX_CHUNK_BYTES + 1;
    const totalSize = chunkSize * 2;
    expect(() =>
      validateChunkedInit(
        validInit({
          chunkSize,
          totalSize,
          totalChunks: 2,
        })
      )
    ).toThrow(/chunkSize/);
  });

  test("rejects missing fingerprint", () => {
    expect(() => validateChunkedInit(validInit({ fingerprint: "" }))).toThrow(
      /fingerprint/
    );
  });

  test("rejects non-positive totalSize", () => {
    expect(() => validateChunkedInit(validInit({ totalSize: 0 }))).toThrow(
      /positive/
    );
  });

  test("sanitizes path-traversal filenames to basename", () => {
    const v = validateChunkedInit(validInit({ fileName: "../../etc/passwd" }));
    expect(v.fileName).toBe("passwd");
  });

  test("sanitizeFileName rejects empty names", () => {
    expect(() => sanitizeFileName("   ")).toThrow(ChunkedUploadError);
  });
});

describe("expectedChunkSize / validateChunkIndex", () => {
  test("full chunks return chunkSize, last returns remainder", () => {
    const chunkSize = 512 * 1024 * 1024;
    const totalSize = chunkSize * 2 + 100;
    expect(expectedChunkSize(0, chunkSize, totalSize)).toBe(chunkSize);
    expect(expectedChunkSize(1, chunkSize, totalSize)).toBe(chunkSize);
    expect(expectedChunkSize(2, chunkSize, totalSize)).toBe(100);
  });

  test("exact division: last chunk is full size", () => {
    const chunkSize = 100;
    expect(expectedChunkSize(2, chunkSize, 300)).toBe(100);
  });

  test("validateChunkIndex enforces 0..totalChunks-1", () => {
    expect(validateChunkIndex(0, 3)).toBe(0);
    expect(validateChunkIndex(2, 3)).toBe(2);
    expect(() => validateChunkIndex(3, 3)).toThrow(ChunkedUploadError);
    expect(() => validateChunkIndex(-1, 3)).toThrow(ChunkedUploadError);
    expect(() => validateChunkIndex("abc", 3)).toThrow(ChunkedUploadError);
  });
});

describe("assertChunksComplete", () => {
  test("passes when every index 0..n-1 is present (any order)", () => {
    expect(() => assertChunksComplete([2, 0, 1], 3)).not.toThrow();
  });

  test("fails with missing-count message when short", () => {
    expect(() => assertChunksComplete([0, 2], 3)).toThrow(/1 of 3 chunks/);
  });

  test("fails naming the first missing index on duplicates", () => {
    expect(() => assertChunksComplete([0, 0, 1], 3)).toThrow(/index 1 is missing/);
  });
});

describe("assembleChunkedDownload", () => {
  test("concatenates chunk streams strictly in index order", async () => {
    const chunkData = ["aaa", "bb", "c"];
    const stream = assembleChunkedDownload(3, async (i) => {
      async function* gen() {
        // yield in two pieces to prove streaming (not whole-buffer) works
        const s = chunkData[i];
        yield Buffer.from(s.slice(0, 1));
        yield Buffer.from(s.slice(1));
      }
      return gen();
    });

    const reader = stream.getReader();
    const parts: Buffer[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(Buffer.from(value));
    }
    expect(Buffer.concat(parts).toString()).toBe("aaabbc");
  });

  test("propagates a mid-stream chunk failure", async () => {
    const stream = assembleChunkedDownload(2, async (i) => {
      if (i === 1) throw new Error("telegram exploded");
      async function* gen() {
        yield Buffer.from("ok");
      }
      return gen();
    });
    const reader = stream.getReader();
    await expect(
      (async () => {
        for (;;) {
          const { done } = await reader.read();
          if (done) break;
        }
      })()
    ).rejects.toThrow("telegram exploded");
  });
});

describe("mock telegram streaming download", () => {
  test("downloadStreamFromSavedMessages reassembles the original bytes", async () => {
    const svc = MockTelegramService.getInstance();
    svc.reset();
    const original = Buffer.from("x".repeat(200 * 1024)); // 200KB > 64KB slice
    const up = await svc.uploadToSavedMessages({
      sessionString: "mock_session_test",
      fileName: "big.bin",
      mimeType: "application/octet-stream",
      fileBuffer: original,
    });
    const stream = await svc.downloadStreamFromSavedMessages({
      sessionString: "mock_session_test",
      messageId: up.telegramMessageId,
    });
    const parts: Buffer[] = [];
    let slices = 0;
    for await (const b of stream) {
      parts.push(b);
      slices++;
    }
    expect(slices).toBeGreaterThan(1); // actually streamed in pieces
    expect(Buffer.concat(parts).equals(original)).toBe(true);
  });
});

describe("sweepStaleUploads", () => {
  let userId: string;

  beforeAll(async () => {
    await prisma.fileChunk.deleteMany();
    await prisma.chunkedUpload.deleteMany();
    await prisma.fileTag.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.file.deleteMany();
    await prisma.telegramConnection.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { email: "chunker@vault.ai", passwordHash: "x" },
    });
    userId = user.id;

    // Stale: updated 25h ago.
    const stale = await prisma.chunkedUpload.create({
      data: {
        ownerUserId: userId,
        fileName: "stale.bin",
        mimeType: "application/octet-stream",
        totalSize: 100,
        chunkSize: 50,
        totalChunks: 2,
        fingerprint: "stale-fp",
        status: "UPLOADING",
      },
    });
    // Backdate via raw SQL in ISO-8601 (the format Prisma uses for DateTime
    // in SQLite) so the < cutoff comparison behaves.
    const backdate25h = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-25 hours')`;
    await prisma.$executeRawUnsafe(
      `UPDATE chunked_uploads SET updated_at = ${backdate25h} WHERE id = '${stale.id}'`
    );

    // Fresh: just created.
    await prisma.chunkedUpload.create({
      data: {
        ownerUserId: userId,
        fileName: "fresh.bin",
        mimeType: "application/octet-stream",
        totalSize: 100,
        chunkSize: 50,
        totalChunks: 2,
        fingerprint: "fresh-fp",
        status: "UPLOADING",
      },
    });
  });

  test("marks only stale UPLOADING sessions as FAILED", async () => {
    const swept = await sweepStaleUploads(userId);
    expect(swept).toBe(1);

    const stale = await prisma.chunkedUpload.findFirst({
      where: { fingerprint: "stale-fp" },
    });
    const fresh = await prisma.chunkedUpload.findFirst({
      where: { fingerprint: "fresh-fp" },
    });
    expect(stale?.status).toBe("FAILED");
    expect(fresh?.status).toBe("UPLOADING");
  });

  test("is scoped per user (does not touch other users)", async () => {
    const other = await prisma.user.create({
      data: { email: "other@vault.ai", passwordHash: "x" },
    });
    await prisma.chunkedUpload.create({
      data: {
        ownerUserId: other.id,
        fileName: "other-stale.bin",
        mimeType: "application/octet-stream",
        totalSize: 100,
        chunkSize: 50,
        totalChunks: 2,
        fingerprint: "other-stale-fp",
        status: "UPLOADING",
      },
    });
    await prisma.$executeRawUnsafe(
      `UPDATE chunked_uploads SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-25 hours') WHERE fingerprint = 'other-stale-fp'`
    );
    const swept = await sweepStaleUploads(userId);
    expect(swept).toBe(0);
    const untouched = await prisma.chunkedUpload.findFirst({
      where: { fingerprint: "other-stale-fp" },
    });
    expect(untouched?.status).toBe("UPLOADING");
  });
});
