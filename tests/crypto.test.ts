import { encryptData, decryptData } from "../src/lib/crypto";

describe("Crypto Module (AES-256-GCM)", () => {
  it("should encrypt and decrypt a plaintext string correctly", () => {
    const original = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2";
    const encrypted = encryptData(original);

    expect(encrypted).not.toBe(original);
    expect(typeof encrypted).toBe("string");

    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should generate different ciphertexts for the same plaintext due to random IV", () => {
    const plaintext = "telegram_session_secret_12345";
    const cipher1 = encryptData(plaintext);
    const cipher2 = encryptData(plaintext);

    expect(cipher1).not.toBe(cipher2);
    expect(decryptData(cipher1)).toBe(plaintext);
    expect(decryptData(cipher2)).toBe(plaintext);
  });

  it("should fail decryption if ciphertext or auth tag is tampered with", () => {
    const original = "secure_user_token";
    const encrypted = encryptData(original);

    // Tamper with the base64 string
    const buf = Buffer.from(encrypted, "base64");
    buf[buf.length - 1] ^= 0xff; // flip a bit
    const tampered = buf.toString("base64");

    expect(() => decryptData(tampered)).toThrow();
  });

  it("should handle empty strings safely", () => {
    expect(encryptData("")).toBe("");
    expect(decryptData("")).toBe("");
  });
});
