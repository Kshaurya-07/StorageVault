import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { UserSession } from "./types";
import prisma from "./db";

const COOKIE_NAME = "vault_session";
const JWT_EXPIRES_IN = "7d";

/**
 * Returns the JWT signing secret.
 * FAILS CLOSED in production: the app refuses to sign/verify tokens when
 * JWT_SECRET is missing or too short, instead of silently falling back to a
 * publicly known default (which would allow universal token forgery).
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET is not set. Refusing to start authentication in production without a secret."
      );
    }
    // Dev/test only: clearly marked insecure default.
    return new TextEncoder().encode("dev-only-insecure-jwt-secret-do-not-deploy");
  }
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }
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
 * Embeds the user's tokenVersion so password changes/resets instantly
 * invalidate previously issued tokens (see getCurrentUser).
 */
export async function signSessionToken(session: UserSession): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({
    userId: session.userId,
    email: session.email,
    name: session.name || null,
    tokenVersion: session.tokenVersion ?? 0,
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
      tokenVersion:
        typeof payload.tokenVersion === "number" ? payload.tokenVersion : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts session from Next.js server context (cookies or Authorization header).
 * Strictly server-side: never trusts client-supplied owner ID.
 *
 * Additionally re-validates the session against the database on every call:
 * - rejects tokens for DELETED/SUSPENDED accounts (accountStatus check)
 * - rejects tokens whose tokenVersion no longer matches (password changed/reset)
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
  const session = await verifySessionToken(token);
  if (!session) return null;

  // Re-validate against the database: status + token version.
  // This is what makes logout/password-change/suspension actually take effect.
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, accountStatus: true, tokenVersion: true },
    });
    if (!user) return null;
    if ((user.accountStatus as string) !== "ACTIVE") return null;
    if (user.tokenVersion !== (session.tokenVersion ?? 0)) return null;
  } catch {
    // Fail closed: if we cannot validate the session, deny access.
    return null;
  }

  return session;
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
