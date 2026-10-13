export function sendJson(res, statusCode, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(statusCode).json(body);
}

export function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export function readJsonBody(req, maxBytes = 8192) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body !== 'string' || Buffer.byteLength(req.body) > maxBytes) {
    return null;
  }

  try {
    return JSON.parse(req.body);
  } catch {
    return null;
  }
}
