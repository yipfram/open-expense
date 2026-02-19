import { extname } from "node:path";

import { paymentMethodEnum } from "@/src/db/schema";
import { ExpenseError } from "@/src/lib/expense-errors";

const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_RECEIPT_MIME = new Set(["image/jpeg", "image/png", "application/pdf"]);
const ALLOWED_RECEIPT_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];

export type UpsertExpenseInput = {
  amount: string;
  expenseDate: string;
  category: string;
  paymentMethod: string;
  comment?: string;
  departmentId?: string;
  projectId?: string;
};

export function validateExpenseInput(input: UpsertExpenseInput) {
  const amountValue = Number(input.amount);
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    throw new ExpenseError(400, "invalid_amount", "Amount must be greater than 0.");
  }

  const amountMinor = Math.round(amountValue * 100);
  if (amountMinor <= 0) {
    throw new ExpenseError(400, "invalid_amount", "Amount must be greater than 0.");
  }

  const expenseDate = input.expenseDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    throw new ExpenseError(400, "invalid_expense_date", "Expense date must use YYYY-MM-DD.");
  }

  const category = input.category.trim();
  if (!category || category.length > 50) {
    throw new ExpenseError(400, "invalid_category", "Category is required and must be 50 chars or fewer.");
  }

  const paymentMethod = normalizePaymentMethod(input.paymentMethod);
  if (!paymentMethod) {
    throw new ExpenseError(400, "invalid_payment_method", "Payment method must be work_card or personal_card.");
  }

  const comment = input.comment?.trim() || null;
  if (comment && comment.length > 500) {
    throw new ExpenseError(400, "invalid_comment", "Comment must be 500 chars or fewer.");
  }

  const departmentId = normalizeNullableUuid(input.departmentId);
  const projectId = normalizeNullableUuid(input.projectId);

  return {
    amountMinor,
    expenseDate,
    category,
    paymentMethod,
    comment,
    departmentId,
    projectId,
  };
}

export function assertValidReceiptFile(file: File) {
  if (file.size <= 0) {
    throw new ExpenseError(400, "empty_receipt", "Receipt file is empty.");
  }

  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    throw new ExpenseError(400, "receipt_too_large", "Receipt file must be 10 MB or smaller.");
  }

  const mimeType = file.type.toLowerCase();
  const extension = extname(file.name).toLowerCase();

  if (!ALLOWED_RECEIPT_MIME.has(mimeType) || !ALLOWED_RECEIPT_EXTENSIONS.has(extension)) {
    throw new ExpenseError(400, "invalid_receipt_type", "Receipt must be JPG, PNG, or PDF.");
  }
}

function normalizePaymentMethod(value: string): PaymentMethod | null {
  const normalized = value.trim().toLowerCase();
  return normalized === "work_card" || normalized === "personal_card" ? normalized : null;
}

function normalizeNullableUuid(value?: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return null;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized);
  if (!isUuid) {
    throw new ExpenseError(400, "invalid_identifier", "Department/project identifiers must be UUIDs.");
  }

  return normalized;
}
