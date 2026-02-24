import type { FinanceExpenseStatus } from "@/src/lib/finance-expenses";

export type FinanceProcessStatusMeta = {
  label: string;
  className: string;
};

export function getFinanceProcessStatusMeta(status: FinanceExpenseStatus): FinanceProcessStatusMeta {
  if (status === "draft") {
    return {
      label: "Draft",
      className: "bg-slate-100 text-slate-700",
    };
  }

  if (status === "submitted") {
    return {
      label: "To validate",
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Validated",
    className: "bg-emerald-100 text-emerald-700",
  };
}

export function canCorrectInProcessView(status: FinanceExpenseStatus): boolean {
  return status === "submitted";
}
