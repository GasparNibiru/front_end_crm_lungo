(() => {
 'use strict';
 let session,items=[],seen=new Set(),scope='',timer,controller,dialog,busy=false,error='',generation=0;
 const buttons=()=>document.querySelectorAll('.notification-trigger');
 const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
 function badge(){const unread=items.filter(x=>!seen.has(x.id)).length;buttons().forEach(b=>{b.querySelector('.notification-dot').hidden=!unread;b.setAttribute('aria-label',unread?`Notificações: ${unread} não lidas`:'Notificações');});}
 function save(){try{localStorage.setItem('lungo-notifications-read:'+scope,JSON.stringify([...seen].slice(-500)));}catch{}badge();render();}
 function read(item){seen.add(item.id);save();}
 function render(){if(!dialog)return;const list=dialog.querySelector('.notification-list');list.replaceChildren();dialog.querySelector('.notification-status').textContent=error|| (busy?'Consultando avisos…':'');dialog.querySelector('.notification-read-all').disabled=!items.some(x=>!seen.has(x.id));
 if(!items.length&&!busy&&!error)list.append(node('p','notification-empty','Nenhuma notificação no momento.'));
 for(const item of items){const row=node('button','notification-row'+(seen.has(item.id)?'':' unread'));row.type='button';row.append(node('strong','',item.title),node('span','',item.message));const date=new Date(item.date);if(Number.isFinite(+date))row.append(node('small','',date.toLocaleDateString('pt-BR')));row.onclick=()=>{read(item);dialog.close();session?.navigate(item.route);};list.append(row);}}
 async function refresh(){if(!session?.token||busy)return;const current=session,g=generation;busy=true;error='';render();controller=new AbortController();
 try{const response=await fetch(window.LUNGO_CONFIG.API_BASE_URL+'/api/notifications',{headers:{'x-access-token':current.token},cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});if(!response.ok)throw Error();const data=await response.json();if(!data.ok||!Array.isArray(data.items)||!data.scope)throw Error();if(session!==current||g!==generation)return;
 if(scope!==data.scope){scope=data.scope;try{const stored=JSON.parse(localStorage.getItem('lungo-notifications-read:'+scope)||'[]');seen=new Set(Array.isArray(stored)?stored:[]);}catch{seen=new Set();}}
 items=data.items;error=data.failed?.length?'Não foi possível consultar: '+data.failed.join(', ')+'.':'';badge();
 }catch{if(session!==current||g!==generation)return;error='Não foi possível atualizar os avisos. Tente novamente.';}
 finally{if(session===current&&g===generation){busy=false;render();}}}
 function reset(){generation++;controller?.abort();clearInterval(timer);session=null;items=[];scope='';seen=new Set();busy=false;error='';dialog?.close();dialog?.remove();dialog=null;badge();}
 function start(options){reset();session=options;refresh();timer=setInterval(()=>{if(!document.hidden)refresh();},60000);}
 function open(){if(!dialog){dialog=node('dialog','notification-dialog');dialog.setAttribute('aria-labelledby','notificationTitle');dialog.innerHTML='<header><h2 id="notificationTitle">Notificações</h2><button class="notification-close" type="button" aria-label="Fechar notificações">×</button></header><div class="notification-actions"><button class="notification-read-all" type="button">Marcar todas como lidas</button><button class="notification-refresh" type="button">Atualizar</button></div><p class="notification-status" role="status"></p><div class="notification-list"></div><small class="notification-device">Leituras salvas neste navegador.</small>';document.body.append(dialog);dialog.querySelector('.notification-close').onclick=()=>dialog.close();dialog.querySelector('.notification-refresh').onclick=refresh;dialog.querySelector('.notification-read-all').onclick=()=>{items.forEach(x=>seen.add(x.id));save();};dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};}
 if(!session)error='Entre na sua conta para consultar notificações.';render();dialog.showModal();refresh();}
 buttons().forEach(b=>b.addEventListener('click',open));window.addEventListener('focus',()=>refresh());
 window.LungoNotifications={start,reset,open};
})();
