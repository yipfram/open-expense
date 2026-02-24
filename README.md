# Open-expense

Open-expense helps you collect and process expense receipts in one place

## What It Is
Open-expense is an open-source expense collection app for a single organization.  
It is designed for mobile-first member submission and desktop-friendly finance processing.

## What It Is Not
Open-expense is not:
- an accounting platform
- a reimbursement tracking system
- an OCR pipeline
- a multi-currency system
- a Kubernetes-first deployment stack

## Core Capabilities (V1 Scope)
- One submission creates one expense with one receipt file.
- Expense status lifecycle: `draft` -> `submitted` -> `received` (shown as `Validated` in process UI).
- Role model: `member`, `manager` (scoped), `finance`, `admin`.
- Signup modes: `invite_only` (default) or `open`.
- Receipt storage via S3-compatible object storage.
- SMTP-ready notification model.

## Tech Stack
- Next.js (App Router) + TypeScript
- Better Auth (email/password in V1)
- PostgreSQL + Drizzle ORM
- S3-compatible object storage
- SMTP for transactional email
- Docker Compose for self-hosted deployment baseline

## Architecture at a Glance
- Canonical protected workspace path: `/app`
- Task views:
  - `view=member` for submit flow
  - `view=process` for finance/admin processing
  - `view=finance` supported as a compatibility alias
- Admin settings path: `/settings`
- Expense detail path: `/app/expense/[id]` (role-aware access checks)
- Canonical identity table: Better Auth `user`
- Authorization source: persisted `role_assignment` records

## How to Get Started
Follow the local setup steps below.

## Quick Start (Local Development)
Requirements:
- Node.js 20+
- pnpm 10+
- Docker (for local PostgreSQL)

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Start local PostgreSQL:
   ```bash
   docker compose up -d postgres
   ```
4. Apply database migrations:
   ```bash
   pnpm db:migrate
   ```
5. Optional: seed an initial admin user:
   ```bash
   SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=ChangeMe123! pnpm seed:admin
   ```
   Alternative built-in bootstrap path: set `AUTH_ADMIN_EMAIL=admin@example.com` and sign up with that email in invite-only mode (invite code bypass + automatic `admin`/`finance`/`member` role assignment). If the account already exists, a successful sign-in will backfill missing bootstrap roles.
6. Start the app:
   ```bash
   pnpm dev
   ```
7. Open `http://localhost:3000`.

## Docker Compose (Self-Hosted Baseline)
Defined services in `docker-compose.yml`:
- `postgres`: PostgreSQL database
- `migrate`: one-shot migration runner (`pnpm db:migrate`)
- `app`: production Next.js app

Notes:
- `app` waits for successful `migrate` completion and healthy `postgres`.
- `.env` is loaded for application settings.
- Compose also defines DB defaults for inter-container connection strings.

Run full stack:
```bash
docker compose up --build -d
```

Check services:
```bash
docker compose ps
```

Stop:
```bash
docker compose down
```

## Configuration (Environment Variables)
Copy `.env.example` to `.env` and set values for your environment.

App/auth:
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `AUTH_SIGNUP_MODE` (`invite_only` or `open`)
- `AUTH_ADMIN_EMAIL` (optional canonical bootstrap email allowlist; comma/semicolon/newline separated)
- `AUTH_ADMIN_EMAILS` (optional backward-compatible alias)

Database:
- `DATABASE_URL`

S3-compatible storage:
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_FORCE_PATH_STYLE`

SMTP:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Data, Auth, and Storage Notes
- Better Auth tables (`user`, `session`, `account`, `verification`) provide core identity/session infrastructure.
- App authorization is enforced from persisted `role_assignment` records.
- Invite validation is backed by persisted invite records.
- One attachment per expense is enforced in V1.

## Main Routes and Access Model
- Public auth routes: `/sign-in`, `/sign-up`
- Protected workspace: `/app`
  - Submit: `/app?view=member`
  - Process: `/app?view=process`
  - Compatibility alias: `/app?view=finance`
- Admin settings: `/settings`
- Expense detail: `/app/expense/[id]`

Task labels in UI are `Submit` and `Process`; route access is role-checked.

## Developer Commands
- `pnpm dev` - start development server
- `pnpm build` - build production bundle
- `pnpm start` - run production server
- `pnpm lint` - run ESLint
- `pnpm format:check` - check formatting
- `pnpm format` - write formatting updates
- `pnpm typecheck` - run TypeScript no-emit checks
- `pnpm test` - run test suite
- `pnpm db:generate` - generate Drizzle migrations from schema changes
- `pnpm db:migrate` - apply pending migrations
- `pnpm db:studio` - open Drizzle Studio
- `pnpm db:check:auth` - validate Better Auth tables
- `pnpm seed:admin` - create user (if needed) and ensure admin/member/finance roles

## Testing and Quality Gates
- Test runner: Vitest (`pnpm test`)
- Static checks:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm format:check`

## Documentation Map (Source of Truth)
- Product and architecture: `docs/architechture.md`
- Permissions and role behavior: `docs/permissions-matrix.md`
- Data entities and integrity rules: `docs/data-model-v1.md`
- Email templates: `docs/email-templates-v1.md`
- Operational implementation snapshot: `docs/current-work-handoff.md`
- Context bootstrap: `CONTEXT.md`

## Current Known Gaps
- Notification delivery workflow is not fully active end-to-end yet.
- Full audit visibility flows remain incomplete.
