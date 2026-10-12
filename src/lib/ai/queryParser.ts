import { FileCategory } from "../types";

export interface ParsedQuery {
  rawQuery: string;
  categories: FileCategory[];
  minSizeBytes?: number;
  maxSizeBytes?: number;
  dateFrom?: Date;
  dateTo?: Date;
  keywords: string[];
  exactExtensions: string[];
}

/**
 * Deterministically parses natural-language user queries into structured filters
 * without invoking external AI, ensuring fast, deterministic, and 100% private filtering.
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase().trim();
  const categories: FileCategory[] = [];
  const exactExtensions: string[] = [];
  const keywords: string[] = [];

  let minSizeBytes: number | undefined;
  let maxSizeBytes: number | undefined;
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  const now = new Date();

  // 1. Detect Category / Extension keywords
  if (/\b(pdf|pdfs)\b/i.test(lower)) {
    categories.push("DOCUMENT");
    exactExtensions.push("pdf");
  }
  if (/\b(doc|docx|word|document|documents|text|txt|notes|assignment|report)\b/i.test(lower)) {
    if (!categories.includes("DOCUMENT")) categories.push("DOCUMENT");
  }
  if (/\b(image|images|photo|photos|picture|pictures|png|jpg|jpeg|poster|posters|wallpaper)\b/i.test(lower)) {
    categories.push("IMAGE");
  }
  if (/\b(video|videos|movie|movies|clip|clips|mp4|recording|recordings)\b/i.test(lower)) {
    categories.push("VIDEO");
  }
  if (/\b(audio|music|song|songs|voice|recording|mp3|sound)\b/i.test(lower)) {
    categories.push("AUDIO");
  }
  if (/\b(zip|archive|archives|tar|rar|backup)\b/i.test(lower)) {
    categories.push("ARCHIVE");
  }

  // 2. Detect Size Filters
  // e.g. "larger than 100 MB", "> 100mb", "more than 50 mb", "greater than 1 gb"
  const sizeMinMatch = lower.match(/(?:larger than|greater than|more than|>|over)\s*(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)/i);
  if (sizeMinMatch) {
    const val = parseFloat(sizeMinMatch[1]);
    const unit = sizeMinMatch[2].toLowerCase();
    minSizeBytes = convertToBytes(val, unit);
  }

  // e.g. "smaller than 50 MB", "< 10mb", "less than 2 gb", "under 5 mb"
  const sizeMaxMatch = lower.match(/(?:smaller than|less than|<|under)\s*(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)/i);
  if (sizeMaxMatch) {
    const val = parseFloat(sizeMaxMatch[1]);
    const unit = sizeMaxMatch[2].toLowerCase();
    maxSizeBytes = convertToBytes(val, unit);
  }

  // 3. Detect Date Filters
  if (/\byesterday\b/i.test(lower)) {
    const yStart = new Date(now);
    yStart.setDate(now.getDate() - 1);
    yStart.setHours(0, 0, 0, 0);

    const yEnd = new Date(now);
    yEnd.setDate(now.getDate() - 1);
    yEnd.setHours(23, 59, 59, 999);

    dateFrom = yStart;
    dateTo = yEnd;
  } else if (/\btoday\b/i.test(lower)) {
    const tStart = new Date(now);
    tStart.setHours(0, 0, 0, 0);
    dateFrom = tStart;
    dateTo = now;
  } else if (/\blast week\b/i.test(lower) || /\bpast week\b/i.test(lower) || /\bpast 7 days\b/i.test(lower)) {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    dateFrom = weekAgo;
    dateTo = now;
  } else if (/\blast month\b/i.test(lower) || /\bpast month\b/i.test(lower) || /\bpast 30 days\b/i.test(lower)) {
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    dateFrom = monthAgo;
    dateTo = now;
  } else if (/\bthis year\b/i.test(lower)) {
    dateFrom = new Date(now.getFullYear(), 0, 1);
    dateTo = now;
  }

  // 4. Extract meaningful search keywords (strip stop words and filter triggers)
  const stopWords = new Set([
    "find",
    "my",
    "show",
    "me",
    "all",
    "the",
    "files",
    "file",
    "uploaded",
    "larger",
    "than",
    "smaller",
    "greater",
    "less",
    "under",
    "over",
    "yesterday",
    "today",
    "last",
    "week",
    "month",
    "year",
    "past",
    "days",
    "mb",
    "gb",
    "kb",
    "bytes",
    "with",
    "and",
    "or",
    "in",
    "from",
    "to",
  ]);

  const cleanWords = lower
    .replace(/[^\w\s.-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  for (const word of cleanWords) {
    if (!keywords.includes(word)) {
      keywords.push(word);
    }
  }

  return {
    rawQuery: query,
    categories,
    minSizeBytes,
    maxSizeBytes,
    dateFrom,
    dateTo,
    keywords,
    exactExtensions,
  };
}

function convertToBytes(val: number, unit: string): number {
  switch (unit) {
    case "kb":
      return Math.round(val * 1024);
    case "mb":
      return Math.round(val * 1024 * 1024);
    case "gb":
      return Math.round(val * 1024 * 1024 * 1024);
    default:
      return Math.round(val);
  }
}
