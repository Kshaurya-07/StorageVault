import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { formatBytes } from "@/lib/fileCategories";
import { FileCategory, StorageAnalyticsData } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES: FileCategory[] = [
  "DOCUMENT",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "ARCHIVE",
  "OTHER",
];

/**
 * GET /api/analytics
 * Storage analytics for the authenticated user.
 * All aggregation happens in the database (groupBy/aggregate) so vaults with
 * tens of thousands of files don't exhaust Node memory.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerUserId = session.userId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, byCategory, recentUploadsCount, largestFiles, recentUploads] =
      await Promise.all([
        prisma.file.aggregate({
          where: { ownerUserId },
          _count: { _all: true },
          _sum: { fileSizeBytes: true },
        }),
        prisma.file.groupBy({
          by: ["category"],
          where: { ownerUserId },
          _count: { _all: true },
          _sum: { fileSizeBytes: true },
        }),
        prisma.file.count({
          where: { ownerUserId, uploadedAt: { gte: sevenDaysAgo } },
        }),
        prisma.file.findMany({
          where: { ownerUserId },
          orderBy: { fileSizeBytes: "desc" },
          take: 5,
        }),
        // Uploads-by-date chart: bounded to the last 30 days.
        prisma.file.findMany({
          where: { ownerUserId, uploadedAt: { gte: thirtyDaysAgo } },
          select: { uploadedAt: true, fileSizeBytes: true },
          orderBy: { uploadedAt: "asc" },
          take: 5000,
        }),
      ]);

    const categoryCounts: Record<FileCategory, number> = {
      DOCUMENT: 0,
      IMAGE: 0,
      VIDEO: 0,
      AUDIO: 0,
      ARCHIVE: 0,
      OTHER: 0,
    };
    const categorySizes: Record<FileCategory, number> = {
      DOCUMENT: 0,
      IMAGE: 0,
      VIDEO: 0,
      AUDIO: 0,
      ARCHIVE: 0,
      OTHER: 0,
    };
    for (const row of byCategory) {
      const cat = row.category as FileCategory;
      if (CATEGORIES.includes(cat)) {
        categoryCounts[cat] = row._count._all;
        categorySizes[cat] = Number(row._sum.fileSizeBytes ?? 0);
      }
    }

    const dateMap: Record<string, { count: number; bytes: number }> = {};
    for (const f of recentUploads) {
      const dateStr = f.uploadedAt.toISOString().slice(0, 10);
      if (!dateMap[dateStr]) dateMap[dateStr] = { count: 0, bytes: 0 };
      dateMap[dateStr].count += 1;
      dateMap[dateStr].bytes += Number(f.fileSizeBytes);
    }
    const uploadsByDate = Object.entries(dateMap)
      .map(([date, val]) => ({ date, count: val.count, bytes: val.bytes }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalSizeBytes = Number(total._sum.fileSizeBytes ?? 0);
    const analyticsData: StorageAnalyticsData = {
      totalFiles: total._count._all,
      totalSizeBytes,
      formattedTotalSize: formatBytes(totalSizeBytes),
      categoryCounts,
      categorySizes,
      recentUploadsCount,
      largestFiles: largestFiles.map((f) => ({
        id: f.id,
        ownerUserId: f.ownerUserId,
        originalFilename: f.originalFilename,
        displayFilename: f.displayFilename,
        mimeType: f.mimeType,
        fileSizeBytes: Number(f.fileSizeBytes),
        category: f.category as FileCategory,
        uploadStatus: f.uploadStatus as any,
        isFavorite: f.isFavorite,
        uploadedAt: f.uploadedAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      uploadsByDate,
    };

    return NextResponse.json(analyticsData);
  } catch (error: any) {
    console.error("Storage analytics error:", error);
    return NextResponse.json(
      { error: "Failed to generate storage analytics" },
      { status: 500 }
    );
  }
}
