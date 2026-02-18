# Email Templates (V1)

## Strategy
- Plain text only in v1.
- Sender display name prefix: `[Open-expense]`.
- Language: English first.

## 1) Member Confirmation

Subject:
`[Open-expense] Expense submitted: {{expense_public_id}}`

Body:
`Hello {{member_name}},`

`Your expense has been submitted successfully.`

`Expense ID: {{expense_public_id}}`
`Date: {{expense_date}}`
`Amount: {{amount}} {{currency_code}}`
`Project: {{project_name}}`
`Status: submitted`

`You will be notified if additional action is required.`

`Open-expense`

## 2) Finance Notification

Subject:
`[Open-expense] New submitted expense: {{expense_public_id}}`

Body:
`Hello Finance Team,`

`A new expense has been submitted.`

`Expense ID: {{expense_public_id}}`
`Member: {{member_name}}`
`Department: {{department_name}}`
`Project: {{project_name}}`
`Date: {{expense_date}}`
`Amount: {{amount}} {{currency_code}}`

`Please review it in the finance inbox.`

`Open-expense`

## Variables
- `expense_public_id`
- `member_name`
- `department_name`
- `project_name`
- `expense_date`
- `amount`
- `currency_code`

## Notes
- Keep templates provider-agnostic (SMTP only).
- HTML version can be added in V2 without changing event triggers.
