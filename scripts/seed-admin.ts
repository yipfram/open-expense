import { auth } from "@/src/lib/auth";
import { db } from "@/src/db/client";
import { roleAssignments, user } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD?.trim();
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Initial Admin";

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required.");
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });
    console.log(`Seeded user: ${email}`);
  } catch (error) {
    console.log(`Skipping signup for ${email}. User may already exist.`);
    if (error instanceof Error) {
      console.log(error.message);
    }
  }

  const users = await db.select({ id: user.id }).from(user).where(eq(user.email, email.toLowerCase())).limit(1);
  const userId = users[0]?.id;

  if (!userId) {
    throw new Error(`Unable to find user id for seeded email ${email}.`);
  }

  await ensureRole(userId, "admin");
  await ensureRole(userId, "member");
  await ensureRole(userId, "finance");
  console.log(`Ensured role assignments for user ${email}.`);
}

void main();

async function ensureRole(userId: string, role: string) {
  const existing = await db
    .select({ id: roleAssignments.id })
    .from(roleAssignments)
    .where(and(eq(roleAssignments.userId, userId), eq(roleAssignments.role, role)))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  await db.insert(roleAssignments).values({
    userId,
    role,
  });
}
