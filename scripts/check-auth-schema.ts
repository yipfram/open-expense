import { Client } from "pg";
import "dotenv/config";

const REQUIRED_TABLES = ["user", "session", "account", "verification"];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(
    `select table_name from information_schema.tables where table_schema='public' and table_name = any($1::text[])`,
    [REQUIRED_TABLES],
  );

  const present = new Set(result.rows.map((r) => r.table_name));
  const missing = REQUIRED_TABLES.filter((t) => !present.has(t));

  await client.end();

  if (missing.length > 0) {
    throw new Error(`Missing Better Auth tables: ${missing.join(", ")}. Run: pnpm db:migrate`);
  }

  console.log("Better Auth schema check passed.");
}

void main();