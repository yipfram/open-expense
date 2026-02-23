import { describe, expect, it } from "vitest";

describe("getUserRoles", () => {
  it("defaults to member when no role is set", async () => {
    const { getUserRoles } = await import("../src/lib/roles");
    await expect(getUserRoles({ email: "user@example.com" })).resolves.toEqual(["member"]);
  });

  it("returns declared role when valid", async () => {
    const { getUserRoles } = await import("../src/lib/roles");
    await expect(getUserRoles({ email: "finance@example.com", role: "finance" })).resolves.toEqual(["finance"]);
  });
});
