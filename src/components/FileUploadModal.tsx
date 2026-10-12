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
} from "lucide-react";
import { formatBytes } from "@/lib/fileCategories";
import Link from "next/link";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: FileUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<UploadingFile[]>([]);
  const [tags, setTags] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [telegramNotConnected, setTelegramNotConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newItems: UploadingFile[] = Array.from(incoming).map((file) => ({
      file,
      progress: 0,
      status: "pending",
    }));
    setQueue((prev) => [...prev, ...newItems]);
  };

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
      handleFiles(e.dataTransfer.files);
    }
  };

  const startUpload = async () => {
    if (queue.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setTelegramNotConnected(false);

    let anySuccess = false;

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === "success") continue;

      // Update item to uploading
      setQueue((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "uploading", progress: 20 } : item
        )
      );

      const formData = new FormData();
      formData.append("file", queue[i].file);
      if (tags.trim()) {
        formData.append("tags", tags.trim());
      }

      let progressTimer: NodeJS.Timeout | null = null;
      try {
        // Progress simulation for user feedback
        progressTimer = setInterval(() => {
          setQueue((prev) =>
            prev.map((item, idx) =>
              idx === i && item.progress < 85
                ? { ...item, progress: item.progress + 15 }
                : item
            )
          );
        }, 150);

        const res = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (progressTimer) clearInterval(progressTimer);
        const data = await res.json();

        if (res.ok && data.success) {
          anySuccess = true;
          setQueue((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "success", progress: 100 } : item
            )
          );
        } else {
          if (data.code === "TELEGRAM_NOT_CONNECTED") {
            setTelegramNotConnected(true);
          }
          setQueue((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: "error",
                    progress: 0,
                    errorMessage: data.error || "Upload failed",
                  }
                : item
            )
          );
        }
      } catch (err: any) {
        if (progressTimer) clearInterval(progressTimer);
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error",
                  progress: 0,
                  errorMessage: err.message || "Network error",
                }
              : item
          )
        );
      }
    }

    setIsProcessing(false);
    if (anySuccess) {
      setTimeout(() => {
        onSuccess();
      }, 700);
    }
  };

  const removeQueueItem = (index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Upload to Saved Messages</h2>
              <p className="text-[11px] text-slate-400">
                Directly stream into your personal Telegram cloud storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {telegramNotConnected && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-amber-300">
                  Telegram Account Not Connected
                </span>
                <p className="text-slate-300 mt-0.5">
                  VAULT AI uses your personal Telegram Saved Messages as storage.
                  Please link your Telegram account before uploading.
                </p>
                <Link
                  href="/connect-telegram"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:underline"
                >
                  <Send className="w-3.5 h-3.5" />
                  Connect Telegram Now
                </Link>
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
                ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                : "border-white/10 hover:border-white/20 bg-slate-900/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-xs font-semibold text-white">
              Drag and drop files here, or <span className="text-blue-400">browse</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports PDF, DOCX, Images, Videos, MP3, ZIP up to 2.0 GB per file
            </p>
          </div>

          {/* Optional Tags input */}
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Add Tags (optional, comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. work, project-alpha, receipt, 2026"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Selected Files ({queue.length})
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {queue.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <FileIcon className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-slate-200 font-medium truncate">
                          {item.file.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatBytes(item.file.size)}
                        </div>
                      </div>
                    </div>

                    {/* Progress / Status */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === "uploading" && (
                        <div className="flex items-center gap-2 text-blue-400 text-[11px]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{item.progress}%</span>
                        </div>
                      )}
                      {item.status === "success" && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                      {item.status === "error" && (
                        <span className="text-rose-400 text-[10px] max-w-[120px] truncate" title={item.errorMessage}>
                          {item.errorMessage || "Failed"}
                        </span>
                      )}
                      {item.status === "pending" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQueueItem(idx);
                          }}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {queue.length} file(s) queued
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={startUpload}
              disabled={queue.length === 0 || isProcessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-lg shadow-blue-600/20 transition"
            >
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isProcessing ? "Uploading..." : "Upload to Telegram"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
