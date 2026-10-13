-- Security hardening: session revocation via token version, expiry for Telegram verification codes
ALTER TABLE "users" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "telegram_connections" ADD COLUMN "code_expires_at" TIMESTAMP(3);
