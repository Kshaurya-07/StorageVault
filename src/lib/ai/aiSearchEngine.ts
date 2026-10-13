import prisma from "../db";
import { AiSearchResult, FileCategory, FileMetadata } from "../types";
import { parseNaturalLanguageQuery, ParsedQuery } from "./queryParser";

/**
 * Privacy-Strict AI Search Engine for StorageVault.
 * Guarantees:
 * 1. Pre-query isolation: ONLY records owned by the authenticated userId are fetched.
 * 2. Deterministic filtering: Date, size, and category conditions are resolved via SQL indexes.
 * 3. Zero Memory: No conversational state or personal memories are persisted.
 * 4. Zero Training: Ephemeral metadata only, never sent to untrusted third parties.
 */
export async function executeAiSearch(params: {
  userId: string;
  query: string;
}): Promise<AiSearchResult> {
  const { userId, query } = params;
  if (!query || query.trim() === "") {
    return {
      query: "",
      parsedFilters: {},
      explanation: "Please enter a search prompt.",
      matchedFiles: [],
      suggestedTags: [],
    };
  }

  const parsed: ParsedQuery = parseNaturalLanguageQuery(query);

  // 1. Build deterministic SQL / Prisma query strictly scoped to ownerUserId
  const whereClause: any = {
    ownerUserId: userId,
  };

  // Category filter
  if (parsed.categories.length > 0) {
    whereClause.category = { in: parsed.categories };
  }

  // Size filters
  if (parsed.minSizeBytes !== undefined || parsed.maxSizeBytes !== undefined) {
    whereClause.fileSizeBytes = {};
    if (parsed.minSizeBytes !== undefined) {
      whereClause.fileSizeBytes.gte = parsed.minSizeBytes;
    }
    if (parsed.maxSizeBytes !== undefined) {
      whereClause.fileSizeBytes.lte = parsed.maxSizeBytes;
    }
  }

  // Date filters
  if (parsed.dateFrom !== undefined || parsed.dateTo !== undefined) {
    whereClause.uploadedAt = {};
    if (parsed.dateFrom !== undefined) {
      whereClause.uploadedAt.gte = parsed.dateFrom;
    }
    if (parsed.dateTo !== undefined) {
      whereClause.uploadedAt.lte = parsed.dateTo;
    }
  }

  // Fetch candidate files for this user.
  // Bounded: scoring happens in JS, so cap candidates to keep memory flat.
  const candidateFiles = await prisma.file.findMany({
    where: whereClause,
    include: {
      tags: true,
    },
    orderBy: {
      uploadedAt: "desc",
    },
    take: 2000,
  });

  // 2. Score candidates based on keyword relevance
  const scoredFiles: { file: typeof candidateFiles[0]; score: number }[] = [];

  for (const file of candidateFiles) {
    let score = 1; // Base score for matching deterministic criteria
    const lowerName = file.displayFilename.toLowerCase();
    const ext = file.displayFilename.split(".").pop()?.toLowerCase() || "";
    const fileTags = file.tags.map((t) => t.tag.toLowerCase());

    // Extension check
    if (parsed.exactExtensions.includes(ext)) {
      score += 5;
    }

    // Keyword matching
    for (const kw of parsed.keywords) {
      if (lowerName.includes(kw)) {
        score += 10;
        // Exact word match
        const regex = new RegExp(`\\b${kw}\\b`, "i");
        if (regex.test(lowerName)) {
          score += 5;
        }
      }
      if (fileTags.includes(kw)) {
        score += 8;
      }
    }

    if (parsed.keywords.length === 0 || score > 1) {
      scoredFiles.push({ file, score });
    }
  }

  // Sort by relevance score descending
  scoredFiles.sort((a, b) => b.score - a.score);

  const matchedFiles: FileMetadata[] = scoredFiles.map(({ file }) => ({
    id: file.id,
    ownerUserId: file.ownerUserId,
    telegramMessageId: file.telegramMessageId,
    originalFilename: file.originalFilename,
    displayFilename: file.displayFilename,
    mimeType: file.mimeType,
    fileSizeBytes: Number(file.fileSizeBytes),
    category: file.category as FileCategory,
    uploadStatus: file.uploadStatus as any,
    isFavorite: file.isFavorite,
    uploadedAt: file.uploadedAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    tags: file.tags.map((t) => t.tag),
  }));

  // Generate suggested tags dynamically from filename tokens
  const suggestedTagsSet = new Set<string>();
  for (const item of matchedFiles.slice(0, 10)) {
    const tokens = item.displayFilename
      .replace(/[._\-0-9]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2);
    for (const t of tokens) {
      suggestedTagsSet.add(t.toLowerCase());
    }
  }

  // 3. Build friendly explanation of the applied filters
  const explanationParts: string[] = [];
  if (parsed.categories.length > 0) {
    explanationParts.push(`filtered by category (${parsed.categories.join(", ")})`);
  }
  if (parsed.minSizeBytes !== undefined) {
    explanationParts.push(`size >= ${(parsed.minSizeBytes / (1024 * 1024)).toFixed(1)} MB`);
  }
  if (parsed.maxSizeBytes !== undefined) {
    explanationParts.push(`size <= ${(parsed.maxSizeBytes / (1024 * 1024)).toFixed(1)} MB`);
  }
  if (parsed.dateFrom !== undefined) {
    explanationParts.push(`uploaded after ${parsed.dateFrom.toISOString().slice(0, 10)}`);
  }
  if (parsed.keywords.length > 0) {
    explanationParts.push(`matching keywords: "${parsed.keywords.join(", ")}"`);
  }

  const explanation =
    explanationParts.length > 0
      ? `Found ${matchedFiles.length} private file(s) ${explanationParts.join(" and ")}.`
      : `Found ${matchedFiles.length} file(s) in your vault.`;

  return {
    query,
    parsedFilters: {
      categories: parsed.categories,
      minSizeBytes: parsed.minSizeBytes,
      maxSizeBytes: parsed.maxSizeBytes,
      dateRange: {
        from: parsed.dateFrom?.toISOString(),
        to: parsed.dateTo?.toISOString(),
      },
      keywords: parsed.keywords,
      tags: Array.from(suggestedTagsSet).slice(0, 5),
    },
    explanation,
    matchedFiles,
    suggestedTags: Array.from(suggestedTagsSet).slice(0, 6),
  };
}
