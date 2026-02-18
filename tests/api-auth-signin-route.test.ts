import { beforeEach, describe, expect, it, vi } from "vitest";

const signInEmail = vi.fn();
const logServerError = vi.fn();
const toUiError = vi.fn();
const uiErrorToStatusCode = vi.fn();

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      signInEmail,
    },
  },
}));

vi.mock("@/src/lib/errors", () => ({
  logServerError,
  toUiError,
  uiErrorToStatusCode,
}));

describe("POST /api/auth/sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on invalid payload", async () => {
    const { POST } = await import("../app/api/auth/sign-in/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-in", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when email/password are missing", async () => {
    const { POST } = await import("../app/api/auth/sign-in/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns mapped error status when auth throws", async () => {
    signInEmail.mockRejectedValueOnce(new Error("db down"));
    toUiError.mockReturnValueOnce({ code: "database", message: "Service unavailable", requestId: "req_1" });
    uiErrorToStatusCode.mockReturnValueOnce(503);

    const { POST } = await import("../app/api/auth/sign-in/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "x@example.com", password: "secret" }),
      }),
    );

    expect(response.status).toBe(503);
  });
});
