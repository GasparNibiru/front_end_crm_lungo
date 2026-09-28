(() => {
  'use strict';
  const base = String(window.LUNGO_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number(value || 0).toLocaleString('pt-BR');
  let key = '', generation = 0, selection = 0, listing = 0, selected = null, busy = false, page = 1, search = '', detailPage = 1;
  const pendingKey = id => 'lungo-prospecting-admin-pending:' + id;
  function pending(id) { try { return JSON.parse(sessionStorage.getItem(pendingKey(id)) || 'null'); } catch { return null; } }
  async function request(path, body) {
    const response = await fetch(base + '/api/admin/prospecting/' + path, { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { 'x-admin-key': key, ...(body ? {'Content-Type':'application/json'} : {}) }, ...(body ? {body:JSON.stringify(body)} : {}), signal:AbortSignal.timeout(30000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || (response.status === 404 ? 'Recurso ainda indisponível. Atualize o backend para habilitar os créditos de Prospecção.' : 'Não foi possível concluir. Tente novamente.'));
    return data;
  }
  function balance(w) { return w ? `Franquia mensal registrada: ${number(w.free_balance)} · Extras: ${number(w.extra_balance)} · Total registrado: ${number(Number(w.free_balance) + Number(w.extra_balance))}` : 'Carteira ainda não iniciada · Extras: 0'; }
  function status(message) { if ($('paStatus')) $('paStatus').textContent = message; }
  async function loadList() {
    const g = generation, l = ++listing;
    status('Consultando usuários…'); $('paUsers').replaceChildren();
    try {
      const data = await request(`users?page=${page}&search=${encodeURIComponent(search)}`);
      if (g !== generation || l !== listing) return;
      $('paUsers').innerHTML = data.users.map(u => `<article class="pa-user"><div><b>${esc(u.name)}</b><small>${esc(u.email)} · ${u.role === 'supervisor' ? 'Supervisor' : 'Corretor'}</small><small>${esc(u.organizations?.name || 'Sem corretora')} · ${esc(u.status)}</small><p>${esc(balance(u.wallet))}</p></div><button type="button" class="btn" data-pa-user="${esc(u.id)}">Saldo e recarga</button></article>`).join('') || '<p>Nenhum usuário encontrado.</p>';
      $('paPages').textContent = `Página ${data.page} de ${Math.max(1,data.pages)} · ${data.total} usuários`;
      $('paPrev').disabled = page <= 1; $('paNext').disabled = page >= data.pages;
      status('Selecione um usuário para adicionar créditos extras ou consultar as recargas.');
    } catch (e) { if (g === generation && l === listing) status(e.message); }
  }
  async function selectUser(id, historyPage = 1) {
    if (busy) return;
    const g = generation, s = ++selection;
    selected = null; detailPage = historyPage; $('paDetail').textContent = 'Consultando saldo e histórico…';
    try {
      const data = await request(`users/${encodeURIComponent(id)}?page=${historyPage}`);
      if (g !== generation || s !== selection) return;
      selected = data.user;
      const attempt = pending(id), active = selected.status === 'active' && selected.organizations?.status === 'active';
      $('paDetail').innerHTML = `<h3>${esc(selected.name)}</h3><p>${esc(selected.email)} · ${esc(selected.organizations?.name || '')}</p><p>${esc(balance(data.wallet))}</p><small>Saldo registrado no último movimento. A franquia gratuita é atualizada quando o usuário acessa a Prospecção; esta consulta não renova créditos.</small><form id="paCreditForm"><label>Créditos extras<input id="paAmount" type="number" min="1" max="1000000" step="1" required value="${attempt?.amount || ''}" ${attempt ? 'readonly' : ''}></label><label>Motivo / referência<textarea id="paReason" minlength="3" maxlength="500" required ${attempt ? 'readonly' : ''}>${esc(attempt?.reason || '')}</textarea></label><button class="btn primary" type="submit" ${!active ? 'disabled' : ''}>${attempt ? 'Reenviar mesma recarga' : 'Adicionar créditos'}</button><p id="paCreditStatus" role="status">${!active ? 'Usuário e corretora precisam estar ativos.' : attempt ? 'Recarga pendente de confirmação. Reenvie os mesmos dados para conferir sem duplicar créditos.' : 'Créditos extras de Prospecção, sem vencimento. Permanecem disponíveis até o consumo completo.'}</p></form><h3>Histórico de recargas</h3><div class="pa-history">${data.movements.map(m => `<article><b>+${number(m.delta)} créditos</b><span>${esc(new Date(m.created_at).toLocaleString('pt-BR'))}</span><p>${esc(m.reason)}</p><small>Extras após a recarga: ${number(m.balance_after)} · Operação: ${esc(m.operation_id)}</small></article>`).join('') || '<p>Nenhuma recarga registrada.</p>'}</div><div class="pa-pager"><button class="btn" id="paHistoryPrev" ${historyPage <= 1 ? 'disabled' : ''}>Anterior</button><span>${historyPage} / ${Math.max(1,data.pages)}</span><button class="btn" id="paHistoryNext" ${historyPage >= data.pages ? 'disabled' : ''}>Próxima</button></div>`;
      $('paCreditForm').onsubmit = credit;
      $('paHistoryPrev').onclick = () => selectUser(id, detailPage - 1);
      $('paHistoryNext').onclick = () => selectUser(id, detailPage + 1);
    } catch (e) { if (g === generation && s === selection) $('paDetail').textContent = e.message; }
  }
  async function credit(event) {
    event.preventDefault(); if (busy || !selected) return;
    const user = selected, g = generation;
    let attempt = pending(user.id);
    if (!attempt) {
      const amount = Number($('paAmount').value), reason = $('paReason').value.trim();
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000 || reason.length < 3) return;
      if (!confirm(`Adicionar ${number(amount)} créditos de Prospecção para ${user.name} (${user.email})?`)) return;
      attempt = { amount, reason, requestId:crypto.randomUUID() };
      try { sessionStorage.setItem(pendingKey(user.id), JSON.stringify(attempt)); } catch { $('paCreditStatus').textContent = 'Habilite o armazenamento da sessão para registrar a recarga com segurança.'; return; }
    }
    busy = true;
    $('paAmount').readOnly = true; $('paReason').readOnly = true;
    const submit = $('paCreditForm').querySelector('button'); submit.disabled = true;
    $('paCreditStatus').textContent = 'Confirmando recarga…';
    try {
      await request(`users/${encodeURIComponent(user.id)}/credits`, attempt);
      sessionStorage.removeItem(pendingKey(user.id));
      if (g !== generation) return;
      busy = false;
      await selectUser(user.id); await loadList();
      if (g === generation) status(`Recarga de ${number(attempt.amount)} créditos confirmada para ${user.name}.`);
    } catch (e) {
      if (g !== generation) return;
      $('paCreditStatus').textContent = `${e.message} Reenvie esta mesma recarga para confirmar sem duplicação.`;
      submit.textContent = 'Reenviar mesma recarga';
    } finally { if (g === generation) { busy = false; submit.disabled = false; } }
  }
  function reset() { generation++; key = ''; selected = null; busy = false; $('admin-master-view-prospecting-credits')?.replaceChildren(); }
  function open(adminKey) {
    if (key === adminKey && $('paUsers')) return;
    reset(); key = adminKey; page = 1; search = '';
    const host = $('admin-master-view-prospecting-credits');
    host.innerHTML = `<section class="admin-master-panel pa-panel"><header><div><h2>Créditos de Prospecção</h2><p>Franquia mensal: supervisor 100 créditos e corretor 20. Créditos extras não vencem e são usados após a franquia mensal.</p></div></header><form id="paSearchForm" class="pa-search"><input id="paSearch" type="search" maxlength="100" placeholder="Nome ou e-mail do usuário" aria-label="Buscar usuário"><button class="btn" type="submit">Buscar</button><button class="btn" type="button" id="paRefresh">Atualizar</button></form><p id="paStatus" role="status"></p><div class="pa-layout"><div><div id="paUsers"></div><div class="pa-pager"><button class="btn" id="paPrev">Anterior</button><span id="paPages"></span><button class="btn" id="paNext">Próxima</button></div></div><section id="paDetail" class="pa-detail" aria-label="Saldo e recarga">Selecione um usuário.</section></div></section>`;
    $('paSearchForm').onsubmit = e => { e.preventDefault(); page = 1; search = $('paSearch').value.trim(); loadList(); };
    $('paRefresh').onclick = () => { loadList(); if (selected) selectUser(selected.id); };
    $('paPrev').onclick = () => { page--; loadList(); }; $('paNext').onclick = () => { page++; loadList(); };
    $('paUsers').onclick = e => { const button = e.target.closest('[data-pa-user]'); if (button) selectUser(button.dataset.paUser); };
    loadList();
  }
  window.LungoProspectingAdmin = { open, reset };
})();
