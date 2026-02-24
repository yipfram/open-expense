import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { ensureBootstrapAdminRolesForEmail } from "@/src/lib/bootstrap-admin";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";
import { canSignUp, consumeInviteCode } from "@/src/lib/invites";
import { getPasswordPolicyLabel, validatePasswordLength } from "@/src/lib/password-policy";

type SignUpPayload = {
  name?: string;
  email?: string;
  password?: string;
  inviteCode?: string;
};

type AuthProviderFailure = {
  code?: string;
  message?: string;
  error?: string;
  status?: number;
  body?: unknown;
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

  if (!validatePasswordLength(password)) {
    return NextResponse.json({ error: getPasswordPolicyLabel() }, { status: 400 });
  }

  if (!(await canSignUp(inviteCode, email))) {
    return NextResponse.json({ error: "Signup requires a valid invite code." }, { status: 403 });
  }

  try {
    const response = await auth.api.signUpEmail({
      body: { name, email, password },
      asResponse: true,
    });

    if (!response.ok) {
      const providerFailure = await normalizeAuthProviderFailure(response);
      const uiError = toUiError(providerFailure, "Unable to create account right now.");
      const status = uiErrorToStatusCode(uiError);
      logServerError("sign-up rejected by auth provider", providerFailure, uiError.requestId);

      return NextResponse.json(
        {
          error: uiError.message,
          requestId: uiError.requestId,
          code: providerFailure.code,
          upstreamStatus: response.status,
        },
        { status },
      );
    }

    if (!(await consumeInviteCode(inviteCode, email))) {
      return NextResponse.json(
        { error: "Your invite code became unavailable. Please request a new invite." },
        { status: 409 },
      );
    }

    await ensureBootstrapAdminRolesQuietly(email);
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

async function normalizeAuthProviderFailure(response: Response): Promise<AuthProviderFailure> {
  const fallback: AuthProviderFailure = {
    status: response.status,
    message: `Authentication service returned status ${response.status}.`,
  };

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    if (!text) {
      return fallback;
    }

    return {
      ...fallback,
      message: text,
      error: text,
    };
  }

  const body = (await response.json().catch(() => undefined)) as Record<string, unknown> | undefined;
  if (!body) {
    return fallback;
  }

  return {
    status: response.status,
    code: getString(body.code),
    message: getString(body.message) ?? getString(body.error) ?? fallback.message,
    error: getString(body.error),
    body,
  };
}

function getString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

async function ensureBootstrapAdminRolesQuietly(email: string) {
  try {
    await ensureBootstrapAdminRolesForEmail(email);
  } catch (error) {
    const uiError = toUiError(error, "Unable to ensure bootstrap admin roles.");
    logServerError("bootstrap role ensure failed after sign-up", error, uiError.requestId);
  }
}
