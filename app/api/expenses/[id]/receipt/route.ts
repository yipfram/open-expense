import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { toUiError } from "@/src/lib/errors";
import { ExpenseError } from "@/src/lib/expense-errors";
import { getExpenseReceiptForViewer } from "@/src/lib/expenses";
import { getUserRoles } from "@/src/lib/roles";
import { getReceiptFromStorage } from "@/src/lib/storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const roles = await getUserRoles(session.user);
    const receipt = await getExpenseReceiptForViewer({
      expenseId: id,
      viewerUserId: session.user.id,
      viewerRoles: roles,
    });

    const object = await getReceiptFromStorage(receipt.storageKey);

    return new NextResponse(object.body, {
      status: 200,
      headers: {
        "content-type": object.contentType,
        "content-disposition": `inline; filename=\"${receipt.originalFilename}\"`,
        "cache-control": "private, no-store",
        ...(typeof object.contentLength === "number" ? { "content-length": String(object.contentLength) } : {}),
      },
    });
  } catch (error) {
    if (error instanceof ExpenseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    const uiError = toUiError(error, "Unable to load receipt.");
    return NextResponse.json({ error: uiError.message, requestId: uiError.requestId }, { status: 503 });
  }
}
