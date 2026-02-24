"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, RefreshCw } from "lucide-react";

import { ReceiptPreview } from "@/app/app/expense/[id]/receipt-preview";
import { TableSkeleton } from "@/app/ui/list-skeletons";
import { canCorrectInProcessView, getFinanceProcessStatusMeta } from "@/src/lib/finance-process";

type ExpenseStatus = "draft" | "submitted" | "received";
type FinanceStatusFilter = "all" | ExpenseStatus;
type PaymentMethod = "work_card" | "personal_card";

type FinanceExpense = {
  id: string;
  publicId: string;
  memberId: string;
  memberEmail: string;
  amountMinor: number;
  currencyCode: string;
  expenseDate: string;
  category: string;
  paymentMethod: PaymentMethod;
  comment: string | null;
  departmentId: string | null;
  departmentName: string | null;
  projectId: string | null;
  projectName: string | null;
  status: ExpenseStatus;
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

type FinanceFilterOptions = {
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

type FinanceFilters = {
  status: FinanceStatusFilter;
  departmentId: string | null;
  projectId: string | null;
};

type FinanceEditForm = {
  amount: string;
  expenseDate: string;
  category: string;
  paymentMethod: PaymentMethod;
  comment: string;
  departmentId: string | null;
  projectId: string | null;
};

type FinanceListResponse = {
  expenses?: FinanceExpense[];
  options?: FinanceFilterOptions;
};

type ApiResponseError = {
  error?: string;
};

type FinanceInboxProps = {
  userEmail: string;
};

const INITIAL_FILTERS: FinanceFilters = {
  status: "submitted",
  departmentId: null,
  projectId: null,
};

const INITIAL_OPTIONS: FinanceFilterOptions = {
  departments: [],
  projects: [],
};

const INITIAL_FORM: FinanceEditForm = {
  amount: "",
  expenseDate: "",
  category: "",
  paymentMethod: "personal_card",
  comment: "",
  departmentId: null,
  projectId: null,
};

export function FinanceInbox({ userEmail }: FinanceInboxProps) {
  const [filters, setFilters] = useState<FinanceFilters>(INITIAL_FILTERS);
  const [options, setOptions] = useState<FinanceFilterOptions>(INITIAL_OPTIONS);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FinanceEditForm>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validatingExpenseId, setValidatingExpenseId] = useState<string | null>(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const selectedExpense = useMemo(
    () => expenses.find((expense) => expense.id === selectedExpenseId) ?? null,
    [expenses, selectedExpenseId],
  );

  const filterProjects = useMemo(() => {
    if (!filters.departmentId) {
      return options.projects;
    }

    return options.projects.filter((project) => project.departmentId === filters.departmentId);
  }, [filters.departmentId, options.projects]);

  const formProjects = useMemo(() => {
    if (!formState.departmentId) {
      return options.projects;
    }

    return options.projects.filter((project) => project.departmentId === formState.departmentId);
  }, [formState.departmentId, options.projects]);

  const canCorrectSelectedExpense = selectedExpense ? canCorrectInProcessView(selectedExpense.status) : false;
  const useSplitLayout = canCorrectSelectedExpense && isCorrectionOpen;

  const loadExpenses = useCallback(async (nextFilters: FinanceFilters) => {
    setIsLoading(true);
    setError("");

    try {
      const query = buildFiltersQuery(nextFilters);
      const response = await fetch(`/api/finance/expenses?${query.toString()}`, { method: "GET" });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponseError;
        setError(data.error ?? "Unable to load finance expenses.");
        return;
      }

      const data = (await response.json()) as FinanceListResponse;
      const nextExpenses = data.expenses ?? [];
      const nextOptions = data.options ?? INITIAL_OPTIONS;

      setOptions(nextOptions);
      setExpenses(nextExpenses);
      setSelectedExpenseId((previous) => {
        if (previous && nextExpenses.some((expense) => expense.id === previous)) {
          return previous;
        }
        return null;
      });
    } catch {
      setError("Network error while loading finance expenses.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExpenses(filters);
  }, [filters, loadExpenses]);

  useEffect(() => {
    if (!selectedExpense) {
      setFormState(INITIAL_FORM);
      setIsCorrectionOpen(false);
      return;
    }

    setFormState({
      amount: (selectedExpense.amountMinor / 100).toFixed(2),
      expenseDate: selectedExpense.expenseDate,
      category: selectedExpense.category,
      paymentMethod: selectedExpense.paymentMethod,
      comment: selectedExpense.comment ?? "",
      departmentId: selectedExpense.departmentId,
      projectId: selectedExpense.projectId,
    });
    setIsCorrectionOpen(false);
  }, [selectedExpense]);

  async function handleSaveCorrection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedExpense) {
      return;
    }

    setIsSaving(true);
    setError("");
    setFeedback("");

    const payload = {
      amount: formState.amount,
      expenseDate: formState.expenseDate,
      category: formState.category,
      paymentMethod: formState.paymentMethod,
      comment: formState.comment,
      departmentId: formState.departmentId ?? "",
      projectId: formState.projectId ?? "",
    };

    try {
      const response = await fetch(`/api/finance/expenses/${selectedExpense.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponseError;
        setError(data.error ?? "Unable to save correction.");
        return;
      }

      const data = (await response.json()) as { expense: FinanceExpense };
      const updated = data.expense;
      setExpenses((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedExpenseId(updated.id);
      setFeedback(`Correction saved for ${updated.publicId}.`);
    } catch {
      setError("Network error while saving correction.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleValidate(expenseId: string) {
    setValidatingExpenseId(expenseId);
    setError("");
    setFeedback("");

    try {
      const response = await fetch(`/api/finance/expenses/${expenseId}/validate`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponseError;
        setError(data.error ?? "Unable to validate expense.");
        return;
      }

      const data = (await response.json()) as { expense: FinanceExpense };
      const updated = data.expense;

      if (filters.status === "submitted") {
        await loadExpenses(filters);
      } else {
        setExpenses((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
        setSelectedExpenseId(updated.id);
      }

      setFeedback(`Expense ${updated.publicId} validated.`);
    } catch {
      setError("Network error while validating expense.");
    } finally {
      setValidatingExpenseId(null);
    }
  }

  function openCorrectionForm() {
    if (!canCorrectSelectedExpense) {
      setFeedback("This expense is already validated and can no longer be edited.");
      return;
    }

    setIsCorrectionOpen(true);
  }

  return (
    <section className="min-w-0 space-y-6">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Process inbox</h2>
            <p className="text-sm text-slate-600">Validate expenses from the table, then open details only if needed.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadExpenses(filters)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw aria-hidden className="h-4 w-4" />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  status: event.target.value as FinanceStatusFilter,
                }))
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="submitted">To validate</option>
              <option value="received">Validated</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Department</span>
            <select
              value={filters.departmentId ?? ""}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  departmentId: event.target.value || null,
                  projectId: null,
                }))
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
            >
              <option value="">All departments</option>
              {options.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Project</span>
            <select
              value={filters.projectId ?? ""}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  projectId: event.target.value || null,
                }))
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
            >
              <option value="">All projects</option>
              {filterProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
        {feedback ? <p className="mb-3 text-sm text-emerald-700">{feedback}</p> : null}

        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : expenses.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No expenses match the current filters.
          </p>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Expense</th>
                  <th className="px-3 py-2 font-semibold">Member</th>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Amount</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Department</th>
                  <th className="px-3 py-2 font-semibold">Project</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => {
                  const statusMeta = getFinanceProcessStatusMeta(expense.status);
                  const isSelected = expense.id === selectedExpenseId;
                  const activityDate = expense.submittedAt ?? expense.createdAt;
                  const canValidate = expense.status === "submitted";
                  const isValidating = validatingExpenseId === expense.id;

                  return (
                    <tr
                      key={expense.id}
                      onClick={() => setSelectedExpenseId((previous) => (previous === expense.id ? null : expense.id))}
                      className={`cursor-pointer border-t border-slate-200 ${
                        isSelected ? "bg-slate-100" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900">{expense.publicId}</p>
                        <p className="text-xs text-slate-600">{expense.category}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{expense.memberEmail}</td>
                      <td className="px-3 py-2 text-slate-700">{toDateLabel(activityDate)}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {(expense.amountMinor / 100).toFixed(2)} {expense.currencyCode}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{expense.departmentName ?? expense.departmentId ?? "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{expense.projectName ?? expense.projectId ?? "-"}</td>
                      <td className="px-3 py-2">
                        {canValidate ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleValidate(expense.id);
                            }}
                            disabled={isValidating}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                          >
                            <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
                            {isValidating ? "Validating..." : "Validate"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedExpense ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <header className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">{selectedExpense.category}</h3>
            <p className="text-sm text-slate-600">
              Expense {selectedExpense.publicId} - {selectedExpense.memberEmail}
            </p>
          </header>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleValidate(selectedExpense.id)}
              disabled={selectedExpense.status !== "submitted" || validatingExpenseId === selectedExpense.id}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              {validatingExpenseId === selectedExpense.id ? "Validating..." : "Validate expense"}
            </button>

            <button
              type="button"
              onClick={openCorrectionForm}
              disabled={!canCorrectSelectedExpense}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit
            </button>

            {selectedExpense.status === "received" ? (
              <p className="text-xs font-medium text-emerald-700">Expense already validated.</p>
            ) : null}
          </div>

          <div className={`mt-4 grid gap-6 ${useSplitLayout ? "xl:grid-cols-[1.2fr_1fr]" : "grid-cols-1"}`}>
            <section className="space-y-4">
              {selectedExpense.receipt?.mimeType.startsWith("image/") ? (
                <ReceiptPreview src={`/api/expenses/${selectedExpense.id}/receipt`} alt={`Receipt ${selectedExpense.publicId}`} />
              ) : null}

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-slate-600">Date</dt>
                    <dd className="text-slate-900">{toDateLabel(selectedExpense.expenseDate)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Amount</dt>
                    <dd className="text-slate-900">
                      {(selectedExpense.amountMinor / 100).toFixed(2)} {selectedExpense.currencyCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Status</dt>
                    <dd className="text-slate-900">{getFinanceProcessStatusMeta(selectedExpense.status).label}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Payment method</dt>
                    <dd className="text-slate-900">{selectedExpense.paymentMethod}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Department</dt>
                    <dd className="break-all text-slate-900">{selectedExpense.departmentName ?? selectedExpense.departmentId ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Project</dt>
                    <dd className="break-all text-slate-900">{selectedExpense.projectName ?? selectedExpense.projectId ?? "-"}</dd>
                  </div>
                  {selectedExpense.comment ? (
                    <div className="sm:col-span-2">
                      <dt className="font-medium text-slate-600">Comment</dt>
                      <dd className="whitespace-pre-wrap text-slate-900">{selectedExpense.comment}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              {selectedExpense.receipt ? (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-base font-semibold text-slate-900">Receipt file</h4>
                  <p className="mt-2 break-all text-sm text-slate-700">{selectedExpense.receipt.originalFilename}</p>
                  <p className="text-xs text-slate-600">
                    {selectedExpense.receipt.mimeType} - {Math.ceil(selectedExpense.receipt.sizeBytes / 1024)} KB
                  </p>
                  <p className="mt-3">
                    <a
                      className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                      href={`/api/expenses/${selectedExpense.id}/receipt?download=1`}
                    >
                      Download receipt
                    </a>
                  </p>
                </section>
              ) : null}
            </section>

            <section className="self-start rounded-xl border border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setIsCorrectionOpen((previous) => !previous)}
                disabled={!canCorrectSelectedExpense}
                className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-1 text-left disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Correct details</h4>
                  <p className="text-xs text-slate-600">Optional - use only when submitted data needs correction.</p>
                </div>
                <ChevronDown
                  aria-hidden
                  className={`h-4 w-4 text-slate-500 transition ${isCorrectionOpen ? "rotate-180" : "rotate-0"}`}
                />
              </button>

              {!canCorrectSelectedExpense ? (
                <p className="mt-3 text-sm text-slate-600">Corrections are locked because this expense is already validated.</p>
              ) : null}

              {canCorrectSelectedExpense && isCorrectionOpen ? (
                <form className="mt-4 grid gap-3" onSubmit={(event) => void handleSaveCorrection(event)}>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-slate-700">Amount</span>
                    <input
                      required
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
                      value={formState.category}
                      onChange={(event) => setFormState((previous) => ({ ...previous, category: event.target.value }))}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-slate-700">Payment method</span>
                    <select
                      value={formState.paymentMethod}
                      onChange={(event) =>
                        setFormState((previous) => ({
                          ...previous,
                          paymentMethod: event.target.value as PaymentMethod,
                        }))
                      }
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
                    >
                      <option value="personal_card">Personal card</option>
                      <option value="work_card">Work card</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-slate-700">Department</span>
                    <select
                      value={formState.departmentId ?? ""}
                      onChange={(event) =>
                        setFormState((previous) => ({
                          ...previous,
                          departmentId: event.target.value || null,
                          projectId: null,
                        }))
                      }
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
                    >
                      <option value="">No department</option>
                      {options.departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-slate-700">Project</span>
                    <select
                      value={formState.projectId ?? ""}
                      onChange={(event) =>
                        setFormState((previous) => ({
                          ...previous,
                          projectId: event.target.value || null,
                        }))
                      }
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
                    >
                      <option value="">No project</option>
                      {formProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-slate-700">Comment</span>
                    <textarea
                      maxLength={500}
                      value={formState.comment}
                      onChange={(event) => setFormState((previous) => ({ ...previous, comment: event.target.value }))}
                      className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save correction"}
                  </button>
                </form>
              ) : null}

              <p className="mt-4 break-all text-xs text-slate-600">Processed by: {userEmail}</p>
            </section>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function buildFiltersQuery(filters: FinanceFilters): URLSearchParams {
  const query = new URLSearchParams();
  query.set("status", filters.status);

  if (filters.departmentId) {
    query.set("departmentId", filters.departmentId);
  }

  if (filters.projectId) {
    query.set("projectId", filters.projectId);
  }

  return query;
}

function toDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}
