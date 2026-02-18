import { getAdminEmails } from "@/src/lib/env";

export const APP_ROLES = ["member", "manager", "finance", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

type BetterAuthUser = {
  email?: string | null;
  role?: string | string[] | null;
};

export function getUserRoles(user: BetterAuthUser): AppRole[] {
  const normalized = new Set<AppRole>();
  const adminEmails = getAdminEmails();
  const email = user.email?.toLowerCase();

  if (email && adminEmails.has(email)) {
    normalized.add("admin");
  }

  if (Array.isArray(user.role)) {
    for (const role of user.role) {
      if (isAppRole(role)) {
        normalized.add(role);
      }
    }
  } else if (typeof user.role === "string" && isAppRole(user.role)) {
    normalized.add(user.role);
  }

  if (normalized.has("admin")) {
    normalized.add("finance");
    normalized.add("member");
  }

  if (normalized.size === 0) {
    normalized.add("member");
  }

  return Array.from(normalized);
}

function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}
