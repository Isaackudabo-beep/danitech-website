import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
async function jsFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? jsFiles(path) : entry.isFile() && entry.name.endsWith('.js') ? [path] : [];
  }));
  return paths.flat();
}

test('api/ contains only intended Vercel function entry points', async () => {
  const files = await jsFiles(join(root, 'api'));
  const paths = files.map((path) => relative(root, path).replaceAll('\\', '/')).sort();
  assert.deepEqual(paths, [
    'api/admin/auth.js',
    'api/admin/content.js',
    'api/admin/overview.js',
    'api/admin/submissions.js',
    'api/contact.js',
    'api/content.js',
  ]);
});

test('admin rewrites are exact and do not match API routes', async () => {
  const config = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
  assert.deepEqual(config.rewrites.map((rule) => rule.source), ['/admin', '/admin/']);
  assert.equal(config.rewrites.some((rule) => rule.source.includes('*') || rule.source.startsWith('/api')), false);
});
