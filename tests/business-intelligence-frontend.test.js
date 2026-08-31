'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const moduleSource = fs.readFileSync(path.join(root, 'business-intelligence.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('registers the prospecting navigation, view and module', () => {
  assert.match(html, /data-view="business_intelligence"/);
  assert.match(html, /data-supervisor-operation="business_intelligence"/);
  assert.match(html, /id="view-business-intelligence"/);
  assert.match(html, /src="business-intelligence\.js/);
  assert.match(app, /business_intelligence: \$\("#view-business-intelligence"\)/);
  assert.match(app, /LungoBusinessIntelligence\?\.open\(state\.token\)/);
  assert.match(app, /LungoBusinessIntelligence\?\.open\(supervisorAccessToken\)/);
});

test('keeps filters in a modal and reserves the main area for results', () => {
  assert.match(html, /<dialog id="biFiltersModal"/);
  assert.match(html, /id="biOpenFilters"/);
  assert.match(moduleSource, /elements\.filtersModal\?\.showModal\(\)/);
  assert.match(moduleSource, /elements\.filtersModal\.close\(\)/);
});

test('uses the existing token header without cookies or credentials', () => {
  assert.match(moduleSource, /'x-access-token': token/);
  assert.match(moduleSource, /\/api\/business-intelligence\/companies/);
  assert.doesNotMatch(moduleSource, /credentials\s*:/);
  assert.doesNotMatch(moduleSource, /method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(moduleSource, /SUPABASE|sb_secret_|service_role/i);
});

test('renders the temporary unmasked contact values returned by the API', () => {
  assert.match(moduleSource, /company\.phone_1/);
  assert.match(moduleSource, /company\.phone_2/);
  assert.match(moduleSource, /company\.email/);
  assert.match(moduleSource, /contactValue\('Telefone'/);
  assert.match(moduleSource, /contactValue\('E-mail'/);
  assert.match(moduleSource, /formatCnpj\(company\.cnpj\)/);
  assert.doesNotMatch(moduleSource, /maskedCnpj/);
});

test('provides all filters and safe page sizes', () => {
  [
    'state', 'company_type', 'segment', 'opened_year', 'simples_opt_in', 'mei_opt_in'
  ].forEach((filter) => assert.match(moduleSource, new RegExp(`${filter}:`), filter));
  assert.doesNotMatch(html, /id="biSearch"|id="biCity"/);
  assert.doesNotMatch(html, /id="biHasPhone"|id="biHasEmail"|id="biCapitalMin"|id="biOpenedStart"/);
  assert.match(html, /id="biOpenedYear"/);
  assert.match(html, /id="biCompanyType"/);
  assert.match(html, /id="biPageSize"><option>25<\/option><option>50<\/option><option>100<\/option>/);
  assert.match(moduleSource, /params\.set\('page', String\(page\)\)/);
  assert.match(moduleSource, /params\.set\('limit', String\(state\.limit\)\)/);
});

test('shows loading only while results are being requested', () => {
  assert.match(moduleSource, /if \(loading\) \{\s*elements\.tableWrap\.hidden = true;\s*elements\.pagination\.hidden = true;/);
  assert.match(moduleSource, /elements\.status\.hidden = true;\s*elements\.tableWrap\.hidden = false;/);
  assert.match(styles, /\.bi-status\[hidden\].*display:\s*none/s);
});

test('shows readable segments and prioritizes protected contacts in the table', () => {
  assert.match(html, /<th>Empresa<\/th><th>Telefone \/ E-mail<\/th><th>Segmento<\/th>/);
  assert.match(html, /id="biSegment"/);
  assert.match(moduleSource, /Restaurantes e alimentação/);
  assert.match(moduleSource, /Clínicas e saúde/);
  assert.match(moduleSource, /Advocacia/);
});

test('formats valid CNPJs and repairs mojibake in company locations', () => {
  assert.match(moduleSource, /number\.length !== 14/);
  assert.match(moduleSource, /number\.slice\(0, 2\).*number\.slice\(12\)/s);
  assert.match(moduleSource, /new TextDecoder\('utf-8'/);
  assert.match(moduleSource, /'São Paulo'/);
});

test('contains no duplicate HTML ids', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
});
