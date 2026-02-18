export type SignupMode = "invite_only" | "open";

export function getSignupMode(): SignupMode {
  const mode = process.env.AUTH_SIGNUP_MODE?.trim().toLowerCase();
  if (mode === "open") {
    return "open";
  }
  return "invite_only";
}

export function getAdminEmails(): Set<string> {
  const value = process.env.AUTH_ADMIN_EMAILS ?? "";
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getInviteCodes(): Set<string> {
  const value = process.env.INVITE_CODES ?? "";
  return new Set(
    value
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean),
  );
}
