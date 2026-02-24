import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { departments, expenseAttachments, expenses, projects, user } from "@/src/db/schema";
import { ExpenseError } from "@/src/lib/expense-errors";
import { type UpsertExpenseInput, validateExpenseInput } from "@/src/lib/expense-validation";

const FINANCE_STATUS_FILTERS = ["all", "draft", "submitted", "received"] as const;
const EDITABLE_FINANCE_STATUSES = new Set<FinanceExpenseStatus>(["submitted", "received"]);

export type FinanceExpenseStatus = "draft" | "submitted" | "received";
export type FinanceStatusFilter = (typeof FINANCE_STATUS_FILTERS)[number];

export type FinanceExpenseRecord = {
  id: string;
  publicId: string;
  memberId: string;
  memberEmail: string;
  amountMinor: number;
  currencyCode: string;
  expenseDate: string;
  category: string;
  paymentMethod: "work_card" | "personal_card";
  comment: string | null;
  departmentId: string | null;
  departmentName: string | null;
  projectId: string | null;
  projectName: string | null;
  status: FinanceExpenseStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  receivedAt: string | null;
  receipt: {
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
  } | null;
};

export type FinanceExpenseFilters = {
  status: FinanceStatusFilter;
  departmentId: string | null;
  projectId: string | null;
};

export type FinanceFilterOptions = {
  departments: Array<{
    id: string;
    name: string;
  }>;
  projects: Array<{
    id: string;
    departmentId: string;
    name: string;
  }>;
};

export type FinanceExpenseListResult = {
  expenses: FinanceExpenseRecord[];
  filters: FinanceExpenseFilters;
  options: FinanceFilterOptions;
};

export type FinanceExpenseUpdatePayload = {
  input: UpsertExpenseInput;
  status: "received" | null;
};

type FinanceStatusTransition = {
  status: FinanceExpenseStatus;
  setReceivedAt: boolean;
};

export function parseFinanceExpenseFilters(searchParams: URLSearchParams): FinanceExpenseFilters {
  const rawStatus = searchParams.get("status")?.trim().toLowerCase();
  const status = parseStatusFilter(rawStatus);
  const departmentId = parseNullableUuid(searchParams.get("departmentId"));
  const projectId = parseNullableUuid(searchParams.get("projectId"));

  return {
    status,
    departmentId,
    projectId,
  };
}

export async function listFinanceExpenses(filters: FinanceExpenseFilters): Promise<FinanceExpenseListResult> {
  const { db } = await import("@/src/db/client");
  const conditions = [isNull(expenses.deletedAt)];

  if (filters.status !== "all") {
    conditions.push(eq(expenses.status, filters.status));
  }

  if (filters.departmentId) {
    conditions.push(eq(expenses.departmentId, filters.departmentId));
  }

  if (filters.projectId) {
    conditions.push(eq(expenses.projectId, filters.projectId));
  }

  const rows = await db
    .select({
      id: expenses.id,
      publicId: expenses.publicId,
      memberId: expenses.memberId,
      memberEmail: user.email,
      amountMinor: expenses.amountMinor,
      currencyCode: expenses.currencyCode,
      expenseDate: expenses.expenseDate,
      category: expenses.category,
      paymentMethod: expenses.paymentMethod,
      comment: expenses.comment,
      departmentId: expenses.departmentId,
      departmentName: departments.name,
      projectId: expenses.projectId,
      projectName: projects.name,
      status: expenses.status,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      submittedAt: expenses.submittedAt,
      receivedAt: expenses.receivedAt,
      receiptOriginalFilename: expenseAttachments.originalFilename,
      receiptMimeType: expenseAttachments.mimeType,
      receiptSizeBytes: expenseAttachments.sizeBytes,
    })
    .from(expenses)
    .innerJoin(user, eq(user.id, expenses.memberId))
    .leftJoin(departments, eq(departments.id, expenses.departmentId))
    .leftJoin(projects, eq(projects.id, expenses.projectId))
    .leftJoin(expenseAttachments, eq(expenseAttachments.expenseId, expenses.id))
    .where(and(...conditions))
    .orderBy(sql`coalesce(${expenses.submittedAt}, ${expenses.createdAt}) desc`, desc(expenses.createdAt));

  const [activeDepartments, activeProjects] = await Promise.all([
    db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.name)),
    db
      .select({ id: projects.id, departmentId: projects.departmentId, name: projects.name })
      .from(projects)
      .where(eq(projects.isActive, true))
      .orderBy(asc(projects.name)),
  ]);

  return {
    expenses: rows.map(toFinanceExpenseRecord),
    filters,
    options: {
      departments: activeDepartments,
      projects: activeProjects,
    },
  };
}

