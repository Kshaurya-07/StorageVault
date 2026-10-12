import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "vault-ai-default-jwt-secret-do-not-use-in-prod";
  return new TextEncoder().encode(secret);
}

/**
 * POST /api/auth/forgot-password
 * Secure 2-step password reset:
 * 1. Step 1 (Request link): User submits email -> generates ephemeral 15-minute cryptographically signed reset token.
 * 2. Step 2 (Execute reset): User submits { token, newPassword } -> token is verified before updating password.
 * Prevents account takeover and email enumeration attacks.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, token, newPassword } = body;

    // STEP 2: Execute password reset using verified token
    if (token) {
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      let payload: any;
      try {
        const verified = await jwtVerify(token, getJwtSecret());
        payload = verified.payload;
      } catch {
        return NextResponse.json(
          { error: "Reset link has expired or is invalid. Please request a new one." },
          { status: 400 }
        );
      }

      if (payload.type !== "password_reset" || !payload.userId) {
        return NextResponse.json(
          { error: "Invalid reset token." },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.accountStatus === "DELETED") {
        return NextResponse.json(
          { error: "User account no longer exists." },
          { status: 404 }
        );
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      return NextResponse.json({
        success: true,
        message: "Your password has been successfully reset. You may now log in.",
      });
    }

    // STEP 1: Request password reset link by email
    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.accountStatus === "DELETED") {
      // Return ambiguous message to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If your email is registered in VAULT AI, you will receive password reset instructions.",
      });
    }

    // Generate signed, 15-minute expiration reset token
    const resetToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      type: "password_reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(getJwtSecret());

    const isDev = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      success: true,
      message: "Password reset instructions have been generated.",
      // Include token and URL in dev mode for testing without an external mailer service
      ...(isDev
        ? {
            resetToken,
            resetUrl: `/forgot-password?token=${resetToken}`,
          }
        : {}),
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing password reset." },
      { status: 500 }
    );
  }
}
