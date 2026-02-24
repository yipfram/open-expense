# Permissions Matrix (V1)

Legend:
- `C` create
- `R` read
- `U` update
- `D` delete

## Roles
- Member
- Member+Manager
- Finance
- Admin

## Expense Actions
| Action | Member | Member+Manager | Finance | Admin |
|---|---|---|---|---|
| Create draft expense | C | C | C | C |
| Read own expenses | R | R | R | R |
| Read all expenses | - | Scoped R | R | R |
| Edit own draft | U | U | U | U |
| Delete own draft | D | D | D | D |
| Edit submitted own expense | - | - | U | U |
| Edit received own expense | - | - | - | - |
| Change status to submitted | U (own draft) | U (own draft) | U | U |
| Change status to received | - | - | U | U |
| Reassign department/project | - | - | U | U |

Notes:
- Member edits/deletes are allowed only in `draft`.
- Scoped manager access means only assigned department(s)/project(s).
- In process workflow, finance/admin corrections are allowed only while expense is `submitted`.
- Internal status `received` is displayed in UI as `Validated`.

## Configuration Actions
| Action | Member | Member+Manager | Finance | Admin |
|---|---|---|---|---|
| Manage departments | - | - | U | U |
| Manage projects | - | - | U | U |
| Configure signup mode | - | - | - | U |
| Configure organization currency | - | - | - | U |
| Manage invites | - | - | U | U |

## Audit and Visibility
| Action | Member | Member+Manager | Finance | Admin |
|---|---|---|---|---|
| View own change history | R | R | R | R |
| View full audit trail | - | - | - | R |

## Route and View Access (V1)
- Canonical protected workspace path: `/app`.
- Workspace views:
  - `view=member`: member, manager, finance, admin
  - `view=process`: finance, admin
  - `view=finance`: finance, admin (legacy compatibility alias)
- Expense detail route: `/app/expense/[id]`
  - owner can read
  - manager can read if scope matches department/project assignment
  - finance and admin can read
- Canonical admin settings path: `/settings` (admin only).
- Legacy role-scoped page routes (`/member`, `/finance`, `/admin`) are not used.
- UI labels are task-based:
  - `Submit` maps to `view=member`
  - `Process` maps to `view=process`