export function parseFinanceExpenseUpdatePayload(body: unknown): FinanceExpenseUpdatePayload {
  if (!isRecord(body)) {
    throw new ExpenseError(400, "invalid_payload", "Request body must be a JSON object.");
  }

  const input: UpsertExpenseInput = {
    amount: parseRequiredString(body.amount, "amount"),
    expenseDate: parseRequiredString(body.expenseDate, "expenseDate"),
    category: parseRequiredString(body.category, "category"),
    paymentMethod: parseRequiredString(body.paymentMethod, "paymentMethod"),
    comment: parseOptionalString(body.comment),
    departmentId: parseOptionalUuidString(body.departmentId, "departmentId"),
    projectId: parseOptionalUuidString(body.projectId, "projectId"),
  };

  const rawStatus = parseOptionalString(body.status)?.toLowerCase();
  if (rawStatus && rawStatus !== "received") {
    throw new ExpenseError(400, "invalid_status_transition", "Status can only be set to received.");
  }

  return {
    input,
    status: rawStatus === "received" ? "received" : null,
  };
}

export function resolveFinanceStatusTransition(
  currentStatus: FinanceExpenseStatus,
  requestedStatus: "received" | null,
): FinanceStatusTransition {
  if (!EDITABLE_FINANCE_STATUSES.has(currentStatus)) {
    throw new ExpenseError(409, "finance_edit_not_allowed", "Only submitted or received expenses can be updated.");
  }

  if (!requestedStatus) {
    return {
      status: currentStatus,
      setReceivedAt: false,
    };
  }

  if (currentStatus === "submitted") {
    return {
      status: "received",
      setReceivedAt: true,
    };
  }

  if (currentStatus === "received") {
    return {
      status: "received",
      setReceivedAt: false,
    };
  }

  throw new ExpenseError(409, "invalid_status_transition", "Unable to apply requested status transition.");
}

export async function updateFinanceExpense(
  expenseId: string,
  payload: FinanceExpenseUpdatePayload,
): Promise<FinanceExpenseRecord> {
  const { db } = await import("@/src/db/client");
  const existingRows = await db
    .select({
      id: expenses.id,
      status: expenses.status,
      receivedAt: expenses.receivedAt,
      deletedAt: expenses.deletedAt,
    })
    .from(expenses)
    .where(eq(expenses.id, expenseId))
    .limit(1);

  const existing = existingRows[0];
  if (!existing || existing.deletedAt) {
    throw new ExpenseError(404, "expense_not_found", "Expense was not found.");
  }

  const transition = resolveFinanceStatusTransition(existing.status, payload.status);
  const validated = validateExpenseInput(payload.input);
  const now = new Date();

  await db
    .update(expenses)
    .set({
      amountMinor: validated.amountMinor,
      expenseDate: validated.expenseDate,
      category: validated.category,
      paymentMethod: validated.paymentMethod,
      comment: validated.comment,
      departmentId: validated.departmentId,
      projectId: validated.projectId,
      status: transition.status,
      receivedAt: transition.status === "received" ? (transition.setReceivedAt ? now : existing.receivedAt ?? now) : null,
      updatedAt: now,
    })
    .where(and(eq(expenses.id, expenseId), isNull(expenses.deletedAt)));

  return getFinanceExpenseById(expenseId);
}

