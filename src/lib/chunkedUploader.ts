/**
 * Chunked + mass parallel upload client.
 *
 * - Files <= 2GB (Telegram single-file limit) use the existing direct
 *   POST /api/files path, upgraded with REAL upload progress via XHR.
 * - Files > 2GB are split with Blob.slice() into 512MB chunks and uploaded
 *   through /api/files/chunks/* with a GLOBAL concurrency pool of 3 — shared
 *   across all files, so mass upload (2-3 files at once) just works.
 * - Resume: per-file progress is persisted in localStorage keyed by a file
 *   fingerprint (name+size+lastModified). The server is the source of truth
 *   (/status); re-selecting the same file resumes only missing chunks.
 */

/** Size of each chunk sent to the server. Must be <= server MAX_CHUNK_BYTES. */
export const CHUNK_SIZE_BYTES = 512 * 1024 * 1024; // 512MB

/** Max concurrent chunk/file uploads across ALL files (global pool). */
export const CHUNK_CONCURRENCY = 3;

/** Retries per chunk before the file is marked failed. */
export const CHUNK_MAX_RETRIES = 3;

/** Files at/below this size use the direct single-request upload path. */
export const DIRECT_UPLOAD_MAX = 2097152000; // 2GB (Telegram limit)

export function shouldUseChunkedUpload(file: File): boolean {
  return file.size > DIRECT_UPLOAD_MAX;
}

