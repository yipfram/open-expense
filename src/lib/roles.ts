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
  let rows: Array<{ role: string }>;

  try {
    rows = await db
      .select({ role: roleAssignments.role })
      .from(roleAssignments)
      .where(eq(roleAssignments.userId, userId));
  } catch (error) {
    if (isMissingRoleAssignmentTableError(error)) {
      console.warn("role_assignment table is missing. Run `pnpm db:migrate`.");
      return [];
    }
    throw error;
  }

  const roles = new Set<AppRole>();
  for (const row of rows) {
    if (isAppRole(row.role)) {
      roles.add(row.role);
    }
  }

  return Array.from(roles);
}

function isMissingRoleAssignmentTableError(error: unknown): boolean {
  const queue: unknown[] = [error];
  const seen = new Set<unknown>();
  const details = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);

    if (typeof current === "object") {
      const record = current as Record<string, unknown>;
      for (const key of ["code", "message", "detail", "hint", "table"]) {
        const value = record[key];
        if (typeof value === "string" && value.trim() !== "") {
          details.add(value.toLowerCase());
        }
      }

      if ("cause" in record) {
        queue.push(record.cause);
      }
      if ("originalError" in record) {
        queue.push(record.originalError);
      }
    }
  }

  if (details.has("42p01")) {
    return true;
  }

  const combined = Array.from(details).join(" ");
  return combined.includes("relation \"role_assignment\" does not exist");
}
