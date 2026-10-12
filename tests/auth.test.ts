import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from "../src/lib/auth";

describe("Authentication & Session Module", () => {
  it("should securely hash passwords and verify matching passwords", async () => {
    const raw = "SuperSecretVaultPass123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword123!", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("should sign and verify JWT session tokens", async () => {
    const userSession = {
      userId: "user-uuid-12345",
      email: "testuser@vault.ai",
      name: "Test User",
    };

    const token = await signSessionToken(userSession);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // Standard JWT format

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(userSession.userId);
    expect(payload?.email).toBe(userSession.email);
    expect(payload?.name).toBe(userSession.name);
  });

  it("should reject tampered or invalid JWT tokens", async () => {
    const validToken = await signSessionToken({
      userId: "user-1",
      email: "valid@vault.ai",
    });

    const tampered = validToken.substring(0, validToken.length - 5) + "abcde";
    const result = await verifySessionToken(tampered);
    expect(result).toBeNull();

    const emptyResult = await verifySessionToken("totally-invalid-token");
    expect(emptyResult).toBeNull();
  });
});
