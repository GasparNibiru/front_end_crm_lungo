'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
test('retains both profile navigation hooks and clears contacts on logout', () => {
  const app = read('app.js'), html = read('index.html');
  assert.match(app, /LungoBusinessIntelligence\?\.open\(state\.token\)/);
  assert.match(app, /LungoBusinessIntelligence\?\.open\(supervisorAccessToken\)/);
  assert.match(app, /function logout\(\) \{\s*window.LungoBusinessIntelligence\?\.reset\(\)/);
  assert.match(html, /data-pr-tab="search"/); assert.match(html, /data-pr-tab="mine"/);
  assert.doesNotMatch(html, /id="biFiltersModal"|id="biCity"/);
});
test('unique HTML ids and all scoped assets shipped by Docker', () => {
  const ids = [...read('index.html').matchAll(/\sid="([^"]+)"/g)].map(m => m[1]); assert.equal(new Set(ids).size, ids.length);
  for (const asset of ['business-intelligence.js','prospecting.css']) { assert.ok(read('Dockerfile').includes(asset)); assert.ok(read('index.html').includes(asset)); }
});
test('staging configuration preserved and browser never receives server credentials', () => {
  assert.match(read('config.js'), /lungo-lungo-backend-staging/);
  assert.doesNotMatch(read('business-intelligence.js'), /SUPABASE|service_role|sb_secret_|\.innerHTML|localStorage\.setItem/);
});
