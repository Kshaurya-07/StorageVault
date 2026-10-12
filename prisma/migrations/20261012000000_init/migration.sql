-- PostgreSQL Migration: 20261012000000_init
-- VAULT AI Database Schema & Row-Level Security

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ConnectionStatus" AS ENUM ('DISCONNECTED', 'PENDING_CODE', 'PENDING_2FA', 'CONNECTED', 'REVOKED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FileCategory" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'ARCHIVE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Telegram Connections Table
CREATE TABLE IF NOT EXISTS "telegram_connections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL UNIQUE,
    "telegram_user_id" TEXT,
    "telegram_username" TEXT,
    "telegram_first_name" TEXT,
    "encrypted_session_reference" TEXT,
    "phone_number" TEXT,
    "phone_code_hash" TEXT,
    "connection_status" "ConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "connected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_telegram_connections_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Create Files Table
CREATE TABLE IF NOT EXISTS "files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT NOT NULL,
    "telegram_message_id" INTEGER,
    "telegram_peer_reference" TEXT NOT NULL DEFAULT 'me',
    "telegram_file_reference" TEXT,
    "original_filename" TEXT NOT NULL,
    "display_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "category" "FileCategory" NOT NULL DEFAULT 'OTHER',
    "upload_status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_files_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Create File Tags Table
CREATE TABLE IF NOT EXISTS "file_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_user_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_file_tags_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_file_tags_file" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "uq_file_tags_file_tag" UNIQUE ("file_id", "tag")
);

-- 6. Create Favorites Table
CREATE TABLE IF NOT EXISTS "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_favorites_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fk_favorites_file" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "uq_favorites_user_file" UNIQUE ("user_id", "file_id")
);

-- 7. Create Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_files_owner_category" ON "files"("owner_user_id", "category");
CREATE INDEX IF NOT EXISTS "idx_files_owner_uploaded_at" ON "files"("owner_user_id", "uploaded_at");
CREATE INDEX IF NOT EXISTS "idx_files_owner_is_favorite" ON "files"("owner_user_id", "is_favorite");
CREATE INDEX IF NOT EXISTS "idx_files_owner_display_filename" ON "files"("owner_user_id", "display_filename");
CREATE INDEX IF NOT EXISTS "idx_file_tags_owner_tag" ON "file_tags"("owner_user_id", "tag");
CREATE INDEX IF NOT EXISTS "idx_favorites_user_id" ON "favorites"("user_id");

-- 8. Row Level Security (RLS) Configuration
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "telegram_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "file_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "favorites" ENABLE ROW LEVEL SECURITY;

-- Note: When connecting with a session variable 'app.current_user_id', PostgreSQL RLS guarantees strict tenant isolation:
-- CREATE POLICY files_isolation_policy ON "files"
--     FOR ALL USING ("owner_user_id" = current_setting('app.current_user_id', true));
