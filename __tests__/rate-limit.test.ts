import { describe, expect, it } from 'vitest';
import {
  buildContactRateLimitKey,
  buildLoginRateLimitKey,
  consumeRateLimit,
  type RateLimitStore,
} from '@/lib/rate-limit';

function createMemoryRedisStore(): RateLimitStore {
  const counts = new Map<string, number>();
  const ttls = new Map<string, number>();

  return {
    async incr(key: string) {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    },
    async expire(key: string, seconds: number) {
      ttls.set(key, seconds);
      return 1;
    },
    async ttl(key: string) {
      return ttls.get(key) ?? -1;
    },
    async del(key: string) {
      counts.delete(key);
      ttls.delete(key);
      return 1;
    },
  } as unknown as RateLimitStore;
}

describe('Redis rate limiter', () => {
  it('allows requests up to limit and blocks subsequent attempts with retryAfterSeconds', async () => {
    const store = createMemoryRedisStore();
    const key = buildLoginRateLimitKey('203.0.113.10', 'Admin@Example.com');

    for (let i = 1; i <= 5; i++) {
      const res = await consumeRateLimit(store, key, 5, 900);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(5 - i);
    }

    const blocked = await consumeRateLimit(store, key, 5, 900);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(900);
  });

  it('normalizes email casing when hashing login rate-limit keys', () => {
    const k1 = buildLoginRateLimitKey('127.0.0.1', 'User@Domain.COM');
    const k2 = buildLoginRateLimitKey('127.0.0.1', ' user@domain.com ');
    expect(k1).toBe(k2);
    expect(k1).not.toContain('user@domain.com');
    expect(buildContactRateLimitKey('127.0.0.1')).toBe('rl:contact:127.0.0.1');
  });
});
