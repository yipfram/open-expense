import { describe, expect, it } from "vitest";

import { getUserRoles } from "../src/lib/roles";

describe("getUserRoles", () => {
  it("defaults to member when no role is set", async () => {
    await expect(getUserRoles({ email: "user@example.com" })).resolves.toEqual(["member"]);
  });

  it("returns declared role when valid", async () => {
    await expect(getUserRoles({ email: "finance@example.com", role: "finance" })).resolves.toEqual(["finance"]);
  });
});
