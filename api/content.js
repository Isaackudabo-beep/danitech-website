import { getSql } from '../lib/server/db.js';
import { requireMethod, sendServerError } from '../lib/server/admin-api.js';
import { sendJson } from '../lib/server/http.js';

const PUBLIC_CONTENT = Object.freeze({
  projects: { table: 'projects', fields: 'id, name, slug, description, status, website_url, screenshot_url, display_order' },
  team_members: { table: 'team_members', fields: 'id, name, role, bio, image_url, highlights, social_links, display_order' },
  testimonials: { table: 'testimonials', fields: 'id, author_name, author_role, quote, image_url, display_order' },
  partners: { table: 'partners', fields: 'id, name, description, logo_url, website_url, display_order' },
});

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['GET'])) return;
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  const config = PUBLIC_CONTENT[req.query?.type];
  if (!config) return sendJson(res, 400, { error: 'Unknown content type.' });
  try {
    const sql = getSql();
    const rows = await sql.query(`SELECT ${config.fields} FROM ${config.table} WHERE is_published = true ORDER BY display_order ASC, created_at ASC`);
    return sendJson(res, 200, { items: rows });
  } catch {
    return sendServerError(res);
  }
}
