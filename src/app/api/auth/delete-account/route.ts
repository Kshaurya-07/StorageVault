import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCookieSettings } from "@/lib/auth";
import prisma from "@/lib/db";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user (cascades to TelegramConnection, Files, Tags, Favorites via FKs)
    await prisma.user.delete({
      where: { id: session.userId },
    });

    const response = NextResponse.json({
      success: true,
      message: "Your account and all associated vault data have been completely deleted.",
    });

    const cookieSettings = getCookieSettings();
    response.cookies.set(cookieSettings.name, "", {
      ...cookieSettings.options,
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
