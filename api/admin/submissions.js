import { getSql } from '../../lib/server/db.js';
import { authorizeAdmin, parseJson, requireMethod, validId, sendServerError } from '../../lib/server/admin-api.js';
import { sendJson } from '../../lib/server/http.js';

export function createHandler({ getSqlFn = getSql, authorizeAdminFn = authorizeAdmin } = {}) {
  return async function handler(req, res) {
  if (!requireMethod(req, res, ['GET', 'PATCH', 'DELETE'])) return;
  const admin = await authorizeAdminFn(req, res, { csrf: req.method !== 'GET' });
  if (!admin) return;
  try {
    const sql = getSqlFn();
    if (req.method === 'GET') {
      const rawLimit = Number(req.query?.limit ?? 50);
      const rawOffset = Number(req.query?.offset ?? 0);
      const limit = Number.isInteger(rawLimit) ? Math.max(1, Math.min(rawLimit, 100)) : 50;
      const offset = Number.isInteger(rawOffset) ? Math.max(0, rawOffset) : 0;
      const rows = await sql.query(`SELECT id, name, email, service, message, status, created_at FROM contact_submissions ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
      const [total] = await sql.query(`SELECT count(*)::int AS total FROM contact_submissions`);
      return sendJson(res, 200, { items: rows, total: total.total });
    }

    const id = req.query?.id;
    if (!validId(id)) return sendJson(res, 400, { error: 'A valid submission id is required.' });

    if (req.method === 'PATCH') {
      const body = parseJson(req, res, 1024);
      if (!body) return;
      if (!['new', 'read', 'archived'].includes(body.status)) return sendJson(res, 400, { error: 'Status must be new, read, or archived.' });
      const rows = await sql.query(`UPDATE contact_submissions SET status = $1 WHERE id = $2 RETURNING id, name, email, service, message, status, created_at`, [body.status, id]);
      return rows.length ? sendJson(res, 200, { item: rows[0] }) : sendJson(res, 404, { error: 'Submission not found.' });
    }

    const rows = await sql.query(`DELETE FROM contact_submissions WHERE id = $1 RETURNING id`, [id]);
    return rows.length ? sendJson(res, 200, { ok: true }) : sendJson(res, 404, { error: 'Submission not found.' });
  } catch {
    return sendServerError(res);
  }
  };
}

export default createHandler();
