import { describe, expect, it } from "vitest";

import { ExpenseError } from "@/src/lib/expense-errors";
import { parseFinanceExpenseFilters, resolveFinanceValidationTransition } from "@/src/lib/finance-expenses";

describe("parseFinanceExpenseFilters", () => {
  it("uses submitted as default status", () => {
    const filters = parseFinanceExpenseFilters(new URLSearchParams());
    expect(filters).toEqual({
      status: "submitted",
      departmentId: null,
      projectId: null,
    });
  });

  it("parses valid status and identifiers", () => {
    const filters = parseFinanceExpenseFilters(
      new URLSearchParams({
        status: "received",
        departmentId: "11111111-1111-4111-8111-111111111111",
        projectId: "22222222-2222-4222-8222-222222222222",
      }),
    );

    expect(filters).toEqual({
      status: "received",
      departmentId: "11111111-1111-4111-8111-111111111111",
      projectId: "22222222-2222-4222-8222-222222222222",
    });
  });

  it("rejects invalid status", () => {
    expect(() => parseFinanceExpenseFilters(new URLSearchParams({ status: "pending" }))).toThrow(
      "Status filter must be all, draft, submitted, or received.",
    );
  });

  it("rejects invalid UUID filters", () => {
    expect(() => parseFinanceExpenseFilters(new URLSearchParams({ departmentId: "abc" }))).toThrow(
      "Department/project filters must be UUIDs.",
    );
  });
});

describe("resolveFinanceValidationTransition", () => {
  it("allows submitted to received transition", () => {
    const transition = resolveFinanceValidationTransition("submitted");
    expect(transition).toEqual({
      status: "received",
      setReceivedAt: true,
    });
  });

  it("is idempotent for received to received", () => {
    const transition = resolveFinanceValidationTransition("received");
    expect(transition).toEqual({
      status: "received",
      setReceivedAt: false,
    });
  });

  it("rejects transition from draft", () => {
    expect(() => resolveFinanceValidationTransition("draft")).toThrow(ExpenseError);
    try {
      resolveFinanceValidationTransition("draft");
    } catch (error) {
      expect(error).toBeInstanceOf(ExpenseError);
      expect((error as ExpenseError).status).toBe(409);
    }
  });
});
