"use server";

import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError } from "@/src/lib/errors";

type SignInState = {
  error?: string;
  requestId?: string;
};

export async function signInAction(_: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
  } catch (error) {
    const uiError = toUiError(error, "Unable to sign in right now.");
    logServerError("sign-in action failed", error, uiError.requestId);
    return { error: uiError.message, requestId: uiError.requestId };
  }

  redirect("/");
}
