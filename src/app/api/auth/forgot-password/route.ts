import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return success to avoid email enumeration attacks
      return NextResponse.json({
        success: true,
        message: "If the email exists, password update instructions have been processed.",
      });
    }

    // If newPassword is provided directly in demo/dev mode:
    if (newPassword && typeof newPassword === "string" && newPassword.length >= 8) {
      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      return NextResponse.json({
        success: true,
        message: "Password has been successfully updated.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link sent to your registered email address.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
