"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Camera,
  Car,
  Coffee,
  Download,
  FileText,
  Filter,
  Home,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plane,
  Plus,
  ReceiptText,
  RefreshCw,
  Settings,
  Upload,
  User,
} from "lucide-react";

import { FinanceInbox } from "@/app/finance/finance-inbox";
import { CardListSkeleton } from "@/app/ui/list-skeletons";
import { signOutAction } from "@/app/actions";
import { calculateMemberDashboardStats, getExpenseStatusMeta } from "@/src/lib/member-dashboard";
import { SETTINGS_PATH, WORKSPACE_PATH } from "@/src/lib/routes";

type PaymentMethod = "work_card" | "personal_card";
type ExpenseStatus = "draft" | "submitted" | "received";
type MemberShellSection = "home" | "reports" | "history" | "profile" | "process";

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

type ExpenseManagerProps = {
  userEmail: string;
  userName?: string | null;
  isAdmin: boolean;
  canAccessFinanceView: boolean;
  initialSection?: MemberShellSection;
};

type MemberDashboardStats = {
  submittedCount: number;
  submittedTotalMinor: number;
};

type MemberExpenseFilters = {
  status: ExpenseStatus | "all";
  categoryQuery: string;
};

const INITIAL_FORM: FormState = {
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  category: "",
  paymentMethod: "personal_card",
  comment: "",
};

const INITIAL_FILTERS: MemberExpenseFilters = {
  status: "all",
  categoryQuery: "",
};

const MOBILE_SECTIONS: { key: MemberShellSection; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "history", label: "History", icon: ReceiptText },
  { key: "profile", label: "Profile", icon: User },
];

