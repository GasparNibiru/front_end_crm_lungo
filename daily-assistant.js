(() => {
  'use strict';
  const dayKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const cleanDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value||'')) ? String(value) : '';
  const inactive = new Set(['arquivado','lixeira','fechamento','venda_perdida','perdida']);
  function summarize({leads=[],clients=[],events=[]}, now=new Date()) {
    const today=dayKey(now), week=new Date(now), month=new Date(now); week.setDate(week.getDate()+7);month.setDate(month.getDate()+30);
    const items=[],seen=new Set();
    function add(group,kind,row,title,detail,due='') {
      const key=`${group}:${kind}:${row.id}:${title}`;if(seen.has(key))return;seen.add(key);
      items.push({group,kind,id:row.id,team:Boolean(row._team),title,name:row.nome||row.pushName||row.telefone||row.title||'Sem nome',detail:[detail,row._team?row.brokerName:''].filter(Boolean).join(' · '),due});
    }
    function schedule(row,s,kind) {
      const date=cleanDate(s?.data);
      if(!date||s.ativo===false||['sent','completed','cancelled','enviado','concluido'].includes(s.status))return;
      if(date<=today)add(date<today?'pending':'today',kind,row,kind==='client'?'Pós-venda programado':'Retorno programado',`${date===today?'Hoje':date.split('-').reverse().join('/')} · ${s.hora||'Horário não informado'}${s.status==='error'?' · Falha no envio':''}`,date);
    }
    for(const lead of leads) {
      if(!lead.id||inactive.has(lead.status))continue;
      schedule(lead,lead.mensagemProgramada,'lead');
      if(!lead.mensagemProgramada&&cleanDate(lead.proximoRetorno))schedule(lead,{data:lead.proximoRetorno},'lead');
      if(['novo','novo_lead','novos'].includes(lead.status))add('pending','lead',lead,'Lead novo no funil','Confira se já recebeu o primeiro atendimento');
      else {const updated=new Date(lead.updatedAt);if(lead.updatedAt&&Number.isFinite(+updated)&&now-updated>=5*86400000)add('pending','lead',lead,'Negociação sem atualização',`Há ${Math.floor((now-updated)/86400000)} dias · revise o próximo passo`,dayKey(updated));}
    }
    for(const client of clients) {
      if(!client.id||['arquivado','lixeira','cancelado','inativo'].includes(client.status))continue;
      schedule(client,client.posVenda,'client');const renewal=cleanDate(client.dataRenovacao);
      if(renewal&&renewal<=dayKey(month)&&client.status!=='renovado')add('portfolio','client',client,renewal<today?'Revisar renovação vencida':'Renovação próxima',renewal.split('-').reverse().join('/'),renewal);
    }
    for(const event of events) {const d=new Date(event.startsAt);if(!event.id||!Number.isFinite(+d)||['cancelled','cancelado','completed','concluido'].includes(event.status))continue;const key=dayKey(d);if(key>=today&&key<=dayKey(week))add('today','agenda',event,key===today?'Compromisso de hoje':'Próximo compromisso',d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),event.startsAt);}
    return items.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  }
  if(typeof module!=='undefined')module.exports={summarize};
  if(typeof window==='undefined')return;
  let generation=0,controller,dialog,session,items=[],tab='today';
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function reset(){generation++;controller?.abort();session=null;items=[];if(dialog?.open)dialog.close();dialog?.remove();dialog=null;document.querySelectorAll('.daily-dot').forEach(n=>n.hidden=true);}
  function renderList(){
    const list=dialog.querySelector('.daily-list');list.replaceChildren();
    for(const button of dialog.querySelectorAll('[data-daily-tab]')){button.setAttribute('aria-pressed',String(button.dataset.dailyTab===tab));button.querySelector('b').textContent=items.filter(x=>x.group===button.dataset.dailyTab).length;}
    const rows=items.filter(x=>x.group===tab);
    if(!rows.length){const empty=node('div','daily-empty');empty.append(node('span','','✓'),node('h3','','Nenhum item nesta categoria'),node('p','','Com base nos dados consultados agora.'));list.append(empty);return;}
    for(const item of rows){const row=node('article','daily-row'),copy=node('div');copy.append(node('small','',item.title),node('h3','',item.name),node('p','',item.detail));const button=node('button','daily-open',item.kind==='agenda'?'Ver agenda':item.kind==='client'?'Abrir cliente':'Abrir lead');button.type='button';button.onclick=async()=>{const current=session;dialog.close();try{await current.navigate(item);}catch{if(session===current){dialog.showModal();dialog.querySelector('.daily-status').textContent='Não foi possível abrir o item. Tente novamente.';}}};row.append(copy,button);list.append(row);}
  }
  async function refresh(){
    const g=++generation;controller?.abort();controller=new AbortController();const current=session;
    const status=dialog.querySelector('.daily-status'),refreshButton=dialog.querySelector('.daily-refresh');refreshButton.disabled=true;status.textContent='Consultando sua agenda e seus atendimentos…';items=[];dialog.querySelector('.daily-list').replaceChildren();
    async function get(path){const r=await fetch(window.LUNGO_CONFIG.API_BASE_URL+path,{headers:{'x-access-token':current.token,'x-client-token':current.token},cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});if(!r.ok)throw Error('unavailable');const d=await r.json();if(d.ok===false)throw Error('unavailable');return d;}
    const q=encodeURIComponent(current.token);
    const sources=[['Meus Leads','leads',`/api/crm/auto-leads?token=${q}&limit=500`,false],['Agenda','events','/api/calendar/events',false],['Carteira','clients',current.supervisor?'/api/supervisor/operational-clients':`/api/clientes?token=${q}&period=all`,false]];
    if(current.supervisor)sources.push(['Leads da equipe','leads','/api/supervisor/leads',true]);
    const results=await Promise.allSettled(sources.map(async([label,key,path,team])=>{const data=await get(path);return {key,rows:(data[key]||data.clientes||[]).map(x=>({...x,_team:team}))};}));
    if(g!==generation||session!==current||!dialog)return;
    const data={leads:[],clients:[],events:[]},failed=[];results.forEach((r,i)=>{if(r.status==='fulfilled')data[r.value.key].push(...r.value.rows);else failed.push(sources[i][0]);});
    for(const key of Object.keys(data))data[key]=[...new Map(data[key].map(x=>[String(x.id),x])).values()];
    items=summarize(data);tab=items.some(x=>x.group==='today')?'today':items.some(x=>x.group==='pending')?'pending':'portfolio';
    status.textContent=failed.length?`Resumo parcial. Não foi possível consultar: ${failed.join(', ')}. Tente atualizar.`:`Atualizado às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · ${current.supervisor?'Seus atendimentos e os da equipe':'Seus atendimentos'}`;
    dialog.querySelector('.daily-intro').textContent=items.length?`${items.length} ${items.length===1?'ponto merece':'pontos merecem'} sua atenção. Vamos organizar os próximos passos?`:failed.length?'Algumas informações ainda não estão disponíveis.':'Tudo em ordem nos dados consultados. Veja sua agenda quando precisar.';
    document.querySelectorAll('.daily-dot').forEach(n=>n.hidden=!items.some(x=>x.group==='pending'));renderList();refreshButton.disabled=false;
  }
  async function open(options){
    reset();session=options;dialog=node('dialog','daily-dialog');dialog.setAttribute('aria-labelledby','dailyTitle');
    dialog.innerHTML='<header class="daily-header"><div><span class="daily-eyebrow">SECRETÁRIA DO LUNGO</span><h2 id="dailyTitle">Seu dia, com mais clareza.</h2></div><button type="button" class="daily-close" aria-label="Fechar resumo do dia">×</button></header><div class="daily-welcome"><span class="daily-orb" aria-hidden="true"><i></i><i></i><i></i></span><div><h3></h3><p class="daily-intro">Vamos conferir o que merece sua atenção.</p></div></div><nav class="daily-tabs" aria-label="Resumo do dia"><button type="button" data-daily-tab="today" aria-pressed="true">Agenda <b>0</b></button><button type="button" data-daily-tab="pending" aria-pressed="false">Pendências <b>0</b></button><button type="button" data-daily-tab="portfolio" aria-pressed="false">Carteira <b>0</b></button></nav><p class="daily-status" role="status"></p><div class="daily-list"></div><footer><span>Agenda: hoje e próximos 7 dias · Renovações: até 30 dias.<br>Até 500 leads próprios. Resumo sem consumo de créditos.</span><button class="daily-refresh" type="button">Atualizar</button></footer>';
    const hour=new Date().getHours();dialog.querySelector('.daily-welcome h3').textContent=hour<12?'Bom dia!':hour<18?'Boa tarde!':'Boa noite!';
    dialog.querySelector('.daily-close').onclick=()=>dialog.close();dialog.querySelector('.daily-refresh').onclick=refresh;dialog.querySelectorAll('[data-daily-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.dailyTab;renderList();});
    document.body.append(dialog);dialog.showModal();if(!options.token){dialog.querySelector('.daily-status').textContent='Entre na sua conta para consultar o resumo.';dialog.querySelector('.daily-refresh').disabled=true;return;}await refresh();
  }
  window.LungoDailyAssistant={open,reset};
})();
