import { createHash, createHmac } from 'node:crypto';
import { getSql } from '../lib/server/db.js';
import { isSameOrigin, readJsonBody, sendJson } from '../lib/server/http.js';

const MAX_REQUESTS_PER_HOUR = 5;

function normalizeText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function validateContactSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Invalid request body.' };
  if (normalizeText(body.website, 200)) return { honeypot: true };
  const name = normalizeText(body.name, 100);
  const email = normalizeText(body.email, 255).toLowerCase();
  const service = normalizeText(body.service, 100);
  const message = normalizeText(body.message, 2000);
  if (!name || !email || !message) return { error: 'Name, email, and message are required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  return { values: { name, email, service, message } };
}

function getClientAddress(req) {
  if (typeof req.ip === 'string' && req.ip) return req.ip;
  return 'unknown';
}

function getRateLimitKey(req) {
  const address = getClientAddress(req);
  const salt = process.env.RATE_LIMIT_SALT || process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  return salt
    ? createHmac('sha256', salt).update(address).digest('hex')
    : createHash('sha256').update(address).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'POST');

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  if (!isSameOrigin(req)) {
    return sendJson(res, 403, { error: 'Request origin is not allowed.' });
  }

  const body = readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: 'Invalid request body.' });
  }

  const validation = validateContactSubmission(body);
  if (validation.honeypot) {
    return sendJson(res, 202, { ok: true });
  }
  if (validation.error) return sendJson(res, 400, { error: validation.error });
  const { name, email, service, message } = validation.values;

  try {
    const sql = getSql();
    const rateLimitKey = getRateLimitKey(req);
    const [limit] = await sql`
      INSERT INTO api_rate_limits (key_hash, window_started_at, request_count)
      VALUES (${rateLimitKey}, now(), 1)
      ON CONFLICT (key_hash) DO UPDATE SET
        request_count = CASE
          WHEN api_rate_limits.window_started_at <= now() - interval '1 hour' THEN 1
          ELSE api_rate_limits.request_count + 1
        END,
        window_started_at = CASE
          WHEN api_rate_limits.window_started_at <= now() - interval '1 hour' THEN now()
          ELSE api_rate_limits.window_started_at
        END
      RETURNING request_count
    `;

    if (limit.request_count > MAX_REQUESTS_PER_HOUR) {
      return sendJson(res, 429, { error: 'Too many messages. Please try again later.' });
    }

    await sql`
      INSERT INTO contact_submissions (name, email, service, message)
      VALUES (${name}, ${email}, ${service}, ${message})
    `;

    return sendJson(res, 201, { ok: true });
  } catch {
    // Keep SQL details and submitted data out of the response.
    return sendJson(res, 503, { error: 'Message storage is temporarily unavailable.' });
  }
}
