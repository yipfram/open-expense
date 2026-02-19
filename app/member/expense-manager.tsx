"use client";

import { useEffect, useMemo, useState } from "react";

type PaymentMethod = "work_card" | "personal_card";
type ExpenseStatus = "draft" | "submitted" | "received";

type Expense = {
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
  status: ExpenseStatus;
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

type ApiResponseError = {
  error?: string;
  requestId?: string;
};

type FormState = {
  amount: string;
  expenseDate: string;
  category: string;
  paymentMethod: PaymentMethod;
  comment: string;
};

const INITIAL_FORM: FormState = {
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  category: "",
  paymentMethod: "personal_card",
  comment: "",
};

export function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const selectedExpense = useMemo(
    () => expenses.find((expense) => expense.id === selectedExpenseId) ?? null,
    [expenses, selectedExpenseId],
  );

  useEffect(() => {
    void loadExpenses();
  }, []);

  useEffect(() => {
    if (!selectedExpense) {
      setFormState(INITIAL_FORM);
      return;
    }

    setFormState({
      amount: (selectedExpense.amountMinor / 100).toFixed(2),
      expenseDate: selectedExpense.expenseDate,
      category: selectedExpense.category,
      paymentMethod: selectedExpense.paymentMethod,
      comment: selectedExpense.comment ?? "",
    });
  }, [selectedExpense]);

  async function loadExpenses() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/member/expenses", { method: "GET" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponseError;
        setError(data.error ?? "Unable to load expenses.");
        return;
      }

      const data = (await response.json()) as { expenses?: Expense[] };
      setExpenses(data.expenses ?? []);
    } catch {
      setError("Network error while loading expenses.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setSelectedExpenseId(null);
    setFormState(INITIAL_FORM);
    setReceiptFile(null);
    setError("");
    setFeedback("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setFeedback("");

    const body = new FormData();
    body.set("amount", formState.amount);
    body.set("expenseDate", formState.expenseDate);
    body.set("category", formState.category);
    body.set("paymentMethod", formState.paymentMethod);
    body.set("comment", formState.comment);
    if (receiptFile) {
      body.set("receipt", receiptFile);
    }

    try {
      const method = selectedExpenseId ? "PUT" : "POST";
      const url = selectedExpenseId ? `/api/member/expenses/${selectedExpenseId}` : "/api/member/expenses";

      if (!selectedExpenseId && !receiptFile) {
        setError("Receipt is required when creating a draft.");
        setIsSaving(false);
        return;
      }

      const response = await fetch(url, {
        method,
        body,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponseError;
        setError(data.error ?? "Unable to save expense.");
        return;
      }

      const data = (await response.json()) as { expense: Expense };
      const updated = data.expense;

      setExpenses((previous) => {
        const rest = previous.filter((expense) => expense.id !== updated.id);
        return [updated, ...rest];
      });

      setSelectedExpenseId(updated.id);
      setReceiptFile(null);
      setFeedback(selectedExpenseId ? "Draft updated." : "Draft created.");
    } catch {
      setError("Network error while saving expense.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedExpenseId) {
      return;
    }

    setIsSaving(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch(`/api/member/expenses/${selectedExpenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponseError;
        setError(data.error ?? "Unable to delete draft.");
        return;
      }

      setExpenses((previous) => previous.filter((expense) => expense.id !== selectedExpenseId));
      resetForm();
      setFeedback("Draft deleted.");
    } catch {
      setError("Network error while deleting expense.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitDraft(expenseId: string) {
    setIsSaving(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch(`/api/member/expenses/${expenseId}/submit`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponseError;
        setError(data.error ?? "Unable to submit draft.");
        return;
      }

      const data = (await response.json()) as { expense: Expense };
      const updated = data.expense;

      setExpenses((previous) => {
        const rest = previous.filter((expense) => expense.id !== updated.id);
        return [updated, ...rest];
      });

      if (selectedExpenseId === updated.id) {
        setSelectedExpenseId(updated.id);
      }

      setFeedback(`Expense ${updated.publicId} submitted.`);
    } catch {
      setError("Network error while submitting expense.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">My expenses</h2>
          <button
            type="button"
            onClick={() => void loadExpenses()}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No expenses yet. Create your first draft.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {expenses.map((expense) => {
              const isSelected = expense.id === selectedExpenseId;
              return (
                <li key={expense.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedExpenseId(expense.id)}
                    className={`w-full rounded-lg border p-3 text-left ${
                      isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{expense.publicId}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          expense.status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : expense.status === "submitted"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {expense.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">
                      {(expense.amountMinor / 100).toFixed(2)} {expense.currencyCode} • {expense.category}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(expense.createdAt).toLocaleString()}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{selectedExpense ? "Edit draft" : "Create draft"}</h2>
          {selectedExpense ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs"
            >
              New draft
            </button>
          ) : null}
        </div>

        <form className="mt-4 grid gap-3" onSubmit={handleSave}>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Amount (EUR)</span>
            <input
              required
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={formState.amount}
              onChange={(event) => setFormState((previous) => ({ ...previous, amount: event.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Expense date</span>
            <input
              required
              name="expenseDate"
              type="date"
              value={formState.expenseDate}
              onChange={(event) => setFormState((previous) => ({ ...previous, expenseDate: event.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Category</span>
            <input
              required
              maxLength={50}
              name="category"
              value={formState.category}
              onChange={(event) => setFormState((previous) => ({ ...previous, category: event.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
              placeholder="Transport"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Payment method</span>
            <select
              name="paymentMethod"
              value={formState.paymentMethod}
              onChange={(event) =>
                setFormState((previous) => ({ ...previous, paymentMethod: event.target.value as PaymentMethod }))
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
            >
              <option value="personal_card">Personal card</option>
              <option value="work_card">Work card</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Comment</span>
            <textarea
              name="comment"
              maxLength={500}
              value={formState.comment}
              onChange={(event) => setFormState((previous) => ({ ...previous, comment: event.target.value }))}
              className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
              placeholder="Optional details"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">
              Receipt ({selectedExpense ? "replace optional" : "required"}, jpg/png/pdf, max 10 MB)
            </span>
            <input
              name="receipt"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
            />
          </label>

          {selectedExpense?.receipt ? (
            <p className="text-xs text-slate-600">
              Current receipt: {selectedExpense.receipt.originalFilename} ({Math.ceil(selectedExpense.receipt.sizeBytes / 1024)} KB)
            </p>
          ) : null}

          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            <button
              type="submit"
              disabled={isSaving || (selectedExpense?.status !== undefined && selectedExpense.status !== "draft")}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : selectedExpense ? "Update draft" : "Create draft"}
            </button>
            {selectedExpense ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving || selectedExpense.status !== "draft"}
                className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
              >
                Delete draft
              </button>
            ) : null}
          </div>
        </form>

        {selectedExpense && selectedExpense.status === "draft" ? (
          <button
            type="button"
            onClick={() => void handleSubmitDraft(selectedExpense.id)}
            disabled={isSaving}
            className="mt-4 w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            Submit expense
          </button>
        ) : null}

        {feedback ? <p className="mt-3 text-sm text-emerald-700">{feedback}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </div>
    </section>
  );
}
