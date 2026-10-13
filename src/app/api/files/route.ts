import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { getTelegramService } from "@/lib/telegram/telegramService";
import { decryptData } from "@/lib/crypto";
import { detectCategory } from "@/lib/fileCategories";
import { FileCategory } from "@/lib/types";

// Maximum upload size: 2GB (Telegram limit).
// Guard against misconfiguration: a non-numeric env value would make
// parseInt return NaN, and `size > NaN` is always false (limit silently off).
const DEFAULT_MAX_FILE_SIZE = 2097152000;
const _parsedMaxSize = parseInt(
  process.env.MAX_FILE_SIZE_BYTES || String(DEFAULT_MAX_FILE_SIZE),
  10
);
const MAX_FILE_SIZE =
  Number.isFinite(_parsedMaxSize) && _parsedMaxSize > 0
    ? _parsedMaxSize
    : DEFAULT_MAX_FILE_SIZE;

// Tag limits: prevent DB-write amplification via unbounded tag lists.
const MAX_TAGS_PER_FILE = 20;
const MAX_TAG_LENGTH = 50;

/** Parse a pagination param defensively: falls back to `def` on garbage input. */
function parseBoundedInt(
  raw: string | null,
  def: number,
  min: number,
  max: number
): number {
  const n = parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
}

export const dynamic = "force-dynamic";

/**
 * GET /api/files
 * Retrieves the current authenticated user's private files.
 * Strictly enforces ownerUserId isolation.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.toUpperCase() as
      | FileCategory
      | undefined;
    const search = searchParams.get("search")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const isFavorite = searchParams.get("favorite") === "true";
    const sortBy = searchParams.get("sortBy") || "uploadedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const limit = parseBoundedInt(searchParams.get("limit"), 50, 1, 200);
    const offset = parseBoundedInt(searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);

    // Build strictly owner-scoped where filter
    const where: any = {
      ownerUserId: session.userId,
    };

    if (category && ["DOCUMENT", "IMAGE", "VIDEO", "AUDIO", "ARCHIVE", "OTHER"].includes(category)) {
      where.category = category;
    }

    if (isFavorite) {
      where.isFavorite = true;
    }

    if (search) {
      where.displayFilename = {
        contains: search,
      };
    }

    if (tag) {
      where.tags = {
        some: {
          tag: tag,
          ownerUserId: session.userId,
        },
      };
    }

    // Determine sort column
    const orderBy: any = {};
    if (sortBy === "filename" || sortBy === "name") {
      orderBy.displayFilename = sortOrder;
    } else if (sortBy === "size") {
      orderBy.fileSizeBytes = sortOrder;
    } else {
      orderBy.uploadedAt = sortOrder;
    }

    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          tags: {
            select: { tag: true },
          },
        },
      }),
      prisma.file.count({ where }),
    ]);

    const formattedFiles = files.map((f) => ({
      id: f.id,
      ownerUserId: f.ownerUserId,
      telegramMessageId: f.telegramMessageId,
      originalFilename: f.originalFilename,
      displayFilename: f.displayFilename,
      mimeType: f.mimeType,
      fileSizeBytes: Number(f.fileSizeBytes),
      category: f.category,
      uploadStatus: f.uploadStatus,
      isFavorite: f.isFavorite,
      uploadedAt: f.uploadedAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      tags: f.tags.map((t) => t.tag),
    }));

    return NextResponse.json({
      files: formattedFiles,
      totalCount,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("List files error:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

/**
 * POST /api/files
 * Uploads a file to the authenticated user's personal Telegram Saved Messages.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user's Telegram connection
    const conn = await prisma.telegramConnection.findUnique({
      where: { userId: session.userId },
    });

    if (
      !conn ||
      conn.connectionStatus !== "CONNECTED" ||
      !conn.encryptedSessionReference
    ) {
      return NextResponse.json(
        {
          error:
            "Telegram account is not connected. Please connect your personal Telegram account to enable Saved Messages storage.",
          code: "TELEGRAM_NOT_CONNECTED",
        },
        { status: 400 }
      );
    }

    // Decrypt the user's personal Telegram session
    let sessionString: string;
    try {
      sessionString = decryptData(conn.encryptedSessionReference);
    } catch {
      return NextResponse.json(
        {
          error: "Failed to decrypt Telegram authorization. Please reconnect your Telegram account.",
        },
        { status: 500 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customTags = formData.get("tags") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds the maximum limit of ${(
            MAX_FILE_SIZE /
            (1024 * 1024 * 1024)
          ).toFixed(1)} GB.`,
        },
        { status: 400 }
      );
    }

    const originalFilename = file.name || "unnamed_file";
    const mimeType = file.type || "application/octet-stream";
    const category = detectCategory(originalFilename, mimeType);

    // Read file buffer in memory for streaming upload to Telegram
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload directly to authenticated user's Saved Messages via MTProto
    const telegramService = await getTelegramService();
    const uploadResult = await telegramService.uploadToSavedMessages({
      sessionString,
      fileBuffer: buffer,
      fileName: originalFilename,
      mimeType,
    });

    // Record metadata in database
    const createdFile = await prisma.file.create({
      data: {
        ownerUserId: session.userId,
        telegramMessageId: uploadResult.telegramMessageId,
        telegramFileReference: uploadResult.telegramFileReference || null,
        originalFilename,
        displayFilename: originalFilename,
        mimeType,
        fileSizeBytes: uploadResult.fileSizeBytes as any,
        category,
        uploadStatus: "COMPLETED",
      },
    });

    // Handle initial tags if provided (bounded count + length)
    if (customTags) {
      const tagsList = customTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
        .map((t) => t.slice(0, MAX_TAG_LENGTH))
        .slice(0, MAX_TAGS_PER_FILE);

      for (const tag of tagsList) {
        await prisma.fileTag.create({
          data: {
            ownerUserId: session.userId,
            fileId: createdFile.id,
            tag,
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json(
      {
        success: true,
        file: {
          id: createdFile.id,
          ownerUserId: createdFile.ownerUserId,
          telegramMessageId: createdFile.telegramMessageId,
          originalFilename: createdFile.originalFilename,
          displayFilename: createdFile.displayFilename,
          mimeType: createdFile.mimeType,
          fileSizeBytes: Number(createdFile.fileSizeBytes),
          category: createdFile.category,
          uploadStatus: createdFile.uploadStatus,
          isFavorite: createdFile.isFavorite,
          uploadedAt: createdFile.uploadedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Upload file error:", error);
    // Generic message: raw error text can leak Telegram/crypto internals.
    return NextResponse.json(
      { error: "Failed to upload file to Telegram Saved Messages." },
      { status: 500 }
    );
  }
}
