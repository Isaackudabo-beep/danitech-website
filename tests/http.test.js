import test from 'node:test';
import assert from 'node:assert/strict';
import { isSameOrigin, readJsonBody } from '../lib/server/http.js';

test('same-origin validation allows same host and rejects a different host', () => {
  assert.equal(isSameOrigin({ headers: { host: 'danitech.example', origin: 'https://danitech.example' } }), true);
  assert.equal(isSameOrigin({ headers: { host: 'danitech.example', origin: 'https://attacker.example' } }), false);
});

test('same-origin validation safely rejects malformed origins', () => {
  assert.equal(isSameOrigin({ headers: { host: 'danitech.example', origin: 'not-a-url' } }), false);
});

test('body parser accepts parsed JSON and bounded JSON strings', () => {
  assert.deepEqual(readJsonBody({ body: { name: 'Dani' } }), { name: 'Dani' });
  assert.deepEqual(readJsonBody({ body: '{"name":"Dani"}' }), { name: 'Dani' });
  assert.equal(readJsonBody({ body: 'not-json' }), null);
  assert.equal(readJsonBody({ body: '12345' }, 4), null);
});
