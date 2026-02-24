import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";
import { ExpenseError } from "@/src/lib/expense-errors";
import { listFinanceExpenses, parseFinanceExpenseFilters } from "@/src/lib/finance-expenses";
import { getUserRoles } from "@/src/lib/roles";

export async function GET(request: Request) {
  try {
    await requireFinanceUser();
    const filters = parseFinanceExpenseFilters(new URL(request.url).searchParams);
    const result = await listFinanceExpenses(filters);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleFinanceApiError("list finance expenses failed", error, "Unable to load finance expenses right now.");
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
