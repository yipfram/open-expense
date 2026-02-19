import { and, desc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { db } from "@/src/db/client";
import { expenseAttachments, expenses } from "@/src/db/schema";
import { ExpenseError } from "@/src/lib/expense-errors";
import {
  type PaymentMethod,
  type UpsertExpenseInput,
  assertValidReceiptFile,
  validateExpenseInput,
} from "@/src/lib/expense-validation";
import { deleteReceiptFromStorage, uploadReceiptToStorage } from "@/src/lib/storage";

const RECEIPT_KEY_PREFIX = "receipts";
const PUBLIC_ID_DIGITS = 6;

export type ExpenseRecord = {
  id: string;
  publicId: string;
  amountMinor: number;
  currencyCode: string;
  expenseDate: string;
  category: string;
  paymentMethod: PaymentMethod;
  comment: string | null;
  departmentId: string | null;
  projectId: string | null;
  status: "draft" | "submitted" | "received";
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  receipt: {
    id: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
  } | null;
};


export async function listMemberExpenses(memberId: string): Promise<ExpenseRecord[]> {
  const rows = await db
    .select({
      id: expenses.id,
      publicId: expenses.publicId,
      amountMinor: expenses.amountMinor,
      currencyCode: expenses.currencyCode,
      expenseDate: expenses.expenseDate,
      category: expenses.category,
      paymentMethod: expenses.paymentMethod,
      comment: expenses.comment,
      departmentId: expenses.departmentId,
      projectId: expenses.projectId,
      status: expenses.status,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      submittedAt: expenses.submittedAt,
      attachmentId: expenseAttachments.id,
      attachmentOriginalFilename: expenseAttachments.originalFilename,
      attachmentMimeType: expenseAttachments.mimeType,
      attachmentSizeBytes: expenseAttachments.sizeBytes,
    })
    .from(expenses)
    .leftJoin(expenseAttachments, eq(expenseAttachments.expenseId, expenses.id))
    .where(and(eq(expenses.memberId, memberId), isNull(expenses.deletedAt)))
    .orderBy(desc(expenses.createdAt));

  return rows.map((row) => ({
    id: row.id,
    publicId: row.publicId,
    amountMinor: row.amountMinor,
    currencyCode: row.currencyCode,
    expenseDate: row.expenseDate,
    category: row.category,
    paymentMethod: row.paymentMethod,
    comment: row.comment,
    departmentId: row.departmentId,
    projectId: row.projectId,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    receipt: row.attachmentId
      ? {
          id: row.attachmentId,
          originalFilename: row.attachmentOriginalFilename ?? "receipt",
          mimeType: row.attachmentMimeType ?? "application/octet-stream",
          sizeBytes: row.attachmentSizeBytes ?? 0,
        }
      : null,
  }));
}

export async function createDraftExpense(memberId: string, input: UpsertExpenseInput, receipt: File): Promise<ExpenseRecord> {
  const payload = validateExpenseInput(input);
  assertValidReceiptFile(receipt);

  const now = new Date();
  const publicId = await nextPublicExpenseId(now);

  const inserted = await db
    .insert(expenses)
    .values({
      publicId,
      memberId,
      departmentId: payload.departmentId,
      projectId: payload.projectId,
      amountMinor: payload.amountMinor,
      currencyCode: "EUR",
      expenseDate: payload.expenseDate,
      category: payload.category,
      paymentMethod: payload.paymentMethod,
      comment: payload.comment,
      status: "draft",
    })
    .returning({ id: expenses.id });

  const expense = inserted[0];
  if (!expense) {
    throw new ExpenseError(500, "expense_create_failed", "Unable to create expense draft.");
  }

  await saveReceiptAttachment(expense.id, receipt);
  return getMemberExpenseById(memberId, expense.id);
}

export async function updateDraftExpense(
  memberId: string,
  expenseId: string,
  input: UpsertExpenseInput,
  receipt: File | null,
): Promise<ExpenseRecord> {
  const payload = validateExpenseInput(input);
  const existing = await requireOwnedDraftExpense(memberId, expenseId);

  await db
    .update(expenses)
    .set({
      amountMinor: payload.amountMinor,
      expenseDate: payload.expenseDate,
      category: payload.category,
      paymentMethod: payload.paymentMethod,
      comment: payload.comment,
      departmentId: payload.departmentId,
      projectId: payload.projectId,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, existing.id));

  if (receipt) {
    assertValidReceiptFile(receipt);
    await saveReceiptAttachment(existing.id, receipt);
  }

  return getMemberExpenseById(memberId, existing.id);
}

export async function deleteDraftExpense(memberId: string, expenseId: string): Promise<void> {
  const existing = await requireOwnedDraftExpense(memberId, expenseId);

  await db
    .update(expenses)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(expenses.id, existing.id));
}

export async function submitDraftExpense(memberId: string, expenseId: string): Promise<ExpenseRecord> {
  const existing = await requireOwnedDraftExpense(memberId, expenseId);

  const attachment = await db
    .select({ id: expenseAttachments.id })
    .from(expenseAttachments)
    .where(eq(expenseAttachments.expenseId, existing.id))
    .limit(1);

  if (!attachment[0]) {
    throw new ExpenseError(400, "missing_receipt", "A receipt file is required before submission.");
  }

  await db
    .update(expenses)
    .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(expenses.id, existing.id));

  return getMemberExpenseById(memberId, existing.id);
}

