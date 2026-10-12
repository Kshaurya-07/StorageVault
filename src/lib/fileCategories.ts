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
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/20",
      };
    case "IMAGE":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
      };
    case "VIDEO":
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/20",
      };
    case "AUDIO":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
      };
    case "ARCHIVE":
      return {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/20",
      };
    default:
      return {
        bg: "bg-zinc-500/10",
        text: "text-zinc-400",
        border: "border-zinc-500/20",
      };
  }
}
