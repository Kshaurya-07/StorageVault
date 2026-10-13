import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCookieSettings, verifyPassword } from "@/lib/auth";
import prisma from "@/lib/db";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Destructive and irreversible: require password re-confirmation so a
    // briefly-stolen session cookie alone cannot wipe the account.
    const body = await req.json().catch(() => ({}));
    const { currentPassword } = body as { currentPassword?: string };
    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Please confirm your current password to delete your account." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
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
