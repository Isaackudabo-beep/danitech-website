import { getSql } from '../../lib/server/db.js';
import { clearSessionCookie, createSessionValues, getSessionToken, hashToken, isValidEmail, requireAdmin, sameOrigin, setSessionCookie, verifyPassword } from '../../lib/server/admin-auth.js';
import { readJsonBody, sendJson } from '../../lib/server/http.js';
import { createHmac } from 'node:crypto';

const MAX_LOGIN_ATTEMPTS = 8;

export function getLoginRateLimitSalt(env = process.env) {
  const salt = env.ADMIN_LOGIN_SALT || '';
  if (env.NODE_ENV === 'production') return /^[a-f0-9]{64}$/i.test(salt) ? salt : null;
  return salt || env.DATABASE_URL || env.POSTGRES_URL || 'danitech-local-login-rate-limit';
}

function requestKey(req, salt) {
  const address = req.ip || 'unknown';
  return createHmac('sha256', salt).update(String(address)).digest('hex');
}

export function createHandler({ getSqlFn = getSql, requireAdminFn = requireAdmin } = {}) {
  return async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const admin = await requireAdminFn(req, res);
      if (!admin) return;
      return sendJson(res, 200, { authenticated: true, email: admin.email, csrfToken: admin.csrfToken });
    }

    if (req.method === 'POST') {
      res.setHeader('Allow', 'GET, POST, DELETE');
      if (!sameOrigin(req)) return sendJson(res, 403, { error: 'Request origin is not allowed.' });
      const body = readJsonBody(req, 4096);
      const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body?.password === 'string' ? body.password : '';
      if (!isValidEmail(email) || password.length < 1 || password.length > 1024) {
        return sendJson(res, 400, { error: 'Enter a valid email and password.' });
      }

      const rateLimitSalt = getLoginRateLimitSalt();
      if (!rateLimitSalt) return sendJson(res, 503, { error: 'Authentication service is not configured.' });
      const sql = getSqlFn();
      const key = requestKey(req, rateLimitSalt);
      const [attempt] = await sql.query(
        `INSERT INTO admin_login_limits (key_hash, window_started_at, attempt_count) VALUES ($1, now(), 1) ON CONFLICT (key_hash) DO UPDATE SET attempt_count = CASE WHEN admin_login_limits.window_started_at <= now() - interval '15 minutes' THEN 1 ELSE admin_login_limits.attempt_count + 1 END, window_started_at = CASE WHEN admin_login_limits.window_started_at <= now() - interval '15 minutes' THEN now() ELSE admin_login_limits.window_started_at END RETURNING attempt_count`,
        [key],
      );
      if (attempt.attempt_count > MAX_LOGIN_ATTEMPTS) return sendJson(res, 429, { error: 'Too many sign-in attempts. Try again later.' });

      const [admin] = await sql.query(`SELECT id, email, password_salt, password_hash FROM admin_users WHERE email = $1 AND is_enabled = true LIMIT 1`, [email]);
      const matches = admin
        ? await verifyPassword(password, admin.password_salt, admin.password_hash)
        : await verifyPassword(password, '00000000000000000000000000000000', '00'.repeat(64));
      if (!admin || !matches) return sendJson(res, 401, { error: 'Email or password is incorrect.' });

      const session = createSessionValues();
      await sql.query(`INSERT INTO admin_sessions (token_hash, csrf_token, admin_id, expires_at) VALUES ($1, $2, $3, $4)`, [session.tokenHash, session.csrfToken, admin.id, session.expiresAt]);
      await sql.query(`DELETE FROM admin_login_limits WHERE key_hash = $1`, [key]);
      setSessionCookie(req, res, session.token);
      return sendJson(res, 200, { authenticated: true, email: admin.email, csrfToken: session.csrfToken });
    }

    if (req.method === 'DELETE') {
      res.setHeader('Allow', 'GET, POST, DELETE');
      const admin = await requireAdminFn(req, res, { csrf: true });
      if (!admin) return;
      const sql = getSqlFn();
      const token = getSessionToken(req);
      await sql.query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [hashToken(token)]);
      clearSessionCookie(req, res);
      return sendJson(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch {
    return sendJson(res, 503, { error: 'Authentication service is temporarily unavailable.' });
  }
  };
}

export default createHandler();
