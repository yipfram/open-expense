import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";
import { createDraftExpense, listMemberExpenses, parseExpenseFormData } from "@/src/lib/expenses";
import { ExpenseError } from "@/src/lib/expense-errors";
import { getUserRoles } from "@/src/lib/roles";

export async function GET() {
  try {
    const memberId = await requireMemberUserId();
    const records = await listMemberExpenses(memberId);
    return NextResponse.json({ expenses: records }, { status: 200 });
  } catch (error) {
    return handleExpenseApiError("list member expenses failed", error, "Unable to load expenses right now.");
  }
}

export async function POST(request: Request) {
  try {
    const memberId = await requireMemberUserId();
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data." }, { status: 400 });
    }

    const formData = await request.formData();
    const { input, receipt } = await parseExpenseFormData(formData);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt is required." }, { status: 400 });
    }

    const created = await createDraftExpense(memberId, input, receipt);
    return NextResponse.json({ expense: created }, { status: 201 });
  } catch (error) {
    return handleExpenseApiError("create member expense failed", error, "Unable to create expense right now.");
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
