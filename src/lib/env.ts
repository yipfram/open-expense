export type SignupMode = "invite_only" | "open";

export function getSignupMode(): SignupMode {
  const mode = process.env.AUTH_SIGNUP_MODE?.trim().toLowerCase();
  if (mode === "open") {
    return "open";
  }
  return "invite_only";
}
