import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";
import { canSignUp, consumeInviteCode } from "@/src/lib/invites";

type SignUpPayload = {
  name?: string;
  email?: string;
  password?: string;
  inviteCode?: string;
};

export async function POST(request: Request) {
  let payload: SignUpPayload;

  try {
    payload = (await request.json()) as SignUpPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const password = String(payload.password ?? "");
  const inviteCode = String(payload.inviteCode ?? "").trim();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  if (!(await canSignUp(inviteCode))) {
    return NextResponse.json({ error: "Signup requires a valid invite code." }, { status: 403 });
  }

  try {
    const response = await auth.api.signUpEmail({
      body: { name, email, password },
      asResponse: true,
    });

    if (!(await consumeInviteCode(inviteCode))) {
      return NextResponse.json(
        { error: "Your invite code became unavailable. Please request a new invite." },
        { status: 409 },
      );
    }

    return response;
  } catch (error) {
    const uiError = toUiError(error, "Unable to create account right now.");
    logServerError("sign-up route failed", error, uiError.requestId);
    return NextResponse.json(
      { error: uiError.message, requestId: uiError.requestId },
      { status: uiErrorToStatusCode(uiError) },
    );
  }
}
