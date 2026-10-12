"use client";

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
} from "lucide-react";
import { FileMetadata } from "@/lib/types";
import { formatBytes, getCategoryBadgeColor } from "@/lib/fileCategories";

interface FileListRowProps {
  file: FileMetadata;
  onPreview: (file: FileMetadata) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
}

export default function FileListRow({
  file,
  onPreview,
  onDelete,
  onToggleFavorite,
}: FileListRowProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DOCUMENT":
        return <FileText className="w-4 h-4 text-neutral-200" />;
      case "IMAGE":
        return <ImageIcon className="w-4 h-4 text-neutral-200" />;
      case "VIDEO":
        return <Video className="w-4 h-4 text-neutral-200" />;
      case "AUDIO":
        return <Music className="w-4 h-4 text-neutral-200" />;
      case "ARCHIVE":
        return <Archive className="w-4 h-4 text-neutral-200" />;
      default:
        return <File className="w-4 h-4 text-neutral-400" />;
    }
  };

  const badgeColors = getCategoryBadgeColor(file.category);

  return (
    <tr className="border-b border-neutral-800/80 hover:bg-neutral-900/60 transition group text-xs">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
            {getCategoryIcon(file.category)}
          </div>
          <div className="min-w-0">
            <span
              onClick={() => onPreview(file)}
              className="font-medium text-white hover:underline cursor-pointer transition block truncate max-w-xs md:max-w-md"
              title={file.displayFilename}
            >
              {file.displayFilename}
            </span>
            {file.tags && file.tags.length > 0 && (
              <div className="flex gap-1 mt-0.5">
                {file.tags.map((t, idx) => (
                  <span key={idx} className="text-[9px] text-neutral-400 font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-4">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border} font-mono`}
        >
          {file.category}
        </span>
      </td>

      <td className="py-3 px-4 text-neutral-300 font-mono">
        {formatBytes(file.fileSizeBytes)}
      </td>

      <td className="py-3 px-4 text-neutral-400 font-mono">
        {new Date(file.uploadedAt).toLocaleDateString()}
      </td>

      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
          <button
            onClick={() => onToggleFavorite(file.id, file.isFavorite)}
            className={`p-1.5 rounded-lg transition ${
              file.isFavorite ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
            title="Favorite"
          >
            <Star className={`w-3.5 h-3.5 ${file.isFavorite ? "fill-white" : ""}`} />
          </button>

          <button
            onClick={() => onPreview(file)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(file.id)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
