import { describe, expect, it } from "vitest";

import { canSignUp, consumeInviteCode } from "../src/lib/invites";

describe("invites", () => {
  it("allows open mode", () => {
    process.env.AUTH_SIGNUP_MODE = "open";
    expect(canSignUp()).toBe(true);
  });

  it("validates and consumes invite code in invite-only mode", () => {
    process.env.AUTH_SIGNUP_MODE = "invite_only";
    process.env.INVITE_CODES = "code-a,code-b";

    expect(canSignUp("code-a")).toBe(true);
    expect(consumeInviteCode("code-a")).toBe(true);
    expect(canSignUp("code-a")).toBe(false);
    expect(canSignUp("code-b")).toBe(true);
  });
});
