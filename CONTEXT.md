# Open-expense Context

## Purpose
Open-expense is a self-hosted expense collection app for organizations.
Its goal is simple: provide one place where members submit expense receipts and finance users organize them.

This project is **not** an accounting system.

## Core Users
1. Member
2. Finance
3. Admin
4. IT (deployment target, not a day-to-day business user)

### Member
- Main device: phone (mobile-first experience)."
- Uses a PWA to submit expenses.
- Creates one expense per submission in v1.
- Uploads one receipt photo/file.
- Specifies whether payment was made with:
  - work card
  - personal card
- Can edit/delete their expense, with version history kept.
- Can edit/delete only while expense is in `draft`.

### Finance
- Main device: desktop.
- Receives submitted expenses in a list.
- Organizes incoming receipts.
- Can correct/reassign department/project when needed.
- Can edit key fields and mark expenses as `received`.

### Manager (additional role)
- Manager is an added role on top of Member, not a separate user type.
- A member with manager role can read/review expenses limited to assigned department(s)/project(s).

### Admin
- Administrative visibility and audit access.
- Configures core business data (with Finance): departments, projects, payment mode options.

### IT (self-hosting target)
- Deploys and operates the app through Docker Compose.
- Configures SMTP, PostgreSQL, and S3-compatible object storage via environment variables.
- Handles reverse proxy outside the app stack.

## Product Scope

### In Scope (V1)
- Mobile-first PWA for members.
- Desktop-friendly finance interface.
- Authentication:
  - Better Auth with email/password in v1
  - OIDC/OAuth added later
- Signup modes:
  - invite-only (default)
  - open signup (configurable from admin settings)
- Expense creation (one expense per submission).
- Receipt upload (photo/file), one file per expense.
- Core fields include:
  - amount
  - date
  - category
  - department (auto-filled from member profile)
  - project (important)
  - payment method (work vs personal card)
  - comment
- File constraints:
  - allowed: `jpg`, `jpeg`, `png`, `pdf`
  - max size: 10 MB
- Basic lifecycle/status support.
- Finance list view of submitted expenses (default sort: newest first).
- Human-readable expense identifier (e.g. `EXP-2026-000123`).
- Email notifications:
  - to finance on new submission
  - to member on submission confirmation
- Edit/delete with versioning.
- Basic audit trail (admin visibility).
- English UI with i18n-ready architecture.

### Out of Scope (for now)
- Accounting features.
- Multi-currency.
- Reimbursement tracking / "paid" workflow (planned later).
- Archive workflow (`archived` status) planned later.
- OCR extraction (much later).
- Legal/compliance hardening at this stage.
- Kubernetes deployment (Docker Compose only for v1).

## Status Model
Initial minimal statuses (no approval workflow in first weeks):
- `draft`
- `submitted`
- `received`

Future status extension:
- `paid` (V2+)
- `archived` (future)

## Domain Boundaries
- One deployment targets one organization.
- Inside the organization, data is structured by department and project.
- Organization uses a single currency configured in admin settings.

## UX Direction
- UI-first and mobile-first product development.
- Member flow optimized for fast receipt capture and submission on phone.
- Finance workflow optimized for desktop triage/list management.

## Technical Direction
- Stack: Node.js + TypeScript.
- Deployment: Docker Compose.
- Storage/services via env config:
  - PostgreSQL
  - SMTP
  - S3-compatible storage

## Early Milestone
Deliver a working app where:
1. Members can submit expenses with a receipt from mobile.
2. Finance users can see all submitted expenses in a desktop list.
3. No approval flow is required in the first weeks.

## Terminology
- French "note de frais" is represented in English as:
  - "expense report" (document-centric)
  - "expense claim" (request-centric)
- In product UI, "expense" or "submit an expense" is preferred for clarity.
