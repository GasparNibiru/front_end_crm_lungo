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
  const money = value => {
    if(typeof value==='number')return Number.isFinite(value)?value:0;
    let v=String(value??'').replace(/[^0-9,.-]/g,'');
    if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');
    return Number.isFinite(Number(v))?Number(v):0;
  };
  function salesSummary(leads,now=new Date()) {
    const month=dayKey(now).slice(0,7),closed=leads.filter(x=>['fechamento','fechado','ganho'].includes(x.status));
    const dated=closed.filter(x=>x.closedAt&&Number.isFinite(+new Date(x.closedAt)));
    const current=dated.filter(x=>dayKey(new Date(x.closedAt)).slice(0,7)===month);
    return {month,count:current.length,value:current.reduce((sum,x)=>sum+money(x.valorNegocio||x.valor),0),undated:closed.length-dated.length,open:leads.filter(x=>!inactive.has(x.status)&&!['fechado','ganho'].includes(x.status)).length};
  }
  function financeSummary(receivables,transfers,now=new Date()) {
    const today=dayKey(now),month=today.slice(0,7);
    return {pending:receivables.filter(x=>x.status==='pending').reduce((s,x)=>s+money(x.net_amount),0),overdue:receivables.filter(x=>x.status==='pending'&&x.due_date&&x.due_date.slice(0,10)<today).reduce((s,x)=>s+money(x.net_amount),0),received:receivables.filter(x=>x.status==='paid'&&x.paid_at&&dayKey(new Date(x.paid_at)).slice(0,7)===month).reduce((s,x)=>s+money(x.paid_amount),0),transfers:transfers.filter(x=>x.status==='pending').reduce((s,x)=>s+money(x.expected_amount),0)};
  }
  const helpTopics = [
    {id:'connect',title:'Como conectar meu WhatsApp?',route:'connect',steps:['Abra Meus dados e acesse Conectar WhatsApp.','Gere o QR Code e escaneie pelo WhatsApp do seu celular, em Aparelhos conectados.','Confira se a plataforma mostra a conexão ativa antes de programar mensagens.']},
    {id:'crm',title:'Como cadastrar e acompanhar um lead?',route:'crm',steps:['Abra Meus Leads e use a opção de novo lead. Preencha nome e telefone.','Use a lista ou o kanban para acompanhar a etapa da negociação.','Abra a ficha para atualizar informações e definir o próximo retorno.']},
    {id:'schedule',title:'Como agendar uma mensagem?',route:'crm',steps:['Conecte primeiro o WhatsApp vinculado à plataforma.','Em Meus Leads, abra o agendamento do lead e informe data, hora e mensagem.','Salve a programação. O WhatsApp precisa estar conectado também no momento do envio.']},
    {id:'business_intelligence',title:'Como prospectar empresas e usar créditos?',route:'business_intelligence',steps:['Em Buscar empresas, escolha os filtros e execute a busca.','Selecione as empresas e confira o custo antes de confirmar. Cada empresa adquirida custa 1 crédito.','Os contatos desbloqueados ficam em Minhas empresas. Ali você pode enviar para Meus Leads; agendar exige WhatsApp conectado.']},
    {id:'agenda',title:'Qual a diferença entre lembrete e envio?',route:'agenda',steps:['A Agenda organiza compromissos e lembretes na tela. Criar um compromisso não envia uma mensagem ao cliente.','Para enviar WhatsApp em uma data específica, use o agendamento na ficha do lead ou em Minhas empresas.']},
    {id:'clients',title:'Como acompanhar minha carteira?',route:'clients',steps:['Abra Clientes para consultar contratos, produtos e dados cadastrados.','Mantenha as datas de renovação e o pós-venda atualizados. O assistente usa essas informações nos lembretes.']},
    {id:'marketing-ai',title:'Como configurar o agente de IA?',route:'marketing-ai',supervisor:true,steps:['Na barra de Marketing, abra Agente de IA. Pause o agente antes de editar.','Escolha o tipo de atendimento e preencha nome, corretora e WhatsApp do responsável pelos resumos.','Conecte um WhatsApp exclusivo para o agente, diferente do número do responsável, e ative o atendimento.']},
    {id:'finance',title:'Como consultar o financeiro?',route:'finance',supervisor:true,steps:['Abra Financeiro para consultar vendas, recebimentos e repasses da corretora.','Use os filtros de período e confira os lançamentos antes de confirmar pagamentos.','Valor vendido, comissão prevista e dinheiro recebido são medidas diferentes. O assistente apenas consulta os registros.']}
  ];
  if(typeof module!=='undefined')module.exports={summarize,salesSummary,financeSummary};
  if(typeof window==='undefined')return;
  let generation=0,controller,dialog,session,items=[],tab='today',mode='day',snapshot={leads:[]},failedSources=[],financeCache=null,loadingData=false;
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  let chat=[],chatBusy=false,chatController;
  function reset(){chatController?.abort();chat=[];chatBusy=false;generation++;controller?.abort();session=null;items=[];snapshot={leads:[]};failedSources=[];financeCache=null;mode='day';loadingData=false;if(dialog?.open)dialog.close();dialog?.remove();dialog=null;document.querySelectorAll('.daily-dot').forEach(n=>n.hidden=true);}
  function renderList(){
    const list=dialog.querySelector('.daily-list');list.replaceChildren();
    dialog.querySelector('.daily-tabs').hidden=mode!=='day';
    dialog.querySelectorAll('[data-daily-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dailyMode===mode)));
    if(mode==='chat'){for(const entry of chat)list.append(node('p','daily-message '+entry.role,entry.content));if(!chat.length)list.append(node('p','daily-empty','Como posso ajudar você a usar o Lungo?'));if(chatBusy)list.append(node('p','daily-thinking','Pensando…'));list.scrollTop=list.scrollHeight;return;}
    if(['help','sales','finance'].includes(mode)){renderFeature(list);return;}
    for(const button of dialog.querySelectorAll('[data-daily-tab]')){button.setAttribute('aria-pressed',String(button.dataset.dailyTab===tab));button.querySelector('b').textContent=items.filter(x=>x.group===button.dataset.dailyTab).length;}
    const rows=mode==='attention'?items.filter(x=>x.group==='pending'||(x.group==='today'&&x.kind!=='agenda')).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')):items.filter(x=>x.group===tab);
    if(!rows.length){const empty=node('div','daily-empty');empty.append(node('span','','✓'),node('h3','','Nenhum item nesta categoria'),node('p','','Com base nos dados consultados agora.'));list.append(empty);return;}
    for(const item of rows){const row=node('article','daily-row'),copy=node('div');copy.append(node('small','',item.title),node('h3','',item.name),node('p','',item.detail));const button=node('button','daily-open',item.kind==='agenda'?'Ver agenda':item.kind==='client'?'Abrir cliente':'Abrir lead');button.type='button';button.onclick=async()=>{const current=session;dialog.close();try{await current.navigate(item);}catch{if(session===current){dialog.showModal();dialog.querySelector('.daily-status').textContent='Não foi possível abrir o item. Tente novamente.';}}};row.append(copy,button);list.append(row);}
  }
  const brl=value=>Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  function shortcut(list,label,route){const b=node('button','daily-open',label);b.type='button';b.onclick=async()=>{const current=session;dialog.close();try{await current.navigate({kind:'route',route});}catch{if(session===current){dialog.showModal();dialog.querySelector('.daily-status').textContent='Não foi possível abrir a área. Tente novamente.';}}};list.append(b);}
  function metrics(list,values){const grid=node('div','daily-metrics');for(const [label,value] of values){const card=node('article');card.append(node('small','',label),node('strong','',String(value)));grid.append(card);}list.append(grid);}
  function renderFeature(list){
    if(mode==='help'){
      list.append(node('p','daily-help-intro','Escolha uma dúvida para ver os passos e abrir a área correspondente.'));
      const topics=helpTopics.filter(x=>!x.supervisor||session.supervisor).sort((a,b)=>Number(b.route===session.context)-Number(a.route===session.context));
      for(const topic of topics){const detail=node('details','daily-help'),summary=node('summary','',topic.title),steps=node('ol');if(topic.route===session.context)summary.append(node('small','','Nesta tela'));topic.steps.forEach(text=>steps.append(node('li','',text)));detail.append(summary,steps);shortcut(detail,'Abrir área',topic.route);list.append(detail);}
      const support=node('a','daily-open','Falar com o suporte ↗');support.href='https://wa.me/5555992102864?text='+encodeURIComponent('Olá! Preciso de ajuda para usar o Lungo CRM. Minha dúvida é:');support.target='_blank';support.rel='noopener noreferrer';list.append(support);return;
    }
    if(mode==='sales'){
      if(loadingData){list.append(node('p','','Consultando os dados de vendas…'));return;}
      list.append(node('h3','',session.supervisor?'Vendas e oportunidades da equipe e suas':'Minhas vendas e oportunidades'));
      if(failedSources.some(x=>x.includes('Leads'))){list.append(node('p','','Dados de leads incompletos. Atualize para consultar os totais.'));return;}
      const totals=salesSummary(snapshot.leads);list.append(node('p','',`Fechamentos com data registrada · ${new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}`));
      metrics(list,[['Vendas fechadas no mês',totals.count],['Valor vendido no mês',brl(totals.value)],['Oportunidades abertas na base',totals.open]]);
      list.append(node('p','',`${totals.undated?totals.undated+' fechamento(s) sem data não entram no total mensal. ':''}Valor vendido não representa comissão nem recebimento. Abrangência: base consultada, até 500 leads próprios e, para supervisor, leads da equipe.`));shortcut(list,'Abrir funil',session.supervisor?'funnel':'crm');return;
    }
    if(mode==='finance'){
      if(!session.supervisor){list.append(node('p','','O resumo financeiro está disponível ao supervisor.'));return;}
      if(!financeCache){list.append(node('p','','Consultando o financeiro da corretora…'));loadFinance();return;}
      if(financeCache.loading){list.append(node('p','','Consultando o financeiro da corretora…'));return;}
      if(financeCache.error){list.append(node('p','',financeCache.error));shortcut(list,'Abrir Financeiro','finance');return;}
      const t=financeSummary(financeCache.receivables,financeCache.transfers);list.append(node('h3','','Financeiro da corretora'));
      metrics(list,[['A receber · todos os vencimentos',brl(t.pending)],['Vencido a receber · até ontem',brl(t.overdue)],['Recebido · mês atual',brl(t.received)],['Repasses pendentes · total',brl(t.transfers)]]);
      list.append(node('p','','O vencido já está incluído no total a receber. Recebidos consideram a data de pagamento. Consulta dos lançamentos existentes, sem alterar ou confirmar pagamentos.'));shortcut(list,'Abrir Financeiro','finance');
    }
  }
  async function loadFinance(){
    const current=session,g=generation;financeCache={loading:true};
    async function read(path){const r=await fetch(window.LUNGO_CONFIG.API_BASE_URL+'/api/supervisor/finance/'+path,{headers:{'x-access-token':current.token},cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});if(!r.ok)throw Error('Não foi possível consultar o financeiro. Tente atualizar.');const data=await r.json();if(data.ok===false)throw Error('Financeiro indisponível.');return data;}
    try{const settings=await read('settings');if(!settings.settings)throw Error('O Financeiro ainda não foi ativado. Abra a área para conferir.');const [r,t]=await Promise.all([read('receivables'),read('transfers')]);if(session!==current||g!==generation)return;financeCache={receivables:r.receivables||[],transfers:t.transfers||[]};}
    catch(e){if(session!==current||g!==generation)return;financeCache={error:e.message};}
    if(mode==='finance')renderList();
  }
  async function refresh(){
    const g=++generation;controller?.abort();controller=new AbortController();const current=session;
    const status=dialog.querySelector('.daily-status'),refreshButton=dialog.querySelector('.daily-refresh');refreshButton.disabled=true;loadingData=true;status.textContent='Consultando sua agenda e seus atendimentos…';items=[];dialog.querySelector('.daily-list').replaceChildren();
    async function get(path){const r=await fetch(window.LUNGO_CONFIG.API_BASE_URL+path,{headers:{'x-access-token':current.token,'x-client-token':current.token},cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});if(!r.ok)throw Error('unavailable');const d=await r.json();if(d.ok===false)throw Error('unavailable');return d;}
    const q=encodeURIComponent(current.token);
    const sources=[['Meus Leads','leads',`/api/crm/auto-leads?token=${q}&limit=500`,false],['Agenda','events','/api/calendar/events',false],['Carteira','clients',current.supervisor?'/api/supervisor/operational-clients':`/api/clientes?token=${q}&period=all`,false]];
    if(current.supervisor)sources.push(['Leads da equipe','leads','/api/supervisor/leads',true]);
    const results=await Promise.allSettled(sources.map(async([label,key,path,team])=>{const data=await get(path);return {key,rows:(data[key]||data.clientes||[]).map(x=>({...x,_team:team}))};}));
    if(g!==generation||session!==current||!dialog)return;
    const data={leads:[],clients:[],events:[]},failed=[];results.forEach((r,i)=>{if(r.status==='fulfilled')data[r.value.key].push(...r.value.rows);else failed.push(sources[i][0]);});
    for(const key of Object.keys(data))data[key]=[...new Map(data[key].map(x=>[String(x.id),x])).values()];
    loadingData=false;snapshot=data;failedSources=failed;financeCache=null;items=summarize(data);tab=items.some(x=>x.group==='today')?'today':items.some(x=>x.group==='pending')?'pending':'portfolio';
    status.textContent=failed.length?`Resumo parcial. Não foi possível consultar: ${failed.join(', ')}. Tente atualizar.`:`Atualizado às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · ${current.supervisor?'Seus atendimentos e os da equipe':'Seus atendimentos'}`;
    dialog.querySelector('.daily-intro').textContent=items.length?`${items.length} ${items.length===1?'ponto merece':'pontos merecem'} sua atenção. Vamos organizar os próximos passos?`:failed.length?'Algumas informações ainda não estão disponíveis.':'Tudo em ordem nos dados consultados. Veja sua agenda quando precisar.';
    document.querySelectorAll('.daily-dot').forEach(n=>n.hidden=!items.some(x=>x.group==='pending'));renderList();refreshButton.disabled=false;
  }
  async function sendChat(event){
    event.preventDefault();if(chatBusy||!session?.token)return;
    const current=session,input=dialog.querySelector('#dailyQuestion'),content=input.value.trim();if(!content)return;
    const history=chat.slice(-8);chat.push({role:'user',content});input.value='';chatBusy=true;mode='chat';chatController=new AbortController();
    const button=dialog.querySelector('.daily-composer button');button.disabled=true;dialog.querySelector('.daily-chat-error').textContent='';renderList();
    try{
      const response=await fetch(window.LUNGO_CONFIG.API_BASE_URL+'/api/assistant/chat',{method:'POST',headers:{'Content-Type':'application/json','x-access-token':current.token},body:JSON.stringify({message:content,history}),signal:AbortSignal.any([chatController.signal,AbortSignal.timeout(50000)])});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.reply)throw Error(response.status===404?'A conversa aguarda a atualização do backend.':data.error||'Não foi possível responder agora. Tente novamente.');
      if(session!==current)return;chat.push({role:'assistant',content:data.reply});chat=chat.slice(-20);
    }catch(error){if(session!==current)return;chat.pop();input.value=content;dialog.querySelector('.daily-chat-error').textContent=error.name==='TimeoutError'?'A resposta demorou. Tente novamente.':error.message;}
    finally{if(session===current){chatBusy=false;button.disabled=false;renderList();}}
  }
  async function open(options){
    reset();session=options;dialog=node('dialog','daily-dialog');dialog.setAttribute('aria-labelledby','dailyTitle');
    dialog.innerHTML='<header class="daily-header"><div><span class="daily-eyebrow">ASSISTENTE LUNGO</span><h2 id="dailyTitle">Como posso ajudar?</h2></div><button type="button" class="daily-close" aria-label="Fechar resumo do dia">×</button></header><div class="daily-welcome"><span class="daily-orb" aria-hidden="true"><i></i><i></i><i></i></span><div><h3></h3><p class="daily-intro">Vamos conferir o que merece sua atenção.</p></div></div><nav class="daily-pills" aria-label="Como posso ajudar"></nav><nav class="daily-tabs" aria-label="Resumo do dia"><button type="button" data-daily-tab="today" aria-pressed="true">Agenda <b>0</b></button><button type="button" data-daily-tab="pending" aria-pressed="false">Pendências <b>0</b></button><button type="button" data-daily-tab="portfolio" aria-pressed="false">Carteira <b>0</b></button></nav><p class="daily-status" role="status"></p><div class="daily-list"></div><form class="daily-composer"><label class="sr-only" for="dailyQuestion">Converse com o Assistente Lungo</label><input id="dailyQuestion" maxlength="2000" autocomplete="off" placeholder="Como posso ajudar?" required><button type="submit" aria-label="Enviar mensagem">Enviar</button></form><footer><span class="daily-chat-error" role="alert"></span><button class="daily-refresh" type="button">Atualizar</button></footer>';
    const hour=new Date().getHours();dialog.querySelector('.daily-welcome h3').textContent=hour<12?'Bom dia!':hour<18?'Boa tarde!':'Boa noite!';
    dialog.querySelector('.daily-close').onclick=()=>dialog.close();dialog.querySelector('.daily-refresh').onclick=refresh;dialog.querySelectorAll('[data-daily-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.dailyTab;renderList();});
    const choices=[['day','Meu dia'],['help','Ajuda'],['sales','Vendas'],['attention','Prioridades'],...(options.supervisor?[['finance','Financeiro']]:[]),['chat','Conversar']];
    for(const [value,label] of choices){const button=node('button','',label);button.type='button';button.dataset.dailyMode=value;button.onclick=()=>{mode=value;renderList();};dialog.querySelector('.daily-pills').append(button);}
    dialog.querySelector('.daily-composer').onsubmit=sendChat;
    document.body.append(dialog);dialog.showModal();if(!options.token){dialog.querySelector('.daily-status').textContent='Entre na sua conta para consultar o resumo.';dialog.querySelector('.daily-refresh').disabled=true;return;}await refresh();
  }
  window.LungoDailyAssistant={open,reset};
})();
