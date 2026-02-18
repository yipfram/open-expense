import { auth } from "@/src/lib/auth";
import { getAdminEmails } from "@/src/lib/env";

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

  const adminEmails = getAdminEmails();
  if (!adminEmails.has(email.toLowerCase())) {
    console.log("Warning: seeded user is not listed in AUTH_ADMIN_EMAILS.");
  }
}

void main();
