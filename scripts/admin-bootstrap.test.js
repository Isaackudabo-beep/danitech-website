import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialAdmin, databaseTarget } from './admin-bootstrap.js';

test('Neon target confirmation contains only host and database identity', () => {
  const target = databaseTarget('postgresql://private-user:private-password@ep-test.us-east-2.aws.neon.tech/danitech?sslmode=require');
  assert.deepEqual(target, {
    host: 'ep-test.us-east-2.aws.neon.tech',
    database: 'danitech',
    confirmation: 'ep-test.us-east-2.aws.neon.tech/danitech',
  });
  assert.equal(JSON.stringify(target).includes('private-password'), false);
});

test('bootstrap refuses unparseable, non-Neon, and incomplete database targets', () => {
  assert.equal(databaseTarget('not a connection string'), null);
  assert.equal(databaseTarget('postgresql://user:pass@localhost/app'), null);
  assert.equal(databaseTarget('postgresql://user:pass@ep-test.neon.tech/'), null);
});

test('initial admin creation serializes with an advisory transaction lock and insert-if-empty', async () => {
  let transactionStatements;
  const sql = (strings, ...values) => ({ text: strings.join('?'), values });
  sql.transaction = async (statements) => { transactionStatements = statements; return [[], [{ id: 'created-id' }]]; };
  const created = await createInitialAdmin(sql, { email: 'admin@example.test', passwordSalt: 'salt', passwordHash: 'hash' });
  assert.equal(created[0].id, 'created-id');
  assert.equal(transactionStatements.length, 2);
  assert.match(transactionStatements[0].text, /pg_advisory_xact_lock/);
  assert.match(transactionStatements[1].text, /WHERE NOT EXISTS \(SELECT 1 FROM admin_users\)/);
  assert.deepEqual(transactionStatements[1].values, ['admin@example.test', 'salt', 'hash']);
});
