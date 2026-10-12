import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { formatBytes } from "@/lib/fileCategories";
import { FileCategory, StorageAnalyticsData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user's files metadata for aggregation
    const files = await prisma.file.findMany({
      where: { ownerUserId: session.userId },
      orderBy: { uploadedAt: "desc" },
    });

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

    let totalSizeBytes = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    let recentUploadsCount = 0;

    const dateMap: Record<string, { count: number; bytes: number }> = {};

    for (const f of files) {
      const size = Number(f.fileSizeBytes);
      const cat = f.category as FileCategory;

      totalSizeBytes += size;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      categorySizes[cat] = (categorySizes[cat] || 0) + size;

      if (f.uploadedAt >= sevenDaysAgo) {
        recentUploadsCount++;
      }

      const dateStr = f.uploadedAt.toISOString().slice(0, 10);
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { count: 0, bytes: 0 };
      }
      dateMap[dateStr].count += 1;
      dateMap[dateStr].bytes += size;
    }

    // Largest 5 files
    const sortedBySize = [...files].sort(
      (a, b) => Number(b.fileSizeBytes) - Number(a.fileSizeBytes)
    );
    const largestFiles = sortedBySize.slice(0, 5).map((f) => ({
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
    }));

    const uploadsByDate = Object.entries(dateMap)
      .map(([date, val]) => ({
        date,
        count: val.count,
        bytes: val.bytes,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const analyticsData: StorageAnalyticsData = {
      totalFiles: files.length,
      totalSizeBytes,
      formattedTotalSize: formatBytes(totalSizeBytes),
      categoryCounts,
      categorySizes,
      recentUploadsCount,
      largestFiles,
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
