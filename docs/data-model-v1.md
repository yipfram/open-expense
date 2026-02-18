# Data Model Draft (V1)

## Entities

### User
- `id` (uuid)
- `email` (unique)
- `password_hash` (nullable for SSO later)
- `display_name`
- `department_id` (required)
- `is_active`
- `created_at`
- `updated_at`

### RoleAssignment
- `id` (uuid)
- `user_id`
- `role` (`member`, `manager`, `finance`, `admin`)
- `scope_department_id` (nullable)
- `scope_project_id` (nullable)

Notes:
- Manager role is additive via extra assignment.
- Scoped manager access represented through optional scope fields.

### Department
- `id` (uuid)
- `name` (unique, max 80 chars)
- `is_active`

### Project
- `id` (uuid)
- `department_id`
- `name` (max 100 chars)
- `is_active`

### Expense
- `id` (uuid)
- `public_id` (unique, e.g. `EXP-2026-000123`)
- `member_id` (creator)
- `department_id` (auto from member profile at creation)
- `project_id`
- `amount_minor` (integer cents)
- `currency_code` (single-org constraint)
- `expense_date`
- `category`
- `payment_method` (`work_card`, `personal_card`)
- `comment` (nullable, max 500 chars)
- `status` (`draft`, `submitted`, `received`)
- `submitted_at` (nullable)
- `received_at` (nullable)
- `created_at`
- `updated_at`
- `deleted_at` (nullable, if soft delete is selected)

### ExpenseAttachment
- `id` (uuid)
- `expense_id` (unique in v1; one file)
- `storage_bucket`
- `storage_key`
- `mime_type`
- `size_bytes`
- `original_filename`
- `created_at`

Notes:
- Store original uploaded file only in v1 (no derived thumbnails/previews).

### ExpenseVersion
- `id` (uuid)
- `expense_id`
- `version_number`
- `changed_by_user_id`
- `change_reason` (nullable)
- `snapshot_json`
- `created_at`

### AuditEvent
- `id` (uuid)
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action` (e.g. `expense.updated`, `expense.submitted`)
- `metadata_json`
- `created_at`

### OrganizationSettings
- `id` (singleton row)
- `organization_name`
- `currency_code`
- `signup_mode` (`invite_only`, `open`, `both_default_invite`)
- `updated_at`

### Invite (Milestone 1 bootstrap: env-backed tokens)
- `token`
- `expires_at`
- `email` (nullable pre-targeting)
- `created_by_user_id` (nullable)
- `used_at` (nullable)

### Better Auth Infrastructure Tables (Milestone 1 implementation)
- `user`
- `session`
- `account`
- `verification`

Notes:
- These tables are required by Better Auth with Drizzle adapter.
- Domain-level user/role model remains defined by `User` + `RoleAssignment` for v1 business behavior.

## Suggested Indexes
- `expense(status, submitted_at desc)` for finance inbox.
- `expense(member_id, created_at desc)` for member history.
- `expense(project_id, created_at desc)` for scoped manager read.
- `audit_event(entity_type, entity_id, created_at desc)`.
- `expense_attachment(expense_id)` unique.
- `invite(token)` unique.

## Integrity Rules
1. One attachment per expense in v1.
2. Member cannot edit/delete unless status is `draft`.
3. Department is copied from member profile on expense creation.
4. `submitted_at` required when status is `submitted` or `received`.
5. `received_at` required when status is `received`.
6. Expense deletion is soft delete (`deleted_at` set, row retained for audit/version traceability).
7. Attachment object is stored in S3-compatible storage as the original upload.
8. `category` max length is 50 chars.
9. Invite tokens can be used only once and only before expiration.
