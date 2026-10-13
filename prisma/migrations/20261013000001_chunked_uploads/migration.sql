-- Chunked large-file uploads: files bigger than Telegram's 2GB single-file
-- limit are split into fixed-size chunks, each stored as its own Telegram
-- Saved Messages document, then reassembled on download.

DO $$ BEGIN
    CREATE TYPE "ChunkUploadStatus" AS ENUM ('UPLOADING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "is_chunked" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "chunked_uploads" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "total_size" BIGINT NOT NULL,
    "chunk_size" INTEGER NOT NULL,
    "total_chunks" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" "ChunkUploadStatus" NOT NULL DEFAULT 'UPLOADING',
    "file_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chunked_uploads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "file_chunks" (
    "id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "telegram_message_id" INTEGER NOT NULL,
    "telegram_file_reference" TEXT,
    "size" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "file_chunks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "chunked_uploads_file_id_key" ON "chunked_uploads"("file_id");
CREATE INDEX IF NOT EXISTS "chunked_uploads_owner_user_id_status_idx" ON "chunked_uploads"("owner_user_id", "status");
CREATE INDEX IF NOT EXISTS "chunked_uploads_owner_user_id_fingerprint_idx" ON "chunked_uploads"("owner_user_id", "fingerprint");
CREATE UNIQUE INDEX IF NOT EXISTS "file_chunks_upload_id_chunk_index_key" ON "file_chunks"("upload_id", "chunk_index");
CREATE INDEX IF NOT EXISTS "file_chunks_upload_id_idx" ON "file_chunks"("upload_id");

DO $$ BEGIN
    ALTER TABLE "chunked_uploads" ADD CONSTRAINT "chunked_uploads_owner_user_id_fkey"
        FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "chunked_uploads" ADD CONSTRAINT "chunked_uploads_file_id_fkey"
        FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "file_chunks" ADD CONSTRAINT "file_chunks_upload_id_fkey"
        FOREIGN KEY ("upload_id") REFERENCES "chunked_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
