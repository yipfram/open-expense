# Open-expense

Milestone 2 baseline for V1 using Next.js (App Router), TypeScript, pnpm, Better Auth, Drizzle ORM, role-based route guards, and S3 receipt storage.

## Requirements
- Node.js 20+
- pnpm 10+

## Quick Start
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Set at least:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `AUTH_SIGNUP_MODE`
   - `S3_ENDPOINT`
   - `S3_REGION`
   - `S3_BUCKET`
   - `S3_ACCESS_KEY`
   - `S3_SECRET_KEY`
4. Optional admin seed:
   ```bash
   SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=ChangeMe123! pnpm seed:admin
   ```
2. Start the local dev server:
   ```bash
   pnpm dev
   ```
5. Open `http://localhost:3000`.

## PostgreSQL with Docker
1. Start PostgreSQL:
   ```bash
   docker compose up -d postgres
   ```
2. Verify container health:
   ```bash
   docker compose ps
   ```
3. Stop PostgreSQL:
   ```bash
   docker compose down
   ```

The default `docker-compose.yml` values match `.env.example`:
- host: `localhost`
- port: `5432`
- database: `open_expense`
- user: `user`
- password: `password`

## Quality Commands
- Lint: `pnpm lint`
- Format check: `pnpm format:check`
- Format write: `pnpm format`
- Test: `pnpm test`
- Type check: `pnpm typecheck`

## Database (Drizzle)
- Generate SQL migration from `src/db/schema.ts`: `pnpm db:generate`
- Apply pending migrations: `pnpm db:migrate`
- Open Drizzle Studio: `pnpm db:studio`
- Validate Better Auth tables are present: `pnpm db:check:auth`

## Auth API Error Status
Auth submit flows use explicit API routes and return non-200 status codes on failure:
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-up`
- `GET /api/admin/invites`
- `POST /api/admin/invites`

Status mapping:
- `400` validation failure
- `401` authentication failure
- `403` invite policy rejection
- `409` conflict (duplicate/consumed resource)
- `503` temporary backend/database outage
- `500` unexpected server failure

## Invite Management
- Primary mode: DB-backed invites via `invites` table.
- Admin endpoints:
  - `POST /api/admin/invites` to create invite tokens
  - `GET /api/admin/invites` to list invites

## Environment
Copy `.env.example` to `.env` and fill values.

Auth mode defaults to invite-only (`AUTH_SIGNUP_MODE=invite_only`).

## Protected UI Routes
- Workspace: `/app`
  - Submit: `/app?view=member`
  - Process: `/app?view=finance`
- Settings (admin): `/settings`

Note: task labels in UI are `Submit` and `Process`; technical view slugs remain `member` and `finance`.

## Member Expense API (Milestone 2)
- `GET /api/member/expenses`
- `POST /api/member/expenses` (multipart with `receipt`)
- `PUT /api/member/expenses/:expenseId` (multipart, optional `receipt` replacement)
- `DELETE /api/member/expenses/:expenseId`
- `POST /api/member/expenses/:expenseId/submit`

Rules:
- Receipts are stored in S3-compatible object storage.
- Receipt file types: `jpg/jpeg/png/pdf`.
- Maximum receipt file size: `10 MB`.
- Members can edit/delete only while expense status is `draft`.

## Milestone Mapping
This repository is currently aligned to Milestone 2 implementation scope in `docs/milestones-v1.md`.

## Cross-Session Context
- Current implementation handoff: `docs/current-work-handoff.md`
