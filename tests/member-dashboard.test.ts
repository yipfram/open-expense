import { describe, expect, it } from "vitest";

import { calculateMemberDashboardStats, getExpenseStatusMeta } from "@/src/lib/member-dashboard";

describe("calculateMemberDashboardStats", () => {
  it("returns zero totals for empty input", () => {
    const stats = calculateMemberDashboardStats([]);

    expect(stats).toEqual({ submittedCount: 0, submittedTotalMinor: 0 });
  });

  it("counts and sums submitted expenses only", () => {
    const stats = calculateMemberDashboardStats([
      { status: "draft", amountMinor: 1000 },
      { status: "submitted", amountMinor: 2500 },
      { status: "submitted", amountMinor: 900 },
      { status: "received", amountMinor: 4400 },
    ]);

    expect(stats).toEqual({ submittedCount: 2, submittedTotalMinor: 3400 });
  });
});

describe("getExpenseStatusMeta", () => {
  it("maps all status badges", () => {
    expect(getExpenseStatusMeta("draft")).toEqual({
      label: "Draft",
      className: "bg-slate-100 text-slate-700",
    });
    expect(getExpenseStatusMeta("submitted")).toEqual({
      label: "Submitted",
      className: "bg-indigo-100 text-indigo-700",
    });
    expect(getExpenseStatusMeta("received")).toEqual({
      label: "Received",
      className: "bg-emerald-100 text-emerald-700",
    });
  });
});
