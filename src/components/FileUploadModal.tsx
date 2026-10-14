"use client";

import { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  File as FileIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Tag,
  Send,
  RotateCcw,
  Ban,
  Layers,
  Minimize2,
} from "lucide-react";
import { formatBytes } from "@/lib/fileCategories";
import Link from "next/link";
import { useUploadQueue } from "./UploadQueueContext";

/**
 * Upload dialog — now a thin UI over the app-level UploadQueueProvider.
 * Closing/minimizing NEVER cancels uploads: they keep running in the
 * background and stay visible via the floating progress pill.
 */
export default function FileUploadModal() {
  const {
    isModalOpen,
    closeModal,
    items,
    tags,
    setTags,
    addFiles,
    startAll,
    cancelItem,
    retryItem,
    removeItem,
    clearFinished,
    activeCount,
    doneCount,
    telegramNotConnected,
    interrupted,
  } = useUploadQueue();

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isModalOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const finishedCount = items.filter(
    (it) => it.status === "done" || it.status === "cancelled" || it.status === "error"
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#0f0f0f] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Upload to Saved Messages</h2>
              <p className="text-xs text-neutral-400">
                Streams into your personal Telegram cloud · up to 50GB per file
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {activeCount > 0 && (
              <button
                onClick={closeModal}
                title="Minimize — uploads keep running in background"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
                aria-label="Minimize"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={closeModal}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeCount > 0 && (
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-brand-300 shrink-0" />
              <p className="text-xs text-neutral-300">
                You can minimize this dialog — uploads keep running in the background.
              </p>
            </div>
          )}

          {telegramNotConnected && (
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-white">
                  Telegram Account Not Connected
                </span>
                <p className="text-neutral-400 mt-0.5">
                  StorageVault uses your personal Telegram Saved Messages as storage.
                  Please link your Telegram account before uploading.
                </p>
                <Link
                  href="/connect-telegram"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:underline"
                >
                  <Send className="w-3.5 h-3.5" />
                  Connect Telegram Now
                </Link>
              </div>
            </div>
          )}

          {interrupted.length > 0 && (
            <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-start gap-3">
              <Layers className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-white">
                  {interrupted.length} interrupted upload{interrupted.length > 1 ? "s" : ""} found
                </span>
                <p className="text-neutral-400 mt-0.5">
                  Re-select the same file{interrupted.length > 1 ? "s" : ""} and only the missing
                  parts will re-upload — e.g.{" "}
                  <span className="text-neutral-200 font-medium">
                    {interrupted[0].fileName} ({interrupted[0].uploaded}/{interrupted[0].totalChunks} parts done)
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-neutral-500 bg-neutral-850 scale-[1.01]"
                : "border-neutral-800 hover:border-neutral-700 bg-neutral-950/80"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-750 mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-semibold text-white">
              Drag and drop files here, or <span className="text-neutral-300 underline">browse</span>
            </p>
            <p className="text-xs text-neutral-400 mt-1 font-mono">
              Multiple files at once · files over 2GB are auto-split into parts
            </p>
          </div>

          {/* Optional Tags input */}
          <div>
            <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-400" />
              Add Tags (optional, comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. work, project-alpha, receipt, 2026"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
            />
          </div>

          {/* Upload Queue */}
          {items.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>
                  Upload Queue ({items.length})
                  {doneCount > 0 && <span className="text-brand-400"> · {doneCount} done</span>}
                </span>
                <div className="flex items-center gap-3">
                  <span className="normal-case font-sans">3 parallel uploads</span>
                  {finishedCount > 0 && (
                    <button
                      onClick={clearFinished}
                      className="normal-case font-sans text-neutral-500 hover:text-white transition"
                    >
                      Clear finished
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileIcon className="w-4 h-4 text-neutral-300 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-medium truncate flex items-center gap-1.5">
                            <span className="truncate">{item.file.name}</span>
                            {item.chunked && (
                              <span className="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
                                {item.totalChunks} parts
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {formatBytes(item.file.size)}
                            {item.chunked && item.status === "uploading" && (
                              <span> · part {Math.min(item.doneChunks + 1, item.totalChunks)}/{item.totalChunks}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status / actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === "uploading" && (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-300" />
                            <span className="text-white font-mono text-xs w-10 text-right">
                              {item.progress}%
                            </span>
                            <button
                              onClick={() => cancelItem(item)}
                              title="Cancel upload"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {item.status === "queued" && (
                          <button
                            onClick={() => removeItem(item.key)}
                            title="Remove from queue"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === "done" && (
                          <CheckCircle className="w-4 h-4 text-brand-300" />
                        )}
                        {item.status === "cancelled" && (
                          <>
                            <span className="text-neutral-500 text-[10px]">Cancelled</span>
                            <button
                              onClick={() => retryItem(item)}
                              title="Retry upload"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {item.status === "error" && (
                          <>
                            <span
                              className="text-neutral-400 text-[10px] max-w-[140px] truncate"
                              title={item.error}
                            >
                              {item.error || "Failed"}
                            </span>
                            <button
                              onClick={() => retryItem(item)}
                              title="Retry upload"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {(item.status === "uploading" || item.status === "done" || item.status === "error") && (
                      <div className="mt-2 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.status === "done"
                              ? "bg-brand-400"
                              : item.status === "error"
                                ? "bg-red-400/70"
                                : "bg-brand-500"
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <span className="text-xs text-neutral-400 font-mono">
            {activeCount > 0
              ? `${activeCount} uploading…`
              : items.length > 0
                ? `${items.length} file(s) in queue`
                : "No files selected"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition min-h-[44px]"
            >
              {activeCount > 0 ? "Minimize" : "Close"}
            </button>
            <button
              onClick={startAll}
              disabled={items.length === 0 || activeCount > 0}
              className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-[#041620] font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-brand-500/25 transition min-h-[48px]"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>
                {activeCount > 0
                  ? "Uploading…"
                  : doneCount > 0 && doneCount === items.length
                    ? "All done"
                    : "Start Upload"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
