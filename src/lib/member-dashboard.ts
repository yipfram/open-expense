type ExpenseStatus = "draft" | "submitted" | "received";

type DashboardExpenseInput = {
  status: ExpenseStatus;
  amountMinor: number;
};

export type ExpenseStatusMeta = {
  label: string;
  className: string;
};

export function calculateMemberDashboardStats(expenses: readonly DashboardExpenseInput[]) {
  return expenses.reduce(
    (acc, expense) => {
      if (expense.status === "submitted") {
        acc.submittedCount += 1;
        acc.submittedTotalMinor += expense.amountMinor;
      }

      return acc;
    },
    { submittedCount: 0, submittedTotalMinor: 0 },
  );
}

export function getExpenseStatusMeta(status: ExpenseStatus): ExpenseStatusMeta {
  if (status === "draft") {
    return {
      label: "Draft",
      className: "bg-slate-100 text-slate-700",
    };
  }

  if (status === "submitted") {
    return {
      label: "Submitted",
      className: "bg-indigo-100 text-indigo-700",
    };
  }

  return {
    label: "Received",
    className: "bg-emerald-100 text-emerald-700",
  };
}
