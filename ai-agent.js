(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = n => Number(n || 0).toLocaleString('pt-BR',{maximumFractionDigits:1});
  const date = s => s ? new Date(s).toLocaleDateString('pt-BR') : 'Na primeira ativação';
  const packages = [{credits:300,price:50},{credits:500,price:75},{credits:1000,price:100}];
  let panel='config';
  let token='',adminKey='',generation=0,poll=null,controller=new AbortController(),state=null,agents=[],selectedOrg='',topupAttempt=null;
  async function request(path,method='GET',body,admin=false) {
    const current=admin?adminKey:token;
    if(!current)throw new Error('Entre novamente para acessar o agente.');
    const response=await fetch(`${window.LUNGO_CONFIG.API_BASE_URL}${path}`,{method,headers:{'Content-Type':'application/json',[admin?'x-admin-key':'x-access-token']:current},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
    let data;try{data=await response.json();}catch{data={};}
    if(!response.ok||data.ok===false)throw new Error(response.status===404?'O módulo está aguardando a implantação do backend de staging.':data.error||'Não foi possível carregar o agente. Tente novamente.');
    return data;
  }
  function notice(message,bad=false,admin=false){const node=$(admin?'#aiAdminStatus':'#aiStatus');if(node){node.textContent=message;node.classList.toggle('error',bad);}}
  async function action(button,fn,admin=false){button.disabled=true;try{await fn();}catch(e){if(e.name!=='AbortError')notice(e.message,true,admin);}finally{if(button.isConnected)button.disabled=false;}}
  function render(available=true){
    const host=$('#supervisor-view-marketing-ai');if(!host)return;
    const a=state?.agent,s=a?.settings||{},w=state?.wallet||{},active=Boolean(a?.enabled);
    host.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
    host.dataset.panel=panel;
    host.innerHTML=`<div class="ai-heading"><div><h2>Configuração do agente</h2><p>Personalize o atendimento e conecte o WhatsApp exclusivo da IA.</p></div><span class="ai-state">${active?'Ativado':'Pausado'}</span></div>
    <div class="ai-mobile-tabs" role="tablist" aria-label="Configuração do agente">${[['config','Configuração','aiConfigForm'],['wallet','Créditos','aiWalletCard'],['connection','WhatsApp','aiWhatsAppCard']].map(([id,label,target])=>`<button type="button" role="tab" data-ai-panel="${id}" aria-controls="${target}" aria-selected="${panel===id}" tabindex="${panel===id?0:-1}">${label}</button>`).join('')}</div>
    <div id="aiStatus" class="ai-notice" role="status" aria-live="polite">${available?(active?'Agente ativado. Pause para editar.':'Roteiro padrão de atendimento configurado.'):'Carregando configuração…'}</div>
    <div class="ai-layout"><form id="aiConfigForm" class="ai-card"><div class="ai-card-title"><h3>Identidade e informações</h3><button class="ai-text-button" type="button" data-ai-open="aiScriptDialog">Como atende</button></div>
      <fieldset ${!available||active?'disabled':''}><label>Nome do agente<input name="agentName" maxlength="50" required value="${esc(s.agentName)}" placeholder="Ex.: Eduarda"></label>
      <label>Nome da corretora<input name="companyName" maxlength="120" required value="${esc(s.companyName)}" placeholder="Sua corretora"></label>
      <label class="ai-field-wide">Informações da corretora<textarea name="companyInfo" rows="3" maxlength="1800" required placeholder="Região atendida, horários e informações da corretora.">${esc(s.companyInfo)}</textarea></label>
      <label class="ai-field-wide">WhatsApp para receber os resumos<input name="summaryPhone" type="tel" inputmode="tel" maxlength="22" required value="${esc(s.summaryPhone)}" placeholder="DDD + número"></label><small class="ai-field-wide">Receba o resumo e o contato do lead para continuar o atendimento.</small>
      <button class="btn primary ai-field-wide" type="submit">Salvar configuração</button></fieldset></form>
      <div class="ai-side"><section id="aiWalletCard" class="ai-card ai-wallet"><div class="ai-card-title"><h3>Créditos de IA</h3><button class="ai-text-button" type="button" data-ai-open="aiPackagesDialog">Adquirir créditos ↗</button></div><div class="ai-balance"><strong>${available?num(w.availableCredits):'—'}</strong><span>disponíveis · 10 respostas = 1 crédito</span></div>
      <div class="ai-meter-caption"><span>Franquia mensal disponível</span><b>${w.activated?num(w.monthlyPercent)+'%':'A ativar'}</b></div><progress max="100" value="${Number(w.monthlyPercent||0)}" aria-label="Percentual da franquia mensal disponível"></progress>
      <div class="ai-wallet-details"><span>Franquia<b>${w.activated?num(w.freeCredits)+' / 100':'100 na ativação'}</b></span><span>Comprados<b>${num(w.paidCredits)}</b></span><span>Renovação<b>${date(w.renewsAt)}</b></span></div><p class="ai-hint">Franquia sem acúmulo. Comprados sem validade. Resumos gratuitos.</p>
      ${w.activated&&Number(w.availableCredits)===0?'<p class="ai-notice error">Saldo esgotado. Aguardando renovação ou recarga.</p>':''}
      ${state?.needsReview?'<p class="ai-notice error">Envio em conferência pelo administrador. Atendimento em espera.</p>':''}</section>
      <section id="aiWhatsAppCard" class="ai-card"><div class="ai-card-title"><h3>WhatsApp do agente</h3><span class="ai-card-caption">Número dedicado</span></div><div id="aiConnection" class="ai-connection" role="status">${a?'Confira a conexão ou gere um QR Code.':'Salve a configuração para conectar.'}</div>
      <div class="ai-buttons"><button class="btn" id="aiConnect" type="button" ${!available||!a?'disabled':''}>Conectar WhatsApp</button><button class="btn" id="aiCheckConnection" type="button" ${!available||!a?'disabled':''}>Verificar conexão</button><button class="btn primary" id="aiToggle" type="button" ${!available||!a?'disabled':''}>${active?'Pausar agente':'Ativar agente'}</button></div><p class="ai-hint">Use um número diferente do CRM e do destinatário dos resumos.</p></section></div></div>
      <dialog id="aiPackagesDialog" class="ai-dialog" aria-labelledby="aiPackagesTitle"><header><div><h3 id="aiPackagesTitle">Adquirir créditos</h3><p>Escolha um pacote e combine a compra pelo WhatsApp.</p></div><button class="btn" type="button" data-ai-close aria-label="Fechar pacotes">×</button></header><div class="ai-packages">${packages.map(p=>`<a href="https://wa.me/5555992102864?text=${encodeURIComponent(`Olá! Quero adquirir ${p.credits} créditos de IA por R$ ${p.price} para a corretora ${s.companyName||'(informar nome)'}.`)}" target="_blank" rel="noopener noreferrer"><span>${num(p.credits)} créditos</span><strong>R$ ${p.price}</strong><small>Até ${num(p.credits*10)} respostas</small><b>Adquirir ↗</b></a>`).join('')}</div><p class="ai-hint">Liberação pelo administrador após confirmar o pagamento.</p></dialog>
      <dialog id="aiScriptDialog" class="ai-dialog" aria-labelledby="aiScriptTitle"><header><h3 id="aiScriptTitle">Como o agente atende</h3><button class="btn" type="button" data-ai-close aria-label="Fechar explicação">×</button></header><p>Uma pergunta por vez: nome, plano atual, empresa e CNPJ quando aplicável, preferência de operadora, quantidade de pessoas, idades e preferência de rede.</p><p>Não solicita e-mail nem orçamento e não inventa preços. Ao concluir, envia o resumo ao cliente e ao responsável. O roteiro é padrão e não pode ser editado.</p></dialog>
      <dialog id="aiQrDialog" class="ai-dialog ai-qr-dialog" aria-labelledby="aiQrTitle"><header><h3 id="aiQrTitle">Conectar WhatsApp</h3><button class="btn" type="button" data-ai-close aria-label="Fechar QR Code">×</button></header><div id="aiQrContent" class="ai-connection" role="status"></div></dialog>`;
    host.querySelectorAll('[data-ai-panel]').forEach(button=>{
      button.onclick=()=>{panel=button.dataset.aiPanel;host.dataset.panel=panel;host.querySelectorAll('[data-ai-panel]').forEach(tab=>{tab.setAttribute('aria-selected',String(tab===button));tab.tabIndex=tab===button?0:-1;});};
      button.onkeydown=event=>{const tabs=[...host.querySelectorAll('[data-ai-panel]')],index=tabs.indexOf(button);let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();tabs[next].click();tabs[next].focus();};
    });
    host.querySelectorAll('[data-ai-open]').forEach(button=>button.onclick=()=>$('#'+button.dataset.aiOpen).showModal());
    host.querySelectorAll('[data-ai-close]').forEach(button=>button.onclick=()=>button.closest('dialog').close());
    $('#aiConfigForm').onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));action(e.submitter,async()=>{const g=generation;const result=await request('/api/supervisor/ai-agent','PUT',data);if(g!==generation)return;state=result;render();notice('Configuração salva.');});};
    $('#aiToggle').onclick=e=>action(e.currentTarget,async()=>{const g=generation;const result=await request('/api/supervisor/ai-agent/enabled','POST',{enabled:!active});if(g!==generation)return;state=result;render();notice(active?'Agente pausado.':'Agente ativado. Pause para editar.');});
    $('#aiConnect').onclick=e=>action(e.currentTarget,()=>connect(true));
    $('#aiCheckConnection').onclick=e=>action(e.currentTarget,()=>connect(false));
  }
  async function connect(create){
    const g=generation,result=await request('/api/supervisor/ai-agent/connection',create?'POST':'GET',create?{}:undefined);if(g!==generation)return;
    const host=$(create?'#aiQrContent':'#aiConnection');if(!host)return;
    host.replaceChildren();
    if(result.connected){$('#aiConnection').textContent='WhatsApp conectado. Você já pode ativar o agente.';$('#aiQrDialog')?.close();clearInterval(poll);poll=null;return;}
    if(create)$('#aiQrDialog').showModal();
    if(result.qrCodeBase64&&/^data:image\/(png|jpeg);base64,[a-z0-9+/=]+$/i.test(result.qrCodeBase64)){const img=document.createElement('img');img.src=result.qrCodeBase64;img.alt='QR Code para conectar o WhatsApp exclusivo do agente';host.append(img);}
    else if(result.qrCode&&window.qrcode){const qr=window.qrcode(0,'M');qr.addData(result.qrCode);qr.make();const img=document.createElement('img');img.src=qr.createDataURL(5,8);img.alt='QR Code para conectar o WhatsApp exclusivo do agente';host.append(img);}
    const message=document.createElement('p');message.textContent=create?'No WhatsApp do agente, abra Aparelhos conectados e escaneie o QR Code. Se expirar, gere outro.':'WhatsApp desconectado. Gere um QR Code para conectar.';host.append(message);
    if(create){clearInterval(poll);let attempts=0;poll=setInterval(async()=>{if(++attempts>20||!$('#supervisor-view-marketing-ai')?.classList.contains('active')){clearInterval(poll);poll=null;return;}try{const r=await request('/api/supervisor/ai-agent/connection');if(g!==generation)return;if(r.connected){clearInterval(poll);poll=null;$('#aiConnection').textContent='WhatsApp conectado. Você já pode ativar o agente.';$('#aiQrDialog')?.close();}}catch{clearInterval(poll);poll=null;notice('Não foi possível atualizar a conexão. Use Verificar conexão.',true);}},5000);}
  }
  async function open(accessToken){
    resetSupervisor();token=accessToken||'';const g=generation;render(false);
    try{const result=await request('/api/supervisor/ai-agent');if(g!==generation)return;state=result;render();if(Object.values(result.readiness||{}).some(v=>!v))notice('Você pode salvar a configuração. A ativação depende da conclusão da integração no servidor.');}
    catch(e){if(e.name!=='AbortError'&&g===generation)notice(e.message,true);}
  }
  function resetSupervisor(){panel='config';generation++;clearInterval(poll);poll=null;controller.abort();controller=new AbortController();token='';state=null;const host=$('#supervisor-view-marketing-ai');if(host){host.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());host.replaceChildren();}}
  async function adminOpen(key){adminKey=key;const host=$('#admin-master-view-ai-credits');if(!host)return;host.innerHTML='<section class="ai-card"><h2>Créditos de IA</h2><p id="aiAdminStatus" role="status">Carregando agentes…</p></section>';try{const result=await request('/api/admin/ai-agents','GET',undefined,true);if(key!==adminKey)return;agents=result.agents;adminRender();}catch(e){if(e.name!=='AbortError')notice(e.message,true,true);}}
  function adminRender(){
    const host=$('#admin-master-view-ai-credits');if(!host)return;
    host.innerHTML=`<section class="ai-card"><h2>Créditos de IA</h2><p>Adicione créditos comprados após confirmar o pagamento. A franquia mensal é renovada automaticamente.</p><p id="aiAdminStatus" class="ai-notice" role="status">${agents.length?'Selecione a corretora e registre a recarga.':'Nenhum supervisor configurou um agente ainda.'}</p><form id="aiTopupForm" class="ai-admin-form"><label>Corretora<select name="organizationId" required>${agents.map(a=>`<option value="${esc(a.organization_id)}" ${a.organization_id===selectedOrg?'selected':''}>${esc(a.settings.companyName)} — ${num(a.wallet.availableCredits)} créditos</option>`).join('')}</select></label><label>Créditos a adicionar<input name="credits" type="number" min="1" max="100000" step="1" value="300" required></label><label>Referência do pagamento / observação<input name="note" minlength="3" maxlength="240" required placeholder="Ex.: Pix confirmado em 19/09, pacote R$ 50"></label><button class="btn primary" ${!agents.length?'disabled':''}>Adicionar créditos</button></form><div id="aiAdminHistory"></div></section>`;
    const form=$('#aiTopupForm');form.onsubmit=e=>{e.preventDefault();const body=Object.fromEntries(new FormData(form));selectedOrg=body.organizationId;body.credits=Number(body.credits);const signature=JSON.stringify(body);if(topupAttempt?.signature!==signature)topupAttempt={signature,id:crypto.randomUUID()};action(e.submitter,async()=>{const key=adminKey;await request(`/api/admin/ai-agents/${encodeURIComponent(body.organizationId)}/credits`,'POST',{credits:body.credits,note:body.note,requestId:topupAttempt.id},true);if(key!==adminKey)return;topupAttempt=null;await adminOpen(key);notice('Créditos adicionados e registrados no histórico.',false,true);},true);};
    form.elements.organizationId.onchange=()=>{selectedOrg=form.elements.organizationId.value;adminHistory(selectedOrg);};
    if(agents.length){selectedOrg=form.elements.organizationId.value;adminHistory(selectedOrg);}
  }
  async function adminHistory(org){try{const data=await request(`/api/admin/ai-agents/${encodeURIComponent(org)}`,'GET',undefined,true);if(org!==selectedOrg)return;$('#aiAdminHistory').innerHTML=`<h3>Histórico de créditos</h3><div class="ai-history">${data.events.map(e=>`<p><span>${date(e.created_at)} · ${esc(e.note)}</span><b>${num(e.units/10)}</b></p>`).join('')||'<p>Nenhuma movimentação.</p>'}</div>${data.jobs.length?'<h3>Entregas pendentes de conferência</h3><p>Confira a conversa no WhatsApp antes de resolver. Não há reenvio automático.</p>':''}${data.jobs.map(j=>`<div class="ai-review"><span>${esc(j.phone)} · ${date(j.created_at)} · ${esc(j.kind==='summary'?'Resumo':'Resposta')}</span><button class="btn" data-job="${esc(j.id)}" data-outcome="sent">Confirmei o envio</button><button class="btn" data-job="${esc(j.id)}" data-outcome="failed">Confirmei que não enviou</button></div>`).join('')}`;document.querySelectorAll('[data-job]').forEach(b=>b.onclick=()=>{if(!confirm('Você conferiu a entrega no WhatsApp? Esta confirmação atualiza o saldo e libera o atendimento.'))return;action(b,async()=>{await request(`/api/admin/ai-agents/${org}/jobs/${b.dataset.job}/resolve`,'POST',{outcome:b.dataset.outcome},true);await adminHistory(org);},true);});}catch(e){if(e.name!=='AbortError')notice(e.message,true,true);}}
  window.LungoAiAgent={open,reset:resetSupervisor,adminOpen,adminReset(){adminKey='';agents=[];selectedOrg='';topupAttempt=null;const host=$('#admin-master-view-ai-credits');if(host)host.replaceChildren();}};
})();
