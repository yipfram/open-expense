import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";
import { ExpenseError } from "@/src/lib/expense-errors";
import { markFinanceExpenseValidated } from "@/src/lib/finance-expenses";
import { getUserRoles } from "@/src/lib/roles";

type RouteContext = {
  params: Promise<{ expenseId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireFinanceUser();
    const { expenseId } = await context.params;
    const expense = await markFinanceExpenseValidated(expenseId);
    return NextResponse.json({ expense }, { status: 200 });
  } catch (error) {
    return handleFinanceApiError("validate finance expense failed", error, "Unable to validate expense right now.");
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
