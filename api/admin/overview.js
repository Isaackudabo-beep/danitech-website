import { getSql } from '../../lib/server/db.js';
import { authorizeAdmin } from '../../lib/server/admin-api.js';
import { sendJson } from '../../lib/server/http.js';

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!await authorizeAdmin(req, res)) return;
  try {
    const sql = getSql();
    const [counts] = await sql.query(`SELECT (SELECT count(*)::int FROM contact_submissions) AS submissions, (SELECT count(*)::int FROM contact_submissions WHERE status = 'new') AS unread, (SELECT count(*)::int FROM projects) AS projects, (SELECT count(*)::int FROM team_members) AS team_members, (SELECT count(*)::int FROM testimonials) AS testimonials, (SELECT count(*)::int FROM partners) AS partners`);
    return sendJson(res, 200, counts);
  } catch {
    return sendJson(res, 503, { error: 'Dashboard data is temporarily unavailable.' });
  }
}
