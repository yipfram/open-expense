import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const redirect = vi.fn((target: string) => {
  throw new Error(`NEXT_REDIRECT:${target}`);
});
const headers = vi.fn(async () => new Headers());
const logServerError = vi.fn();
const toUiError = vi.fn(() => ({
  code: "database",
  message: "Service is temporarily unavailable. Please retry in a moment.",
  requestId: "req_session_1",
}));

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

vi.mock("@/src/lib/errors", () => ({
  logServerError,
  toUiError,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/headers", () => ({
  headers,
}));

describe("session helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null by default when session retrieval fails", async () => {
    getSession.mockRejectedValueOnce(new Error("db down"));
    const { getSessionSafe } = await import("../src/lib/session");

    const result = await getSessionSafe();

    expect(result).toBeNull();
    expect(logServerError).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to service-unavailable when redirectOnError is enabled", async () => {
    getSession.mockRejectedValueOnce(new Error("db down"));
    const { getSessionSafe } = await import("../src/lib/session");

    await expect(getSessionSafe({ redirectOnError: true })).rejects.toThrow(
      "NEXT_REDIRECT:/service-unavailable?ref=req_session_1",
    );
    expect(redirect).toHaveBeenCalledWith("/service-unavailable?ref=req_session_1");
  });
});
