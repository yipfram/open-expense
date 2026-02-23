# Open-expense Architecture (V1)

## Goal
Build a self-hosted, mobile-first expense collection app.
The system collects and organizes receipts, and is not an accounting platform.

## Core Architecture Decisions
1. Framework: Next.js (App Router) + TypeScript.
2. UI direction: PWA-first for members (mobile), desktop-optimized workflow for finance.
3. Authentication: Better Auth, email/password in v1; OIDC/OAuth later.
4. Authorization model:
   - Main user types: member, finance, admin.
   - Manager is an additional role on top of member (scoped read/review).
   - Runtime access checks use persisted role assignments in database.
5. Data layer: PostgreSQL + Drizzle ORM.
6. File storage: S3-compatible object storage.
7. Mail: SMTP for transactional emails.
8. Deployment target for v1: self-hosted environment (Docker Compose supported by IT).
9. Milestone 0 bootstrap mode: local-first development using pnpm (no mandatory Docker setup).
10. Email templates in v1: plain text; branded HTML can be introduced later.
11. Protected UI routing uses a unified workspace path (`/app`) with role-aware view selection via query param (`?view=member|finance`) and a separate admin settings path (`/settings`).
12. Expense detail pages are shareable internal routes under `/app/expense/[id]` and remain protected by role-based access checks.

## Domain and Workflow Decisions
1. One deployment = one organization.
2. Department and project segmentation exists inside the organization.
3. One expense submission = one expense + one receipt file.
4. Status flow in v1: `draft -> submitted -> received`.
5. Future statuses: `paid`, `archived`.
6. Member can edit/delete only in `draft`.
7. Deletion strategy: soft delete (`deleted_at`) for traceability.
8. Finance can edit key fields and set `received`.
9. Finance inbox default sorting: newest submitted first.
10. Public expense identifier format: `EXP-YYYY-NNNNNN`.

## Validation and Constraints (V1)
1. Upload constraints: `jpg/jpeg/png/pdf`, max 1 file, max 10 MB.
2. Receipt handling: store original file only (no compression/thumbnailing in v1).
3. Currency: single organization currency, configured in admin settings.
4. Text lengths:
   - comment: 500
   - project name: 100
   - department name: 80
   - category: 50

## Signup and Invitations
1. Signup modes supported: invite-only and open signup.
2. Default mode: invite-only.
3. Invite expiration: 14 days.
4. Milestone 1 implementation uses environment-driven signup mode (`AUTH_SIGNUP_MODE`) with `invite_only` as default.
5. Invitation validation is backed by persisted invite records.

## Role Persistence (Milestone 1)
1. Access roles (`member`, `manager`, `finance`, `admin`) are persisted via `role_assignment` records.
2. Environment email allowlists are not used as runtime authorization source.
3. Canonical identity table is Better Auth `user`; no duplicate app-level `users` identity table is used.

## API Error Semantics (Milestone 1)
1. Auth submit endpoints return explicit HTTP status codes on failures.
2. Status mapping:
   - validation errors: `400`
   - authentication failures: `401`
   - invite policy rejection: `403`
   - conflicts (e.g., duplicate email): `409`
   - temporary database/service outage: `503`
   - unknown server errors: `500`

## V1 Non-Goals
1. Accounting features.
2. Reimbursement tracking.
3. Approval workflow.
4. OCR.
5. Multi-currency.
6. Kubernetes deployment.
