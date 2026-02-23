import { describe, expect, it } from "vitest";

describe("toUiError", () => {
  it("maps database connectivity errors", async () => {
    const { toUiError } = await import("../src/lib/errors");
    const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");
    const mapped = toUiError(error, "fallback");
    expect(mapped.code).toBe("database");
    expect(mapped.message).toContain("temporarily unavailable");
  });

  it("maps duplicate conflicts", async () => {
    const { toUiError } = await import("../src/lib/errors");
    const error = { code: "23505", message: "duplicate key value violates unique constraint" };
    const mapped = toUiError(error, "fallback");
    expect(mapped.code).toBe("conflict");
    expect(mapped.message).toBe("This email is already registered. Try signing in instead.");
  });

  it("maps postgres authentication failures as database outages", async () => {
    const { toUiError } = await import("../src/lib/errors");
    const error = {
      code: "28P01",
      message: "password authentication failed for user",
    };
    const mapped = toUiError(error, "fallback");
    expect(mapped.code).toBe("database");
    expect(mapped.message).toContain("temporarily unavailable");
  });

  it("maps explicit short-password errors to validation policy message", async () => {
    const { toUiError } = await import("../src/lib/errors");
    const error = new Error("Password is too short");
    const mapped = toUiError(error, "fallback");
    expect(mapped.code).toBe("validation");
    expect(mapped.message).toContain("between 8 and 128");
  });
});
