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
5. Data layer: PostgreSQL.
6. File storage: S3-compatible object storage.
7. Mail: SMTP for transactional emails.
8. Deployment: Docker Compose only for v1.
9. Email templates in v1: plain text; branded HTML can be introduced later.

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

## V1 Non-Goals
1. Accounting features.
2. Reimbursement tracking.
3. Approval workflow.
4. OCR.
5. Multi-currency.
6. Kubernetes deployment.
