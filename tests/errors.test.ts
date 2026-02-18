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
});
