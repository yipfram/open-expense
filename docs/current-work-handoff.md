# Current Work Handoff (V1)

Last updated: 2026-02-18

## Purpose
Cross-session execution context for the current implementation state.
This file is an operational snapshot, not a source-of-truth spec.

Primary source-of-truth docs:
- `docs/architechture.md`
- `docs/permissions-matrix.md`
- `docs/data-model-v1.md`
- `docs/milestones-v1.md`

## Current Milestone Focus
- Milestone 1: Auth and Roles (`EXP-6`)

## Implemented So Far
- Next.js App Router + TypeScript + pnpm bootstrap.
- Tailwind CSS v4 setup and UI migration for current auth/protected pages.
- Better Auth integrated with Drizzle adapter (`provider: pg`).
- Drizzle ORM/tooling added:
  - `drizzle.config.ts`
  - `src/db/client.ts`
  - `src/db/schema.ts`
  - scripts: `db:generate`, `db:migrate`, `db:studio`, `db:check:auth`
- Better Auth schema tables implemented and migrated:
  - `user`, `session`, `account`, `verification`
- Auth routes and role-protected pages scaffolded:
  - `/sign-in`, `/sign-up`, `/member`, `/finance`, `/admin`
- Role persistence implemented via `role_assignment` table and DB-backed role checks.
- Admin seed now persists admin/member/finance assignments in `role_assignment`.
- Invite-only bootstrap flow implemented (env-backed tokens for now).
- Invite flow upgraded to DB-backed lifecycle via Drizzle `invites` table.
- Admin invite management API implemented:
  - `GET /api/admin/invites`
  - `POST /api/admin/invites`
- Error handling hardened:
  - centralized mapper in `src/lib/errors.ts`
  - request reference IDs in UI
  - dedicated outage page `/service-unavailable`
- Auth submit flows now use explicit API routes with status codes:
  - `POST /api/auth/sign-in`
  - `POST /api/auth/sign-up`

## API Error Status Contract (Implemented)
- `400`: validation errors
- `401`: authentication errors
- `403`: invite policy rejection
- `409`: conflict (duplicate/consumed resource)
- `503`: temporary DB/service outage
- `500`: unexpected server errors

## Known Technical Gaps
- Temporary fallback invite mode (`INVITE_CODES`) still exists for bootstrap/local usage.
- Domain/business `users` table and Better Auth `user` table coexist; final ownership/mapping must be clarified in milestone work.

## Recommended Next Steps
1. Add API integration tests for auth status-code behavior and admin invite routes.
2. Remove env invite fallback once DB invite management is confirmed stable.
3. Clarify/merge business `users` vs Better Auth `user` ownership.
4. Move Milestone 1 issue to review when above items are done.

## Useful Commands
```bash
pnpm install
pnpm dev
pnpm db:generate
pnpm db:migrate
pnpm db:check:auth
pnpm typecheck
pnpm lint
pnpm test
```
