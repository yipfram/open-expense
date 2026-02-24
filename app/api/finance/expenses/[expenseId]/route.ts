import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";
import { ExpenseError } from "@/src/lib/expense-errors";
import { parseFinanceExpenseUpdatePayload, updateFinanceExpense } from "@/src/lib/finance-expenses";
import { getUserRoles } from "@/src/lib/roles";

type RouteContext = {
  params: Promise<{ expenseId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireFinanceUser();
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ExpenseError(400, "invalid_content_type", "Content-Type must be application/json.");
    }

    const body = (await request.json().catch(() => {
      throw new ExpenseError(400, "invalid_json", "Request body must be valid JSON.");
    })) as unknown;

    const payload = parseFinanceExpenseUpdatePayload(body);
    const { expenseId } = await context.params;
    const expense = await updateFinanceExpense(expenseId, payload);
    return NextResponse.json({ expense }, { status: 200 });
  } catch (error) {
    return handleFinanceApiError("update finance expense failed", error, "Unable to update finance expense right now.");
  }
}

async function requireFinanceUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new ExpenseError(401, "not_authenticated", "Authentication required.");
  }

  const roles = await getUserRoles(session.user);
  if (!roles.some((role) => role === "finance" || role === "admin")) {
    throw new ExpenseError(403, "forbidden", "Forbidden.");
  }

  if (!session.user.id) {
    throw new ExpenseError(401, "invalid_session", "Session is missing user identity.");
  }

  return session.user.id;
}

function handleFinanceApiError(context: string, error: unknown, fallbackMessage: string) {
  if (error instanceof ExpenseError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }

  const uiError = toUiError(error, fallbackMessage);
  logServerError(context, error, uiError.requestId);
  return NextResponse.json(
    { error: uiError.message, requestId: uiError.requestId },
    { status: uiErrorToStatusCode(uiError) },
  );
}
