import { getInviteCodes, getSignupMode } from "@/src/lib/env";

const usedInviteCodes = new Set<string>();

export function canSignUp(inputCode?: string): boolean {
  if (getSignupMode() === "open") {
    return true;
  }

  const code = (inputCode ?? "").trim();
  if (!code) {
    return false;
  }

  return getInviteCodes().has(code) && !usedInviteCodes.has(code);
}

export function consumeInviteCode(inputCode?: string): boolean {
  if (getSignupMode() === "open") {
    return true;
  }

  const code = (inputCode ?? "").trim();
  if (!canSignUp(code)) {
    return false;
  }

  usedInviteCodes.add(code);
  return true;
}
