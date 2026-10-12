import { neon } from '@neondatabase/serverless';

let cachedSql;

export function getSql() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('Database connection is not configured.');
  }

  cachedSql ??= neon(connectionString);
  return cachedSql;
}
