import { describe, expect, it } from "vitest";

import { toUiError } from "../src/lib/errors";

describe("toUiError", () => {
  it("maps database connectivity errors", () => {
    const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");
    const mapped = toUiError(error, "fallback");
    expect(mapped.code).toBe("database");
    expect(mapped.message).toContain("temporarily unavailable");
  });

  it("maps duplicate conflicts", () => {
    const error = { code: "23505", message: "duplicate key value violates unique constraint" };
    const mapped = toUiError(error, "fallback");
    expect(mapped.code).toBe("conflict");
    expect(mapped.message).toBe("This email is already registered. Try signing in instead.");
  });

  it("maps postgres authentication failures as database outages", () => {
    const error = {
      code: "28P01",
      message: "password authentication failed for user",
    };
    const mapped = toUiError(error, "fallback");
    expect(mapped.code).toBe("database");
    expect(mapped.message).toContain("temporarily unavailable");
  });

  it("maps explicit short-password errors to validation policy message", () => {
    const error = new Error("Password is too short");
    const mapped = toUiError(error, "fallback");
    expect(mapped.code).toBe("validation");
    expect(mapped.message).toContain("between 8 and 128");
  });
});
