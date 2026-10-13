import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import {
  parseMultipartUpload,
  cleanupUpload,
  UploadParseError,
} from "../src/lib/streamingUpload";

const BOUNDARY = "----testboundary123456";

function buildMultipartBody(
  parts: { name: string; filename?: string; contentType?: string; data: Buffer }[],
  fields: Record<string, string> = {}
): Buffer {
  const chunks: Buffer[] = [];
  for (const p of parts) {
    chunks.push(Buffer.from(`--${BOUNDARY}\r\n`));
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${p.name}"` +
          (p.filename ? `; filename="${p.filename}"` : "") +
          `\r\n`
      )
    );
    if (p.contentType) chunks.push(Buffer.from(`Content-Type: ${p.contentType}\r\n`));
    chunks.push(Buffer.from(`\r\n`));
    chunks.push(p.data);
    chunks.push(Buffer.from(`\r\n`));
  }
  for (const [k, v] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`)
    );
  }
  chunks.push(Buffer.from(`--${BOUNDARY}--\r\n`));
  return Buffer.concat(chunks);
}

function makeRequest(body: Buffer): NextRequest {
  return new NextRequest("http://localhost/api/files", {
    method: "POST",
    headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
    body: body as any,
  });
}

describe("Streaming multipart upload parser", () => {
  it("streams the file part to disk and returns metadata + tags", async () => {
    const payload = Buffer.from("hello streaming upload world");
    const body = buildMultipartBody(
      [
        {
          name: "file",
          filename: "greeting.txt",
          contentType: "text/plain",
          data: payload,
        },
      ],
      { tags: "Work, Personal" }
    );

    const parsed = await parseMultipartUpload(makeRequest(body));

    expect(parsed.originalFilename).toBe("greeting.txt");
    expect(parsed.mimeType).toBe("text/plain");
    expect(parsed.fileSize).toBe(payload.length);
    expect(parsed.tags).toBe("Work, Personal");

    // The bytes landed on disk, identical to what was sent.
    const onDisk = await fs.readFile(parsed.filePath);
    expect(onDisk.equals(payload)).toBe(true);

    // Cleanup removes the temp file.
    await cleanupUpload(parsed);
    await expect(fs.access(parsed.filePath)).rejects.toThrow();
  });

  it("rejects with NO_FILE when no file part is present", async () => {
    const body = buildMultipartBody([], { tags: "orphan" });
    await expect(parseMultipartUpload(makeRequest(body))).rejects.toMatchObject({
      code: "NO_FILE",
    } satisfies Partial<UploadParseError> as any);
  });

  it("rejects oversized files mid-stream without buffering them", async () => {
    // Shrink the limit for this test via a fresh module instance.
    const original = process.env.MAX_FILE_SIZE_BYTES;
    process.env.MAX_FILE_SIZE_BYTES = "16";
    let mod: typeof import("../src/lib/streamingUpload");
    jest.isolateModules(() => {
      mod = require("../src/lib/streamingUpload");
    });
    if (original === undefined) delete process.env.MAX_FILE_SIZE_BYTES;
    else process.env.MAX_FILE_SIZE_BYTES = original;

    const body = buildMultipartBody([
      {
        name: "file",
        filename: "big.bin",
        contentType: "application/octet-stream",
        data: Buffer.alloc(1024, 0xab),
      },
    ]);

    await expect(mod!.parseMultipartUpload(makeRequest(body))).rejects.toThrow(
      /exceeds the maximum limit/
    );
  });

  it("strips directory components from hostile filenames", async () => {
    const body = buildMultipartBody([
      {
        name: "file",
        filename: "../../etc/evil.txt",
        contentType: "text/plain",
        data: Buffer.from("x"),
      },
    ]);
    const parsed = await parseMultipartUpload(makeRequest(body));
    expect(parsed.originalFilename).toBe("evil.txt");
    expect(parsed.filePath).not.toContain("etc");
    await cleanupUpload(parsed);
  });
});
