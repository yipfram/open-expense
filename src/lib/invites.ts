import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { invites } from "@/src/db/schema";
import { getInviteCodes, getSignupMode } from "@/src/lib/env";

const usedFallbackInviteCodes = new Set<string>();

export async function canSignUp(inputCode?: string): Promise<boolean> {
  if (getSignupMode() === "open") {
    return true;
  }

  const code = normalizeCode(inputCode);
  if (!code) {
    return false;
  }

  if (isFallbackModeEnabled()) {
    return canUseFallbackInviteCode(code);
  }

  const db = await getDb();
  const rows = await db
    .select({ id: invites.id })
    .from(invites)
    .where(and(eq(invites.token, code), isNull(invites.usedAt), gt(invites.expiresAt, new Date())))
    .limit(1);

  return rows.length > 0;
}

export async function consumeInviteCode(inputCode?: string): Promise<boolean> {
  if (getSignupMode() === "open") {
    return true;
  }

  const code = normalizeCode(inputCode);
  if (!code) {
    return false;
  }

  if (isFallbackModeEnabled()) {
    if (!canUseFallbackInviteCode(code)) {
      return false;
    }
    usedFallbackInviteCodes.add(code);
    return true;
  }

  const db = await getDb();
  const updated = await db
    .update(invites)
    .set({ usedAt: new Date() })
    .where(and(eq(invites.token, code), isNull(invites.usedAt), gt(invites.expiresAt, new Date())))
    .returning({ id: invites.id });

  return updated.length > 0;
}

type CreateInviteInput = {
  email?: string;
  createdByUserId?: string;
  expiresInDays?: number;
};

export async function createInvite(input: CreateInviteInput = {}) {
  const db = await getDb();
  const token = generateInviteToken();
  const expiresInDays = input.expiresInDays ?? 14;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const created = await db
    .insert(invites)
    .values({
      token,
      email: input.email?.trim().toLowerCase() || null,
      createdByUserId: input.createdByUserId ?? null,
      expiresAt,
    })
    .returning({
      id: invites.id,
      token: invites.token,
      email: invites.email,
      expiresAt: invites.expiresAt,
      createdAt: invites.createdAt,
    });

  return created[0];
}

export async function listInvites(limit = 50) {
  const db = await getDb();
  return db
    .select({
      id: invites.id,
      token: invites.token,
      email: invites.email,
      createdByUserId: invites.createdByUserId,
      expiresAt: invites.expiresAt,
      usedAt: invites.usedAt,
      createdAt: invites.createdAt,
    })
    .from(invites)
    .orderBy(desc(invites.createdAt))
    .limit(limit);
}

function normalizeCode(inputCode?: string) {
  return (inputCode ?? "").trim();
}

function canUseFallbackInviteCode(code: string) {
  const fallbackCodes = getInviteCodes();
  return fallbackCodes.has(code) && !usedFallbackInviteCodes.has(code);
}

function isFallbackModeEnabled() {
  return getInviteCodes().size > 0;
}

function generateInviteToken() {
  return `inv_${randomUUID().replace(/-/g, "")}`;
}

async function getDb() {
  const mod = await import("@/src/db/client");
  return mod.db;
}
