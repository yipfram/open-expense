import { describe, expect, it } from "vitest";

import { canSignUp, consumeInviteCode } from "../src/lib/invites";

describe("invites", () => {
  it("allows open mode", async () => {
    process.env.AUTH_SIGNUP_MODE = "open";
    await expect(canSignUp()).resolves.toBe(true);
  });

  it("validates and consumes invite code in invite-only mode", async () => {
    process.env.AUTH_SIGNUP_MODE = "invite_only";
    process.env.INVITE_CODES = "code-a,code-b";

    await expect(canSignUp("code-a")).resolves.toBe(true);
    await expect(consumeInviteCode("code-a")).resolves.toBe(true);
    await expect(canSignUp("code-a")).resolves.toBe(false);
    await expect(canSignUp("code-b")).resolves.toBe(true);
  });
});
