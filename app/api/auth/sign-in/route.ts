import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { logServerError, toUiError, uiErrorToStatusCode } from "@/src/lib/errors";

type SignInPayload = {
  email?: string;
  password?: string;
};

type AuthProviderFailure = {
  code?: string;
  message?: string;
  error?: string;
  status?: number;
  body?: unknown;
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

    if (!response.ok) {
      const providerFailure = await normalizeAuthProviderFailure(response);
      const uiError = toUiError(providerFailure, "Unable to sign in right now.");
      const status = uiErrorToStatusCode(uiError);
      logServerError("sign-in rejected by auth provider", providerFailure, uiError.requestId);

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
