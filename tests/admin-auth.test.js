import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, createSessionValues, hashToken, getSessionToken, sameOrigin, validCsrf, requireAdminWithSql } from '../lib/server/admin-auth.js';

function response() { return { headers: {}, setHeader(k,v){this.headers[k]=v;}, status(n){this.code=n;return this;}, json(body){this.body=body;return body;} }; }

test('passwords are scrypt-hashed and verified without storing plaintext', async () => {
  const password = 'a-long-test-password-never-used-in-production';
  const encoded = await hashPassword(password);
  assert.notEqual(encoded.hash, password);
  assert.equal(encoded.hash.length, 128);
  assert.equal(await verifyPassword(password, encoded.salt, encoded.hash), true);
  assert.equal(await verifyPassword('incorrect-password', encoded.salt, encoded.hash), false);
});

test('sessions use random opaque tokens and store only a hash identifier', () => {
  const first = createSessionValues();
  const second = createSessionValues();
  assert.notEqual(first.token, second.token);
  assert.equal(first.tokenHash, hashToken(first.token));
  assert.notEqual(first.tokenHash, first.token);
  assert.ok(first.expiresAt.getTime() > Date.now());
});

test('session cookie parser extracts only the admin cookie', () => {
  assert.equal(getSessionToken({ headers: { cookie: 'theme=dark; danitech_admin_session=opaque_token' } }), 'opaque_token');
  assert.equal(getSessionToken({ headers: { cookie: 'theme=dark' } }), '');
});

test('state-changing request checks require same-origin and CSRF token', () => {
  const req = { headers: { host: 'site.example', origin: 'https://site.example', 'x-forwarded-proto': 'https', 'x-csrf-token': 'abc123' } };
  assert.equal(sameOrigin(req), true);
  assert.equal(sameOrigin({ headers: { host: 'site.example', origin: 'https://attacker.example' } }), false);
  assert.equal(validCsrf(req, { csrf_token: 'abc123' }), true);
  assert.equal(validCsrf(req, { csrf_token: 'different' }), false);
});

test('server-side authorization rejects missing and expired sessions and enforces CSRF', async () => {
  const sql = { query: async (_query, params) => params[0] === hashToken('valid-session')
    ? [{ id: 'admin-id', email: 'admin@example.test', csrf_token: 'csrf-value' }]
    : [] };
  const missing = response();
  assert.equal(await requireAdminWithSql({ headers: { cookie: '' } }, missing, sql), null);
  assert.equal(missing.code, 401);
  const invalid = response();
  assert.equal(await requireAdminWithSql({ headers: { cookie: 'danitech_admin_session=invalid' } }, invalid, sql), null);
  assert.equal(invalid.code, 401);
  const badCsrf = response();
  assert.equal(await requireAdminWithSql({ headers: { cookie: 'danitech_admin_session=valid-session', host: 'site.test', origin: 'https://site.test', 'x-forwarded-proto':'https', 'x-csrf-token':'wrong' } }, badCsrf, sql, { csrf: true }), null);
  assert.equal(badCsrf.code, 403);
  const valid = response();
  const admin = await requireAdminWithSql({ headers: { cookie: 'danitech_admin_session=valid-session', host: 'site.test', origin: 'https://site.test', 'x-forwarded-proto':'https', 'x-csrf-token':'csrf-value' } }, valid, sql, { csrf: true });
  assert.equal(admin.email, 'admin@example.test');
});
