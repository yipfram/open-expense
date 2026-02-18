# Milestones (V1)

## Milestone 0 - Project Bootstrap
- Initialize Node.js + TypeScript app structure.
- Add lint/format/test baseline.
- Add Docker Compose with app, postgres, mail test service, and local S3-compatible service.
- Provide `.env.example`.

Exit criteria:
- App runs locally with one command.

## Milestone 1 - Auth and Roles
- Integrate Better Auth with email/password.
- Implement invite flow and signup mode setting (default invite-only).
- Seed initial admin account.
- Implement role checks for member/manager/finance/admin.

Exit criteria:
- Role-based route protection works.

## Milestone 2 - Member Submission (Mobile First)
- Build PWA-ready submission flow.
- Create/edit/delete draft expense.
- Upload one receipt file with type/size validation.
- Submit expense (`draft -> submitted`).

Exit criteria:
- Member can submit an expense end-to-end from phone.

## Milestone 3 - Finance Inbox (Desktop)
- Finance list page for submitted expenses.
- Default sorting: newest first.
- Finance can edit key fields and set `received`.
- Filters: status, project, department.

Exit criteria:
- Finance can process incoming expenses from one central list.

## Milestone 4 - Notifications and Audit
- Send email to finance on new submission.
- Send confirmation email to member.
- Record expense version history on edits.
- Record audit events and expose admin-only audit view.

Exit criteria:
- Core traceability and notification loop is live.

## Milestone 5 - Hardening Pass
- Validation and error handling pass.
- Basic integration tests for core workflows.
- Storage failure/retry behavior reviewed.
- Documentation updated.

Exit criteria:
- Stable v1 candidate ready for first internal users.
