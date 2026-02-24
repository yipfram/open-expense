import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const headersMock = vi.fn();
const getUserRoles = vi.fn();
const parseFinanceExpenseUpdatePayload = vi.fn();
const updateFinanceExpense = vi.fn();
const toUiError = vi.fn();
const uiErrorToStatusCode = vi.fn();
const logServerError = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

vi.mock("@/src/lib/roles", () => ({
  getUserRoles,
}));

vi.mock("@/src/lib/finance-expenses", () => ({
  parseFinanceExpenseUpdatePayload,
  updateFinanceExpense,
}));

vi.mock("@/src/lib/errors", () => ({
  toUiError,
  uiErrorToStatusCode,
  logServerError,
}));

describe("/api/finance/expenses/[expenseId]", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getSession.mockResolvedValueOnce(null);
    const { PATCH } = await import("../app/api/finance/expenses/[expenseId]/route");

    const response = await PATCH(
      new Request("http://localhost/api/finance/expenses/e1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ expenseId: "e1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when role is not finance or admin", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["member"]);
    const { PATCH } = await import("../app/api/finance/expenses/[expenseId]/route");

    const response = await PATCH(
      new Request("http://localhost/api/finance/expenses/e1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ expenseId: "e1" }) },
    );

    expect(response.status).toBe(403);
  });

  it("returns 200 for valid update", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["finance"]);
    parseFinanceExpenseUpdatePayload.mockReturnValueOnce({
      input: {
        amount: "10.00",
        expenseDate: "2026-02-24",
        category: "Meal",
        paymentMethod: "personal_card",
      },
    });
    updateFinanceExpense.mockResolvedValueOnce({
      id: "e1",
      publicId: "EXP-2026-000001",
    });

    const { PATCH } = await import("../app/api/finance/expenses/[expenseId]/route");
    const response = await PATCH(
      new Request("http://localhost/api/finance/expenses/e1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: "10.00",
          expenseDate: "2026-02-24",
          category: "Meal",
          paymentMethod: "personal_card",
        }),
      }),
      { params: Promise.resolve({ expenseId: "e1" }) },
    );

    expect(response.status).toBe(200);
    expect(updateFinanceExpense).toHaveBeenCalledWith("e1", {
      input: {
        amount: "10.00",
        expenseDate: "2026-02-24",
        category: "Meal",
        paymentMethod: "personal_card",
      },
    });
  });

  it("returns 400 for invalid payload", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["admin"]);
    const { ExpenseError } = await import("../src/lib/expense-errors");
    parseFinanceExpenseUpdatePayload.mockImplementationOnce(() => {
      throw new ExpenseError(400, "invalid_payload", "Request body must be a JSON object.");
    });

    const { PATCH } = await import("../app/api/finance/expenses/[expenseId]/route");
    const response = await PATCH(
      new Request("http://localhost/api/finance/expenses/e1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bad: true }),
      }),
      { params: Promise.resolve({ expenseId: "e1" }) },
    );

    expect(response.status).toBe(400);
  });

  it("returns 409 when transition is invalid", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["finance"]);
    const { ExpenseError } = await import("../src/lib/expense-errors");
    parseFinanceExpenseUpdatePayload.mockReturnValueOnce({
      input: {
        amount: "10.00",
        expenseDate: "2026-02-24",
        category: "Meal",
        paymentMethod: "personal_card",
      },
    });
    updateFinanceExpense.mockImplementationOnce(() => {
      throw new ExpenseError(409, "finance_edit_not_allowed", "Only submitted expenses can be corrected before validation.");
    });

    const { PATCH } = await import("../app/api/finance/expenses/[expenseId]/route");
    const response = await PATCH(
      new Request("http://localhost/api/finance/expenses/e1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: "10.00",
          expenseDate: "2026-02-24",
          category: "Meal",
          paymentMethod: "personal_card",
        }),
      }),
      { params: Promise.resolve({ expenseId: "e1" }) },
    );

    expect(response.status).toBe(409);
  });
});
