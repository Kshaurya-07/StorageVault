"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import {
  shouldUseChunkedUpload,
  uploadFileChunked,
  uploadFileDirect,
  CancelToken,
  CancelledError,
  listInterruptedUploads,
  CHUNK_SIZE_BYTES,
} from "@/lib/chunkedUploader";

export type ItemStatus = "queued" | "uploading" | "done" | "error" | "cancelled";

export interface QueueItem {
  key: string;
  file: File;
  chunked: boolean;
  status: ItemStatus;
  progress: number; // 0-100
  doneChunks: number;
  totalChunks: number;
  error?: string;
  code?: string;
  uploadId?: string;
  cancelToken: CancelToken;
}

export interface InterruptedUpload {
  fingerprint: string;
  fileName: string;
  uploaded: number;
  totalChunks: number;
}

interface UploadQueueContextValue {
  items: QueueItem[];
  tags: string;
  setTags: (t: string) => void;
  addFiles: (incoming: FileList | File[] | null) => void;
  startAll: () => void;
  startItem: (item: QueueItem) => void;
  cancelItem: (item: QueueItem) => Promise<void>;
  retryItem: (item: QueueItem) => void;
  removeItem: (key: string) => void;
  clearFinished: () => void;
  activeCount: number;
  doneCount: number;
  totalProgress: number; // aggregate 0-100 across active items
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  telegramNotConnected: boolean;
  interrupted: InterruptedUpload[];
  refreshInterrupted: () => void;
}

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null);

export function useUploadQueue(): UploadQueueContextValue {
  const ctx = useContext(UploadQueueContext);
  if (!ctx) throw new Error("useUploadQueue must be used within UploadQueueProvider");
  return ctx;
}

let keyCounter = 0;

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [tags, setTags] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [telegramNotConnected, setTelegramNotConnected] = useState(false);
  const [interrupted, setInterrupted] = useState<InterruptedUpload[]>([]);

  const itemsRef = useRef<QueueItem[]>([]);
  itemsRef.current = items;
  const tagsRef = useRef(tags);
  tagsRef.current = tags;
  const settledNotifiedRef = useRef(false);

  const refreshInterrupted = useCallback(() => {
    try {
      setInterrupted(listInterruptedUploads());
    } catch {
      /* storage unavailable */
    }
  }, []);

  const openModal = useCallback(() => {
    refreshInterrupted();
    setIsModalOpen(true);
  }, [refreshInterrupted]);

  const closeModal = useCallback(() => {
    // Closing the modal never cancels uploads — they keep running in the
    // background and are visible via the floating progress pill.
    setIsModalOpen(false);
  }, []);

  const patchItem = useCallback((key: string, patch: Partial<QueueItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }, []);

  const maybeSettled = useCallback(() => {
    const current = itemsRef.current;
    const hasActive = current.some(
      (it) => it.status === "uploading" || it.status === "queued"
    );
    const hasDone = current.some((it) => it.status === "done");
    if (!hasActive && hasDone && !settledNotifiedRef.current) {
      settledNotifiedRef.current = true;
      // Notify any listening page (e.g. dashboard file list) to refresh.
      window.dispatchEvent(new CustomEvent("vault:uploads-complete"));
    }
    if (hasActive) {
      settledNotifiedRef.current = false;
    }
  }, []);

  const startItem = useCallback(
    (item: QueueItem) => {
      const token = new CancelToken();
      settledNotifiedRef.current = false;
      patchItem(item.key, {
        status: "uploading",
        progress: 0,
        doneChunks: 0,
        error: undefined,
        code: undefined,
        uploadId: undefined,
        cancelToken: token,
      });

      const onError = (err: any) => {
        if (err instanceof CancelledError || token.cancelled) {
          patchItem(item.key, { status: "cancelled", progress: 0 });
        } else {
          if (err?.code === "TELEGRAM_NOT_CONNECTED") setTelegramNotConnected(true);
          patchItem(item.key, {
            status: "error",
            error: err?.message || "Upload failed",
            code: err?.code,
          });
        }
        maybeSettled();
      };

      const currentTags = tagsRef.current;

      if (item.chunked) {
        uploadFileChunked(
          item.file,
          token,
          {
            onProgress: (done, total) => {
              patchItem(item.key, {
                doneChunks: done,
                totalChunks: total,
                progress: total > 0 ? Math.round((done / total) * 100) : 0,
              });
            },
            onUploadId: (uploadId) => patchItem(item.key, { uploadId }),
          },
          currentTags
        ).then(
          () => {
            patchItem(item.key, { status: "done", progress: 100 });
            maybeSettled();
          },
          onError
        );
      } else {
        uploadFileDirect(item.file, currentTags, token, {
          onProgress: (percent) => patchItem(item.key, { progress: percent }),
        }).then(
          () => {
            patchItem(item.key, { status: "done", progress: 100 });
            maybeSettled();
          },
          onError
        );
      }
    },
    [patchItem, maybeSettled]
  );

  const addFiles = useCallback((incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const fresh: QueueItem[] = Array.from(incoming).map((file) => {
      const chunked = shouldUseChunkedUpload(file);
      const totalChunks = chunked ? Math.ceil(file.size / CHUNK_SIZE_BYTES) : 1;
      return {
        key: `q-${Date.now()}-${keyCounter++}`,
        file,
        chunked,
        status: "queued" as ItemStatus,
        progress: 0,
        doneChunks: 0,
        totalChunks,
        cancelToken: new CancelToken(),
      };
    });
    settledNotifiedRef.current = false;
    setItems((prev) => [...prev, ...fresh]);
  }, []);

  const startAll = useCallback(() => {
    setTelegramNotConnected(false);
    const current = itemsRef.current;
    current
      .filter((it) => it.status === "queued" || it.status === "error")
      .forEach((it) => startItem(it));
  }, [startItem]);

  const cancelItem = useCallback(
    async (item: QueueItem) => {
      item.cancelToken.cancel();
      if (item.uploadId) {
        try {
          await fetch("/api/files/chunks/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadId: item.uploadId }),
          });
        } catch {
          /* best effort */
        }
      }
      patchItem(item.key, { status: "cancelled" });
      maybeSettled();
    },
    [patchItem, maybeSettled]
  );

  const retryItem = useCallback(
    (item: QueueItem) => {
      startItem(item);
    },
    [startItem]
  );

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const clearFinished = useCallback(() => {
    setItems((prev) =>
      prev.filter((it) => it.status === "uploading" || it.status === "queued")
    );
    settledNotifiedRef.current = false;
  }, []);

  const activeCount = items.filter(
    (it) => it.status === "uploading" || it.status === "queued"
  ).length;
  const doneCount = items.filter((it) => it.status === "done").length;

  const activeItems = items.filter(
    (it) => it.status === "uploading" || it.status === "queued"
  );
  const totalProgress =
    activeItems.length > 0
      ? Math.round(
          activeItems.reduce((sum, it) => sum + it.progress, 0) / activeItems.length
        )
      : items.length > 0 && doneCount === items.length
        ? 100
        : 0;

  const value: UploadQueueContextValue = {
    items,
    tags,
    setTags,
    addFiles,
    startAll,
    startItem,
    cancelItem,
    retryItem,
    removeItem,
    clearFinished,
    activeCount,
    doneCount,
    totalProgress,
    isModalOpen,
    openModal,
    closeModal,
    telegramNotConnected,
    interrupted,
    refreshInterrupted,
  };

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
    </UploadQueueContext.Provider>
  );
}
