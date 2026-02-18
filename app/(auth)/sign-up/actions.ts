"use server";

import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError } from "@/src/lib/errors";
import { canSignUp, consumeInviteCode } from "@/src/lib/invites";

type SignUpState = {
  error?: string;
  requestId?: string;
};

export async function signUpAction(_: SignUpState, formData: FormData): Promise<SignUpState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  if (!canSignUp(inviteCode)) {
    return { error: "Signup requires a valid invite code." };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });
  } catch (error) {
    const uiError = toUiError(error, "Unable to create account right now.");
    logServerError("sign-up action failed", error, uiError.requestId);
    return { error: uiError.message, requestId: uiError.requestId };
  }

  if (!consumeInviteCode(inviteCode)) {
    return {
      error: "Your invite code became unavailable. Please request a new invite.",
    };
  }

  redirect("/");
}
