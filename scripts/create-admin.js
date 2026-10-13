import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from '../lib/server/admin-auth.js';
import { createInitialAdmin, databaseTarget } from './admin-bootstrap.js';

function readSecret(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this setup command in an interactive terminal so the password can be entered without echo.');
  }
  process.stdout.write(prompt);
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stdout.write('\n');
      error ? reject(error) : resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') return finish(new Error('Setup cancelled.'));
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ' && char <= '~') value += char;
      }
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

async function loadLocalDatabaseUrl() {
  try {
    const env = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
    const line = env.split(/\r?\n/).find((item) => /^\s*DATABASE_URL\s*=/.test(item));
    if (!line) return '';
    return line.replace(/^\s*DATABASE_URL\s*=\s*/, '').replace(/^(['"])(.*)\1\s*$/, '$2').trim();
  } catch { return ''; }
}

try {
  const connectionString = await loadLocalDatabaseUrl();
  if (!connectionString) throw new Error('DATABASE_URL must be configured in the ignored .env.local file; inherited environment values are not used.');
  const target = databaseTarget(connectionString);
  if (!target) throw new Error('The configured URL is not a recognizable Neon PostgreSQL endpoint. No connection was made.');
  console.log(`Selected Neon target (credentials omitted): ${target.confirmation}`);
  const confirmation = await readSecret('Compare this host and database with the intended Neon branch, then type the exact target shown above to continue: ');
  if (confirmation !== target.confirmation) throw new Error('Database target confirmation did not match. No connection was made.');

  const email = (await readSecret('Initial admin email: ')).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) throw new Error('Enter a valid email address.');
  const password = await readSecret('Choose a password (minimum 14 characters): ');
  if (password.length < 14 || password.length > 1024) throw new Error('Password must contain 14–1024 characters.');
  const confirm = await readSecret('Confirm password: ');
  if (password !== confirm) throw new Error('Passwords do not match.');
  const sql = neon(connectionString);
  const { salt, hash } = await hashPassword(password);
  const created = await createInitialAdmin(sql, { email, passwordSalt: salt, passwordHash: hash });
  if (created.length === 0) throw new Error('An administrator already exists. No account was created.');
  console.log('Initial administrator created. Sign in at /admin.');
} catch (error) {
  const safeMessages = new Set([
    'Run this setup command in an interactive terminal so the password can be entered without echo.',
    'Setup cancelled.',
    'DATABASE_URL must be configured in the ignored .env.local file; inherited environment values are not used.',
    'The configured URL is not a recognizable Neon PostgreSQL endpoint. No connection was made.',
    'Database target confirmation did not match. No connection was made.',
    'Enter a valid email address.',
    'Password must contain 14–1024 characters.',
    'Passwords do not match.',
    'An administrator already exists. No account was created.',
  ]);
  console.error(safeMessages.has(error.message) ? error.message : 'Admin setup failed. Check the Neon schema and local setup without sharing the connection string.');
  process.exitCode = 1;
}
