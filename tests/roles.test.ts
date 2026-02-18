import { describe, expect, it } from "vitest";

import { getUserRoles } from "../src/lib/roles";

describe("getUserRoles", () => {
  it("defaults to member when no role is set", () => {
    expect(getUserRoles({ email: "user@example.com" })).toEqual(["member"]);
  });

  it("returns declared role when valid", () => {
    expect(getUserRoles({ email: "finance@example.com", role: "finance" })).toEqual(["finance"]);
  });
});
