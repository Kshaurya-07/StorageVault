# StorageVault

A multi-user cloud storage platform that stores files in each user's own Telegram Saved Messages, using Telegram's MTProto API.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Telegram Configuration](#telegram-configuration)
- [Uploads](#uploads)
- [AI Search](#ai-search)
- [API Reference](#api-reference)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Overview

StorageVault is designed to give each user a private cloud drive without routing all users' files through a single shared bot or group chat. Each user connects their own Telegram account, and files are stored in that account's private Saved Messages conversation.

Key design principles described in the original README:

1. **Personal storage:** Each user's files live in their own Telegram account, not in a shared account.
2. **Tenant isolation:** File queries, searches, downloads, and tag lookups are scoped by owner, so one user cannot access another user's files.
3. **Streaming uploads:** Uploads are streamed to Telegram rather than kept permanently on the application server's disk.
4. **Resumable uploads:** Large files can be split into chunks and resumed.
5. **Encrypted sessions:** Telegram session data is encrypted at rest using AES-256-GCM, as described in the original README.
6. **Search without profiling:** Natural-language queries are translated into database filters, rather than used for model training or conversational profiling, as described in the original README.

Storage limits and behaviour ultimately depend on Telegram's own API and account limits, so "unlimited" should not be read as a guarantee independent of those limits.

## Features

StorageVault includes workspaces for browsing, searching, and managing files, including:

- Landing page, sign-in, registration, and password reset
- Dashboard with storage metrics and recent uploads
- Telegram connection wizard
- File explorer with grid and list views, search, sorting, tags, and bulk actions
- Filtered views for documents, images, videos, audio, and archives
- Favorites and recent uploads
- AI-assisted natural-language search
- Storage analytics
- Account settings, including Telegram session management and account deletion
- A privacy page describing the security model

The interface uses a monochrome black-and-white theme with HTML5 canvas visual elements, as described in the original README.

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.6 |
| Database and ORM | PostgreSQL and Prisma ORM 5.22; SQLite supported for development and tests |
| Telegram protocol | GramJS / Telegram API |
| Streaming parser | Busboy |
| Styling | Tailwind CSS 3.4 |
| Icons | Lucide React |
| Security | Node.js `crypto` (AES-256-GCM), `bcryptjs`, `jose` (JWT) |
| Email | Nodemailer, for password resets |
| Testing | Jest 29, ts-jest |

## Project Structure

The repository follows a Next.js application layout with API routes, components (including 3D canvas components described in the original README), database schema files, and tests. Refer to the repository itself for the complete, current file layout.

## Getting Started

### Prerequisites

- Node.js 20 or later
- PostgreSQL for production, or SQLite for local testing
- Telegram API credentials from my.telegram.org

### Installation

```bash
git clone https://github.com/Kshaurya-07/StorageVault.git
cd StorageVault
npm install
cp .env.example .env
```

### Database setup

For local development with SQLite:

```bash
npx prisma db push --schema=prisma/schema.sqlite.prisma
```

For PostgreSQL:

```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### Run tests and start the server

```bash
npm test
npm run dev
```

Open http://localhost:3000 in your browser, as described in the original README.

## Telegram Configuration

StorageVault supports two modes, controlled by `TELEGRAM_MODE`:

### Mock mode

Set `TELEGRAM_MODE="mock"` for local development and demonstrations. This mode simulates verification codes, 2FA, uploads, downloads, and deletions in memory, without a real Telegram account.

### Real MTProto mode

Set `TELEGRAM_MODE="real"` and provide your own Telegram API credentials:

1. Log in to my.telegram.org with your Telegram phone number.
2. Open **API development tools** and create an app.
3. Copy your numerical `api_id` and hexadecimal `api_hash`.
4. Set `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` in `.env`.
5. Restart the server and complete the 3-step authorization flow at `/connect-telegram`.

## Uploads

- Files up to 2 GB are described as streaming directly through the upload endpoint.
- Files larger than 2 GB, up to 50 GB as described in the original README, are split in the browser into 512 MB chunks and uploaded through the chunk endpoints.
- Uploads use a concurrent queue, and a deterministic fingerprint based on file name, size, and last-modified time is used to resume missing chunks.
- During download, chunks are streamed sequentially from Telegram and reassembled on demand, as described in the original README.

## AI Search

The AI search feature translates plain-language queries into database filters. Examples from the original README include finding documents by keyword, filtering PDFs by date, and filtering by file size or category.

Security properties described in the original README include:

- No model training on user queries or file metadata
- Stateless, ephemeral requests
- Ownership filters applied before results are returned

## API Reference

### Authentication

- `POST /api/auth/register` — Create an account
- `POST /api/auth/login` — Sign in and obtain a session cookie
- `POST /api/auth/logout` — Invalidate the session
- `GET /api/auth/me` — Retrieve the active user identity and Telegram status
- `POST /api/auth/change-password` — Change password
- `POST /api/auth/forgot-password` — Request or complete a password reset
- `DELETE /api/auth/delete-account` — Delete the account, metadata, and sessions

### Telegram

- `GET /api/telegram/status` — MTProto connection status
- `POST /api/telegram/send-code` — Send a login verification code
- `POST /api/telegram/verify-code` — Verify the code
- `POST /api/telegram/verify-2fa` — Submit a cloud 2FA password
- `POST /api/telegram/disconnect` — Disconnect the MTProto session

### Files

- `GET /api/files` — List files with pagination, search, filtering, and sorting
- `POST /api/files` — Upload a file
- `GET /api/files/[id]` — Retrieve file metadata
- `PATCH /api/files/[id]` — Rename a file or toggle favorite status
- `DELETE /api/files/[id]` — Delete a file
- `GET /api/files/[id]/download` — Stream a file download
- `POST /api/files/[id]/tags` — Add or remove tags

### Chunked uploads, search, and analytics

- `POST /api/files/chunks/init`, `POST /api/files/chunks`, `GET /api/files/chunks/status`, `POST /api/files/chunks/complete`, `POST /api/files/chunks/cancel`
- `POST /api/ai/search` — Natural-language search
- `GET /api/analytics` — Storage metrics by category and timeline

## Security

| Area | Specification, as described in the original README |
| --- | --- |
| Session cookies | HttpOnly, SameSite=Lax, Secure in production, HS256 JWT |
| Passwords | Salted bcrypt hashes |
| Telegram sessions | AES-256-GCM encryption with random IVs at rest |
| Tenant isolation | Server-side owner filtering on queries |
| File storage | Ephemeral memory streams; no permanent server disk copies described |
| Content handling | Inline previews restricted to verified image, audio, and video types; `X-Content-Type-Options: nosniff` |
| Clickjacking | `X-Frame-Options: DENY` |
| Rate limiting | Sliding-window throttles on sensitive endpoints |

## Testing

The original README describes a Jest test suite covering chunked uploads, streaming uploads, tenant isolation, authentication, mailer behaviour, Telegram flows, cryptography, and AI search parsing. It states 8 test suites and 50 tests; those counts are as described in the original README and were not independently re-run for this rewrite.

```bash
npm test
```

## Deployment

### Render

Deploy as a Node web service, connecting this repository and setting the production environment variables below. The original README lists:

- Build command: `npm install && npx prisma generate --schema=prisma/schema.prisma && npm run build`
- Start command: `npm start`

### Docker

The original README includes a multi-stage Dockerfile that builds the Next.js application and runs it with Node 20 Alpine. Refer to that Dockerfile in the repository for the current, complete version.

## Environment Variables

| Variable | Description |
| --- | --- |
| `PORT` | HTTP server port, for example `3000` |
| `NEXT_PUBLIC_APP_URL` | Public URL for reset links, required in production |
| `DATABASE_URL` | PostgreSQL or SQLite database URI |
| `JWT_SECRET` | Secret for signing session JWTs, at least 32 characters |
| `ENCRYPTION_KEY` | 64 hexadecimal characters for AES-256-GCM |
| `TELEGRAM_MODE` | `"real"` or `"mock"` |
| `TELEGRAM_API_ID` | Telegram numerical API ID |
| `TELEGRAM_API_HASH` | Telegram hexadecimal API hash |
| `AI_PROVIDER` | Optional: `"local"`, `"gemini"`, or `"openai"` |
| `GEMINI_API_KEY` | Optional, for Gemini |
| `OPENAI_API_KEY` | Optional, for OpenAI |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Optional SMTP settings for password resets |

Replace all placeholder values with your own secrets. Do not commit real secrets to the repository.

## Contributing

Issues and pull requests are welcome. Please avoid committing secrets, real credentials, or example keys, and keep security-related changes focused and well tested.

## License

This project is licensed under the MIT License. See the LICENSE file in the repository for details.

## Author

Kumar Shaurya — https://github.com/Kshaurya-07
