"use client";

import { useState } from "react";
import {
  X,
  Download,
  Calendar,
  HardDrive,
  FileText,
  Tag,
  Star,
  ExternalLink,
  ShieldCheck,
  Send,
} from "lucide-react";
import { FileMetadata } from "@/lib/types";
import { formatBytes, getCategoryBadgeColor } from "@/lib/fileCategories";

interface FilePreviewModalProps {
  file: FileMetadata | null;
  onClose: () => void;
  onToggleFavorite?: (id: string, current: boolean) => void;
}

export default function FilePreviewModal({
  file,
  onClose,
  onToggleFavorite,
}: FilePreviewModalProps) {
  if (!file) return null;

  const downloadUrl = `/api/files/${file.id}/download`;
  const inlineUrl = `${downloadUrl}?inline=true`;
  const badgeColors = getCategoryBadgeColor(file.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0f0f0f] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border} font-mono`}
            >
              {file.category}
            </span>
            <h2 className="text-sm font-bold text-white truncate max-w-md">
              {file.displayFilename}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(file.id, file.isFavorite)}
                className={`p-2 rounded-xl border border-neutral-800 transition ${
                  file.isFavorite
                    ? "text-white bg-neutral-800 border-neutral-700"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
                title={file.isFavorite ? "Favorited" : "Add to favorites"}
              >
                <Star
                  className={`w-4 h-4 ${file.isFavorite ? "fill-white" : ""}`}
                />
              </button>
            )}
            <a
              href={downloadUrl}
              download={file.originalFilename}
              className="flex items-center gap-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[250px] bg-neutral-950/80">
          {file.category === "IMAGE" ? (
            <div className="max-h-[50vh] flex items-center justify-center overflow-hidden rounded-xl">
              <img
                src={inlineUrl}
                alt={file.displayFilename}
                className="max-h-[50vh] object-contain rounded-xl shadow-lg border border-neutral-800"
              />
            </div>
          ) : file.category === "AUDIO" ? (
            <div className="w-full max-w-md p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-4">
                {file.displayFilename}
              </h4>
              <audio controls className="w-full" src={inlineUrl}>
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : file.category === "VIDEO" ? (
            <div className="w-full max-h-[50vh] flex items-center justify-center">
              <video
                controls
                className="max-h-[50vh] w-full rounded-xl shadow-lg border border-neutral-800"
                src={inlineUrl}
              >
                Your browser does not support video playback.
              </video>
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {file.displayFilename}
              </h3>
              <p className="text-xs text-neutral-400 mb-6 font-mono">
                Streamed directly from your private Telegram Saved Messages
              </p>
              <a
                href={downloadUrl}
                download={file.originalFilename}
                className="inline-flex items-center gap-2 bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md"
              >
                <Download className="w-4 h-4" />
                Download Document ({formatBytes(file.fileSizeBytes)})
              </a>
            </div>
          )}
        </div>

        {/* File Metadata Details Footer */}
        <div className="p-5 border-t border-neutral-800 bg-[#0a0a0a] text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-semibold">
                File Size
              </span>
              <span className="font-semibold text-neutral-200">
                {formatBytes(file.fileSizeBytes)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-semibold">
                MIME Type
              </span>
              <span className="font-semibold text-neutral-200 truncate block">
                {file.mimeType}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-semibold">
                Telegram Message ID
              </span>
              <span className="font-mono text-white">
                #{file.telegramMessageId || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-semibold">
                Uploaded On
              </span>
              <span className="font-semibold text-neutral-200">
                {new Date(file.uploadedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Zero-knowledge cloud storage (Saved Messages)</span>
            </div>
            <span className="font-mono">Owner: Authenticated User Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
