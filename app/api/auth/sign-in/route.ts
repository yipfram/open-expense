import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";

type SignInPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let payload: SignInPayload;

  try {
    payload = (await request.json()) as SignInPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const email = String(payload.email ?? "").trim();
  const password = String(payload.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    return response;
  } catch (error) {
    const uiError = toUiError(error, "Unable to sign in right now.");
    logServerError("sign-in route failed", error, uiError.requestId);
    return NextResponse.json(
      { error: uiError.message, requestId: uiError.requestId },
      { status: uiErrorToStatusCode(uiError) },
    );
  }
}
