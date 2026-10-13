import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContactSubmission } from '../api/contact.js';

test('valid contact payload is trimmed, bounded, and email-normalized', () => {
  assert.deepEqual(validateContactSubmission({ name: '  Dani  ', email: ' USER@EXAMPLE.TEST ', service: ' Web ', message: ' Hello ' }), {
    values: { name: 'Dani', email: 'user@example.test', service: 'Web', message: 'Hello' },
  });
});

test('contact validation rejects missing required fields and malformed email', () => {
  assert.match(validateContactSubmission({ name: 'Dani', email: '', message: 'Hi' }).error, /required/);
  assert.match(validateContactSubmission({ name: 'Dani', email: 'not-email', message: 'Hi' }).error, /valid email/);
  assert.match(validateContactSubmission(null).error, /Invalid/);
});

test('contact text fields respect the schema limits and bot honeypot is recognized', () => {
  const long = validateContactSubmission({ name: 'N'.repeat(101), email: 'a@example.test', service: '', message: 'M'.repeat(2001) });
  assert.equal(long.values.name.length, 100);
  assert.equal(long.values.message.length, 2000);
  assert.deepEqual(validateContactSubmission({ website: 'automated bot value' }), { honeypot: true });
});
