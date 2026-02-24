import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const selectLimit = vi.fn();
const updateReturning = vi.fn();

const dbMock = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: selectLimit,
      })),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: updateReturning,
      })),
    })),
  })),
};

vi.mock("@/src/db/client", () => ({
  db: dbMock,
}));

describe("invites", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.AUTH_ADMIN_EMAIL;
    delete process.env.AUTH_ADMIN_EMAILS;
    delete process.env.AUTH_SIGNUP_MODE;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows open mode", async () => {
    process.env.AUTH_SIGNUP_MODE = "open";
    const { canSignUp } = await import("../src/lib/invites");
    await expect(canSignUp()).resolves.toBe(true);
  });

  it("allows invite bypass for configured AUTH_ADMIN_EMAIL", async () => {
    process.env.AUTH_SIGNUP_MODE = "invite_only";
    process.env.AUTH_ADMIN_EMAIL = "admin@example.com";
    const { canSignUp, consumeInviteCode } = await import("../src/lib/invites");

    await expect(canSignUp("", "admin@example.com")).resolves.toBe(true);
    await expect(consumeInviteCode("", "admin@example.com")).resolves.toBe(true);
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("supports AUTH_ADMIN_EMAILS as a compatibility alias", async () => {
    process.env.AUTH_SIGNUP_MODE = "invite_only";
    process.env.AUTH_ADMIN_EMAILS = "admin@example.com";
    const { canSignUp } = await import("../src/lib/invites");

    await expect(canSignUp("", "admin@example.com")).resolves.toBe(true);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  it("validates and consumes DB invite in invite-only mode", async () => {
    process.env.AUTH_SIGNUP_MODE = "invite_only";
    selectLimit.mockResolvedValueOnce([{ id: "i1" }]).mockResolvedValueOnce([]);
    updateReturning.mockResolvedValueOnce([{ id: "i1" }]);

    const { canSignUp, consumeInviteCode } = await import("../src/lib/invites");

    await expect(canSignUp("code-a", "user@example.com")).resolves.toBe(true);
    await expect(consumeInviteCode("code-a", "user@example.com")).resolves.toBe(true);
    await expect(canSignUp("code-a", "user@example.com")).resolves.toBe(false);
  });
});
