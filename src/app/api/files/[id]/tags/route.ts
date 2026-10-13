import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tag, action } = await req.json();
    if (!tag || typeof tag !== "string") {
      return NextResponse.json({ error: "Tag is required" }, { status: 400 });
    }

    const cleanTag = tag.trim().toLowerCase();
    // Reject tags that are empty after trimming, and cap length.
    if (cleanTag.length === 0) {
      return NextResponse.json({ error: "Tag must not be empty" }, { status: 400 });
    }
    if (cleanTag.length > 50) {
      return NextResponse.json(
        { error: "Tag must not exceed 50 characters" },
        { status: 400 }
      );
    }

    // Verify file ownership
    const file = await prisma.file.findFirst({
      where: { id: params.id, ownerUserId: session.userId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (action === "remove") {
      await prisma.fileTag.deleteMany({
        where: {
          fileId: file.id,
          ownerUserId: session.userId,
          tag: cleanTag,
        },
      });
      return NextResponse.json({ success: true, message: "Tag removed" });
    } else {
      await prisma.fileTag.upsert({
        where: {
          fileId_tag: {
            fileId: file.id,
            tag: cleanTag,
          },
        },
        create: {
          fileId: file.id,
          ownerUserId: session.userId,
          tag: cleanTag,
        },
        update: {},
      });
      return NextResponse.json({ success: true, message: "Tag added" });
    }
  } catch (error: any) {
    console.error("Tag operation error:", error);
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}
