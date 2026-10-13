import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword, signSessionToken, getCookieSettings } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/change-password
 * Authenticated password update endpoint.
 * Requires valid active session AND the current password.
 * Bumps tokenVersion so all other sessions are instantly invalidated.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required to change your password." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (newPassword.length > 72) {
      return NextResponse.json(
        { error: "New password must not exceed 72 characters." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.accountStatus === "DELETED") {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      // Bump tokenVersion: invalidates every other session immediately.
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    // Re-issue this device's session so the user stays signed in here.
    const freshToken = await signSessionToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      tokenVersion: updatedUser.tokenVersion,
    });
    const cookieSettings = getCookieSettings();
    const response = NextResponse.json({
      success: true,
      message: "Password updated successfully. Other devices have been signed out.",
    });
    response.cookies.set(cookieSettings.name, freshToken, cookieSettings.options);
    return response;
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  }
}