/** Stable fingerprint so re-selecting the same file resumes its session. */
export function fileFingerprint(file: File): string {
  const raw = `${file.name}|${file.size}|${file.lastModified}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    h1 = (Math.imul(h1 ^ c, 0x01000193) >>> 0) || 1;
    h2 = (Math.imul(h2 ^ (c + 31), 0x01000193) >>> 0) || 1;
  }
  return `${h1.toString(16)}${h2.toString(16)}`;
}

export class CancelledError extends Error {
  constructor() {
    super("Upload cancelled.");
    this.name = "CancelledError";
  }
}

/** Cooperative cancellation: aborts in-flight fetches/XHRs. */
export class CancelToken {
  cancelled = false;
  private controllers = new Set<AbortController | XMLHttpRequest>();

  cancel() {
    if (this.cancelled) return;
    this.cancelled = true;
    for (const c of this.controllers) {
      try {
        c.abort();
      } catch {
        /* noop */
      }
    }
    this.controllers.clear();
  }

  track(c: AbortController | XMLHttpRequest) {
    if (this.cancelled) {
      try {
        c.abort();
      } catch {
        /* noop */
      }
      return;
    }
    this.controllers.add(c);
  }

  untrack(c: AbortController | XMLHttpRequest) {
    this.controllers.delete(c);
  }
}

// ---------------------------------------------------------------------------
// Global concurrency pool: at most CHUNK_CONCURRENCY tasks in flight,
// shared by every file being uploaded (mass upload just works).
// ---------------------------------------------------------------------------

type Task = () => Promise<void>;
const taskQueue: Task[] = [];
let runningTasks = 0;

function pumpQueue() {
  while (runningTasks < CHUNK_CONCURRENCY && taskQueue.length > 0) {
    const task = taskQueue.shift()!;
    runningTasks++;
    task().finally(() => {
      runningTasks--;
      pumpQueue();
    });
  }
}

function enqueueTask(task: Task) {
  taskQueue.push(task);
  pumpQueue();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// localStorage progress (resume across reloads / dropped connections)
// ---------------------------------------------------------------------------

interface StoredProgress {
  uploadId: string;
  fileName: string;
  uploaded: number[];
  totalChunks: number;
}

function progressKey(fingerprint: string) {
  return `sv_chunked_${fingerprint}`;
}

function readProgress(fingerprint: string): StoredProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(fingerprint));
    return raw ? (JSON.parse(raw) as StoredProgress) : null;
  } catch {
    return null;
  }
}

function writeProgress(fingerprint: string, p: StoredProgress) {
  try {
    localStorage.setItem(progressKey(fingerprint), JSON.stringify(p));
  } catch {
    /* storage full / private mode — resume just won't persist */
  }
}

function clearProgress(fingerprint: string) {
  try {
    localStorage.removeItem(progressKey(fingerprint));
  } catch {
    /* noop */
  }
}

/** Lists interrupted chunked sessions still on this device (for the UI hint). */
export function listInterruptedUploads(): Array<{
  fingerprint: string;
  fileName: string;
  uploaded: number;
  totalChunks: number;
}> {
  const out: Array<{
    fingerprint: string;
    fileName: string;
    uploaded: number;
    totalChunks: number;
  }> = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("sv_chunked_")) continue;
      const p = JSON.parse(localStorage.getItem(key) || "null") as StoredProgress | null;
      if (p && p.uploaded.length < p.totalChunks) {
        out.push({
          fingerprint: key.slice("sv_chunked_".length),
          fileName: p.fileName,
          uploaded: p.uploaded.length,
          totalChunks: p.totalChunks,
        });
      }
    }
  } catch {
    /* noop */
  }
  return out;
}

// ---------------------------------------------------------------------------
// Chunked upload
// ---------------------------------------------------------------------------

export interface ChunkedHooks {
  onProgress: (doneChunks: number, totalChunks: number) => void;
  onUploadId?: (uploadId: string) => void;
}

export interface ChunkedResult {
  fileId: string;
}

async function postJson(url: string, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data.error || `Request failed (${res.status})`);
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

async function uploadOneChunk(
  file: File,
  uploadId: string,
  index: number,
  cancel: CancelToken
): Promise<void> {
  const start = index * CHUNK_SIZE_BYTES;
  const end = Math.min(start + CHUNK_SIZE_BYTES, file.size);
  // Blob.slice() is a zero-copy view — the 512MB is NOT loaded into RAM.
  const blob = file.slice(start, end, "application/octet-stream");

  let lastError = "";
  for (let attempt = 1; attempt <= CHUNK_MAX_RETRIES; attempt++) {
    if (cancel.cancelled) throw new CancelledError();
    const controller = new AbortController();
    cancel.track(controller);
    try {
      const form = new FormData();
      form.append("uploadId", uploadId);
      form.append("chunkIndex", String(index));
      form.append("file", blob, `chunk-${index}.bin`);

      const res = await fetch("/api/files/chunks", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return; // includes duplicate:true (idempotent retry)
      lastError = data.error || `Chunk ${index + 1} failed (HTTP ${res.status})`;
      if (res.status === 429) {
        await sleep(2000 * attempt); // back off on rate limit, then retry
        continue;
      }
      if (res.status >= 400 && res.status < 500) {
        // Non-retryable client error (bad index, session gone, …).
        throw new Error(lastError);
      }
      // 5xx / network: fall through to retry.
    } catch (e: any) {
      if (e?.name === "AbortError" || cancel.cancelled) throw new CancelledError();
      if (e instanceof Error && !lastError) lastError = e.message;
      else if (e instanceof Error) throw e;
      lastError = lastError || e?.message || "Network error";
    } finally {
      cancel.untrack(controller);
    }
    await sleep(1000 * attempt);
  }
  throw new Error(lastError || `Chunk ${index + 1} failed after ${CHUNK_MAX_RETRIES} attempts.`);
}

/**
 * Uploads a large file in 512MB chunks. Resolves with the created file id.
 * Only missing chunks are uploaded (resume); the session survives reloads
 * via fingerprint + server status.
 */
export function uploadFileChunked(
  file: File,
  cancel: CancelToken,
  hooks: ChunkedHooks,
  tags?: string
): Promise<ChunkedResult> {
  return new Promise<ChunkedResult>((resolve, reject) => {
    (async () => {
      try {
        if (cancel.cancelled) throw new CancelledError();
        const fingerprint = fileFingerprint(file);
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE_BYTES);

        // init — the server returns the EXISTING session for this
        // fingerprint when one is still UPLOADING (resume).
        const init = await postJson("/api/files/chunks/init", {
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          totalSize: file.size,
          chunkSize: CHUNK_SIZE_BYTES,
          totalChunks,
          fingerprint,
        });
        const uploadId: string = init.uploadId;
        hooks.onUploadId?.(uploadId);

        // Server is the source of truth for what's already stored.
        const uploaded = new Set<number>();
        try {
          const res = await fetch(
            `/api/files/chunks/status?uploadId=${encodeURIComponent(uploadId)}`
          );
          if (res.ok) {
            const s = await res.json();
            for (const i of s.uploadedChunkIndexes || []) uploaded.add(i);
          }
        } catch {
          /* fall back to localStorage below */
        }
        if (uploaded.size === 0) {
          const stored = readProgress(fingerprint);
          if (stored && stored.uploadId === uploadId) {
            for (const i of stored.uploaded) uploaded.add(i);
          }
        }
        writeProgress(fingerprint, {
          uploadId,
          fileName: file.name,
          uploaded: [...uploaded],
          totalChunks,
        });
        hooks.onProgress(uploaded.size, totalChunks);

        const missing: number[] = [];
        for (let i = 0; i < totalChunks; i++) {
          if (!uploaded.has(i)) missing.push(i);
        }

        if (missing.length > 0) {
          await new Promise<void>((res, rej) => {
            let remaining = missing.length;
            let settled = false;
            for (const index of missing) {
              enqueueTask(async () => {
                if (settled) return;
                if (cancel.cancelled) {
                  settled = true;
                  rej(new CancelledError());
                  return;
                }
                try {
                  await uploadOneChunk(file, uploadId, index, cancel);
                } catch (e) {
                  if (!settled) {
                    settled = true;
                    rej(e);
                  }
                  return;
                }
                uploaded.add(index);
                writeProgress(fingerprint, {
                  uploadId,
                  fileName: file.name,
                  uploaded: [...uploaded],
                  totalChunks,
                });
                hooks.onProgress(uploaded.size, totalChunks);
                remaining--;
                if (remaining === 0 && !settled) {
                  settled = true;
                  res();
                }
              });
            }
          });
        }

        if (cancel.cancelled) throw new CancelledError();

        const fin = await postJson("/api/files/chunks/complete", {
          uploadId,
          tags: tags?.trim() || undefined,
        });
        clearProgress(fingerprint);
        hooks.onProgress(totalChunks, totalChunks);
        resolve({ fileId: fin.file.id });
      } catch (e) {
        reject(e);
      }
    })();
  });
}

// ---------------------------------------------------------------------------
// Direct upload (<=2GB) with REAL progress via XHR
// ---------------------------------------------------------------------------

export interface DirectHooks {
  onProgress: (percent: number) => void;
}

export function uploadFileDirect(
  file: File,
  tags: string | undefined,
  cancel: CancelToken,
  hooks: DirectHooks
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    enqueueTask(async () => {
      if (cancel.cancelled) {
        reject(new CancelledError());
        return;
      }
      const xhr = new XMLHttpRequest();
      cancel.track(xhr);
      xhr.open("POST", "/api/files");
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          hooks.onProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
      xhr.onload = () => {
        cancel.untrack(xhr);
        let data: any = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* noop */
        }
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          hooks.onProgress(100);
          resolve();
        } else {
          const err: any = new Error(data.error || `Upload failed (${xhr.status})`);
          err.code = data.code;
          reject(err);
        }
      };
      xhr.onerror = () => {
        cancel.untrack(xhr);
        reject(cancel.cancelled ? new CancelledError() : new Error("Network error during upload."));
      };
      xhr.onabort = () => {
        cancel.untrack(xhr);
        reject(new CancelledError());
      };
      const form = new FormData();
      form.append("file", file);
      if (tags?.trim()) form.append("tags", tags.trim());
      xhr.send(form);
    });
  });
}
