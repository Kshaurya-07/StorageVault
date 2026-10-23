// Jest global environment setup for isolated local SQLite test runs
process.env.DATABASE_URL = "file:./dev.db";
process.env.JWT_SECRET = "storagevault-test-jwt-secret-at-least-32-chars-long!";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.TELEGRAM_MODE = "mock";
process.env.AI_PROVIDER = "local";
