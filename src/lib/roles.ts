import { eq } from "drizzle-orm";

export const APP_ROLES = ["member", "manager", "finance", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

type BetterAuthUser = {
  id?: string | null;
  email?: string | null;
  role?: string | string[] | null;
};

export async function getUserRoles(user: BetterAuthUser): Promise<AppRole[]> {
  const normalized = new Set<AppRole>();

  if (Array.isArray(user.role)) {
    for (const role of user.role) {
      if (isAppRole(role)) {
        normalized.add(role);
      }
    }
  } else if (typeof user.role === "string" && isAppRole(user.role)) {
    normalized.add(user.role);
  }

  if (typeof user.id === "string" && user.id) {
    const dbRoles = await getPersistedRolesForUser(user.id);
    for (const role of dbRoles) {
      normalized.add(role);
    }
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

async function getPersistedRolesForUser(userId: string): Promise<AppRole[]> {
  const { db } = await import("@/src/db/client");
  const { roleAssignments } = await import("@/src/db/schema");

  const rows = await db
    .select({ role: roleAssignments.role })
    .from(roleAssignments)
    .where(eq(roleAssignments.userId, userId));

  const roles = new Set<AppRole>();
  for (const row of rows) {
    if (isAppRole(row.role)) {
      roles.add(row.role);
    }
  }

  return Array.from(roles);
}