async function getFinanceExpenseById(expenseId: string): Promise<FinanceExpenseRecord> {
  const { db } = await import("@/src/db/client");
  const rows = await db
    .select({
      id: expenses.id,
      publicId: expenses.publicId,
      memberId: expenses.memberId,
      memberEmail: user.email,
      amountMinor: expenses.amountMinor,
      currencyCode: expenses.currencyCode,
      expenseDate: expenses.expenseDate,
      category: expenses.category,
      paymentMethod: expenses.paymentMethod,
      comment: expenses.comment,
      departmentId: expenses.departmentId,
      departmentName: departments.name,
      projectId: expenses.projectId,
      projectName: projects.name,
      status: expenses.status,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      submittedAt: expenses.submittedAt,
      receivedAt: expenses.receivedAt,
      receiptOriginalFilename: expenseAttachments.originalFilename,
      receiptMimeType: expenseAttachments.mimeType,
      receiptSizeBytes: expenseAttachments.sizeBytes,
    })
    .from(expenses)
    .innerJoin(user, eq(user.id, expenses.memberId))
    .leftJoin(departments, eq(departments.id, expenses.departmentId))
    .leftJoin(projects, eq(projects.id, expenses.projectId))
    .leftJoin(expenseAttachments, eq(expenseAttachments.expenseId, expenses.id))
    .where(and(eq(expenses.id, expenseId), isNull(expenses.deletedAt)))
    .limit(1);

  const record = rows[0];
  if (!record) {
    throw new ExpenseError(404, "expense_not_found", "Expense was not found.");
  }

  return toFinanceExpenseRecord(record);
}

function toFinanceExpenseRecord(row: {
  id: string;
  publicId: string;
  memberId: string;
  memberEmail: string;
  amountMinor: number;
  currencyCode: string;
  expenseDate: string;
  category: string;
  paymentMethod: "work_card" | "personal_card";
  comment: string | null;
  departmentId: string | null;
  departmentName: string | null;
  projectId: string | null;
  projectName: string | null;
  status: FinanceExpenseStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  receivedAt: Date | null;
  receiptOriginalFilename: string | null;
  receiptMimeType: string | null;
  receiptSizeBytes: number | null;
}): FinanceExpenseRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    memberId: row.memberId,
    memberEmail: row.memberEmail,
    amountMinor: row.amountMinor,
    currencyCode: row.currencyCode,
    expenseDate: row.expenseDate,
    category: row.category,
    paymentMethod: row.paymentMethod,
    comment: row.comment,
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    projectId: row.projectId,
    projectName: row.projectName,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    receivedAt: row.receivedAt ? row.receivedAt.toISOString() : null,
    receipt:
      row.receiptOriginalFilename && row.receiptMimeType && typeof row.receiptSizeBytes === "number"
        ? {
            originalFilename: row.receiptOriginalFilename,
            mimeType: row.receiptMimeType,
            sizeBytes: row.receiptSizeBytes,
          }
        : null,
  };
}

function parseStatusFilter(value: string | undefined): FinanceStatusFilter {
  if (!value) {
    return "submitted";
  }

  if (isFinanceStatusFilter(value)) {
    return value;
  }

  throw new ExpenseError(400, "invalid_status_filter", "Status filter must be all, draft, submitted, or received.");
}

function isFinanceStatusFilter(value: string): value is FinanceStatusFilter {
  return (FINANCE_STATUS_FILTERS as readonly string[]).includes(value);
}

function parseNullableUuid(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  if (!normalized) {
    return null;
  }

  if (!isUuid(normalized)) {
    throw new ExpenseError(400, "invalid_filter_identifier", "Department/project filters must be UUIDs.");
  }

  return normalized;
}

function parseOptionalUuidString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new ExpenseError(400, "invalid_payload", `${fieldName} must be a string.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  if (!isUuid(normalized)) {
    throw new ExpenseError(400, "invalid_identifier", "Department/project identifiers must be UUIDs.");
  }

  return normalized;
}

function parseRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new ExpenseError(400, "invalid_payload", `${fieldName} is required.`);
  }

  return value;
}

function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ExpenseError(400, "invalid_payload", "Invalid payload field type.");
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
