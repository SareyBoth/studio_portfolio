import 'server-only';
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  __ratanakRedis?: Redis;
};

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required.');
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 150, 2000);
    },
  });

  client.on('error', (err) => {
    console.error('[Redis] connection error:', err.message);
  });

  return client;
}

export function getRedis(): Redis {
  if (!globalForRedis.__ratanakRedis) {
    globalForRedis.__ratanakRedis = createRedisClient();
  }
  return globalForRedis.__ratanakRedis;
}

export async function pingRedis(): Promise<{ ok: boolean; latencyMs: number | null; error?: string }> {
  if (!process.env.REDIS_URL) {
    return { ok: false, latencyMs: null, error: 'REDIS_URL is not configured' };
  }
  const start = performance.now();
  try {
    const res = await getRedis().ping();
    return {
      ok: res === 'PONG',
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : 'Redis ping failed',
    };
  }
}
