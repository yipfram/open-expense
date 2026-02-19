import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";
import { deleteDraftExpense, parseExpenseFormData, updateDraftExpense } from "@/src/lib/expenses";
import { ExpenseError } from "@/src/lib/expense-errors";
import { getUserRoles } from "@/src/lib/roles";

type RouteContext = {
  params: Promise<{ expenseId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const memberId = await requireMemberUserId();
    const { expenseId } = await context.params;

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data." }, { status: 400 });
    }

    const formData = await request.formData();
    const { input, receipt } = await parseExpenseFormData(formData);
    const updated = await updateDraftExpense(memberId, expenseId, input, receipt);
    return NextResponse.json({ expense: updated }, { status: 200 });
  } catch (error) {
    return handleExpenseApiError("update member expense failed", error, "Unable to update expense right now.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const memberId = await requireMemberUserId();
    const { expenseId } = await context.params;
    await deleteDraftExpense(memberId, expenseId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleExpenseApiError("delete member expense failed", error, "Unable to delete expense right now.");
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
