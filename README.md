# Open-expense

Milestone 1 bootstrap for V1 using Next.js (App Router), TypeScript, pnpm, Better Auth, Drizzle ORM, and role-based route guards.

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
   - `INVITE_CODES` (when `AUTH_SIGNUP_MODE=invite_only`)
   - `AUTH_ADMIN_EMAILS`
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

## Environment
Copy `.env.example` to `.env` and fill values.

Auth mode defaults to invite-only (`AUTH_SIGNUP_MODE=invite_only`).

## Milestone Mapping
This repository is currently aligned to Milestone 1 foundations defined in `docs/milestones-v1.md`.
