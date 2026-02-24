export type SignupMode = "invite_only" | "open";

export function getSignupMode(): SignupMode {
  const mode = process.env.AUTH_SIGNUP_MODE?.trim().toLowerCase();
  if (mode === "open") {
    return "open";
  }
  return "invite_only";
}

export function isBootstrapInviteBypassEmail(email?: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  return getBootstrapAdminEmailAllowlist().has(normalizedEmail);
}

export function getBootstrapAdminEmailAllowlist(): Set<string> {
  const value = [process.env.AUTH_ADMIN_EMAIL ?? "", process.env.AUTH_ADMIN_EMAILS ?? ""].filter(Boolean).join(",");
  if (!value.trim()) {
    return new Set();
  }

  const entries = value
    .split(/[,\n;]/)
    .map((entry) => normalizeEmail(entry))
    .filter((entry): entry is string => Boolean(entry));

  return new Set(entries);
}

function normalizeEmail(email?: string): string {
  return (email ?? "").trim().toLowerCase();
}