export function ExpenseManager({
  userEmail,
  userName,
  isAdmin,
  canAccessFinanceView,
  initialSection = "home",
}: ExpenseManagerProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<MemberShellSection>(initialSection);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<MemberExpenseFilters>(INITIAL_FILTERS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [toolbarFeedback, setToolbarFeedback] = useState("");
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const hasActiveFilters = filters.status !== "all" || filters.categoryQuery.trim().length > 0;

  const filteredExpenses = useMemo(() => {
    const categoryFilter = filters.categoryQuery.trim().toLowerCase();

    return expenses.filter((expense) => {
      if (filters.status !== "all" && expense.status !== filters.status) {
        return false;
      }

      if (categoryFilter && !expense.category.toLowerCase().includes(categoryFilter)) {
        return false;
      }

      return true;
    });
  }, [expenses, filters]);

  const selectedExpense = useMemo(
    () => expenses.find((expense) => expense.id === selectedExpenseId) ?? null,
    [expenses, selectedExpenseId],
  );

  const dashboardStats: MemberDashboardStats = useMemo(
    () => calculateMemberDashboardStats(filteredExpenses),
    [filteredExpenses],
  );
  const currencyCode = filteredExpenses[0]?.currencyCode ?? expenses[0]?.currencyCode ?? "EUR";
  const currentUserName = userName?.trim() || userEmail;

  function setSection(section: MemberShellSection) {
    setActiveSection(section);
    router.replace(section === "process" ? `${WORKSPACE_PATH}?view=process` : WORKSPACE_PATH);
  }

  useEffect(() => {
    void loadExpenses();
  }, []);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

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

  function openNewDraft() {
    setSection("home");
    resetForm();
    requestAnimationFrame(() => amountInputRef.current?.focus());
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

  function handleExport() {
    if (filteredExpenses.length === 0) {
      setToolbarFeedback("No expenses to export for the current filters.");
      return;
    }

    exportExpensesCsv(filteredExpenses);
    setToolbarFeedback(`Exported ${filteredExpenses.length} expense(s).`);
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
    setToolbarFeedback("");
  }

  return (
    <section className="relative min-w-0 pb-24 md:pb-0">
      <div
        className={`grid min-w-0 gap-6 ${
          isSidebarCollapsed ? "md:grid-cols-[5rem_1fr]" : "md:grid-cols-[14rem_1fr] lg:grid-cols-[15rem_1fr]"
        }`}
      >
        <MemberDesktopSidebar
          activeSection={activeSection}
          isCollapsed={isSidebarCollapsed}
          onSelectSection={setSection}
          onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
          onRefresh={() => void loadExpenses()}
          onNewDraft={openNewDraft}
          isLoading={isLoading}
          canAccessFinanceView={canAccessFinanceView}
          isAdmin={isAdmin}
        />

        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <MemberDashboardHeader userName={currentUserName} userEmail={userEmail} isAdmin={isAdmin} />

          {activeSection === "process" ? <FinanceInbox userEmail={userEmail} /> : null}

          {activeSection === "reports" ? (
            <>
              <MemberActionBar
                onToggleFilters={() => setIsFilterPanelOpen((value) => !value)}
                onExport={handleExport}
                hasActiveFilters={hasActiveFilters}
                isFilterPanelOpen={isFilterPanelOpen}
                isExportDisabled={filteredExpenses.length === 0}
              />

              {toolbarFeedback ? <p className="mb-4 text-sm text-slate-700">{toolbarFeedback}</p> : null}

              {isFilterPanelOpen ? (
                <MemberFilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  onClearFilters={clearFilters}
                  shownCount={filteredExpenses.length}
                  totalCount={expenses.length}
                />
              ) : null}
            </>
          ) : null}

          {activeSection === "home" ? (
            <div className="grid min-w-0 gap-6 xl:grid-cols-[1.15fr_1fr]">
              <MemberExpenseEditor
                amountInputRef={amountInputRef}
                cameraInputRef={cameraInputRef}
                fileInputRef={fileInputRef}
                error={error}
                feedback={feedback}
                formState={formState}
                isSaving={isSaving}
                receiptFile={receiptFile}
                selectedExpense={selectedExpense}
                onDelete={() => void handleDelete()}
                onExpenseDateChange={(expenseDate) => setFormState((previous) => ({ ...previous, expenseDate }))}
                onFormSubmit={(event) => void handleSave(event)}
                onAmountChange={(amount) => setFormState((previous) => ({ ...previous, amount }))}
                onCategoryChange={(category) => setFormState((previous) => ({ ...previous, category }))}
                onCommentChange={(comment) => setFormState((previous) => ({ ...previous, comment }))}
                onNewDraft={openNewDraft}
                onPaymentMethodChange={(paymentMethod) => setFormState((previous) => ({ ...previous, paymentMethod }))}
                onSelectCameraFile={(file) => setReceiptFile(file)}
                onSelectUploadFile={(file) => setReceiptFile(file)}
                onSubmitDraft={(expenseId) => void handleSubmitDraft(expenseId)}
              />

              <MemberExpensesList
                expenses={expenses}
                isLoading={isLoading}
                selectedExpenseId={selectedExpenseId}
                onSelectExpense={(expenseId) => {
                  const expense = expenses.find((item) => item.id === expenseId);
                  if (expense?.status === "submitted") {
                    router.push(`/app/expense/${expenseId}`);
                    return;
                  }

                  setSelectedExpenseId(expenseId);
                }}
              />
            </div>
          ) : null}

          {activeSection === "reports" ? (
            <>
              <MemberSummaryCard
                submittedCount={dashboardStats.submittedCount}
                submittedTotalMinor={dashboardStats.submittedTotalMinor}
                currencyCode={currencyCode}
              />
              <ReportsPanel expenses={filteredExpenses} currencyCode={currencyCode} />
            </>
          ) : null}

          {activeSection === "history" ? (
            <HistoryPanel
              expenses={expenses}
              isLoading={isLoading}
              onSelectExpense={(expenseId) => {
                router.push(`/app/expense/${expenseId}`);
              }}
            />
          ) : null}

          {activeSection === "profile" ? <ProfilePanel userEmail={userEmail} userName={currentUserName} /> : null}
        </div>
      </div>

      <MemberFabAddButton onClick={openNewDraft} />
      <MemberMobileBottomNav activeSection={activeSection} onSelectSection={setSection} />
    </section>
  );
}

type MemberDashboardHeaderProps = {
  userName: string;
  userEmail: string;
  isAdmin: boolean;
};

function MemberDashboardHeader({ userName, userEmail, isAdmin }: MemberDashboardHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">Welcome back</p>
        <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{userName}</h2>
        <p className="truncate text-xs text-slate-500 sm:text-sm">{userEmail}</p>
      </div>
      {isAdmin ? (
        <Link
          href={SETTINGS_PATH}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
          aria-label="Workspace settings"
        >
          <Settings aria-hidden className="h-5 w-5" />
        </Link>
      ) : null}
    </header>
  );
}

type MemberSummaryCardProps = {
  submittedCount: number;
  submittedTotalMinor: number;
  currencyCode: string;
};

function MemberSummaryCard({ submittedCount, submittedTotalMinor, currencyCode }: MemberSummaryCardProps) {
  const total = (submittedTotalMinor / 100).toFixed(2);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-lg shadow-slate-900/20">
      <div className="relative z-10">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-slate-300">Pending reimbursement</h3>
          <Briefcase aria-hidden className="h-4 w-4 text-slate-300" />
        </div>
        <p className="text-3xl font-bold tracking-tight">
          {currencyCode} {total}
        </p>
        <p className="mt-3 text-xs font-medium text-emerald-300">{submittedCount} item(s) processing</p>
      </div>
    </section>
  );
}

