import { eq, sql } from "drizzle-orm";

import { roleAssignments, user } from "@/src/db/schema";
import { isBootstrapInviteBypassEmail } from "@/src/lib/env";

const BOOTSTRAP_ADMIN_ROLES = ["admin", "finance", "member"] as const;

export async function ensureBootstrapAdminRolesForEmail(email?: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isBootstrapInviteBypassEmail(normalizedEmail)) {
    return;
  }

  const db = await getDb();
  const matchedUsers = await db
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizedEmail}`)
    .limit(1);
  const userId = matchedUsers[0]?.id;

  if (!userId) {
    return;
  }

  const existingRoles = await db
    .select({ role: roleAssignments.role })
    .from(roleAssignments)
    .where(eq(roleAssignments.userId, userId));

  const existingRoleSet = new Set(existingRoles.map((entry) => entry.role));
  const missingRoles = BOOTSTRAP_ADMIN_ROLES.filter((role) => !existingRoleSet.has(role));

  if (missingRoles.length === 0) {
    return;
  }

  await db.insert(roleAssignments).values(
    missingRoles.map((role) => ({
      userId,
      role,
    })),
  );
}

function normalizeEmail(email?: string): string {
  return (email ?? "").trim().toLowerCase();
}

async function getDb() {
  const mod = await import("@/src/db/client");
  return mod.db;
}
