import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const headersMock = vi.fn();
const getUserRoles = vi.fn();
const markFinanceExpenseValidated = vi.fn();
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
  markFinanceExpenseValidated,
}));

vi.mock("@/src/lib/errors", () => ({
  toUiError,
  uiErrorToStatusCode,
  logServerError,
}));

describe("/api/finance/expenses/[expenseId]/validate", () => {
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
    const { POST } = await import("../app/api/finance/expenses/[expenseId]/validate/route");

    const response = await POST(new Request("http://localhost/api/finance/expenses/e1/validate"), {
      params: Promise.resolve({ expenseId: "e1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 when role is not finance or admin", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["member"]);
    const { POST } = await import("../app/api/finance/expenses/[expenseId]/validate/route");

    const response = await POST(new Request("http://localhost/api/finance/expenses/e1/validate"), {
      params: Promise.resolve({ expenseId: "e1" }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 200 for submitted -> received validation", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["finance"]);
    markFinanceExpenseValidated.mockResolvedValueOnce({
      id: "e1",
      publicId: "EXP-2026-000001",
      status: "received",
    });

    const { POST } = await import("../app/api/finance/expenses/[expenseId]/validate/route");
    const response = await POST(new Request("http://localhost/api/finance/expenses/e1/validate"), {
      params: Promise.resolve({ expenseId: "e1" }),
    });

    expect(response.status).toBe(200);
    expect(markFinanceExpenseValidated).toHaveBeenCalledWith("e1");
  });

  it("returns 200 for idempotent validation", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["admin"]);
    markFinanceExpenseValidated.mockResolvedValueOnce({
      id: "e1",
      publicId: "EXP-2026-000001",
      status: "received",
    });

    const { POST } = await import("../app/api/finance/expenses/[expenseId]/validate/route");
    const response = await POST(new Request("http://localhost/api/finance/expenses/e1/validate"), {
      params: Promise.resolve({ expenseId: "e1" }),
    });

    expect(response.status).toBe(200);
  });

  it("returns 409 when transition is invalid", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["finance"]);
    const { ExpenseError } = await import("../src/lib/expense-errors");
    markFinanceExpenseValidated.mockImplementationOnce(() => {
      throw new ExpenseError(409, "invalid_status_transition", "Only submitted expenses can be validated.");
    });

    const { POST } = await import("../app/api/finance/expenses/[expenseId]/validate/route");
    const response = await POST(new Request("http://localhost/api/finance/expenses/e1/validate"), {
      params: Promise.resolve({ expenseId: "e1" }),
    });

    expect(response.status).toBe(409);
  });
});
