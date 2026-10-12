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
  MoreVertical,
  Check,
  Edit2,
  Tag,
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
  const [showMenu, setShowMenu] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DOCUMENT":
        return <FileText className="w-8 h-8 text-blue-400" />;
      case "IMAGE":
        return <ImageIcon className="w-8 h-8 text-emerald-400" />;
      case "VIDEO":
        return <Video className="w-8 h-8 text-purple-400" />;
      case "AUDIO":
        return <Music className="w-8 h-8 text-amber-400" />;
      case "ARCHIVE":
        return <Archive className="w-8 h-8 text-rose-400" />;
      default:
        return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  const handleDownload = () => {
    window.open(`/api/files/${file.id}/download`, "_blank");
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
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between group relative overflow-hidden">
      {/* Top Bar: Category badge & Actions */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}
        >
          {file.category}
        </span>

        <div className="flex items-center gap-1">
          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(file.id, file.isFavorite)}
            className={`p-1.5 rounded-lg transition ${
              file.isFavorite
                ? "text-amber-400 hover:text-amber-300"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5 opacity-0 group-hover:opacity-100"
            }`}
            title={file.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Star
              className={`w-3.5 h-3.5 ${file.isFavorite ? "fill-amber-400" : ""}`}
            />
          </button>

          {/* Quick Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition"
            title="Download from Telegram"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(file.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition"
            title="Delete file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Thumbnail / Icon Center Area */}
      <div
        onClick={() => onPreview(file)}
        className="h-28 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/60 transition group-hover:border-blue-500/20 mb-3"
      >
        <div className="p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">
          {getCategoryIcon(file.category)}
        </div>
        <span className="text-[10px] text-slate-400 mt-2">Click to preview</span>
      </div>

      {/* File Info */}
      <div className="space-y-1">
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onBlur={() => setIsRenaming(false)}
              className="bg-slate-900 border border-blue-500 rounded px-2 py-0.5 text-xs text-white w-full"
            />
            <button type="submit" className="text-emerald-400 p-0.5">
              <Check className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-1 group/title">
            <h3
              onClick={() => onPreview(file)}
              className="text-xs font-semibold text-white truncate cursor-pointer hover:text-blue-400 transition"
              title={file.displayFilename}
            >
              {file.displayFilename}
            </h3>
            <button
              onClick={() => setIsRenaming(true)}
              className="text-slate-500 hover:text-slate-300 opacity-0 group-hover/title:opacity-100 p-0.5"
              title="Rename file"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>{formatBytes(file.fileSizeBytes)}</span>
          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1.5">
            {file.tags.map((t, idx) => (
              <span
                key={idx}
                className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-white/5"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
