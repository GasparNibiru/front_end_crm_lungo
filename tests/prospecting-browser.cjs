'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const section = html.slice(html.indexOf('      <section id="view-business-intelligence"'), html.indexOf('      <section id="view-clients"'));
const fixture = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/prospecting.css"><style>body{overflow:auto}#view-business-intelligence{display:block;position:relative;inset:auto;height:100dvh;width:100%;padding:0}</style><script>window.LUNGO_CONFIG={API_BASE_URL:location.origin}</script><script src="/business-intelligence.js" defer></script></head><body>${section}</body></html>`;
const shell = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace('</head>', '<script>window.LUNGO_CONFIG={API_BASE_URL:location.origin}</script><script src="/business-intelligence.js" defer></script></head>');
const report = [], acquisitions = [];
let acquired = new Set(['owned']), balance = 20, mode = 'normal', failNext = false;
const raw = [{ company_id: 'owned', cnpj: '12345678000199', trade_name: 'Aurora Benefícios', legal_name: 'Aurora Serviços Empresariais Ltda', mobile_1: '11999999999', mobile_2: '11988888888', email: 'aurora@example.invalid', category: 'Serviços Empresariais e Administrativos', cnae: '8211300', opened_year: 2026, company_size: 'MICROEMPRESA', city: 'São Paulo', state: 'SP' }, ...Array.from({ length: 2 }, (_, i) => ({ company_id: `opaque-${i}`, cnpj: `1234567800029${i}`, trade_name: i ? 'Horizonte Tecnologia' : 'Clínica Viver Bem', legal_name: 'Empresa de demonstração com nome longo para validar a quebra de linha e os limites dos cartões Ltda', mobile_1: '21999999999', mobile_2: '21988888888', email: 'contato-muito-longo@example.invalid', category: i ? 'Tecnologia, Software e Comunicação' : 'Saúde e Serviços Médicos', cnae: i ? '6201501' : '8630503', opened_year: 2025, company_size: 'EMPRESA DE PEQUENO PORTE', city: 'Rio de Janeiro', state: 'RJ' }))];
const queries = [];
function project(r, token) { const yes = token !== 'other' && acquired.has(r.company_id); return { ...r, ...(yes ? {} : { cnpj: '**.***.***/****-**', mobile_1: '(**) *****-****', mobile_2: '(**) *****-****', email: '***@***' }), is_acquired: yes, selectable: !yes, acquired_at: '2026-09-10T12:00:00Z' }; }
async function main() {
  const server = http.createServer((req, res) => { const file = req.url.split('?')[0]; if (file === '/' || file === '/shell') { res.setHeader('content-type','text/html'); return res.end(file === '/shell' ? shell : fixture); } if (!['/styles.css','/prospecting.css','/business-intelligence.js'].includes(file)) { res.statusCode = 404; return res.end(); } res.setHeader('content-type', file.endsWith('.css') ? 'text/css' : 'text/javascript'); res.end(fs.readFileSync(path.join(root, file))); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read','clipboard-write'] });
    await context.route('https://**/*', route => route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/prospecting/**', async route => {
      const req = route.request(), url = new URL(req.url()), token = req.headers()['x-access-token'];
      const send = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
      if (url.pathname.endsWith('/wallet')) return send({ ok: true, wallet: { total_balance: balance, free_balance: balance, extra_balance: 0, cycle_allowance: 20, next_renewal: '2026-10-05' } });
      if (url.pathname.endsWith('/acquisitions')) { const body = req.postDataJSON(); acquisitions.push(body); if (failNext) { failNext = false; return route.abort('failed'); } const fresh = body.company_ids.filter(id => !acquired.has(id)); fresh.forEach(id => acquired.add(id)); balance -= fresh.length; return send({ ok: true, charged: fresh.length }); }
      queries.push(url);
      if (mode === 'error') return send({ ok: false, error: 'Falha controlada na consulta.' }, 503);
      if (mode === 'loading') await new Promise(r => setTimeout(r, 500));
      const mine = url.pathname.endsWith('/my-companies');
      const rows = mode === 'empty' ? [] : raw.filter(r => !mine || (token !== 'other' && acquired.has(r.company_id))).map(r => project(r, token));
      return send({ ok: true, companies: rows, role: 'supervisor', pagination: { total: mode === 'empty' ? 0 : mine ? rows.length : 60, page: +(url.searchParams.get('page') || 1), limit: +(url.searchParams.get('limit') || 25), totalPages: mode === 'empty' ? 0 : mine ? 1 : 3 } });
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    await page.goto(base); await page.evaluate(() => window.LungoBusinessIntelligence.open('broker'));
    await page.waitForSelector('.pr-card'); await page.waitForFunction(() => document.querySelector('#prBalance').textContent.includes('20 tokens'));
    assert.equal(await page.locator('[data-pr-tab="search"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.pr-card input:disabled').count(), 1);
    assert.ok(!(await page.locator('#prCards').innerText()).includes(raw[1].email));
    await page.locator('#prBalance').click(); assert.ok((await page.locator('#prBalanceDetails').innerText()).includes('05/10/2026')); report.push('wallet, default search, masks and acquired company');
    await page.locator('#prState').selectOption('RJ'); await page.locator('#prCategoriesSummary').click(); await page.locator('#prCategories input').nth(0).check(); await page.locator('#prCategories input').nth(1).check(); await page.locator('#prCategoriesSummary').click();
    for (const code of ['6201501','8630503']) { await page.locator('#prCnaeInput').fill(code); await page.locator('#prAddCnae').click(); }
    await page.locator('#prFilters button[type="submit"]').click(); await page.waitForFunction(() => document.querySelector('#prCards').getAttribute('aria-busy') === 'false');
    const q = queries.at(-1); assert.deepEqual(q.searchParams.getAll('cnae'), ['6201501','8630503']); assert.equal(q.searchParams.getAll('category').length, 2); assert.equal(q.searchParams.get('state'), 'RJ'); assert.equal(q.searchParams.has('city'), false);
    await page.locator('#prClear').click(); await page.waitForFunction(() => document.querySelector('#prCards').getAttribute('aria-busy') === 'false'); assert.equal(queries.at(-1).searchParams.has('category'), false); assert.equal(await page.locator('#prCnaeChips button').count(), 0); report.push('filters, multiselection, CNAE chips, clear');
    await page.locator('#prPagination button').last().click(); await page.waitForFunction(() => document.querySelector('#prPagination').textContent.includes('Página 2')); assert.equal(queries.at(-1).searchParams.get('page'), '2'); report.push('server pagination');
    await page.locator('.pr-card input:not(:disabled)').nth(0).check(); await page.locator('.pr-card input:not(:disabled)').nth(1).check();
    assert.ok((await page.locator('#prCost').innerText()).includes('Saldo após aquisição: 18')); await page.locator('#prChoose').click(); assert.equal(acquisitions.length, 0);
    failNext = true; await page.locator('#prConfirmBuy').click(); await page.waitForFunction(() => document.querySelector('#prConfirmError').textContent.includes('mesma solicitação')); await page.locator('#prConfirmBuy').click();
    await page.waitForFunction(() => document.querySelector('#prBalance').textContent.includes('18 tokens')); await page.waitForFunction(() => document.querySelectorAll('.pr-card input:disabled').length === 3);
    assert.deepEqual(acquisitions[0], acquisitions[1]); assert.equal(await page.locator('#prSelection').isVisible(), false); assert.ok((await page.locator('#prCards').innerText()).includes(raw[1].email)); report.push('batch selection, confirmation, retry idempotency, balance and unlock without reload');
    await page.locator('[data-pr-tab="mine"]').click(); await page.waitForSelector('.pr-card-footer'); assert.equal(await page.locator('.pr-card').count(), 3); assert.equal(await page.locator('#prFilters').isVisible(), false);
    assert.ok(await page.locator('button[aria-label*="Equipe"]').first().isDisabled()); assert.ok((await page.locator('.pr-future-actions a').first().getAttribute('href')).startsWith('https://wa.me/55'));
    await page.getByRole('button', { name: 'Sugestão de abordagem' }).first().click(); await page.locator('#prApproachText').fill('Mensagem editada localmente'); await page.locator('#prCopy').click(); assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'Mensagem editada localmente'); await page.locator('#prCloseApproach').click(); report.push('my companies, future disabled actions, explicit WhatsApp and local editable copy');
    const output = path.join(root, 'test-results'); fs.mkdirSync(output, { recursive: true });
    for (const [width, height] of [[1440,900],[1280,720],[768,1024],[390,844],[320,720]]) for (const theme of ['light','dark']) {
      await page.setViewportSize({ width, height }); await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
      for (const tab of ['search','mine']) { await page.locator(`[data-pr-tab="${tab}"]`).click(); await page.waitForFunction(() => document.querySelector('#prCards').getAttribute('aria-busy') === 'false'); const overflow = await page.evaluate(() => { const r = document.querySelector('#view-business-intelligence'); return r.scrollWidth > r.clientWidth + 1; }); assert.equal(overflow, false, `${width}/${theme}/${tab} overflow`); }
      await page.screenshot({ path: path.join(output, `mine-${width}-${theme}.png`), fullPage: true });
      report.push(`${width}x${height} ${theme}: search and mine without horizontal overflow`);
    }
    mode = 'loading'; await page.locator('[data-pr-tab="search"]').click(); assert.ok(await page.locator('#prStatus').isVisible()); await page.waitForSelector('.pr-card');
    mode = 'empty'; await page.locator('[data-pr-tab="mine"]').click(); await page.waitForFunction(() => document.querySelector('#prStatus').textContent.includes('ainda não adquiriu'));
    mode = 'error'; await page.locator('[data-pr-tab="search"]').click(); await page.waitForSelector('.pr-status.error'); assert.equal(await page.locator('.pr-card').count(), 0);
    mode = 'normal'; await page.getByRole('button', { name: 'Tentar novamente' }).click(); await page.waitForSelector('.pr-card'); report.push('loading, empty, error and retry');
    await page.evaluate(() => window.LungoBusinessIntelligence.open('other')); await page.waitForSelector('.pr-card'); assert.equal(await page.locator('.pr-acquired').count(), 0); assert.ok(!(await page.locator('#prCards').innerText()).includes(raw[0].email));
    await page.evaluate(() => window.LungoBusinessIntelligence.reset()); assert.equal(await page.locator('.pr-card').count(), 0); report.push('session switch and logout erase unlocked contacts');
    acquired.delete('opaque-0'); balance = 1;
    await page.evaluate(() => window.LungoBusinessIntelligence.open('broker'));
    await page.waitForFunction(() => document.querySelector('#prBalance').textContent.includes('1 tokens'));
    await page.locator('.pr-card input:not(:disabled)').first().check(); await page.locator('#prChoose').click(); await page.locator('#prConfirmBuy').click();
    await page.waitForFunction(() => document.querySelector('#prBalance').textContent.includes('0 tokens'));
    assert.equal(acquisitions.at(-1).company_ids.length, 1); report.push('individual acquisition');
    acquired.delete('opaque-1'); await page.evaluate(() => window.LungoBusinessIntelligence.open('broker'));
    await page.waitForFunction(() => document.querySelector('#prCards').getAttribute('aria-busy') === 'false');
    await page.locator('.pr-card input:not(:disabled)').first().check(); assert.ok(await page.locator('#prChoose').isDisabled()); assert.equal(await page.locator('#prChoose').innerText(), 'Saldo insuficiente'); report.push('insufficient balance prevents confirmation');
    for (const profile of ['broker','supervisor']) for (const width of [1440,390]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(base + '/shell');
      await page.evaluate(profile => {
        document.body.classList.remove('auth-locked'); document.querySelector('#authScreen').hidden = true;
        document.documentElement.dataset.theme = 'light'; document.querySelectorAll('.view.active').forEach(n => n.classList.remove('active'));
        const view = document.querySelector('#view-business-intelligence'); view.classList.add('active');
        if (profile === 'supervisor') { document.body.classList.add('supervisor-mode'); document.querySelector('#supervisorScreen').hidden = false; document.querySelectorAll('.supervisor-view.active').forEach(n => n.classList.remove('active')); document.querySelector('#supervisor-view-operation').classList.add('active'); document.querySelector('#supervisorOperationContent').replaceChildren(view); view.classList.add('supervisor-shared-view'); }
        window.LungoBusinessIntelligence.open('broker');
      }, profile);
      await page.waitForSelector('.pr-card');
      const metrics = await page.locator('#view-business-intelligence').evaluate(r => ({ width:r.clientWidth,height:r.clientHeight,scroll:r.scrollWidth }));
      assert.ok(metrics.height > 100 && metrics.width > 200, JSON.stringify(metrics)); assert.ok(metrics.scroll <= metrics.width + 1, `${profile}/${width} shell overflow`);
      await page.screenshot({ path: path.join(output, `shell-${profile}-${width}.png`) }); report.push(`${profile}/${width}: existing page container integration`);
    }
    assert.deepEqual(errors, []); fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ passed: report, pageErrors: errors }, null, 2)); console.log(JSON.stringify({ passed: report.length, checks: report }, null, 2));
    await context.close();
  } finally { if (browser) await browser.close(); await new Promise(r => server.close(r)); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
