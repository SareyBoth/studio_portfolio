import 'server-only';
import { revalidateTag, updateTag } from 'next/cache';
import { getRedis } from './redis';

export const CACHE_KEYS = {
  PORTFOLIO: 'portfolio:v1:full',
  SESSION: (tokenHash: string) => `session:v1:${tokenHash}`,
} as const;

export const PORTFOLIO_CACHE_TAG = 'portfolio';
export const PORTFOLIO_TTL_SECONDS = 3600;

export async function getCachedJson<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = getRedis();

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    console.warn(`[Cache] Redis GET failed for ${key}:`, err instanceof Error ? err.message : err);
  }

  const fresh = await fetcher();

  try {
    await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`[Cache] Redis SET failed for ${key}:`, err instanceof Error ? err.message : err);
  }

  return fresh;
}

export async function deleteCacheKey(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch (err) {
    console.warn(`[Cache] Redis DEL failed for ${key}:`, err instanceof Error ? err.message : err);
  }
}

/**
 * Invalidate both Redis and Next.js 16 Cache Components tag after a Server Action write.
 */
export async function invalidatePortfolioFromAction(): Promise<void> {
  await deleteCacheKey(CACHE_KEYS.PORTFOLIO);
  updateTag(PORTFOLIO_CACHE_TAG);
}

/**
 * Invalidate both Redis and Next.js 16 Cache Components tag after a Route Handler write.
 */
export async function invalidatePortfolioFromRoute(): Promise<void> {
  await deleteCacheKey(CACHE_KEYS.PORTFOLIO);
  revalidateTag(PORTFOLIO_CACHE_TAG, 'max');
}

export async function getPortfolioCacheStatus(): Promise<{
  cached: boolean;
  ttlSeconds: number;
}> {
  try {
    const ttl = await getRedis().ttl(CACHE_KEYS.PORTFOLIO);
    return {
      cached: ttl > 0,
      ttlSeconds: ttl > 0 ? ttl : 0,
    };
  } catch {
    return { cached: false, ttlSeconds: 0 };
  }
}
