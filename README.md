# VAULT AI

> **Premium, multi-user, zero-knowledge cloud storage platform powered by your own Telegram account's Saved Messages.**

[![Tests](https://img.shields.io/badge/Tests-23%20Passed-emerald.svg)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-teal.svg)](https://www.prisma.io/)
[![Telegram](https://img.shields.io/badge/Telegram-MTProto-sky.svg)](https://core.telegram.org/api)

---

## 📖 Overview

**VAULT AI** turns every user's personal Telegram account into an unlimited, private cloud drive. Unlike legacy storage providers that enforce strict storage limits and charge expensive monthly subscriptions, or insecure bot apps that dump all users' files into a shared channel, **VAULT AI connects to each user's personal Telegram account and operates solely within their private "Saved Messages" dialogue**.

```
USER A -> VAULT Account A -> Telegram Account A -> Saved Messages A -> User A's files
USER B -> VAULT Account B -> Telegram Account B -> Saved Messages B -> User B's files
```

### Core Value Propositions
- **Personal Saved Messages**: Every user authenticates their own Telegram account via MTProto.
- **Zero Permanent Disk Footprint**: Files stream directly into your Telegram account during upload and stream back on download. The backend never keeps permanent copies of your files.
- **Strict Tenant Isolation**: User A can never access, query, download, or delete User B's files.
- **Zero-Memory AI Search**: Natural language search ("Find my Java notes", "Show videos > 100MB") with zero cross-session memory, zero persistent profiling, and zero model training on user files.
- **AES-256-GCM Session Encryption**: Telegram MTProto session strings are encrypted at rest with authenticated tags and random IVs.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Browser (React / Next.js)"]
        UI["VAULT AI Web Interface"]
    end

    subgraph Server["Next.js App Server"]
        Auth["JWT Session Auth (HttpOnly Cookie)"]
        Crypto["AES-256-GCM Session Encryption"]
        AISearch["AI Deterministic & Semantic Search"]
        MTProto["MTProto Client Layer (GramJS / TDLib)"]
    end

    subgraph DB["Database"]
        PG["PostgreSQL / SQLite Metadata Store"]
    end

    subgraph Telegram["Telegram Global Infrastructure"]
        SavedA["User A: Saved Messages (InputPeerSelf)"]
        SavedB["User B: Saved Messages (InputPeerSelf)"]
    end

    UI -->|HTTPS / Secure Cookies| Auth
    Auth --> Crypto
    Crypto --> MTProto
    Server -->|Metadata Only| PG
    MTProto -->|Stream Upload / Download| SavedA
    MTProto -->|Stream Upload / Download| SavedB
```

---

## 🚀 Features & Pages

VAULT AI provides a complete suite of 18 dedicated pages and tools:

1. **Landing Page (`/`)**: Value proposition, architecture breakdown, and interactive onboarding flow.
2. **Register (`/register`)**: New account creation with password hashing and session tokens.
3. **Login (`/login`)**: Secure authentication with HttpOnly cookies.
4. **Forgot Password (`/forgot-password`)**: Account password reset flow.
5. **Main Dashboard (`/dashboard`)**: Storage KPI metrics, recent activity, and quick actions.
6. **Connect Telegram (`/connect-telegram`)**: 3-step interactive MTProto connection wizard (Phone Number → SMS/App Code → Cloud 2FA Password).
7. **All Files (`/files`)**: Full file explorer with Grid/List view toggle, in-page search, and sorting.
8. **Documents (`/files/documents`)**: Category filter for PDF, DOCX, TXT, XLSX, PPTX, etc.
9. **Images (`/files/images`)**: Category filter for PNG, JPG, WEBP, SVG, GIF, etc.
10. **Videos (`/files/videos`)**: Category filter for MP4, MOV, MKV, WebM, etc.
11. **Audio (`/files/audio`)**: Category filter for MP3, WAV, FLAC, M4A with inline audio player.
12. **Archives (`/files/archives`)**: Category filter for ZIP, RAR, 7Z, TAR, GZ, etc.
13. **Favorites (`/favorites`)**: Starred and quick-access files.
14. **Recent Uploads (`/recent`)**: Files uploaded in the last 7 days.
15. **AI Search Assistant (`/ai-search`)**: Privacy-strict natural language query engine.
16. **Storage Analytics (`/analytics`)**: File count and size distributions by category and upload timeline.
17. **Account Settings (`/settings`)**: Profile info, password update, Telegram session management, and permanent account deletion.
18. **Privacy & Security (`/privacy`)**: Detailed architecture guarantees and zero-knowledge verification.

---

## 🛠️ Prerequisites

- **Node.js**: `v20.x` or later (tested on `v24.21.0`).
- **Database**: PostgreSQL (production) or SQLite (local development and automated testing).
- **Telegram API Credentials**: An `API_ID` and `API_HASH` from [my.telegram.org](https://my.telegram.org).

---

## ⚡ Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/Kshaurya-07/StorageVault.git
cd StorageVault
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default local `.env` configuration:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="vault-ai-super-secret-jwt-key-replace-in-production-min-32-chars!"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
TELEGRAM_MODE="mock"
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH="demo_telegram_api_hash_for_vault_ai"
AI_PROVIDER="local"
```

### 3. Initialize Database
Initialize the local database:
```bash
npx prisma db push --schema=prisma/schema.sqlite.prisma
```

For production PostgreSQL databases, run:
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### 4. Run Automated Tests
Execute the comprehensive test suite:
```bash
npm test
```
Result: 5 test suites, 23 tests passed.

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Telegram MTProto Configuration

To connect live Telegram accounts rather than the mock adapter:

1. Log in to [my.telegram.org](https://my.telegram.org) with your Telegram phone number.
2. Select **API development tools**.
3. Create a new application (e.g. app name: `VAULT AI`).
4. Copy your `api_id` (integer) and `api_hash` (string).
5. Update your `.env`:
   ```env
   TELEGRAM_MODE="real"
   TELEGRAM_API_ID=12345678
   TELEGRAM_API_HASH="your_32_character_api_hash"
   ```
6. Restart the server. Users can now enter their real phone numbers on `/connect-telegram` to receive official Telegram confirmation codes.

---

## 🤖 Privacy-Strict AI Search

VAULT AI's AI Assistant parses natural language queries into exact database and semantic filters without retaining personal memories:

### Example Supported Queries:
- `"Find my Java notes"` → Category: `DOCUMENT`, Keywords: `["java", "notes"]`
- `"Show PDFs uploaded last week"` → Category: `DOCUMENT`, Ext: `pdf`, Date: `last 7 days`
- `"Find my Navratri posters"` → Category: `IMAGE`, Keyword: `["navratri", "poster"]`
- `"Show videos larger than 100 MB"` → Category: `VIDEO`, Size: `> 104,857,600 bytes`
- `"Show files < 10mb uploaded yesterday"` → Size: `< 10,485,760 bytes`, Date: `yesterday`

### AI Privacy Guarantees:
- **No Training**: Neither files nor search queries are ever used for model training.
- **Zero Memory**: Sessions do not persist conversational context across requests.
- **Pre-Query Filtering**: Ownership checks (`ownerUserId === session.userId`) are applied **before** any AI processing.

---

## 🔒 Security Architecture

| Security Domain | Implementation |
|---|---|
| **Session Cookies** | `HttpOnly`, `SameSite=Lax`, `Secure` (production), signed with HS256 JWT |
| **Passwords** | Salted bcrypt hashes (10 rounds) |
| **Telegram Sessions** | AES-256-GCM authenticated encryption at rest |
| **Cross-Tenant Isolation** | Strict server-side verification: client cannot manipulate `ownerUserId` |
| **File Storage** | Ephemeral memory streams; zero permanent disk copies on server |
| **Database** | Foreign keys with cascade deletion, performance indexes, and PostgreSQL RLS compatibility |

---

## 🧪 Testing Coverage

The test suite in `/tests` validates:
- `tests/crypto.test.ts`: AES-256-GCM encryption, decryption, random IVs, and tamper detection.
- `tests/auth.test.ts`: Password hashing, comparison, JWT signing, verification, and expiration.
- `tests/telegram.test.ts`: MTProto code sending, sign-in, 2FA challenge, Saved Messages upload, download, and deletion.
- `tests/ai-search.test.ts`: Deterministic parsing of size, date, category, and keyword constraints.
- `tests/isolation.test.ts`: Strict tenant boundary verification between User A and User B.

Run tests anytime with:
```bash
npm test
```

---

## 🚢 Production Deployment

### Docker / Standalone Node.js
```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### PostgreSQL Migration
Ensure `DATABASE_URL` points to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://user:password@host:5432/vault_ai?schema=public"
```
Apply the migration:
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

---

## 📄 License
MIT License. Built for sovereign, decentralized personal cloud storage.