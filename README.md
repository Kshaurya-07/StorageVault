# StorageVault

> **Premium, multi-user, zero-knowledge sovereign cloud storage platform powered by your personal Telegram Saved Messages.**

[![Tests](https://img.shields.io/badge/Tests-50%20Passed%20(8%20Suites)-white?style=for-the-badge&logo=jest&logoColor=black&labelColor=262626)](#-testing-coverage)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-white?style=for-the-badge&logo=typescript&logoColor=black&labelColor=262626)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-white?style=for-the-badge&logo=nextdotjs&logoColor=black&labelColor=262626)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-white?style=for-the-badge&logo=prisma&logoColor=black&labelColor=262626)](https://www.prisma.io/)
[![Telegram](https://img.shields.io/badge/Telegram-MTProto-white?style=for-the-badge&logo=telegram&logoColor=black&labelColor=262626)](https://core.telegram.org/api)
[![Design](https://img.shields.io/badge/Theme-Monochrome%20B%26W-white?style=for-the-badge&labelColor=262626)](#-premium-monochrome-design--3d-canvas-engine)

---

## 📑 Table of Contents

- [Overview](#-overview)
  - [Core Principles](#core-principles)
  - [Why StorageVault?](#why-storagevault)
- [System Architecture](#️-system-architecture)
- [Features & Pages](#-features--pages)
- [Tech Stack](#-tech-stack)
- [Interactive 3D Canvas Engine](#-interactive-3d-canvas-engine)
- [Prerequisites](#-prerequisites)
- [Quick Start (Local Development)](#-quick-start-local-development)
- [Telegram MTProto Configuration](#-telegram-mtproto-configuration)
- [Chunked & Resumable Uploads](#-chunked--resumable-uploads)
- [Privacy-Strict AI Search](#-privacy-strict-ai-search)
- [API Reference](#-api-reference)
- [Security & Cryptography](#-security--cryptography)
- [Testing Coverage](#-testing-coverage)
- [Production Deployment](#-production-deployment)
  - [Render Deployment](#render-deployment)
  - [Docker / Container Deployment](#docker--container-deployment)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## 📖 Overview

**StorageVault** turns every user's personal Telegram account into an unlimited, sovereign private cloud drive.

Traditional cloud storage platforms enforce restrictive storage limits, upsell costly recurring tiers, and maintain full access to your stored documents. Meanwhile, simplistic Telegram bot services channel all users' private files through a single shared bot or group chat—destroying privacy and exposing data.

**StorageVault eliminates these flaws by connecting directly to each user's personal Telegram account via MTProto and storing files strictly within their private "Saved Messages" dialogue (`InputPeerSelf`).**

```
┌──────────────┐     ┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│    User A    │ ──> │ StorageVault Tenant A │ ──> │ Telegram Account A    │ ──> │ Saved Messages (Self) │
└──────────────┘     └───────────────────────┘     └───────────────────────┘     └───────────────────────┘
┌──────────────┐     ┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│    User B    │ ──> │ StorageVault Tenant B │ ──> │ Telegram Account B    │ ──> │ Saved Messages (Self) │
└──────────────┘     └───────────────────────┘     └───────────────────────┘     └───────────────────────┘
```

### Core Principles

1. **Personal Saved Messages Sovereign Storage**: Every user connects their own Telegram account. Files live exclusively in their personal chat.
2. **Zero Host Disk Persistence**: File uploads stream on-the-fly directly to Telegram MTProto servers and are immediately released from memory upon dispatch. The backend never keeps copies of your files on disk.
3. **Cryptographic Multi-Tenant Partitioning**: All queries, searches, downloads, and tag lookups enforce strict `ownerUserId` foreign-key scoping. User A can never discover, stream, or delete User B's files.
4. **Resumable Parallel Chunked Uploads**: Files up to 2GB stream directly; files larger than 2GB (up to 50GB) are automatically partitioned into 512MB chunks, uploaded across a concurrency pool, and reassembled on-demand.
5. **Zero-Retention Natural Language AI Search**: Queries like *"Find my Java notes"* or *"Show PDFs uploaded last week"* are ephemerally translated into deterministic database filters without model training or conversational profiling.
6. **AES-256-GCM Session Encryption at Rest**: Telegram authorization session strings are sealed using authenticated AES-256-GCM encryption with unique initialization vectors (IVs) and authentication tags.
7. **Monochrome Black & White Aesthetic**: Clean, distraction-free, futuristic black-and-white theme (`#000000`, `#0A0A0A`, `#171717`, `#262626`, `#FFFFFF`) with interactive HTML5 3D canvas visualizers.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Browser (React / Next.js 14)"]
        UI["StorageVault Interface (Monochrome)"]
        Uploader["Chunked & Parallel Uploader (XHR / Blob.slice)"]
        Visualizer3D["Interactive 3D Canvas Engine"]
    end

    subgraph Server["Next.js App Server"]
        Auth["JWT Session Auth (HttpOnly SameSite=Lax)"]
        RateLimit["Memory Sliding-Window Rate Limiter"]
        BusboyParser["Busboy Streaming Multipart Parser"]
        ChunkManager["Chunk Assembler & Stale Sweeper"]
        Crypto["AES-256-GCM Session Cipher"]
        AISearch["Deterministic AI Search Engine"]
        MTProto["MTProto Client Layer (GramJS / TDLib)"]
    end

    subgraph Database["Database Layer"]
        PG["PostgreSQL / SQLite Metadata Store"]
        FileModel["Files & Chunks Index"]
        UserModel["Users & Salted Password Hashes"]
        ConnModel["Encrypted MTProto Sessions"]
    end

    subgraph Telegram["Telegram Global Infrastructure"]
        SavedA["User A: Saved Messages (InputPeerSelf)"]
        SavedB["User B: Saved Messages (InputPeerSelf)"]
    end

    UI -->|HTTPS / Encrypted Cookies| Auth
    Auth --> RateLimit
    RateLimit --> BusboyParser
    BusboyParser --> MTProto
    Uploader --> ChunkManager
    ChunkManager --> MTProto
    Auth --> Crypto
    Crypto --> MTProto
    AISearch --> PG
    Server --> PG
    MTProto -->|Direct In-Flight Stream| SavedA
    MTProto -->|Direct In-Flight Stream| SavedB
```

---

## 🚀 Features & Pages

StorageVault provides 18 dedicated pages and workspaces:

| Route | Page | Description |
|---|---|---|
| `/` | **Landing Page** | Feature breakdown, 6-step workflow, trust metrics, and 3D vault core animation. |
| `/login` | **Sign In** | Secure authentication with salted bcrypt hashes and HttpOnly JWT cookies. |
| `/register` | **Account Creation** | Registration with instant multi-tenant database partition provisioning. |
| `/forgot-password` | **Password Reset** | Cryptographically signed, 15-minute single-use reset links with optional SMTP delivery. |
| `/dashboard` | **Main Dashboard** | Storage KPI metrics, isometric volume matrix, category cards, and recent uploads. |
| `/connect-telegram` | **Connect Telegram** | 3-step interactive MTProto wizard (Phone Number → Confirmation Code → Cloud 2FA Password). |
| `/files` | **All Files Explorer** | Grid/List views, search filters, sorting by size/date/name, tags, and bulk actions. |
| `/files/documents` | **Documents** | Filtered view for PDF, DOCX, TXT, XLSX, PPTX, MD, SQL, code files. |
| `/files/images` | **Images** | Filtered view for PNG, JPG, WEBP, SVG, GIF, BMP, TIFF, HEIC. |
| `/files/videos` | **Videos** | Filtered view for MP4, MOV, MKV, WebM, AVI. |
| `/files/audio` | **Audio** | Filtered view for MP3, WAV, OGG, FLAC, M4A with inline previews. |
| `/files/archives` | **Archives** | Filtered view for ZIP, RAR, 7Z, TAR, GZ, BZ2, ISO. |
| `/favorites` | **Favorites** | Starred files workspace for rapid access. |
| `/recent` | **Recent Uploads** | Files uploaded within the past 7 days. |
| `/ai-search` | **AI Search Assistant** | Plain-English natural language query interface with suggested query chips. |
| `/analytics` | **Storage Analytics** | Category distribution bars, file size distribution, and upload activity timelines. |
| `/settings` | **Account Settings** | Profile identity, password change, MTProto session management, and account deletion. |
| `/privacy` | **Privacy Architecture** | Zero-knowledge specifications and security pillar verifications. |

---

## 💻 Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript 5.6](https://www.typescriptlang.org/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM 5.22](https://www.prisma.io/) *(SQLite supported for dev/tests)*
- **MTProto Protocol**: [GramJS](https://gram.js.org/) / Telegram API v2
- **Streaming Parser**: [Busboy](https://github.com/mscdex/busboy)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) (Custom Monochrome Palette)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Security & Ciphers**: Native Node.js `crypto` (AES-256-GCM), `bcryptjs`, and `jose` (HS256 JWT)
- **Email Delivery**: [Nodemailer](https://nodemailer.com/) (Password resets with dev console fallback)
- **Automated Testing**: [Jest 29](https://jestjs.io/) & [ts-jest](https://kulshekhar.github.io/ts-jest/)

---

## 🎨 Interactive 3D Canvas Engine

StorageVault features an in-house **HTML5 Canvas 3D rendering engine** that requires no heavy external 3D libraries (such as Three.js), ensuring zero bundle bloat and 60 FPS performance:

- **Vault3DCore** (`src/components/3d/Vault3DCore.tsx`): Isometric rotating wireframe cube with orbit rings, data nodes, and subtle particle glows.
- **NodeMesh3D** (`src/components/3d/NodeMesh3D.tsx`): Neural discovery orb for the AI Search engine with pulsing network vertices.
- **DataPillar3D** (`src/components/3d/DataPillar3D.tsx`): Isometric storage capacity pillars visualizer for analytics.
- **Shield3DVault** (`src/components/3d/Shield3DVault.tsx`): Cryptographic shield with rotating rings for security and privacy pages.
- **Bridge3DConduit** (`src/components/3d/Bridge3DConduit.tsx`): Interactive MTProto protocol pipeline visualizer with live connection particle flow.
- **VaultEmblem3D** (`src/components/3d/VaultEmblem3D.tsx`): Brand emblem with depth-shaded isometric geometry.

All canvas visualizers strictly use pure monochrome rgba tints (`rgba(255, 255, 255, ...)` and `rgba(10, 10, 10, ...)`).

---

## 🛠️ Prerequisites

- **Node.js**: `v20.x` or later (tested on `Node.js v24.21.0`).
- **Database**: PostgreSQL (for production) or SQLite (for local testing).
- **Telegram API Credentials**: An `API_ID` and `API_HASH` from [my.telegram.org](https://my.telegram.org).

---

## ⚡ Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/Kshaurya-07/StorageVault.git
cd StorageVault
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create your local `.env` file from the example:
```bash
cp .env.example .env
```

Minimal local development configuration in `.env`:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="storagevault-super-secret-jwt-key-replace-in-production-min-32-chars!"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
TELEGRAM_MODE="mock"
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH="your_32_character_telegram_api_hash"
AI_PROVIDER="local"
```

### 4. Initialize the Database
For local development using SQLite:
```bash
npx prisma db push --schema=prisma/schema.sqlite.prisma
```

For PostgreSQL:
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### 5. Run Automated Tests
```bash
npm test
```
*Expected: 8 test suites passed, 50 unit and integration tests passed.*

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Telegram MTProto Configuration

StorageVault supports two operational modes controlled by the `TELEGRAM_MODE` environment variable:

### Mode 1: Mock Mode (`TELEGRAM_MODE="mock"`)
- Requires no Telegram account.
- Simulates SMS codes, 2FA verification, upload streams, downloads, and deletions in memory.
- Perfect for local feature development, automated CI pipelines, and demonstrations.

### Mode 2: Real MTProto Mode (`TELEGRAM_MODE="real"`)
To connect real Telegram accounts:
1. Log in to [my.telegram.org](https://my.telegram.org) using your Telegram phone number.
2. Select **API development tools**.
3. Create a new app (e.g., App Title: `StorageVault`, Short Name: `storagevault`).
4. Copy your numerical **App api_id** and hexadecimal **App api_hash**.
5. Update your `.env`:
   ```env
   TELEGRAM_MODE="real"
   TELEGRAM_API_ID=12345678
   TELEGRAM_API_HASH="23b5f9775a3522f2bd9a09d088445909"
   ```
6. Restart your server. Navigate to `/connect-telegram` and complete the 3-step authorization flow.

---

## 📦 Chunked & Resumable Uploads

StorageVault features an enterprise-grade chunked file transfer engine:

- **Direct Uploads (`<= 2GB`)**: Files at or below Telegram's single-file limit stream straight through `POST /api/files` with real-time XHR progress.
- **Chunked Splitting (`> 2GB up to 50GB`)**: Files larger than 2GB are partitioned in the browser into 512MB chunks via `Blob.slice()` and dispatched through `/api/files/chunks/*`.
- **Global Concurrency Pool**: Uploads are managed through a concurrent queue (concurrency limit: 3) so multi-file uploads execute smoothly without saturating network connections.
- **Client-Side Resume**: Upload sessions compute a deterministic fingerprint (`name|size|lastModified`). If an upload is paused or disconnected, re-uploading the file queries `/api/files/chunks/status` and resumes only the missing chunks.
- **Server-Side Reassembly**: During download, chunks are streamed sequentially from Telegram and concatenated on-the-fly without buffering the entire file into server RAM.

---

## 🤖 Privacy-Strict AI Search

StorageVault's AI Assistant parses natural human inquiries into deterministic database predicates without retaining personal profiles or training machine learning models:

### Example Supported Queries
- `"Find my Java notes"` &rarr; Category: `DOCUMENT`, Keywords: `["java", "notes"]`
- `"Show PDFs uploaded last week"` &rarr; Category: `DOCUMENT`, Extension: `pdf`, Date: `last 7 days`
- `"Find my Navratri posters"` &rarr; Category: `IMAGE`, Keywords: `["navratri", "poster"]`
- `"Show videos larger than 100 MB"` &rarr; Category: `VIDEO`, Size: `> 104,857,600 bytes`
- `"Show files < 10mb uploaded yesterday"` &rarr; Size: `< 10,485,760 bytes`, Date: `yesterday`

### AI Security Guarantees
- **No Model Training**: User queries and file metadata are never used for model training or fine-tuning.
- **Zero Cross-Session Memory**: Requests are completely stateless and ephemeral.
- **Pre-Execution Isolation**: Ownership filters (`ownerUserId === session.userId`) are applied at the database level before any AI results are returned.

---

## 📡 API Reference

### Authentication Endpoints
- `POST /api/auth/register` — Create a new user account.
- `POST /api/auth/login` — Sign in and obtain HttpOnly session cookie.
- `POST /api/auth/logout` — Invalidate session and clear auth cookies.
- `GET /api/auth/me` — Retrieve active user identity and Telegram status.
- `POST /api/auth/change-password` — Change password and invalidate existing sessions.
- `POST /api/auth/forgot-password` — Request password reset token or execute password reset.
- `DELETE /api/auth/delete-account` — Permanently purge account, metadata, and sessions.

### Telegram Endpoints
- `GET /api/telegram/status` — Get MTProto connection status.
- `POST /api/telegram/send-code` — Send official Telegram login verification code.
- `POST /api/telegram/verify-code` — Verify Telegram SMS/app confirmation code.
- `POST /api/telegram/verify-2fa` — Submit Telegram cloud 2FA password.
- `POST /api/telegram/disconnect` — Disconnect MTProto session and revoke token.

### File Operations
- `GET /api/files` — List files with pagination, search, category filter, and sorting.
- `POST /api/files` — Stream file upload directly into Telegram Saved Messages.
- `GET /api/files/[id]` — Retrieve individual file metadata.
- `PATCH /api/files/[id]` — Rename file or toggle favorite status.
- `DELETE /api/files/[id]` — Delete file from database and Telegram Saved Messages.
- `GET /api/files/[id]/download` — Securely stream file download from Telegram.
- `POST /api/files/[id]/tags` — Add or remove metadata tags.

### Chunked Upload Operations
- `POST /api/files/chunks/init` — Initialize a chunked upload session.
- `POST /api/files/chunks` — Upload a single 512MB chunk.
- `GET /api/files/chunks/status` — Check which chunks have been received for resume.
- `POST /api/files/chunks/complete` — Validate all chunks and finalize file.
- `POST /api/files/chunks/cancel` — Abort upload session and clean up temporary parts.

### Intelligence & Metrics
- `POST /api/ai/search` — Execute natural language search query.
- `GET /api/analytics` — Aggregate storage metrics by category and timeline.

---

## 🔒 Security & Cryptography

| Security Domain | Specification |
|---|---|
| **Session Cookies** | `HttpOnly`, `SameSite=Lax`, `Secure` (production), signed with HS256 JWT |
| **Passwords** | Salted bcrypt hashes with 10 salt rounds |
| **Telegram MTProto Sessions** | Authenticated AES-256-GCM cipher with random 12-byte IVs at rest |
| **Multi-Tenant Isolation** | All queries enforce strict server-side `ownerUserId` filtering |
| **File Storage** | Ephemeral memory streams; zero permanent server disk footprint |
| **XSS & Content Sniffing** | Inline previews restricted to verified image/audio/video types; `X-Content-Type-Options: nosniff` |
| **Clickjacking Defense** | `X-Frame-Options: DENY` on all responses |
| **Rate Limiting** | Sliding-window IP and account throttles on sensitive endpoints |

---

## 🧪 Testing Coverage

StorageVault includes a Jest test suite across 8 dedicated test suites:

```bash
npm test
```

### Test Suites:
1. `tests/chunkedUpload.test.ts`: Chunk initialization validation, chunk size verification, chunk reassembly, and stale sweep tests.
2. `tests/streamingUpload.test.ts`: Streaming multipart form parsing, temp file lifecycle, and cleanup tests.
3. `tests/isolation.test.ts`: Strict cross-tenant isolation ensuring User A cannot read, query, or delete User B files.
4. `tests/auth.test.ts`: Bcrypt hashing, JWT token signing, verification, and expiration handling.
5. `tests/mailer.test.ts`: Password reset URL generation, SMTP configuration detection, and email template dispatch.
6. `tests/telegram.test.ts`: MTProto code dispatch, session sign-in, 2FA challenge, file upload, download, and deletion.
7. `tests/crypto.test.ts`: AES-256-GCM authenticated encryption, random IV variance, and tamper detection.
8. `tests/ai-search.test.ts`: Natural language query parsing across date, size, category, and keyword filters.

---

## 🚢 Production Deployment

### Render Deployment

To deploy StorageVault as a Web Service on [Render](https://render.com/):

1. **Create a New Web Service** and connect your GitHub repository (`StorageVault`).
2. **Environment**: `Node`
3. **Build Command**:
   ```bash
   npm install && npx prisma generate --schema=prisma/schema.prisma && npm run build
   ```
4. **Start Command**:
   ```bash
   npm start
   ```
5. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = Your production PostgreSQL connection string
   - `JWT_SECRET` = A strong secret string (min 32 characters)
   - `ENCRYPTION_KEY` = 64 random hexadecimal characters
   - `TELEGRAM_MODE` = `real`
   - `TELEGRAM_API_ID` = Your Telegram API ID
   - `TELEGRAM_API_HASH` = Your Telegram API Hash
   - `NEXT_PUBLIC_APP_URL` = Your production URL (e.g., `https://storagevault.onrender.com`)

### Docker / Container Deployment

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]
```

---

## ⚙️ Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | Optional | Port for the HTTP server | `3000` |
| `NEXT_PUBLIC_APP_URL` | Required (Prod) | Public URL for reset links | `https://storagevault.onrender.com` |
| `DATABASE_URL` | Required | PostgreSQL or SQLite database URI | `postgresql://user:pass@host:5432/storagevault?schema=public` |
| `JWT_SECRET` | Required | Secret for signing session JWTs (min 32 chars) | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Required | 64 hex characters (32 bytes) for AES-256-GCM | `openssl rand -hex 32` |
| `TELEGRAM_MODE` | Required | Operational mode: `"real"` or `"mock"` | `"real"` |
| `TELEGRAM_API_ID` | Optional in mock | Telegram numerical API ID | `12345678` |
| `TELEGRAM_API_HASH` | Optional in mock | Telegram hex API hash | `23b5f9775a3522f2bd9a09d088445909` |
| `AI_PROVIDER` | Optional | AI mode: `"local"`, `"gemini"`, `"openai"` | `"local"` |
| `GEMINI_API_KEY` | Optional | Google Gemini API key | `AIzaSy...` |
| `OPENAI_API_KEY` | Optional | OpenAI API key | `sk-...` |
| `SMTP_HOST` | Optional | SMTP host for password resets | `smtp.gmail.com` |
| `SMTP_PORT` | Optional | SMTP port | `587` |
| `SMTP_USER` | Optional | SMTP username | `user@example.com` |
| `SMTP_PASS` | Optional | SMTP password / app password | `app-specific-password` |
| `SMTP_FROM` | Optional | From address in sent emails | `StorageVault <no-reply@example.com>` |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for sovereign, privacy-first personal cloud storage.