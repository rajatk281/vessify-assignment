# Vessify — Personal Finance Transaction Extractor

A premium, production-ready personal finance transaction extractor with robust authentication, multi-tenancy, and data isolation, built for the Vessify assignment.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Hono](https://img.shields.io/badge/Hono-4-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Better Auth](https://img.shields.io/badge/Better_Auth-1.6-green)

---

## Live Demo 🚀

- **Frontend (Vercel):** [https://vessify-assignment-three.vercel.app](https://vessify-assignment-three.vercel.app)
- **Backend API (Render):** [https://vessify-assignment-ev1s.onrender.com](https://vessify-assignment-ev1s.onrender.com)

---

## 🎯 Better Auth Integration & Data Isolation Strategy

Vessify leverages **Better Auth** with its `organization` plugin to achieve seamless, scalable multi-tenancy. On user registration, a Prisma database hook automatically provisions a unique Organization and assigns the user as the "Owner". At the API layer, a custom Hono middleware intercepts every request, validates the session, and enforces strict isolation by scoping all database queries (like `transaction.findMany`) to the session's `activeOrganizationId`. This guarantees that users can never access data outside their organization, ensuring absolute data privacy while remaining highly performant.

To solve modern browser third-party cookie restrictions in a decoupled deployment (Vercel Frontend + Render Backend), all frontend authentication and API requests are proxied via Next.js `rewrites` and a custom Next.js API route (`/api/auth/[...all]`). This architecture allows cookies to be securely set as same-site first-party cookies.

---

## Features

- **🔐 Robust Authentication** — Secure Email/Password registration & login via Better Auth.
- **🏢 Multi-Tenancy** — Automatic organization creation on signup; data strictly isolated per organization.
- **📊 AI-less Transaction Parsing** — Intelligent regex-based extractor handling ISO dates, DD/MM/YYYY, long dates, ₹/$ amounts, and messy single-line formats.
- **📈 Confidence Scoring** — Each extraction returns a confidence score (0–1) based on parsing accuracy.
- **📑 Cursor Pagination** — Highly scalable cursor-based pagination for the transaction feed.
- **🎨 Dark Mode UI** — Premium, responsive dark interface utilizing Tailwind CSS v4, shadcn/ui, and micro-interactions.

---

## 🔑 Test User Credentials

You can test data isolation using the following pre-created accounts. Each user belongs to their own isolated organization:

| User | Email | Password |
|------|-------|----------|
| **User 1** | `user1@vessify.test` | `password123!` |
| **User 2** | `user2@vessify.test` | `password123!` |

*(Try logging in with User 1, parsing a transaction, and then logging in as User 2 to verify that the data is completely isolated.)*

---

## 🛠️ Local Development Setup

### Prerequisites

- [Bun](https://bun.sh) (v1.3+)
- [Node.js](https://nodejs.org) (v20+)
- PostgreSQL Database

### 1. Clone the repository

```bash
git clone https://github.com/rajatk281/vessify-assignment.git
cd vessify-assignment
```

### 2. Environment Variables (`.env.example`)

You will need to create a `.env` file in **both** the `Server` and `Client` directories.

**`Server/.env`**
```env
# Database connection string (PostgreSQL required)
DATABASE_URL="postgresql://postgres:password@localhost:5432/vessify?schema=public"

# Better Auth Configuration
BETTER_AUTH_SECRET="super-secret-key-for-better-auth-min-32-chars-long!"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: GitHub OAuth
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

**`Client/.env`**
```env
# URL of the Hono backend API
NEXT_PUBLIC_API_URL="http://localhost:3000"

# URL of the Next.js frontend (used for local proxying)
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### 3. Start the Backend (Hono + Bun)

```bash
cd Server

# Install dependencies
bun install

# Run Prisma migrations
bunx prisma migrate dev

# Generate Prisma client
bunx prisma generate

# Start the server (runs on http://localhost:3000)
bun run dev
```

### 4. Start the Frontend (Next.js)

Open a new terminal window:

```bash
cd Client

# Install dependencies
npm install

# Start the dev server (runs on http://localhost:3001)
npm run dev
```

---

## 🧪 Running Tests

The backend includes a comprehensive test suite covering the transaction extraction logic, confidence scoring, and edge cases.

```bash
cd Server
bun test
```
