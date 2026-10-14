"use client";

import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  Star,
  Download,
  Trash2,
  Eye,
  Check,
  Edit2,
} from "lucide-react";
import { FileMetadata } from "@/lib/types";
import { formatBytes, getCategoryBadgeColor } from "@/lib/fileCategories";

interface FileCardProps {
  file: FileMetadata;
  onPreview: (file: FileMetadata) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onRename?: (id: string, newName: string) => void;
}

export default function FileCard({
  file,
  onPreview,
  onDelete,
  onToggleFavorite,
  onRename,
}: FileCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.displayFilename);

  const downloadHref = `/api/files/${file.id}/download`;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DOCUMENT":
        return <FileText className="w-7 h-7 text-neutral-200" />;
      case "IMAGE":
        return <ImageIcon className="w-7 h-7 text-neutral-200" />;
      case "VIDEO":
        return <Video className="w-7 h-7 text-neutral-200" />;
      case "AUDIO":
        return <Music className="w-7 h-7 text-neutral-200" />;
      case "ARCHIVE":
        return <Archive className="w-7 h-7 text-neutral-200" />;
      default:
        return <File className="w-7 h-7 text-neutral-400" />;
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRename && newName.trim() && newName !== file.displayFilename) {
      onRename(file.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const badgeColors = getCategoryBadgeColor(file.category);

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between group relative overflow-hidden transform-gpu hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/80 hover:border-neutral-600 transition-all duration-300">
      {/* Top Bar: Category badge, chunked badge & Favorite toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wide ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}
          >
            {file.category}
          </span>
          {file.isChunked && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700"
              title="Large file stored across MTProto chunks"
            >
              CHUNKED
            </span>
          )}
        </div>

        <button
          onClick={() => onToggleFavorite(file.id, file.isFavorite)}
          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition ${
            file.isFavorite
              ? "text-white hover:text-neutral-300"
              : "text-neutral-500 hover:text-white hover:bg-white/5"
          }`}
          title={file.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          aria-label={file.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Star className={`w-4 h-4 ${file.isFavorite ? "fill-white" : ""}`} />
        </button>
      </div>

      {/* Center 3D Layered Thumbnail Area */}
      <div
        onClick={() => onPreview(file)}
        className="h-28 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-850 hover:border-neutral-600 transition mb-3 relative overflow-hidden group/thumb"
      >
        <div className="absolute w-12 h-14 bg-neutral-800/40 rounded-lg border border-neutral-700/40 -rotate-6 translate-x-1 -translate-y-1 pointer-events-none group-hover/thumb:-rotate-12 group-hover/thumb:-translate-x-2 transition-transform duration-300" />
        <div className="absolute w-12 h-14 bg-neutral-800/60 rounded-lg border border-neutral-700/60 rotate-6 -translate-x-1 translate-y-1 pointer-events-none group-hover/thumb:rotate-12 group-hover/thumb:translate-x-2 transition-transform duration-300" />

        <div className="relative z-10 p-3 rounded-2xl bg-neutral-800 border border-neutral-700 shadow-lg group-hover/thumb:scale-105 transition-transform">
          {getCategoryIcon(file.category)}
        </div>
        <span className="relative z-10 text-[10px] text-neutral-400 mt-2 font-mono">Preview Asset</span>
      </div>

      {/* File Info */}
      <div className="space-y-2">
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onBlur={() => setIsRenaming(false)}
              className="bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-xs text-white w-full focus:outline-none"
            />
            <button type="submit" className="text-white p-1 min-h-[36px] min-w-[36px] flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-1 group/title">
            <h3
              onClick={() => onPreview(file)}
              className="text-xs font-semibold text-white truncate cursor-pointer hover:underline transition flex-1 min-w-0"
              title={file.displayFilename}
            >
              {file.displayFilename}
            </h3>
            {onRename && (
              <button
                onClick={() => setIsRenaming(true)}
                className="text-neutral-500 hover:text-neutral-300 opacity-0 group-hover/title:opacity-100 p-1"
                title="Rename file"
                aria-label={`Rename ${file.displayFilename}`}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
          <span>{formatBytes(file.fileSizeBytes)}</span>
          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {file.tags.slice(0, 4).map((t, idx) => (
              <span
                key={idx}
                className="text-[9px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700 font-mono"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Action Bar with min-h-[44px] accessible touch targets */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80">
          <button
            onClick={() => onPreview(file)}
            className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <a
            href={downloadHref}
            download={file.displayFilename}
            className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800/60 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
          <button
            onClick={() => onDelete(file.id)}
            className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
