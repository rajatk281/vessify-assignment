# Vessify — Personal Finance Transaction Extractor

A production-realistic personal finance transaction extractor with **proper authentication**, **multi-tenancy**, and **data isolation** — built for the Vessify internship coding assignment.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Hono](https://img.shields.io/badge/Hono-4-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Better Auth](https://img.shields.io/badge/Better_Auth-1.6-green)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Hono (TypeScript) running on Bun |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth (Backend)** | Better Auth (email/password + GitHub OAuth + JWT plugin + organizations) |
| **Auth (Frontend)** | Better Auth React client for session management |
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **UI Library** | shadcn/ui + Tailwind CSS v4 |

---

## Features

- **🔐 Authentication** — Email/password registration & login via Better Auth
- **🏢 Multi-Tenancy** — Automatic organization creation on signup; data isolated per organization
- **📊 Transaction Parsing** — Intelligent regex-based extractor handling ISO dates, DD/MM/YYYY, long dates, ₹/$ amounts, and messy single-line formats
- **📈 Confidence Scoring** — Each extraction returns a confidence score (0–1) based on how many fields were successfully parsed
- **📑 Cursor Pagination** — Efficient cursor-based pagination for transaction listing
- **🛡️ Data Isolation** — All queries are scoped to `organizationId`; no way to see another user's data even with modified requests
- **🎨 Dark Mode UI** — Premium dark interface with glassmorphism effects

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) (v1.3+)
- [Node.js](https://nodejs.org) (v20+)
- PostgreSQL database (or a cloud-hosted instance like Prisma Postgres / Neon)

### 1. Clone the repository

```bash
git clone https://github.com/rajatk281/vessify-assignment.git
cd vessify-assignment
```

### 2. Setup the Backend

```bash
cd server

# Install dependencies
bun install

# Copy env and fill in your values
cp .env.example .env
# Edit .env with your DATABASE_URL, BETTER_AUTH_SECRET, etc.

# Run Prisma migrations
bunx prisma migrate dev

# Generate Prisma client
bunx prisma generate

# Start the server (hot-reload)
bun run dev
# → Backend running at http://localhost:3000
```

### 3. Setup the Frontend

```bash
cd Client

# Install dependencies
npm install

# Start the dev server
npm run dev
# → Frontend running at http://localhost:3001
```

### 4. Run Tests

```bash
cd server
bun test
```

---

## Environment Variables

### Server (`server/.env`)

```env
DATABASE_URL=postgres://user:password@host:5432/dbname?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=true
```

### Client (`Client/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Test Users

After starting both servers, register these users to test data isolation:

| User | Email | Password |
|------|-------|----------|
| User 1 | `alice@test.com` | `password123` |
| User 2 | `bob@test.com` | `password123` |

Each user automatically gets their own organization on signup. Transactions are scoped to the user's organization — **User 1 cannot see User 2's data** and vice versa.

---

## Sample Texts (all 3 work perfectly)

### Sample 1 — Standard multi-line
```
Date: 11 Dec 2025
Description: STARBUCKS COFFEE MUMBAI
Amount: -420.00
Balance after transaction: 18,420.50
```

### Sample 2 — Slash-date with ₹ symbol
```
Uber Ride * Airport Drop
12/11/2025 → ₹1,250.00 debited
Available Balance → ₹17,170.50
```

### Sample 3 — Messy single-line
```
txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ❌ | Health check |
| `POST` | `/api/auth/sign-up/email` | ❌ | Register (email + password) |
| `POST` | `/api/auth/sign-in/email` | ❌ | Login → session cookie |
| `GET` | `/api/auth/session` | ✅ | Get current session |
| `POST` | `/api/auth/sign-out` | ✅ | Logout |
| `POST` | `/api/organization/create` | ✅ | Create organization |
| `GET` | `/api/organization` | ✅ | List user's organizations |
| `POST` | `/api/organization/set-active` | ✅ | Switch active organization |
| `POST` | `/api/transactions/extract` | ✅ | Parse & save bank statement |
| `GET` | `/api/transactions?cursor=&limit=` | ✅ | List transactions (paginated) |

---

## Architecture & Isolation Strategy

**Better Auth** handles all authentication and session management. On signup, a database hook automatically creates an **Organization** for the user and assigns them as "owner". The session hook auto-sets the `activeOrganizationId`, so every API call is inherently scoped.

All transaction queries filter by `organizationId` from the session context — this guarantees **true data isolation**. Even if a user modifies API requests, they can only access transactions belonging to their own organization because membership is validated server-side before every query.

**Cursor-based pagination** is used for the transaction listing endpoint (instead of offset-based) for better performance on large datasets and seamless infinite scrolling on the frontend.

---

## Project Structure

```
vessify-assignment/
├── Client/                          # Next.js 16 frontend
│   ├── app/
│   │   ├── layout.tsx              # Root layout (dark mode, providers)
│   │   ├── page.tsx                # Dashboard (protected)
│   │   ├── login/page.tsx          # Login page
│   │   └── register/page.tsx       # Registration page
│   ├── components/
│   │   ├── providers.tsx           # React Query + Toaster
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/
│   │   ├── auth-client.ts          # Better Auth React client
│   │   ├── api.ts                  # Axios API helpers
│   │   └── utils.ts                # cn() utility
│   └── middleware.ts               # Route protection
│
└── server/                          # Hono backend
    ├── lib/
    │   └── auth.ts                 # Better Auth configuration
    ├── src/
    │   ├── index.ts                # App entry point + CORS
    │   ├── routes/
    │   │   ├── transactions.ts     # POST /extract + GET /
    │   │   └── organization.ts     # CRUD operations
    │   └── lib/
    │       ├── extractor.ts        # Transaction text parser
    │       ├── middleware.ts        # Auth middleware
    │       └── prisma.ts           # Prisma client
    ├── prisma/
    │   └── schema.prisma           # Database schema
    └── tests/
        └── extractor.test.ts       # 19 tests (6 describe blocks)
```

---

## Tests

**19 tests across 6 describe blocks** covering:

1. **Sample 1** — Standard multi-line parsing (date, amount, description, confidence)
2. **Sample 2** — Slash-date DD/MM/YYYY + ₹ symbol
3. **Sample 3** — Messy single-line format
4. **Edge cases** — Empty text, unrecognizable text, missing dates
5. **Confidence scoring** — Full, zero, and partial confidence
6. **Return type correctness** — Field presence, type validation, bounds

```bash
cd server && bun test

# 19 pass | 0 fail | 35 expect() calls | 50ms
```

---

## AI Tools Used

**Antigravity IDE** (Claude) was used for code generation, planning, and debugging throughout the project. Every line of code has been reviewed and understood.
