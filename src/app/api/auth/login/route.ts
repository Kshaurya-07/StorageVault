import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, signSessionToken, getCookieSettings } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rateLimit";

// Constant dummy bcrypt hash so unknown-email logins take the same time as
// real password checks (mitigates login timing enumeration). Not a secret.
const DUMMY_BCRYPT_HASH =
  "$2a$10$e35iebAytVZzfzWNC849ZOrDHigUS4be.ENAZEdN2zn.gLAVXk0q6";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit: 10 login attempts per 10 minutes per IP.
    const ipLimit = checkRateLimit(`login:ip:${ip}`, 10, 10 * 60 * 1000);
    if (!ipLimit.allowed) return rateLimitedResponse(ipLimit.retryAfterMs);

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Per-account throttle: 20 attempts per 10 minutes per email.
    const emailLimit = checkRateLimit(
      `login:email:${normalizedEmail}`,
      20,
      10 * 60 * 1000
    );
    if (!emailLimit.allowed) return rateLimitedResponse(emailLimit.retryAfterMs);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.accountStatus === "DELETED") {
      // Run a dummy compare so response time matches the valid-user path.
      await verifyPassword(password, DUMMY_BCRYPT_HASH);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.accountStatus === "SUSPENDED") {
      return NextResponse.json(
        { error: "Account suspended. Please contact support." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    const cookieSettings = getCookieSettings();
    response.cookies.set(cookieSettings.name, token, cookieSettings.options);

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during login." },
      { status: 500 }
    );
  }
}
