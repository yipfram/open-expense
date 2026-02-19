import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";
import { submitDraftExpense } from "@/src/lib/expenses";
import { ExpenseError } from "@/src/lib/expense-errors";
import { getUserRoles } from "@/src/lib/roles";

type RouteContext = {
  params: Promise<{ expenseId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const memberId = await requireMemberUserId();
    const { expenseId } = await context.params;
    const submitted = await submitDraftExpense(memberId, expenseId);

    return NextResponse.json({ expense: submitted }, { status: 200 });
  } catch (error) {
    return handleExpenseApiError("submit member expense failed", error, "Unable to submit expense right now.");
  }
}

async function requireMemberUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new ExpenseError(401, "not_authenticated", "Authentication required.");
  }

  const roles = await getUserRoles(session.user);
  if (!roles.some((role) => role === "member" || role === "manager" || role === "finance" || role === "admin")) {
    throw new ExpenseError(403, "forbidden", "Forbidden.");
  }

  if (!session.user.id) {
    throw new ExpenseError(401, "invalid_session", "Session is missing user identity.");
  }

  return session.user.id;
}

function handleExpenseApiError(context: string, error: unknown, fallbackMessage: string) {
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
