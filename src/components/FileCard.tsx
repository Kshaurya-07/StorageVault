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
import { FileCategory } from "@/lib/types";
import {
  formatBytes,
  getCategoryBadgeColor,
  getCategoryIconClass,
  getCategoryTileClass,
} from "@/lib/fileCategories";

interface FileCardProps {
  file: FileMetadata;
  onPreview: (file: FileMetadata) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onRename?: (id: string, newName: string) => void;
}

function CategoryIcon({ category, className }: { category: FileCategory; className?: string }) {
  const color = getCategoryIconClass(category);
  const cls = `w-7 h-7 ${color} ${className || ""}`;
  switch (category) {
    case "DOCUMENT":
      return <FileText className={cls} />;
    case "IMAGE":
      return <ImageIcon className={cls} />;
    case "VIDEO":
      return <Video className={cls} />;
    case "AUDIO":
      return <Music className={cls} />;
    case "ARCHIVE":
      return <Archive className={cls} />;
    default:
      return <File className={cls} />;
  }
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

  // Direct download link (anchor with download attr) instead of window.open:
  // same-tab navigation keeps auth cookies and can't be abused as a popup.
  const downloadHref = `/api/files/${file.id}/download`;

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRename && newName.trim() && newName !== file.displayFilename) {
      onRename(file.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const badgeColors = getCategoryBadgeColor(file.category);

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 group">
      {/* Header row: icon tile + name/meta + favorite */}
      <div className="flex items-start gap-3">
        <div
          onClick={() => onPreview(file)}
          className={`w-12 h-12 rounded-xl border flex items-center justify-center cursor-pointer shrink-0 transition group-hover:scale-105 ${getCategoryTileClass(
            file.category
          )}`}
          role="button"
          aria-label={`Preview ${file.displayFilename}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onPreview(file);
          }}
        >
          <CategoryIcon category={file.category} />
        </div>

        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                onBlur={() => setIsRenaming(false)}
                className="bg-ink-800 border border-brand-500/50 rounded-lg px-2 py-1.5 text-sm text-white w-full focus:outline-none"
                aria-label="New file name"
              />
              <button
                type="submit"
                className="text-brand-300 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Confirm rename"
              >
                <Check className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1">
              <h3
                onClick={() => onPreview(file)}
                className="text-sm font-semibold text-white truncate cursor-pointer hover:text-brand-300 transition flex-1 min-w-0"
                title={file.displayFilename}
              >
                {file.displayFilename}
              </h3>
              {onRename && (
                <button
                  onClick={() => setIsRenaming(true)}
                  className="text-neutral-500 hover:text-neutral-300 p-2 shrink-0"
                  title="Rename file"
                  aria-label={`Rename ${file.displayFilename}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wide ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}
            >
              {file.category}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {formatBytes(file.fileSizeBytes)}
            </span>
            <span className="text-xs text-neutral-500">
              {new Date(file.uploadedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Favorite — always visible, 44px target */}
        <button
          onClick={() => onToggleFavorite(file.id, file.isFavorite)}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition shrink-0 ${
            file.isFavorite
              ? "text-amber-300 hover:text-amber-200"
              : "text-neutral-500 hover:text-amber-300 hover:bg-white/5"
          }`}
          title={file.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          aria-label={file.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          aria-pressed={file.isFavorite}
        >
          <Star className={`w-5 h-5 ${file.isFavorite ? "fill-amber-300" : ""}`} />
        </button>
      </div>

      {/* Tags */}
      {file.tags && file.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {file.tags.slice(0, 4).map((t, idx) => (
            <span
              key={idx}
              className="text-xs bg-white/5 text-neutral-300 px-2 py-0.5 rounded-md border border-white/10"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Action bar — always visible, 44px touch targets */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.07]">
        <button
          onClick={() => onPreview(file)}
          className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/[0.07] active:bg-white/10 transition"
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>
        <a
          href={downloadHref}
          download={file.displayFilename}
          className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-xs font-semibold text-brand-300 hover:text-brand-200 hover:bg-brand-500/10 active:bg-brand-500/20 transition"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </a>
        <button
          onClick={() => onDelete(file.id)}
          className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl text-xs font-semibold text-neutral-400 hover:text-red-300 hover:bg-red-500/10 active:bg-red-500/20 transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
