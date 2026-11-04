import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('LearnFlow is standalone-first and allows tablet landscape use', () => {
  const manifest = read('app/manifest.ts');
  assert.match(manifest, /display:\s*["']standalone["']/);
  assert.match(manifest, /display_override:\s*\[["']standalone["'],\s*["']minimal-ui["']\]/);
  assert.match(manifest, /orientation:\s*["']any["']/);
});
test('installed LearnFlow respects system bars and describes the experience accurately', () => {
  assert.ok(read('app/globals.css').includes('padding-bottom: env(safe-area-inset-bottom'));
  assert.ok(read('components/PWAAndBrandBar.tsx').includes('Standalone app window'));
});
