import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/change-password
 * Authenticated password update endpoint.
 * Requires valid active session.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.accountStatus === "DELETED") {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // If current password provided, verify it
    if (currentPassword) {
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  }
}
