import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isBootstrapInviteBypassEmail = vi.fn();
const selectUserLimit = vi.fn();
const selectRolesWhere = vi.fn();
const insertValues = vi.fn();

const dbMock = {
  select: vi.fn((selection: Record<string, unknown>) => {
    if ("id" in selection) {
      return {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: selectUserLimit,
          })),
        })),
      };
    }

    return {
      from: vi.fn(() => ({
        where: selectRolesWhere,
      })),
    };
  }),
  insert: vi.fn(() => ({
    values: insertValues,
  })),
};

vi.mock("@/src/lib/env", () => ({
  isBootstrapInviteBypassEmail,
}));

vi.mock("@/src/db/client", () => ({
  db: dbMock,
}));

describe("ensureBootstrapAdminRolesForEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when email is not in bootstrap allowlist", async () => {
    isBootstrapInviteBypassEmail.mockReturnValueOnce(false);
    const { ensureBootstrapAdminRolesForEmail } = await import("../src/lib/bootstrap-admin");

    await expect(ensureBootstrapAdminRolesForEmail("admin@example.com")).resolves.toBeUndefined();
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("inserts missing bootstrap roles for bootstrap account", async () => {
    isBootstrapInviteBypassEmail.mockReturnValueOnce(true);
    selectUserLimit.mockResolvedValueOnce([{ id: "user_1" }]);
    selectRolesWhere.mockResolvedValueOnce([{ role: "member" }]);
    const { ensureBootstrapAdminRolesForEmail } = await import("../src/lib/bootstrap-admin");

    await expect(ensureBootstrapAdminRolesForEmail("admin@example.com")).resolves.toBeUndefined();
    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith([
      { userId: "user_1", role: "admin" },
      { userId: "user_1", role: "finance" },
    ]);
  });

  it("does not insert duplicate roles when all are already present", async () => {
    isBootstrapInviteBypassEmail.mockReturnValueOnce(true);
    selectUserLimit.mockResolvedValueOnce([{ id: "user_1" }]);
    selectRolesWhere.mockResolvedValueOnce([{ role: "admin" }, { role: "finance" }, { role: "member" }]);
    const { ensureBootstrapAdminRolesForEmail } = await import("../src/lib/bootstrap-admin");

    await expect(ensureBootstrapAdminRolesForEmail("admin@example.com")).resolves.toBeUndefined();
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("does nothing when bootstrap user cannot be resolved in database", async () => {
    isBootstrapInviteBypassEmail.mockReturnValueOnce(true);
    selectUserLimit.mockResolvedValueOnce([]);
    const { ensureBootstrapAdminRolesForEmail } = await import("../src/lib/bootstrap-admin");

    await expect(ensureBootstrapAdminRolesForEmail("admin@example.com")).resolves.toBeUndefined();
    expect(selectRolesWhere).not.toHaveBeenCalled();
    expect(dbMock.insert).not.toHaveBeenCalled();
  });
});
