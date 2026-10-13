import { requireAdmin } from './admin-auth.js';
import { sendJson } from './http.js';

export async function authorizeAdmin(req, res, { csrf = false } = {}) {
  try {
    return await requireAdmin(req, res, { csrf });
  } catch {
    sendJson(res, 503, { error: 'Admin service is temporarily unavailable.' });
    return null;
  }
}

export function requireMethod(req, res, methods) {
  res.setHeader('Allow', methods.join(', '));
  if (!methods.includes(req.method)) {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return false;
  }
  return true;
}

export function validId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseJson(req, res, maxBytes = 16384) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body !== 'string' || Buffer.byteLength(req.body) > maxBytes) {
    sendJson(res, 400, { error: 'Invalid request body.' });
    return null;
  }
  try {
    return JSON.parse(req.body);
  } catch {
    sendJson(res, 400, { error: 'Invalid request body.' });
    return null;
  }
}

export function boundedText(value, maxLength, { required = false } = {}) {
  if (typeof value !== 'string') return required ? null : '';
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maxLength) return null;
  return normalized;
}

export function boundedUrl(value, { required = false } = {}) {
  if (value == null || value === '') return required ? null : '';
  if (typeof value !== 'string' || value.length > 2048) return null;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function boundedSocialUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) return value;
  if (/^tel:\+?[0-9(). -]{5,30}$/i.test(value)) return value;
  return boundedUrl(value, { required: true });
}

export function sendServerError(res) {
  return sendJson(res, 503, { error: 'The request could not be completed.' });
}
