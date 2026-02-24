import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const headersMock = vi.fn();
const getUserRoles = vi.fn();
const parseFinanceExpenseFilters = vi.fn();
const listFinanceExpenses = vi.fn();
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
  parseFinanceExpenseFilters,
  listFinanceExpenses,
}));

vi.mock("@/src/lib/errors", () => ({
  toUiError,
  uiErrorToStatusCode,
  logServerError,
}));

describe("/api/finance/expenses", () => {
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
    const { GET } = await import("../app/api/finance/expenses/route");

    const response = await GET(new Request("http://localhost/api/finance/expenses"));
    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not finance or admin", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["member"]);
    const { GET } = await import("../app/api/finance/expenses/route");

    const response = await GET(new Request("http://localhost/api/finance/expenses"));
    expect(response.status).toBe(403);
  });

  it("returns 200 with finance expenses for finance role", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["finance"]);
    parseFinanceExpenseFilters.mockReturnValueOnce({
      status: "submitted",
      departmentId: null,
      projectId: null,
    });
    listFinanceExpenses.mockResolvedValueOnce({
      expenses: [],
      filters: {
        status: "submitted",
        departmentId: null,
        projectId: null,
      },
      options: {
        departments: [],
        projects: [],
      },
    });

    const { GET } = await import("../app/api/finance/expenses/route");
    const response = await GET(new Request("http://localhost/api/finance/expenses?status=submitted"));

    expect(response.status).toBe(200);
    expect(parseFinanceExpenseFilters).toHaveBeenCalledOnce();
    expect(listFinanceExpenses).toHaveBeenCalledWith({
      status: "submitted",
      departmentId: null,
      projectId: null,
    });
  });

  it("returns 400 when filters are invalid", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["admin"]);
    const { ExpenseError } = await import("../src/lib/expense-errors");
    parseFinanceExpenseFilters.mockImplementationOnce(() => {
      throw new ExpenseError(400, "invalid_status_filter", "Status filter must be all, draft, submitted, or received.");
    });

    const { GET } = await import("../app/api/finance/expenses/route");
    const response = await GET(new Request("http://localhost/api/finance/expenses?status=bad"));

    expect(response.status).toBe(400);
  });
});
