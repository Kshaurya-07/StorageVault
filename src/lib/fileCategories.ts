import { FileCategory } from "./types";

export function detectCategory(
  filename: string,
  mimeType?: string
): FileCategory {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mime = mimeType?.toLowerCase() || "";

  // Images
  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "tiff", "heic"].includes(ext)
  ) {
    return "IMAGE";
  }

  // Videos
  if (
    mime.startsWith("video/") ||
    ["mp4", "mov", "mkv", "webm", "avi", "flv", "wmv", "m4v"].includes(ext)
  ) {
    return "VIDEO";
  }

  // Audio
  if (
    mime.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "flac", "m4a", "aac", "wma"].includes(ext)
  ) {
    return "AUDIO";
  }

  // Archives
  if (
    mime.includes("zip") ||
    mime.includes("tar") ||
    mime.includes("compressed") ||
    mime.includes("archive") ||
    ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso"].includes(ext)
  ) {
    return "ARCHIVE";
  }

  // Documents
  if (
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.includes("document") ||
    mime.includes("presentation") ||
    mime.includes("sheet") ||
    mime.includes("text/") ||
    [
      "pdf",
      "doc",
      "docx",
      "txt",
      "rtf",
      "odt",
      "xls",
      "xlsx",
      "csv",
      "ppt",
      "pptx",
      "md",
      "json",
      "xml",
      "html",
      "py",
      "js",
      "ts",
      "java",
      "c",
      "cpp",
      "sql",
    ].includes(ext)
  ) {
    return "DOCUMENT";
  }

  return "OTHER";
}

export function formatBytes(bytes: number | bigint, decimals: number = 2): string {
  const numericBytes = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (!numericBytes || numericBytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(numericBytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);

  return (
    parseFloat((numericBytes / Math.pow(k, safeI)).toFixed(dm)) +
    " " +
    sizes[safeI]
  );
}

export function getCategoryBadgeColor(category: FileCategory): {
  bg: string;
  text: string;
  border: string;
} {
  switch (category) {
    case "DOCUMENT":
      return {
        bg: "bg-sky-500/10",
        text: "text-sky-300",
        border: "border-sky-500/30",
      };
    case "IMAGE":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-300",
        border: "border-emerald-500/30",
      };
    case "VIDEO":
      return {
        bg: "bg-violet-500/10",
        text: "text-violet-300",
        border: "border-violet-500/30",
      };
    case "AUDIO":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-300",
        border: "border-amber-500/30",
      };
    case "ARCHIVE":
      return {
        bg: "bg-slate-500/10",
        text: "text-slate-300",
        border: "border-slate-500/30",
      };
    default:
      return {
        bg: "bg-neutral-500/10",
        text: "text-neutral-300",
        border: "border-neutral-500/30",
      };
  }
}

/** Tailwind text-color class for a category's icon, from the theme palette. */
export function getCategoryIconClass(category: FileCategory): string {
  switch (category) {
    case "DOCUMENT":
      return "text-cat-document";
    case "IMAGE":
      return "text-cat-image";
    case "VIDEO":
      return "text-cat-video";
    case "AUDIO":
      return "text-cat-audio";
    case "ARCHIVE":
      return "text-cat-archive";
    default:
      return "text-cat-other";
  }
}

/** Soft tinted tile classes behind a category icon. */
export function getCategoryTileClass(category: FileCategory): string {
  switch (category) {
    case "DOCUMENT":
      return "bg-sky-500/10 border-sky-500/25";
    case "IMAGE":
      return "bg-emerald-500/10 border-emerald-500/25";
    case "VIDEO":
      return "bg-violet-500/10 border-violet-500/25";
    case "AUDIO":
      return "bg-amber-500/10 border-amber-500/25";
    case "ARCHIVE":
      return "bg-slate-500/10 border-slate-500/25";
    default:
      return "bg-neutral-500/10 border-neutral-500/25";
  }
}
