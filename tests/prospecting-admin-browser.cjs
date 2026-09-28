const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('https://**/*',r=>r.abort());
 const user={id:'11111111-1111-4111-8111-111111111111',name:'Pessoa <teste>',email:'teste@example.com',role:'broker',status:'active',organizations:{name:'Corretora',status:'active'}};
 let amount=0,requests=[],offline=true,missing=false,hold=null;
 await page.route('**/api/admin/prospecting/**',async r=>{
   assert.equal(r.request().headers()['x-admin-key'],'test-only');
   if(missing)return r.fulfill({status:404,json:{}});
   const url=new URL(r.request().url());
   if(r.request().method()==='POST'){
     const body=r.request().postDataJSON();requests.push(body);amount=body.amount;
     if(offline){offline=false;return r.abort();}
     return r.fulfill({json:{ok:true,result:{extra:amount,free:0}}});
   }
   if(hold){await hold;}
   const wallet={extra_balance:amount,free_balance:0};
   if(url.pathname.endsWith('/users'))return r.fulfill({json:{ok:true,users:[{...user,wallet}],page:1,pages:1,total:1}});
   return r.fulfill({json:{ok:true,user,wallet,movements:amount?[{id:'test',operation_id:'op-test',delta:amount,balance_after:amount,reason:'Teste',created_at:new Date().toISOString()}]:[],page:1,pages:1}});
 });
 const url='http://127.0.0.1:'+server.address().port;
 async function open(){await page.goto(url);await page.evaluate(()=>{document.body.className='admin-master-mode';document.querySelector('#adminMasterScreen').hidden=false;document.querySelector('#adminMasterScreen').classList.remove('admin-master-auth');document.querySelector('#adminMasterLoginPanel').hidden=true;document.querySelector('#adminMasterWorkspace').hidden=false;document.querySelectorAll('.admin-master-view').forEach(el=>el.classList.toggle('active',el.id==='admin-master-view-prospecting-credits'));window.LungoProspectingAdmin.open('test-only');});await page.waitForSelector('[data-pa-user]');}
 await open();await page.locator('[data-pa-user]').click();await page.locator('#paAmount').fill('25');await page.locator('#paReason').fill('Recarga de teste');await page.locator('#paCreditForm button').click();
 await page.waitForFunction(()=>document.querySelector('#paCreditForm button')?.textContent==='Reenviar mesma recarga');assert.equal(requests.length,1);
 await open();await page.locator('[data-pa-user]').click();await page.waitForSelector('#paAmount[readonly]');assert.equal(await page.locator('#paAmount').inputValue(),'25');await page.locator('#paCreditForm button').click();await page.waitForFunction(()=>document.querySelector('#paStatus').textContent.includes('confirmada'));
 assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);assert.equal(await page.evaluate(()=>Object.keys(sessionStorage).filter(k=>k.startsWith('lungo-prospecting-admin-pending:')).length),0);
 assert.equal(await page.locator('#paDetail h3').first().textContent(),user.name);assert.equal(await page.locator('#paDetail teste').count(),0);
 fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
 for(const width of [1360,390])for(const theme of ['dark','light']){await page.setViewportSize({width,height:850});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);assert(await page.locator('.pa-panel').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await page.screenshot({path:path.join(root,'test-results',`prospecting-admin-${width}-${theme}.png`)});}
 let release;hold=new Promise(r=>release=r);await page.locator('#paRefresh').click();await page.evaluate(()=>window.LungoProspectingAdmin.reset());release();hold=null;await page.waitForTimeout(100);assert.equal(await page.locator('#admin-master-view-prospecting-credits').innerText(),'');
 missing=true;await page.evaluate(()=>window.LungoProspectingAdmin.open('test-only'));await page.waitForFunction(()=>document.querySelector('#paStatus').textContent.includes('backend'));
 assert.deepEqual(errors,[]);console.log('Admin prospecting: retry across reload, identical request ID, history, escaping, logout race, missing backend and four layouts passed.');
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1);});
