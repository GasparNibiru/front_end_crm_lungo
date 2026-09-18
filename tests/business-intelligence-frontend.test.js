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
test('production configuration preserved and browser never receives server credentials', () => {
  assert.match(read('config.js'), /lungo-disparos-app/);
  assert.doesNotMatch(read('config.js'), /lungo-lungo-backend-staging/);
  assert.doesNotMatch(read('business-intelligence.js'), /SUPABASE|service_role|sb_secret_|\.innerHTML|localStorage\.setItem/);
});
test('money totals keep decimal precision without turning the decimal point into thousands', () => {
  const app = read('app.js');
  const functionSource = (name, nextName) => app.slice(app.indexOf(`  function ${name}`), app.indexOf(`  function ${nextName}`));
  const helpers = Function(`${functionSource('moneyNumber', 'leadDateValue')}\n${functionSource('formatMoney', 'formatDate')}\nreturn { moneyNumber, formatMoney };`)();
  const values = ['R$ 5.372,90', '2.858,37', '252,87', '460.59'];
  const total = values.reduce((sum, value) => sum + helpers.moneyNumber(value), 0);
  assert.equal(total, 8944.730000000001);
  assert.match(helpers.formatMoney(total), /8\.944,73/);
  assert.equal(helpers.moneyNumber('8,944.73'), 8944.73);
  assert.match(helpers.formatMoney(0), /0,00/);
});
test('supervisor finance is isolated, authenticated and shipped with the frontend', () => {
  const html = read('index.html'), api = read('supervisor-api.js'), app = read('app.js'), docker = read('Dockerfile'), finance = read('supervisor-finance.js');
  assert.match(html, /data-supervisor-view="finance"/);
  assert.match(html, /id="supervisor-view-finance"/);
  assert.match(app, /LungoSupervisorFinance\?\.open\(supervisorAccessToken\)/);
  assert.match(api, /\/api\/supervisor\/finance\/products/);
  assert.match(finance, /activateFinance\(token\)/);
  assert.match(finance, /Vitalício do mês/);
  assert.match(finance, /firstTransferDate/);
  assert.match(finance, /data-finance-edit-product/);
  assert.match(finance, /Comissões por corretor/);
  assert.match(finance, /data-finance-new-broker-rule/);
  assert.match(finance, /function reports\(\)/);
  assert.match(finance, /data-finance-export-csv/);
  assert.match(finance, /data-finance-export-pdf/);
  assert.match(finance, /finance_sales\?\.seller_name/);
  assert.doesNotMatch(finance, /localStorage|SUPABASE|service_role|sb_secret_/);
  for (const asset of ['supervisor-finance.js', 'supervisor-finance.css']) assert.ok(docker.includes(asset));
});
