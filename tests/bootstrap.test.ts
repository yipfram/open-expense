import { describe, expect, it } from "vitest";

import { getBootstrapStatus } from "../src/lib/bootstrap";

describe("bootstrap status", () => {
  it("returns ok", () => {
    expect(getBootstrapStatus()).toBe("ok");
  });
});