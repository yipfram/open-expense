import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";
import { createInvite, listInvites } from "@/src/lib/invites";
import { getUserRoles } from "@/src/lib/roles";

type CreateInvitePayload = {
  email?: string;
  expiresInDays?: number;
};

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!(await getUserRoles(session.user)).includes("admin")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const invites = await listInvites(100);
    return NextResponse.json({ invites }, { status: 200 });
  } catch (error) {
    const uiError = toUiError(error, "Unable to list invites right now.");
    logServerError("list invites route failed", error, uiError.requestId);
    return NextResponse.json(
      { error: uiError.message, requestId: uiError.requestId },
      { status: uiErrorToStatusCode(uiError) },
    );
  }
}

export async function POST(request: Request) {
  let payload: CreateInvitePayload;

  try {
    payload = (await request.json()) as CreateInvitePayload;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!(await getUserRoles(session.user)).includes("admin")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const expiresInDays =
      typeof payload.expiresInDays === "number" && payload.expiresInDays > 0 ? payload.expiresInDays : 14;

    const invite = await createInvite({
      email: payload.email,
      createdByUserId: typeof session.user.id === "string" ? session.user.id : undefined,
      expiresInDays,
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    const uiError = toUiError(error, "Unable to create invite right now.");
    logServerError("create invite route failed", error, uiError.requestId);
    return NextResponse.json(
      { error: uiError.message, requestId: uiError.requestId },
      { status: uiErrorToStatusCode(uiError) },
    );
  }
}
