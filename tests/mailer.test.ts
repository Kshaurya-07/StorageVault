import { isSmtpConfigured, sendPasswordResetEmail } from "../src/lib/mailer";

describe("Mailer (SMTP)", () => {
  const OLD_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it("reports SMTP as not configured when SMTP_HOST is empty", () => {
    delete process.env.SMTP_HOST;
    expect(isSmtpConfigured()).toBe(false);
  });

  it("reports SMTP as configured when SMTP_HOST is set", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    expect(isSmtpConfigured()).toBe(true);
  });

  it("is a safe no-op (no throw, no network) when SMTP is unconfigured", async () => {
    delete process.env.SMTP_HOST;
    const result = await sendPasswordResetEmail(
      "user@example.com",
      "http://localhost:3000/forgot-password?token=abc"
    );
    expect(result.sent).toBe(false);
  });
});
