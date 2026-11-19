import 'server-only';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  __ratanakPgPool?: Pool;
};

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getPool(): Pool {
  if (!globalForDb.__ratanakPgPool) {
    globalForDb.__ratanakPgPool = createPool();
  }
  return globalForDb.__ratanakPgPool;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}

export { schema };
