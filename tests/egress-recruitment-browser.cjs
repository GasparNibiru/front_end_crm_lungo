'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const hook=`window.__egress={poll:pollRecruitment,load:loadRecruitment,reset:resetRecruitmentPolling,
  session:token=>{resetRecruitmentPolling();supervisorAccessToken=token;},data:()=>recruitmentData,
  avatar:supervisorBrokerAvatar,identity:applyOrganizationIdentity,
  active:view=>{document.body.classList.remove('auth-locked');document.body.classList.add('supervisor-mode');document.querySelector('#authScreen').hidden=true;document.querySelector('#supervisorScreen').hidden=false;document.querySelectorAll('.supervisor-view').forEach(x=>x.classList.toggle('active',x.id==='supervisor-view-'+view));}};`;
(async()=>{
  const server=http.createServer((req,res)=>{
    const relative=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
    if(file.endsWith('.js')||file.endsWith('.html')||file.endsWith('.css')){
      res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
      let source=fs.readFileSync(file,'utf8');if(file.endsWith(path.sep+'app.js'))source=source.replace('  const RH_STAGES =',hook+'\n  const RH_STAGES =');return res.end(source);
    }res.end(fs.readFileSync(file));
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage(),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
    const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jYxkAAAAASUVORK5CYII=';
    let version='v1',delay=0,notification=null;
    const candidate={id:'hired',name:'Pessoa Teste',email:'test@example.invalid',phone:'11900000000',stage:'aprovado',hiredUserId:'broker',seenAt:'2026-10-01',profilePhotoUrl:image,createdAt:'2026-09-01'};
    await page.route('**/api/**',async r=>{
      const request=r.request(),url=new URL(request.url());requests.push(url.pathname);
      if(url.pathname.endsWith('/recruitment/updates')){await new Promise(resolve=>setTimeout(resolve,30));return r.fulfill({json:{ok:true,version,notification}});}
      if(url.pathname.endsWith('/recruitment')){if(delay)await new Promise(resolve=>setTimeout(resolve,delay));return r.fulfill({json:{ok:true,version,vacancy:{title:'Vaga',logo:image},candidates:[candidate]}});}
      if(url.pathname.includes('/candidates/')){notification=null;version='seen';return r.fulfill({json:{ok:true,candidate:{seenAt:'2026-10-01'}}});}
      return r.fulfill({json:{ok:true}});
    });
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.evaluate(()=>{window.__egress.session('synthetic-user-a');window.__egress.active('dashboard');});
    await page.evaluate(()=>Promise.all([window.__egress.poll(),window.__egress.poll()]));
    const count=p=>requests.filter(x=>x===p).length,full='/api/supervisor/recruitment',light=full+'/updates';
    assert.equal(count(light),1);assert.equal(count(full),0,'dashboard must not download RH list');
    await page.evaluate(()=>{window.__egress.active('rh');return Promise.all([window.__egress.load(),window.__egress.load()]);});
    assert.equal(count(full),1,'deduplicate full loads');
    assert.equal(await page.locator('#rhApprovedList img').count(),0);assert.equal(await page.locator('#rhApprovedList .supervisor-avatar').count(),0);
    await page.evaluate(()=>window.__egress.poll());assert.equal(count(full),1,'same version does not reload list');
    version='v2';await page.evaluate(()=>window.__egress.poll());assert.equal(count(full),2,'changed version refreshes visible RH');
    const beforeHidden=count(light);await page.evaluate(async()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});await window.__egress.poll();delete document.hidden;});assert.equal(count(light),beforeHidden);
    notification={id:'new',name:'Nova Pessoa',city:'Cidade',experience:'Experiência',disc:{completedAt:'2026-10-01'}};
    await page.evaluate(()=>{window.__egress.active('dashboard');return window.__egress.poll();});
    assert.match(await page.locator('#rhCandidateNotification').innerText(),/respondeu ao teste DISC/);
    await page.locator('#rhNotificationClose').click();await page.waitForSelector('#rhCandidateNotification',{state:'detached'});
    assert.ok(requests.some(x=>x.endsWith('/candidates/new')),'notification still marks candidate seen');
    await page.evaluate(image=>{const host=document.createElement('div');host.id='preservedPhoto';host.innerHTML=window.__egress.avatar({name:'Corretor',photo:image});document.body.append(host);window.__egress.identity({id:'org',name:'Corretora',logoUrl:image});},image);
    assert.equal(await page.locator('#preservedPhoto img').count(),1,'avatar helper still renders broker photos');
    assert.ok(await page.evaluate(image=>[...document.images].some(img=>img.id!=='preservedPhoto'&&!img.closest('#preservedPhoto')&&img.src===image),image),'organization logo preserved');
    await page.evaluate(()=>{window.__egress.active('rh');return window.__egress.load(false);});
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    for(const width of [1360,390])for(const theme of ['light','dark']){await page.setViewportSize({width,height:844});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.screenshot({path:path.join(root,'test-results',`egress-rh-${width}-${theme}.png`)});}
    delay=150;
    await page.evaluate(async()=>{const pending=window.__egress.load(false);await new Promise(r=>setTimeout(r,40));window.__egress.session('synthetic-user-b');await pending;});
    assert.equal(await page.evaluate(()=>window.__egress.data().candidates.length),0,'old session response discarded');
    assert.deepEqual(errors,[]);
    console.log('PASS: light polling, single-flight, version changes, hidden tab, notifications, no RH photos, preserved broker photo/logo, session isolation; four screenshots.');
  }finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
