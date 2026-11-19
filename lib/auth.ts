import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, desc, eq, gt, ne } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { CACHE_KEYS, deleteCacheKey } from './cache';
import { getRedis } from './redis';
import { hashPassword, verifyPassword } from './password';

export const ADMIN_SESSION_COOKIE = 'ratanak_admin_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_REDIS_TTL_SECONDS = 900; // 15 minutes sliding cache

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
  sessionId: string;
}

export interface AdminSessionRecord {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

function hashSessionToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export async function createAdminSession(
  userId: string,
  meta: { ipAddress: string | null; userAgent: string | null }
): Promise<{ sessionId: string; expiresAt: Date }> {
  const db = getDb();
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const [inserted] = await db
    .insert(schema.adminSessions)
    .values({
      userId,
      tokenHash,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt,
    })
    .returning({ id: schema.adminSessions.id });

  const [user] = await db
    .select({
      id: schema.adminUsers.id,
      email: schema.adminUsers.email,
      name: schema.adminUsers.name,
    })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, userId))
    .limit(1);

  if (user) {
    const payload: AuthenticatedAdmin = {
      id: user.id,
      email: user.email,
      name: user.name,
      sessionId: inserted.id,
    };
    try {
      await getRedis().set(
        CACHE_KEYS.SESSION(tokenHash),
        JSON.stringify(payload),
        'EX',
        SESSION_REDIS_TTL_SECONDS
      );
    } catch {
      // Non-fatal: DB holds authoritative session
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return { sessionId: inserted.id, expiresAt };
}

export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!rawToken) return null;

  const tokenHash = hashSessionToken(rawToken);
  const cacheKey = CACHE_KEYS.SESSION(tokenHash);

  try {
    const cached = await getRedis().get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as AuthenticatedAdmin;
    }
  } catch {
    // Fall through to PostgreSQL
  }

  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({
      sessionId: schema.adminSessions.id,
      expiresAt: schema.adminSessions.expiresAt,
      userId: schema.adminUsers.id,
      email: schema.adminUsers.email,
      name: schema.adminUsers.name,
    })
    .from(schema.adminSessions)
    .innerJoin(schema.adminUsers, eq(schema.adminSessions.userId, schema.adminUsers.id))
    .where(and(eq(schema.adminSessions.tokenHash, tokenHash), gt(schema.adminSessions.expiresAt, now)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const admin: AuthenticatedAdmin = {
    id: row.userId,
    email: row.email,
    name: row.name,
    sessionId: row.sessionId,
  };

  // Update last active timestamp & repopulate Redis session cache
  const remainingSec = Math.max(
    1,
    Math.min(SESSION_REDIS_TTL_SECONDS, Math.floor((row.expiresAt.getTime() - Date.now()) / 1000))
  );

  await Promise.allSettled([
    db
      .update(schema.adminSessions)
      .set({ lastActiveAt: now })
      .where(eq(schema.adminSessions.id, row.sessionId)),
    getRedis().set(cacheKey, JSON.stringify(admin), 'EX', remainingSec),
  ]);

  return admin;
}

/**
 * Use inside Dashboard Server Components & Server Actions.
 * Redirects unauthenticated callers directly to /login.
 */
export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/login');
  }
  return admin;
}

/**
 * Use inside Route Handlers (`/api/admin/*`).
 * Returns null without throwing a Next.js redirect so callers can return 401 JSON.
 */
export async function requireAdminApi(): Promise<AuthenticatedAdmin | null> {
  return getCurrentAdmin();
}

export async function clearCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (rawToken) {
    const tokenHash = hashSessionToken(rawToken);
    const db = getDb();
    await Promise.allSettled([
      db.delete(schema.adminSessions).where(eq(schema.adminSessions.tokenHash, tokenHash)),
      deleteCacheKey(CACHE_KEYS.SESSION(tokenHash)),
    ]);
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function listAdminSessions(
  userId: string,
  currentSessionId: string
): Promise<AdminSessionRecord[]> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(schema.adminSessions)
    .where(and(eq(schema.adminSessions.userId, userId), gt(schema.adminSessions.expiresAt, now)))
    .orderBy(desc(schema.adminSessions.lastActiveAt));

  return rows.map((r) => ({
    id: r.id,
    ipAddress: r.ipAddress,
    userAgent: r.userAgent,
    lastActiveAt: r.lastActiveAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    isCurrent: r.id === currentSessionId,
  }));
}

export async function revokeAdminSession(userId: string, sessionId: string): Promise<void> {
  const db = getDb();
  const [deleted] = await db
    .delete(schema.adminSessions)
    .where(and(eq(schema.adminSessions.id, sessionId), eq(schema.adminSessions.userId, userId)))
    .returning({ tokenHash: schema.adminSessions.tokenHash });

  if (deleted) {
    await deleteCacheKey(CACHE_KEYS.SESSION(deleted.tokenHash));
  }
}

export async function revokeOtherAdminSessions(
  userId: string,
  currentSessionId: string
): Promise<number> {
  const db = getDb();
  const deleted = await db
    .delete(schema.adminSessions)
    .where(
      and(eq(schema.adminSessions.userId, userId), ne(schema.adminSessions.id, currentSessionId))
    )
    .returning({ tokenHash: schema.adminSessions.tokenHash });

  await Promise.allSettled(deleted.map((d) => deleteCacheKey(CACHE_KEYS.SESSION(d.tokenHash))));
  return deleted.length;
}

export async function authenticateAdminCredentials(
  email: string,
  password: string
): Promise<{ id: string; email: string; name: string } | null> {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, normalizedEmail))
    .limit(1);

  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return { id: user.id, email: user.email, name: user.name };
}

export async function updateAdminCredentials(params: {
  userId: string;
  currentSessionId: string;
  currentPassword: string;
  newEmail?: string;
  newName?: string;
  newPassword?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, params.userId))
    .limit(1);

  if (!user) {
    return { ok: false, error: 'Account not found.' };
  }

  const validCurrent = await verifyPassword(params.currentPassword, user.passwordHash);
  if (!validCurrent) {
    return { ok: false, error: 'Current password is incorrect.' };
  }

  const updates: Partial<typeof schema.adminUsers.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (params.newEmail && params.newEmail.trim().toLowerCase() !== user.email) {
    updates.email = params.newEmail.trim().toLowerCase();
  }
  if (params.newName && params.newName.trim().length > 0) {
    updates.name = params.newName.trim();
  }
  if (params.newPassword && params.newPassword.length > 0) {
    if (params.newPassword.length < 8) {
      return { ok: false, error: 'New password must be at least 8 characters long.' };
    }
    updates.passwordHash = await hashPassword(params.newPassword);
  }

  await db.update(schema.adminUsers).set(updates).where(eq(schema.adminUsers.id, params.userId));

  // If password changed, revoke all other active sessions
  if (updates.passwordHash) {
    await revokeOtherAdminSessions(params.userId, params.currentSessionId);
  }

  // Refresh Redis cache for current session cookie if email/name changed
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (rawToken) {
    await deleteCacheKey(CACHE_KEYS.SESSION(hashSessionToken(rawToken)));
  }

  return { ok: true };
}
