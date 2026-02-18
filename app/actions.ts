"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError } from "@/src/lib/errors";

export async function signOutAction() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    const uiError = toUiError(error, "Sign out failed.");
    logServerError("sign-out action failed", error, uiError.requestId);
    redirect(`/service-unavailable?ref=${uiError.requestId}`);
  }

  redirect("/sign-in");
}
