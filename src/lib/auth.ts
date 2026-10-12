import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { UserSession } from "./types";

const COOKIE_NAME = "vault_session";
const JWT_EXPIRES_IN = "7d";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "vault-ai-default-jwt-secret-do-not-use-in-prod";
  return new TextEncoder().encode(secret);
}

/**
 * Hashes a plaintext password securely using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password with stored hash.
 */
export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

/**
 * Signs a JWT token containing user identity.
 */
export async function signSessionToken(session: UserSession): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({
    userId: session.userId,
    email: session.email,
    name: session.name || null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
}

/**
 * Verifies a JWT token and returns the payload if valid.
 */
export async function verifySessionToken(
  token: string
): Promise<UserSession | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    if (!payload.userId || typeof payload.userId !== "string") {
      return null;
    }
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) || null,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts session from Next.js server context (cookies or Authorization header).
 * Strictly server-side: never trusts client-supplied owner ID.
 */
export async function getCurrentUser(
  req?: NextRequest
): Promise<UserSession | null> {
  let token: string | undefined;

  if (req) {
    // Check Authorization header first
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    // Check cookie on request
    if (!token) {
      token = req.cookies.get(COOKIE_NAME)?.value;
    }
  }

  // Fallback to next/headers cookies()
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // Not in a server action / route handler context
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

export function getCookieSettings() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    },
  };
}
