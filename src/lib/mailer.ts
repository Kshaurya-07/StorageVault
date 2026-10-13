import nodemailer from "nodemailer";

/**
 * SMTP configuration is env-only — never hardcode credentials.
 * When SMTP_HOST is unset, sending is a no-op returning { sent: false } and
 * the caller falls back to logging the reset link server-side, so local
 * development works without a mail server.
 */
export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

function buildTransporter() {
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure =
    process.env.SMTP_SECURE === "true" || (!process.env.SMTP_SECURE && port === 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || "",
        }
      : undefined,
  });
}

/**
 * Sends the password-reset email. Returns { sent: true } on success,
 * { sent: false } when SMTP is not configured (caller should log the link).
 * Throws on transport/auth failures so the caller can log them.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ sent: boolean }> {
  if (!isSmtpConfigured()) {
    return { sent: false };
  }

  const transporter = buildTransporter();
  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "no-reply@storagevault.local";

  const text =
    `You requested a password reset for your StorageVault account.\n\n` +
    `Reset your password using this link (valid for 15 minutes, single use):\n${resetUrl}\n\n` +
    `If you did not request this, you can safely ignore this email — your password will not change.`;

  const html =
    `<p>You requested a password reset for your StorageVault account.</p>` +
    `<p><a href="${resetUrl}">Reset your password</a> — this link is valid for 15 minutes and can be used only once.</p>` +
    `<p style="color:#666;font-size:12px;">If you did not request this, you can safely ignore this email — your password will not change.</p>`;

  await transporter.sendMail({
    from,
    to,
    subject: "StorageVault — Password reset request",
    text,
    html,
  });

  return { sent: true };
}
