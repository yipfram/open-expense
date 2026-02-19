import { describe, expect, it } from "vitest";

import { canAccessWorkspaceView, getDefaultWorkspaceView, parseWorkspaceView } from "@/src/lib/workspace";

describe("workspace routing rules", () => {
  it("parses valid views and rejects invalid values", () => {
    expect(parseWorkspaceView("member")).toBe("member");
    expect(parseWorkspaceView("finance")).toBe("finance");
    expect(parseWorkspaceView("unknown")).toBeUndefined();
    expect(parseWorkspaceView(undefined)).toBeUndefined();
  });

  it("defaults to finance for finance/admin roles", () => {
    expect(getDefaultWorkspaceView(["finance"])).toBe("finance");
    expect(getDefaultWorkspaceView(["admin"])).toBe("finance");
    expect(getDefaultWorkspaceView(["member", "manager"])).toBe("member");
  });

  it("enforces per-view access rules", () => {
    expect(canAccessWorkspaceView("member", ["member"])).toBe(true);
    expect(canAccessWorkspaceView("member", ["finance"])).toBe(true);
    expect(canAccessWorkspaceView("finance", ["member"])).toBe(false);
    expect(canAccessWorkspaceView("finance", ["manager"])).toBe(false);
    expect(canAccessWorkspaceView("finance", ["admin"])).toBe(true);
  });
});
