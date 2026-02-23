import { beforeEach, describe, expect, it, vi } from "vitest";

const signUpEmail = vi.fn();
const canSignUp = vi.fn();
const consumeInviteCode = vi.fn();
const logServerError = vi.fn();
const toUiError = vi.fn();
const uiErrorToStatusCode = vi.fn();

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      signUpEmail,
    },
  },
}));

vi.mock("@/src/lib/invites", () => ({
  canSignUp,
  consumeInviteCode,
}));

vi.mock("@/src/lib/errors", () => ({
  logServerError,
  toUiError,
  uiErrorToStatusCode,
}));

describe("POST /api/auth/sign-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toUiError.mockReturnValue({ code: "validation", message: "Mapped validation error", requestId: "req_signup_1" });
    uiErrorToStatusCode.mockReturnValue(400);
  });

  it("returns 400 on missing fields", async () => {
    const { POST } = await import("../app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "x@example.com" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 403 when invite is invalid", async () => {
    canSignUp.mockResolvedValueOnce(false);

    const { POST } = await import("../app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "User", email: "x@example.com", password: "secret123", inviteCode: "bad" }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("returns 400 when password does not match policy", async () => {
    const { POST } = await import("../app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "User", email: "x@example.com", password: "short", inviteCode: "any" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("between 8 and 128");
    expect(canSignUp).not.toHaveBeenCalled();
  });

  it("returns 409 when invite consumption fails after signup", async () => {
    canSignUp.mockResolvedValueOnce(true);
    signUpEmail.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    consumeInviteCode.mockResolvedValueOnce(false);

    const { POST } = await import("../app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "User", email: "x@example.com", password: "secret123", inviteCode: "good" }),
      }),
    );

    expect(response.status).toBe(409);
  });

  it("does not consume invite when signup fails", async () => {
    canSignUp.mockResolvedValueOnce(true);
    signUpEmail.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Password is too short" }), {
        status: 422,
        headers: { "content-type": "application/json" },
      }),
    );

    const { POST } = await import("../app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "User", email: "x@example.com", password: "secret123", inviteCode: "good" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: string;
      requestId?: string;
      code?: string;
      upstreamStatus?: number;
    };
    expect(body.error).toBe("Mapped validation error");
    expect(body.requestId).toBe("req_signup_1");
    expect(body.upstreamStatus).toBe(422);
    expect(consumeInviteCode).not.toHaveBeenCalled();
    expect(logServerError).toHaveBeenCalledTimes(1);
  });
});