export async function parseExpenseFormData(formData: FormData): Promise<{ input: UpsertExpenseInput; receipt: File | null }> {
  const input: UpsertExpenseInput = {
    amount: String(formData.get("amount") ?? ""),
    expenseDate: String(formData.get("expenseDate") ?? ""),
    category: String(formData.get("category") ?? ""),
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    comment: String(formData.get("comment") ?? ""),
    departmentId: String(formData.get("departmentId") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
  };

  const candidate = formData.get("receipt");
  const receipt = candidate instanceof File && candidate.size > 0 ? candidate : null;

  return { input, receipt };
}

async function saveReceiptAttachment(expenseId: string, file: File) {
  const existing = await db
    .select({ id: expenseAttachments.id, storageKey: expenseAttachments.storageKey })
    .from(expenseAttachments)
    .where(eq(expenseAttachments.expenseId, expenseId))
    .limit(1);

  const storage = await uploadReceiptFile(expenseId, file);

  if (existing[0]) {
    if (existing[0].storageKey) {
      await deleteReceiptSafely(existing[0].storageKey);
    }

    await db
      .update(expenseAttachments)
      .set({
        storageBucket: storage.bucket,
        storageKey: storage.key,
        mimeType: file.type,
        sizeBytes: file.size,
        originalFilename: sanitizeFilename(file.name),
      })
      .where(eq(expenseAttachments.id, existing[0].id));

    return;
  }

  await db.insert(expenseAttachments).values({
    expenseId,
    storageBucket: storage.bucket,
    storageKey: storage.key,
    mimeType: file.type,
    sizeBytes: file.size,
    originalFilename: sanitizeFilename(file.name),
  });
}

async function uploadReceiptFile(expenseId: string, file: File) {
  const extension = extname(file.name).toLowerCase();
  const filename = `${expenseId}-${randomUUID()}${extension}`;
  const storageKey = `${RECEIPT_KEY_PREFIX}/${new Date().getUTCFullYear()}/${filename}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return await uploadReceiptToStorage({
      key: storageKey,
      body: bytes,
      contentType: file.type,
    });
  } catch {
    throw new ExpenseError(503, "storage_unavailable", "Receipt storage is temporarily unavailable.");
  }
}

async function deleteReceiptSafely(storageKey: string) {
  try {
    await deleteReceiptFromStorage(storageKey);
  } catch {
    // Ignore storage cleanup failures to avoid blocking draft updates.
  }
}

async function requireOwnedDraftExpense(memberId: string, expenseId: string) {
  const rows = await db
    .select({ id: expenses.id, status: expenses.status })
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.memberId, memberId), isNull(expenses.deletedAt)))
    .limit(1);

  const expense = rows[0];
  if (!expense) {
    throw new ExpenseError(404, "expense_not_found", "Expense was not found.");
  }

  if (expense.status !== "draft") {
    throw new ExpenseError(409, "expense_not_draft", "Only draft expenses can be changed.");
  }

  return expense;
}

async function getMemberExpenseById(memberId: string, expenseId: string): Promise<ExpenseRecord> {
  const rows = await db
    .select({
      id: expenses.id,
      publicId: expenses.publicId,
      amountMinor: expenses.amountMinor,
      currencyCode: expenses.currencyCode,
      expenseDate: expenses.expenseDate,
      category: expenses.category,
      paymentMethod: expenses.paymentMethod,
      comment: expenses.comment,
      departmentId: expenses.departmentId,
      projectId: expenses.projectId,
      status: expenses.status,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      submittedAt: expenses.submittedAt,
      attachmentId: expenseAttachments.id,
      attachmentOriginalFilename: expenseAttachments.originalFilename,
      attachmentMimeType: expenseAttachments.mimeType,
      attachmentSizeBytes: expenseAttachments.sizeBytes,
    })
    .from(expenses)
    .leftJoin(expenseAttachments, eq(expenseAttachments.expenseId, expenses.id))
    .where(and(eq(expenses.id, expenseId), eq(expenses.memberId, memberId), isNull(expenses.deletedAt)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new ExpenseError(404, "expense_not_found", "Expense was not found.");
  }

  return {
    id: row.id,
    publicId: row.publicId,
    amountMinor: row.amountMinor,
    currencyCode: row.currencyCode,
    expenseDate: row.expenseDate,
    category: row.category,
    paymentMethod: row.paymentMethod,
    comment: row.comment,
    departmentId: row.departmentId,
    projectId: row.projectId,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    receipt: row.attachmentId
      ? {
          id: row.attachmentId,
          originalFilename: row.attachmentOriginalFilename ?? "receipt",
          mimeType: row.attachmentMimeType ?? "application/octet-stream",
          sizeBytes: row.attachmentSizeBytes ?? 0,
        }
      : null,
  };
}

async function nextPublicExpenseId(date: Date): Promise<string> {
  const year = date.getUTCFullYear();
  const prefix = `EXP-${year}-`;
  let attempt = 0;

  while (attempt < 5) {
    attempt += 1;
    const candidate = `${prefix}${String(Math.floor(Math.random() * 1_000_000)).padStart(PUBLIC_ID_DIGITS, "0")}`;
    const rows = await db.select({ publicId: expenses.publicId }).from(expenses).where(eq(expenses.publicId, candidate)).limit(1);
    if (rows.length === 0) {
      return candidate;
    }
  }

  throw new ExpenseError(503, "public_id_generation_failed", "Unable to generate expense identifier.");
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255) || "receipt";
}
