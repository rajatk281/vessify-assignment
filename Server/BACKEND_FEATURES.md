# Vessify Backend: Features & Implementation Summary

This document serves as a comprehensive record of all successfully implemented backend features, the architecture, and the capabilities of the Vessify API.

---

## 1. Core Tech Stack
*   **Framework:** Hono (running on Bun)
*   **Database:** PostgreSQL (via Prisma ORM)
*   **Authentication:** Better Auth
*   **Validation:** Zod (`@hono/zod-validator`)

---

## 2. Authentication System
Fully operational authentication system powered by Better Auth.
*   **Authentication Methods:** Email/Password and GitHub OAuth.
*   **Session Management:** Secure session tokens/cookies handled automatically.
*   **Middleware (`authMiddleware`):** A custom, reusable Hono middleware that intercepts requests, validates the Better Auth session, and injects the authenticated `user` and `session` objects directly into the Hono context for downstream routes.

---

## 3. Multi-Tenancy & Organizations
The backend is built with strict multi-tenancy to isolate user data.
*   **Auto-Creation on Signup:** When a user registers, a database hook automatically creates an Organization named after them (e.g., "Rajat's Organization").
*   **Auto-Ownership:** The newly registered user is automatically assigned the "owner" role of their new organization.
*   **Auto-Activation:** When a session is created, a database hook automatically detects the user's organization and sets it as the `activeOrganizationId` in the session.
*   **Organization API (`/api/organization`):**
    *   `POST /create`: Manually create additional organizations (validates name, slug, logo).
    *   `GET /`: List all organizations the user belongs to.
    *   `POST /set-active`: Switch the active organization context for the current session.

---

## 4. Transaction Processing Engine
The core feature of parsing and saving bank statements.
*   **Text Extractor (`src/lib/extractor.ts`):** An intelligent regex-based parser that takes a raw bank statement string and extracts:
    *   `Date` (supports ISO, DD/MM/YYYY, and long formats)
    *   `Amount` (handles currency symbols and commas)
    *   `Description` (infers the transaction name by excluding boilerplate text)
    *   `Confidence Score` (calculates how confident the parser is in the extracted data)
*   **Extraction API (`POST /api/transactions/extract`):**
    *   Receives raw text via JSON body.
    *   Verifies the user has an active organization and is a valid member of it.
    *   Parses the text and stores the structured data securely in the database.

---

## 5. Data Retrieval & Pagination
*   **Listing API (`GET /api/transactions`):**
    *   Retrieves transactions strictly scoped to the user's currently active organization.
    *   **Cursor-Based Pagination:** Built for high performance and infinite scrolling. Supports `cursor` and `limit` query parameters.
    *   Returns the data along with `nextCursor` and a `hasMore` boolean flag.

---

## 6. Security & Infrastructure
*   **Data Isolation:** All database queries for transactions strictly enforce `organizationId` filters to guarantee data privacy between users and teams.
*   **CORS Configuration:** The backend is fully configured to accept cross-origin requests and credentials (cookies) from frontend development servers (`http://localhost:3001` and `http://localhost:5173`).
*   **Clean Database Schema:** The Prisma schema (`schema.prisma`) is fully optimized, containing robust relational models for `User`, `Session`, `Organization`, `Member`, and `Transaction` with cascading deletes to maintain data integrity.

---

## API Quick Reference

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | ❌ | API Health check |
| `POST` | `/api/auth/sign-up/email` | ❌ | User Registration |
| `POST` | `/api/auth/sign-in/email` | ❌ | User Login |
| `POST` | `/api/organization/create` | ✅ | Create new organization |
| `GET` | `/api/organization` | ✅ | List user's organizations |
| `POST` | `/api/organization/set-active` | ✅ | Switch active organization |
| `POST` | `/api/transactions/extract` | ✅ | Parse & save bank statement text |
| `GET` | `/api/transactions` | ✅ | List transactions (Cursor paginated) |
