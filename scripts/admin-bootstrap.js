export function databaseTarget(connectionString) {
  let url;
  try { url = new URL(connectionString); } catch { return null; }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname.endsWith('.neon.tech')) return null;
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!database || /[\r\n\t]/.test(database)) return null;
  return { host: url.hostname.toLowerCase(), database, confirmation: `${url.hostname.toLowerCase()}/${database}` };
}

export async function createInitialAdmin(sql, { email, passwordHash, passwordSalt }) {
  const result = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(784513920471::bigint)`,
    sql`INSERT INTO admin_users (email, password_salt, password_hash)
        SELECT ${email}, ${passwordSalt}, ${passwordHash}
        WHERE NOT EXISTS (SELECT 1 FROM admin_users)
        RETURNING id`,
  ]);
  return result[1] || [];
}
