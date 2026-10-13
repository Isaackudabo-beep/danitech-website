import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { sendJson } from './http.js';

const scrypt = promisify(scryptCallback);
export const SESSION_SECONDS = 8 * 60 * 60;
const COOKIE_NAME = 'danitech_admin_session';

export function hashToken(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = await scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return { salt, hash: derived.toString('hex') };
}

export async function verifyPassword(password, salt, expectedHex) {
  if (typeof password !== 'string' || typeof salt !== 'string' || !/^[a-f0-9]{128}$/i.test(expectedHex || '')) return false;
  const { hash } = await hashPassword(password, salt);
  const actual = Buffer.from(hash, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSessionValues() {
  const token = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token), csrfToken, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000) };
}

function cookieSecure(req) {
  return process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
}

export function setSessionCookie(req, res, token) {
  const secure = cookieSecure(req) ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`);
}

export function clearSessionCookie(req, res) {
  const secure = cookieSecure(req) ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

export function getSessionToken(req) {
  const cookieHeader = req.headers.cookie || '';
  const item = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!item) return '';
  try { return decodeURIComponent(item.slice(COOKIE_NAME.length + 1)); } catch { return ''; }
}

export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || typeof req.headers.host !== 'string') return false;
  try {
    const parsed = new URL(origin);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.host !== req.headers.host) return false;
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (typeof forwardedProto === 'string' && forwardedProto) {
      const protocol = `${forwardedProto.split(',')[0].trim()}:`;
      if (!['https:', 'http:'].includes(protocol) || parsed.protocol !== protocol) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function validCsrf(req, session) {
  const token = req.headers['x-csrf-token'];
  return typeof token === 'string' && typeof session.csrf_token === 'string' && token.length === session.csrf_token.length && timingSafeEqual(Buffer.from(token), Buffer.from(session.csrf_token));
}

export async function requireAdmin(req, res, { csrf = false } = {}) {
  if (!getSessionToken(req)) {
    sendJson(res, 401, { error: 'Authentication required.' });
    return null;
  }
  const { getSql } = await import('./db.js');
  return requireAdminWithSql(req, res, getSql(), { csrf });
}

export async function requireAdminWithSql(req, res, sql, { csrf = false } = {}) {
  const token = getSessionToken(req);
  if (!token) {
    sendJson(res, 401, { error: 'Authentication required.' });
    return null;
  }
  const rows = await sql.query(
    `SELECT a.id, a.email, s.csrf_token FROM admin_sessions s JOIN admin_users a ON a.id = s.admin_id WHERE s.token_hash = $1 AND s.expires_at > now() AND a.is_enabled = true LIMIT 1`,
    [hashToken(token)],
  );
  const admin = rows[0];
  if (!admin) {
    clearSessionCookie(req, res);
    sendJson(res, 401, { error: 'Authentication required.' });
    return null;
  }
  if (csrf && (!sameOrigin(req) || !validCsrf(req, admin))) {
    sendJson(res, 403, { error: 'Request verification failed.' });
    return null;
  }
  return { id: admin.id, email: admin.email, csrfToken: admin.csrf_token };
}

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
