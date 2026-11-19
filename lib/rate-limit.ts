import { createHash } from 'node:crypto';
import type Redis from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export type RateLimitStore = Pick<Redis, 'incr' | 'expire' | 'ttl' | 'del'>;

export async function consumeRateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const count = await store.incr(key);
  if (count === 1) {
    await store.expire(key, windowSeconds);
  }

  if (count > limit) {
    const ttl = await store.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: 0,
  };
}

export function buildLoginRateLimitKey(ip: string, email: string): string {
  const emailHash = createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex')
    .slice(0, 16);
  return `rl:login:${ip}:${emailHash}`;
}

export function buildContactRateLimitKey(ip: string): string {
  return `rl:contact:${ip}`;
}
