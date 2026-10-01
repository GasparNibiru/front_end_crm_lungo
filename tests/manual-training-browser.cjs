'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const id = '10000000-0000-4000-8000-000000000001';
const hook = `window.__training={load:()=>loadTrainingLibrary(supervisorAccessToken,'supervisor'),render:items=>{document.querySelector('#supervisorOperationContent').innerHTML=trainingLibraryContent(items,{metrics:true});},session:token=>{supervisorAccessToken=token;},metrics:openTrainingMetrics};`;
(async()=>{
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
    if(/\.(js|html|css)$/.test(file)){
      res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
      let source=fs.readFileSync(file,'utf8');
      if(file.endsWith(path.sep+'app.js'))source=source.replace('  const RH_STAGES =',hook+'\n  const RH_STAGES =');
      return res.end(source);
    }res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
    const errors=[],requests=[];let confirmedAt=null,fail=false,delay=0;
    const item={id,title:'Treinamento de teste',track:'Equipe',youtubeId:'test-video',ownerType:'admin',progress:{percent:100,status:'completed'}};
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://**/*',r=>r.abort());
    await page.route('**/api/**',async r=>{
      const url=new URL(r.request().url());requests.push(url.pathname);
      if(url.pathname.endsWith('/training-center'))return r.fulfill({json:{ok:true,trainings:[{...item,confirmation:confirmedAt?{confirmedAt}:null}]}});
      if(url.pathname.endsWith('/confirm')){
        assert.deepEqual(r.request().postDataJSON(),{confirmed:true});
        if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
        if(fail)return r.fulfill({status:503,json:{error:'Falha temporária. Tente novamente.'}});
        confirmedAt ||= '2026-10-02T12:00:00Z';
        return r.fulfill({json:{ok:true,confirmation:{confirmedAt}}});
      }
      if(url.pathname.endsWith('/metrics'))return r.fulfill({json:{ok:true,training:{title:'Treinamento de teste'},viewers:confirmedAt?[{userName:'Corretor Teste',userRole:'broker',confirmedAt}]:[]}});
      return r.fulfill({json:{ok:true}});
    });
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.evaluate(()=>{
      window.__training.session('synthetic');
      document.body.classList.remove('auth-locked');document.body.classList.add('supervisor-mode');
      document.querySelector('#authScreen').hidden=true;document.querySelector('#supervisorScreen').hidden=false;
      const host=document.querySelector('#supervisorOperationContent');document.body.append(host);host.style.cssText='display:block;position:relative;z-index:9999;max-width:100%;';
    });
    await page.evaluate(()=>window.__training.load());
    const check=page.locator(`[data-training-confirm="${id}"]`);
    assert.equal(await check.isEnabled(),true,'legacy completion is not a manual declaration');
    assert.equal(await page.locator('.training-progress').count(),0);
    await page.clock.install();
    await page.locator('[data-training-play]').click();
    assert.equal(await page.locator('#trainingPlayerFrame iframe').count(),1);
    await page.clock.fastForward(60000);
    assert.equal(requests.filter(p=>/\/(progress|confirm)$/.test(p)).length,0,'watching must never save or declare');
    await page.locator('#trainingPlayerModal [data-training-player-close]').last().click();
    assert.equal(await page.locator('#trainingPlayerFrame iframe').count(),0);
    assert.equal(requests.filter(p=>/\/(progress|confirm)$/.test(p)).length,0,'closing must not declare');
    await page.clock.resume();
    fail=true;await check.click();await page.waitForFunction(()=>document.querySelector('[data-training-confirm-status]').textContent.includes('Falha temporária'));
    assert.equal(await check.isEnabled(),true);
    fail=false;delay=100;
    await check.evaluate(button=>{button.click();button.click();});
    await page.waitForFunction(()=>document.querySelector('[data-training-confirm]').getAttribute('aria-pressed') === 'true');
    assert.equal(await check.isDisabled(),true);
    assert.equal(requests.filter(p=>p.endsWith('/confirm')).length,2,'one failed request plus one successful declaration');
    await page.locator('#supervisorTrainingSourceFilter').selectOption('supervisor');
    await page.locator('#supervisorTrainingSourceFilter').selectOption('admin');
    assert.equal(await check.isDisabled(),true,'filter rerender retains the confirmed state without another request');
    await page.evaluate(()=>window.__training.load());
    assert.equal(await check.isDisabled(),true,'saved declaration survives library reload');
    await page.evaluate(id=>window.__training.metrics(id),id);
    assert.match(await page.locator('#trainingMetricsBody').innerText(),/Corretor Teste/);
    assert.doesNotMatch(await page.locator('#trainingMetricsBody').innerText(),/%|Progresso/);
    await page.locator('#trainingMetricsModal [data-training-metrics-close]').last().click();
    await page.evaluate(({item,confirmedAt})=>window.__training.render([
      {...item,stars:5,confirmation:{confirmedAt}},
      {...item,id:'second',title:'Venda de planos',stars:4,confirmation:{confirmedAt}},
      {...item,id:'third',title:'Cadastro e comissão',stars:5,confirmation:null},
      {...item,id:'fourth',title:'Novos corretores',stars:4,confirmation:null}
    ]),{item,confirmedAt});
    const visual = await page.locator('[data-training-confirm]').evaluateAll(buttons=>buttons.map(button=>({
      background:getComputedStyle(button).backgroundColor,
      fontSize:getComputedStyle(button).fontSize,
      genericButton:button.classList.contains('btn')
    })));
    assert.ok(visual.every(button=>button.background==='rgba(0, 0, 0, 0)'&&button.fontSize==='10px'&&!button.genericButton));
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    for(const width of [1360,390]){
      await page.setViewportSize({width,height:900});
      await page.locator('#supervisorOperationContent').screenshot({path:path.join(root,`test-results/manual-training-${width}.png`)});
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: no automatic writes, legacy completion separate, explicit confirmation, failure/retry, double-click, persisted state, supervisor names/dates, desktop/mobile.');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
