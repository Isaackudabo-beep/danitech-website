import { getSql } from '../../lib/server/db.js';
import { authorizeAdmin, boundedSocialUrl, boundedText, boundedUrl, parseJson, requireMethod, validId, sendServerError } from '../../lib/server/admin-api.js';
import { sendJson } from '../../lib/server/http.js';

const RESOURCES = Object.freeze({
  projects: {
    table: 'projects',
    fields: ['name', 'slug', 'description', 'status', 'website_url', 'screenshot_url', 'display_order', 'is_published'],
    validate(input) {
      const name = boundedText(input.name, 120, { required: true });
      const slug = boundedText(input.slug, 140, { required: true });
      const description = boundedText(input.description ?? '', 10000);
      const status = boundedText(input.status ?? '', 40);
      const website = boundedUrl(input.website_url);
      const screenshot = boundedUrl(input.screenshot_url);
      const order = orderValue(input.display_order);
      if (!name || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || description === null || status === null || website === null || screenshot === null || order === null || typeof input.is_published !== 'boolean') return null;
      return [name, slug, description, status, website || null, screenshot || null, order, input.is_published];
    },
  },
  team_members: {
    table: 'team_members',
    fields: ['name', 'role', 'bio', 'image_url', 'highlights', 'social_links', 'display_order', 'is_published'],
    validate(input) {
      const name = boundedText(input.name, 120, { required: true });
      const role = boundedText(input.role, 120, { required: true });
      const bio = boundedText(input.bio ?? '', 10000);
      const image = boundedUrl(input.image_url);
      const highlights = stringArray(input.highlights, 20, 160);
      const links = linkArray(input.social_links);
      const order = orderValue(input.display_order);
      if (!name || !role || bio === null || image === null || highlights === null || links === null || order === null || typeof input.is_published !== 'boolean') return null;
      return [name, role, bio, image || null, JSON.stringify(highlights), JSON.stringify(links), order, input.is_published];
    },
  },
  testimonials: {
    table: 'testimonials',
    fields: ['author_name', 'author_role', 'quote', 'image_url', 'display_order', 'is_published'],
    validate(input) {
      const name = boundedText(input.author_name, 120, { required: true });
      const role = boundedText(input.author_role ?? '', 160);
      const quote = boundedText(input.quote, 10000, { required: true });
      const image = boundedUrl(input.image_url);
      const order = orderValue(input.display_order);
      if (!name || role === null || !quote || image === null || order === null || typeof input.is_published !== 'boolean') return null;
      return [name, role, quote, image || null, order, input.is_published];
    },
  },
  partners: {
    table: 'partners',
    fields: ['name', 'description', 'logo_url', 'website_url', 'display_order', 'is_published'],
    validate(input) {
      const name = boundedText(input.name, 120, { required: true });
      const description = boundedText(input.description ?? '', 5000);
      const logo = boundedUrl(input.logo_url);
      const website = boundedUrl(input.website_url);
      const order = orderValue(input.display_order);
      if (!name || description === null || logo === null || website === null || order === null || typeof input.is_published !== 'boolean') return null;
      return [name, description, logo || null, website || null, order, input.is_published];
    },
  },
});

function orderValue(value) {
  const order = value == null || value === '' ? 0 : Number(value);
  return Number.isInteger(order) && order >= 0 && order <= 100000 ? order : null;
}

function stringArray(value, maxItems, maxLength) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const result = value.map((item) => boundedText(item, maxLength, { required: true }));
  return result.some((item) => !item) ? null : result;
}

function linkArray(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 12) return null;
  const links = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const label = boundedText(item.label, 40, { required: true });
    const url = boundedSocialUrl(item.url);
    if (!label || !url) return null;
    links.push({ label, url });
  }
  return links;
}

export function getResource(type) {
  return RESOURCES[type] || null;
}

export function validateResource(type, body) {
  const resource = getResource(type);
  if (!resource || !body || typeof body !== 'object' || Array.isArray(body)) return null;
  return resource.validate(body);
}

export function createHandler({ getSqlFn = getSql, authorizeAdminFn = authorizeAdmin } = {}) {
  return async function handler(req, res) {
  if (!requireMethod(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  const admin = await authorizeAdminFn(req, res, { csrf: req.method !== 'GET' });
  if (!admin) return;
  const type = req.query?.type;
  const resource = getResource(type);
  if (!resource) return sendJson(res, 400, { error: 'Unknown content type.' });

  try {
    const sql = getSqlFn();
    if (req.method === 'GET') {
      const rows = await sql.query(`SELECT * FROM ${resource.table} ORDER BY display_order ASC, created_at DESC`);
      return sendJson(res, 200, { items: rows });
    }

    const id = req.query?.id;
    if (req.method !== 'POST' && !validId(id)) return sendJson(res, 400, { error: 'A valid content id is required.' });
    const body = req.method === 'DELETE' ? {} : parseJson(req, res);
    if (!body) return;

    if (req.method === 'DELETE') {
      const deleted = await sql.query(`DELETE FROM ${resource.table} WHERE id = $1 RETURNING id`, [id]);
      return deleted.length ? sendJson(res, 200, { ok: true }) : sendJson(res, 404, { error: 'Content not found.' });
    }

    const values = validateResource(type, body);
    if (!values) return sendJson(res, 400, { error: 'One or more fields are invalid.' });
    const columns = resource.fields;

    if (req.method === 'POST') {
      const names = columns.join(', ');
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const created = await sql.query(`INSERT INTO ${resource.table} (${names}) VALUES (${placeholders}) RETURNING *`, values);
      return sendJson(res, 201, { item: created[0] });
    }

    const assignments = columns.map((field, index) => `${field} = $${index + 1}`).concat('updated_at = now()').join(', ');
    const updated = await sql.query(`UPDATE ${resource.table} SET ${assignments} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]);
    return updated.length ? sendJson(res, 200, { item: updated[0] }) : sendJson(res, 404, { error: 'Content not found.' });
  } catch {
    return sendServerError(res);
  }
  };
}

export default createHandler();