type MemberActionBarProps = {
  onToggleFilters: () => void;
  onExport: () => void;
  hasActiveFilters: boolean;
  isFilterPanelOpen: boolean;
  isExportDisabled: boolean;
};

function MemberActionBar({
  onToggleFilters,
  onExport,
  hasActiveFilters,
  isFilterPanelOpen,
  isExportDisabled,
}: MemberActionBarProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onToggleFilters}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isFilterPanelOpen || hasActiveFilters
            ? "bg-slate-900 text-white hover:bg-slate-800"
            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
        }`}
      >
        <Filter aria-hidden className="h-4 w-4" />
        {hasActiveFilters ? "Filter (active)" : "Filter"}
      </button>
      <button
        type="button"
        onClick={onExport}
        disabled={isExportDisabled}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download aria-hidden className="h-4 w-4" />
        Export
      </button>
    </div>
  );
}

type MemberFilterPanelProps = {
  filters: MemberExpenseFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<MemberExpenseFilters>>;
  onClearFilters: () => void;
  shownCount: number;
  totalCount: number;
};

function MemberFilterPanel({ filters, onFiltersChange, onClearFilters, shownCount, totalCount }: MemberFilterPanelProps) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onFiltersChange((previous) => ({
                ...previous,
                status: event.target.value as MemberExpenseFilters["status"],
              }))
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="received">Received</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Category</span>
          <input
            type="text"
            value={filters.categoryQuery}
            onChange={(event) =>
              onFiltersChange((previous) => ({
                ...previous,
                categoryQuery: event.target.value,
              }))
            }
            placeholder="e.g. transport"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-600">
          Showing {shownCount} of {totalCount} expense(s)
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Clear filters
        </button>
      </div>
    </section>
  );
}

type MemberExpensesListProps = {
  expenses: Expense[];
  isLoading: boolean;
  selectedExpenseId: string | null;
  onSelectExpense: (expenseId: string) => void;
};

function MemberExpensesList({
  expenses,
  isLoading,
  selectedExpenseId,
  onSelectExpense,
}: MemberExpensesListProps) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">Recent expenses</h3>
        <span className="text-xs font-medium text-slate-500">{expenses.length} total</span>
      </div>

      {isLoading ? (
        <div aria-busy>
          <p className="mb-3 text-sm text-slate-600">Loading expenses...</p>
          <CardListSkeleton />
        </div>
      ) : expenses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          No expenses yet. Create your first draft.
        </p>
      ) : (
        <ul className="grid gap-3">
          {expenses.map((expense) => {
            const isSelected = expense.id === selectedExpenseId;
            const statusMeta = getExpenseStatusMeta(expense.status);
            const Icon = getCategoryIcon(expense.category);

            return (
              <li key={expense.id}>
                <button
                  type="button"
                  onClick={() => onSelectExpense(expense.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isSelected ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                        <Icon aria-hidden className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{expense.publicId}</p>
                        <p className="truncate text-xs text-slate-500">
                          {new Date(expense.expenseDate).toLocaleDateString()} • {expense.category}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {(expense.amountMinor / 100).toFixed(2)} {expense.currencyCode}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type MemberExpenseEditorProps = {
  amountInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  error: string;
  feedback: string;
  formState: FormState;
  isSaving: boolean;
  receiptFile: File | null;
  selectedExpense: Expense | null;
  onDelete: () => void;
  onExpenseDateChange: (expenseDate: string) => void;
  onFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAmountChange: (amount: string) => void;
  onCategoryChange: (category: string) => void;
  onCommentChange: (comment: string) => void;
  onNewDraft: () => void;
  onPaymentMethodChange: (paymentMethod: PaymentMethod) => void;
  onSelectCameraFile: (file: File | null) => void;
  onSelectUploadFile: (file: File | null) => void;
  onSubmitDraft: (expenseId: string) => void;
};

function MemberExpenseEditor({
  amountInputRef,
  cameraInputRef,
  fileInputRef,
  error,
  feedback,
  formState,
  isSaving,
  receiptFile,
  selectedExpense,
  onDelete,
  onExpenseDateChange,
  onFormSubmit,
  onAmountChange,
  onCategoryChange,
  onCommentChange,
  onNewDraft,
  onPaymentMethodChange,
  onSelectCameraFile,
  onSelectUploadFile,
  onSubmitDraft,
}: MemberExpenseEditorProps) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900">{selectedExpense ? "Edit draft" : "Create draft"}</h3>
        {selectedExpense ? (
          <button
            type="button"
            onClick={onNewDraft}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            New draft
          </button>
        ) : null}
      </div>

      <form className="mt-4 grid gap-3" onSubmit={onFormSubmit}>
        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Receipt</span>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex min-h-24 w-full flex-col items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800"
            >
              <Camera aria-hidden className="h-7 w-7" />
              <span className="mt-1 text-base font-semibold">Take photo</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 transition hover:bg-slate-50"
            >
              <Upload aria-hidden className="h-7 w-7" />
              <span className="mt-1 text-base font-semibold">Import file</span>
            </button>
          </div>
          <input
            ref={cameraInputRef}
            name="receipt-camera"
            type="file"
            capture="environment"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={(event) => onSelectCameraFile(event.target.files?.[0] ?? null)}
            className="sr-only"
          />
          <input
            ref={fileInputRef}
            name="receipt"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={(event) => onSelectUploadFile(event.target.files?.[0] ?? null)}
            className="sr-only"
          />
          <p className="text-xs text-slate-600">JPG, PNG, PDF up to 10 MB.</p>
          {receiptFile ? (
            <p className="break-all text-xs text-slate-700">
              Selected: {receiptFile.name} ({Math.ceil(receiptFile.size / 1024)} KB)
            </p>
          ) : null}
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Amount (EUR)</span>
          <input
            ref={amountInputRef}
            required
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={formState.amount}
            onChange={(event) => onAmountChange(event.target.value)}
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
            onChange={(event) => onExpenseDateChange(event.target.value)}
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
            onChange={(event) => onCategoryChange(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
            placeholder="Transport"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Payment method</span>
          <select
            name="paymentMethod"
            value={formState.paymentMethod}
            onChange={(event) => onPaymentMethodChange(event.target.value as PaymentMethod)}
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
            onChange={(event) => onCommentChange(event.target.value)}
            className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-slate-300 focus:ring-2"
            placeholder="Optional details"
          />
        </label>

        {selectedExpense?.receipt ? (
          <p className="break-all text-xs text-slate-600">
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
              onClick={onDelete}
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
          onClick={() => onSubmitDraft(selectedExpense.id)}
          disabled={isSaving}
          className="mt-4 w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          Submit expense
        </button>
      ) : null}

      {feedback ? <p className="mt-3 break-all text-sm text-emerald-700">{feedback}</p> : null}
      {error ? <p className="mt-3 break-all text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}

type MemberDesktopSidebarProps = {
  activeSection: MemberShellSection;
  isCollapsed: boolean;
  onSelectSection: (section: MemberShellSection) => void;
  onToggleCollapse: () => void;
  onRefresh: () => void;
  onNewDraft: () => void;
  isLoading: boolean;
  canAccessFinanceView: boolean;
  isAdmin: boolean;
};

function MemberDesktopSidebar({
  activeSection,
  isCollapsed,
  onSelectSection,
  onToggleCollapse,
  onRefresh,
  onNewDraft,
  isLoading,
  canAccessFinanceView,
  isAdmin,
}: Readonly<MemberDesktopSidebarProps>) {
  return (
    <aside className="hidden h-fit self-start rounded-3xl border border-slate-200 bg-white px-4 py-6 shadow-sm md:block">
      <div className={`mb-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {isCollapsed ? null : <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member menu</p>}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen aria-hidden className="h-4 w-4" /> : <PanelLeftClose aria-hidden className="h-4 w-4" />}
        </button>
      </div>
      <nav className="grid gap-1">
        {MOBILE_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = section.key === activeSection;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => onSelectSection(section.key)}
              className={`inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                isCollapsed ? "justify-center" : "gap-2"
              } ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              aria-label={section.label}
              title={section.label}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {!isCollapsed ? section.label : null}
            </button>
          );
        })}

        {canAccessFinanceView ? (
          <button
            type="button"
            onClick={() => onSelectSection("process")}
            className={`inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
              isCollapsed ? "justify-center" : "gap-2"
            } ${activeSection === "process" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            aria-label="Process expenses"
            title="Process expenses"
          >
            <Briefcase aria-hidden className="h-4 w-4" />
            {!isCollapsed ? "Process" : null}
          </button>
        ) : null}

        {isAdmin ? (
          <Link
            href={SETTINGS_PATH}
            className={`inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 ${
              isCollapsed ? "justify-center" : "gap-2"
            }`}
            aria-label="Admin settings"
            title="Admin settings"
          >
            <Settings aria-hidden className="h-4 w-4" />
            {!isCollapsed ? "Settings" : null}
          </Link>
        ) : null}
      </nav>
      <div className="my-4 h-px bg-slate-200" />
      <div className="grid gap-2">
        <button
          type="button"
          onClick={onNewDraft}
          className={`inline-flex rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 ${
            isCollapsed ? "items-center justify-center" : "items-center justify-center gap-2"
          }`}
          aria-label="New draft"
          title="New draft"
        >
          <Plus aria-hidden className="h-4 w-4" />
          {!isCollapsed ? "New draft" : null}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className={`rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 ${
            isCollapsed ? "inline-flex items-center justify-center" : ""
          }`}
          aria-label={isLoading ? "Refreshing" : "Refresh"}
          title={isLoading ? "Refreshing" : "Refresh"}
        >
          {isCollapsed ? <RefreshCw aria-hidden className="h-4 w-4" /> : isLoading ? "Refreshing..." : "Refresh"}
        </button>
        <form action={signOutAction}>
          <button
            type="submit"
            className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${
              isCollapsed ? "inline-flex items-center justify-center" : "inline-flex items-center justify-center gap-2"
            }`}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut aria-hidden className="h-4 w-4" />
            {!isCollapsed ? "Sign out" : null}
          </button>
        </form>
      </div>
    </aside>
  );
}

type MemberMobileBottomNavProps = {
  activeSection: MemberShellSection;
  onSelectSection: (section: MemberShellSection) => void;
};

function MemberMobileBottomNav({ activeSection, onSelectSection }: MemberMobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-4 pb-5 pt-2 md:hidden" aria-label="Member sections">
      <ul className="mx-auto grid w-full max-w-md grid-cols-4 items-center gap-1">
        {MOBILE_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = section.key === activeSection;
          return (
            <li key={section.key}>
              <button
                type="button"
                onClick={() => onSelectSection(section.key)}
                className={`inline-flex w-full flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
                  isActive ? "text-slate-900" : "text-slate-500"
                }`}
              >
                <Icon aria-hidden className="h-4 w-4" />
                {section.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type MemberFabAddButtonProps = {
  onClick: () => void;
};

function MemberFabAddButton({ onClick }: MemberFabAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Create new draft"
      className="fixed bottom-20 left-1/2 z-40 inline-flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/30 transition hover:scale-105 active:scale-95 md:hidden"
    >
      <Plus aria-hidden className="h-6 w-6" />
    </button>
  );
}

type HistoryPanelProps = {
  expenses: Expense[];
  isLoading: boolean;
  onSelectExpense: (expenseId: string) => void;
};

function HistoryPanel({ expenses, isLoading, onSelectExpense }: HistoryPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">History</h3>
      {isLoading ? (
        <p className="mt-3 text-sm text-slate-600">Loading history...</p>
      ) : expenses.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No history available yet.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <button
                type="button"
                onClick={() => onSelectExpense(expense.id)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">{expense.category}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {new Date(expense.expenseDate).toLocaleDateString()} - {(expense.amountMinor / 100).toFixed(2)} {expense.currencyCode}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ReportsPanelProps = {
  expenses: Expense[];
  currencyCode: string;
};

function ReportsPanel({ expenses, currencyCode }: ReportsPanelProps) {
  const draftTotalMinor = expenses
    .filter((expense) => expense.status === "draft")
    .reduce((sum, expense) => sum + expense.amountMinor, 0);
  const receivedTotalMinor = expenses
    .filter((expense) => expense.status === "received")
    .reduce((sum, expense) => sum + expense.amountMinor, 0);

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Draft value</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">
          {currencyCode} {(draftTotalMinor / 100).toFixed(2)}
        </p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Received value</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">
          {currencyCode} {(receivedTotalMinor / 100).toFixed(2)}
        </p>
      </article>
    </section>
  );
}

type ProfilePanelProps = {
  userEmail: string;
  userName: string;
};

function ProfilePanel({ userEmail, userName }: ProfilePanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Profile</h3>
      <p className="mt-2 text-sm text-slate-700">Name: {userName}</p>
      <p className="mt-1 break-all text-sm text-slate-700">Email: {userEmail}</p>
      <p className="mt-3 text-xs text-slate-500">Profile editing is planned for a later milestone.</p>
      <form action={signOutAction} className="mt-4 md:hidden">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          aria-label="Sign out"
        >
          <LogOut aria-hidden className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </section>
  );
}

function exportExpensesCsv(expenses: Expense[]) {
  const header = [
    "Public ID",
    "Expense Date",
    "Status",
    "Category",
    "Payment Method",
    "Amount",
    "Currency",
    "Comment",
    "Submitted At",
    "Updated At",
  ];

  const lines = expenses.map((expense) => [
    expense.publicId,
    toDateValue(expense.expenseDate),
    expense.status,
    expense.category,
    expense.paymentMethod,
    (expense.amountMinor / 100).toFixed(2),
    expense.currencyCode,
    expense.comment ?? "",
    expense.submittedAt ? toDateTimeValue(expense.submittedAt) : "",
    toDateTimeValue(expense.updatedAt),
  ]);

  const csvContent = [header, ...lines].map((line) => line.map(toCsvCell).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  anchor.href = url;
  anchor.download = `expenses-${stamp}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function toCsvCell(value: string) {
  const escaped = value.replace(/"/g, "\"\"");
  return `"${escaped}"`;
}

function toDateValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function toDateTimeValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

function getCategoryIcon(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("transport") || normalized.includes("taxi")) {
    return Car;
  }

  if (normalized.includes("meal") || normalized.includes("coffee") || normalized.includes("food")) {
    return Coffee;
  }

  if (normalized.includes("flight") || normalized.includes("travel")) {
    return Plane;
  }

  return FileText;
}
