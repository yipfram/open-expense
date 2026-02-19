# Current Work Handoff (V1)

Last updated: 2026-02-19

## Purpose
Cross-session execution context for the current implementation state.
This file is an operational snapshot, not a source-of-truth spec.

Primary source-of-truth docs:
- `docs/architechture.md`
- `docs/permissions-matrix.md`
- `docs/data-model-v1.md`
- `docs/milestones-v1.md`

## Current Milestone Focus
- Milestone 2: Member Submission (Mobile First)

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
- Invite flow upgraded to DB-backed lifecycle via Drizzle `invites` table.
- Admin invite management API implemented:
  - `GET /api/admin/invites`
  - `POST /api/admin/invites`
- API integration-style test coverage added for:
  - `POST /api/auth/sign-in`
  - `POST /api/auth/sign-up`
  - `GET/POST /api/admin/invites`
- Error handling hardened:
  - centralized mapper in `src/lib/errors.ts`
  - request reference IDs in UI
  - dedicated outage page `/service-unavailable`
- Auth submit flows now use explicit API routes with status codes:
  - `POST /api/auth/sign-in`
  - `POST /api/auth/sign-up`
- Member expense submission flow implemented:
  - `GET /api/member/expenses`
  - `POST /api/member/expenses`
  - `PUT /api/member/expenses/:expenseId`
  - `DELETE /api/member/expenses/:expenseId`
  - `POST /api/member/expenses/:expenseId/submit`
- Expense domain schema and migrations added:
  - `department`, `project`, `expense`, `expense_attachment`
  - enums `expense_status`, `payment_method`
- Receipt storage switched to S3-compatible bucket uploads.
- Member UI now includes mobile-first draft create/edit/delete/submit manager.

## API Error Status Contract (Implemented)
- `400`: validation errors
- `401`: authentication errors
- `403`: invite policy rejection
- `409`: conflict (duplicate/consumed resource)
- `503`: temporary DB/service outage
- `500`: unexpected server errors

## Known Technical Gaps
- Finance inbox, notifications, and audit trail are pending future milestones.

## Recommended Next Steps
1. Add integration tests for member expense API routes.
2. Start Milestone 3 finance inbox list and processing flow.

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
