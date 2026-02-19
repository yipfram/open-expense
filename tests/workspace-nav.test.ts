import { describe, expect, it } from "vitest";

import { buildWorkspaceNavItems } from "@/src/lib/workspace-nav";

describe("buildWorkspaceNavItems", () => {
  it("returns submit + sign out for member-only access", () => {
    const items = buildWorkspaceNavItems({
      activeView: "member",
      canAccessMemberView: true,
      canAccessFinanceView: false,
      isAdmin: false,
      workspacePath: "/app",
      settingsPath: "/settings",
    });

    expect(items.map((item) => item.label)).toEqual(["Submit", "Sign out"]);
    expect(items[0]?.active).toBe(true);
  });

  it("returns process + sign out for finance-only access", () => {
    const items = buildWorkspaceNavItems({
      activeView: "finance",
      canAccessMemberView: false,
      canAccessFinanceView: true,
      isAdmin: false,
      workspacePath: "/app",
      settingsPath: "/settings",
    });

    expect(items.map((item) => item.label)).toEqual(["Process", "Sign out"]);
    expect(items[0]?.active).toBe(true);
  });

  it("returns submit/process/settings/sign out for admin access", () => {
    const items = buildWorkspaceNavItems({
      activeView: "finance",
      canAccessMemberView: true,
      canAccessFinanceView: true,
      isAdmin: true,
      workspacePath: "/app",
      settingsPath: "/settings",
    });

    expect(items.map((item) => item.label)).toEqual(["Submit", "Process", "Settings", "Sign out"]);
    expect(items[0]?.active).toBe(false);
    expect(items[1]?.active).toBe(true);
  });
});
