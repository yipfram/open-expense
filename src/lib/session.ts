import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError } from "@/src/lib/errors";
import { type AppRole, getUserRoles } from "@/src/lib/roles";

type GetSessionSafeOptions = {
  redirectOnError?: boolean;
};

export async function requireSession() {
  const session = await getSessionSafe({ redirectOnError: true });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const session = await requireSession();
  const roles = await getUserRoles(session.user);
  const isAllowed = roles.some((role) => allowedRoles.includes(role));

  if (!isAllowed) {
    redirect("/forbidden");
  }

  return session;
}

export async function getSessionSafe(options: GetSessionSafeOptions = {}) {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    const uiError = toUiError(error, "Session unavailable.");
    logServerError("session retrieval failed", error, uiError.requestId);

    if (options.redirectOnError) {
      redirect(`/service-unavailable?ref=${uiError.requestId}`);
    }

    return null;
  }
}
