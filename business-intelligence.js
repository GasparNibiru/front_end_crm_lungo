(() => {
  'use strict';
  const API = String(window.LUNGO_CONFIG?.API_BASE_URL || '').replace(/\/+$/, '');
  const $ = id => document.getElementById(id);
  const categories = ['Alimentício e Bebidas','Saúde e Serviços Médicos','Estética, Beleza e Bem-Estar','Construção Civil e Imobiliário','Jurídico e Contábil','Tecnologia, Software e Comunicação','Comércio Varejista','Indústria e Manufatura','Transporte e Logística','Educação e Treinamentos','Serviços Financeiros e Seguros','Serviços Operacionais e Manutenção','Serviços Empresariais e Administrativos','Turismo, Hotelaria e Eventos','Automotivo','Comércio Atacadista e Distribuição','Serviços para Animais e Pet Care','Agropecuária e Agronegócio','Outros'];
  const approach = 'Olá! Tudo bem?\n\nMeu nome é ___ e sou consultor(a) de benefícios da ___.\n\nEstamos entrando em contato com algumas empresas da sua região para apresentar soluções e benefícios disponíveis para CNPJ, que também podem atender o proprietário e os colaboradores da empresa.\n\nPosso te enviar algumas informações para você conhecer?';
  const state = { token: '', tab: 'search', page: 1, pages: 0, limit: 25, rows: [], selected: new Map(), cnaes: new Set(), filters: new URLSearchParams(), wallet: null, role: '', loading: false, buying: false, generation: 0, request: 0, controller: null, pending: null };
  let initialized = false;
  function node(tag, className = '', value) { const n = document.createElement(tag); n.className = className; if (value !== undefined) n.textContent = String(value ?? '—'); return n; }
  function date(value) { return value ? String(value).slice(0, 10).split('-').reverse().join('/') : '—'; }
  function cnpj(value) { const s = String(value || ''); return /^\d{14}$/.test(s) ? s.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : s; }
  function clean(value) { const s = String(value ?? ''); if (!/[ÃÂ]/.test(s)) return s; try { return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(s, c => c.charCodeAt(0))); } catch { return s; } }
  function notice(message = '') { $('prNotice').textContent = message; $('prNotice').hidden = !message; }
  async function api(path, body, signal) {
    if (!state.token) throw new Error('Entre novamente no CRM para acessar a Prospecção.');
    const response = await fetch(`${API}/api/prospecting/${path}`, { method: body ? 'POST' : 'GET', headers: { 'x-access-token': state.token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, cache: 'no-store', ...(body ? { body: JSON.stringify(body) } : {}), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok !== true) throw Object.assign(new Error(payload.error || (response.status === 404 ? 'A Prospecção ainda não está disponível neste ambiente. Tente novamente após a atualização.' : 'Não foi possível concluir. Tente novamente.')), { code: payload.code, status: response.status });
    return payload;
  }
  async function loadWallet() {
    const g = state.generation;
    try { const r = await api('wallet'); if (g !== state.generation) return; state.wallet = r.wallet; }
    catch { if (g !== state.generation) return; state.wallet = null; }
    $('prBalance').textContent = state.wallet ? `${state.wallet.total_balance} tokens disponíveis` : 'Saldo indisponível';
    $('prBalanceDetails').replaceChildren();
    if (state.wallet) { const w = state.wallet; for (const label of [`Gratuitos: ${w.free_balance}`, `Extras: ${w.extra_balance}`, `Renovação: ${date(w.next_renewal)}`, `Franquia: ${w.cycle_allowance} tokens · dia 5`]) $('prBalanceDetails').append(node('p', '', label)); }
    else { const b = node('button', '', 'Consultar saldo novamente'); b.onclick = loadWallet; $('prBalanceDetails').append(b); }
    renderSelection();
  }
  function renderSelection() {
    const n = state.selected.size, balance = state.wallet?.total_balance;
    $('prSelection').hidden = !n || state.tab !== 'search';
    $('prSelectedCount').textContent = `${n} ${n === 1 ? 'empresa selecionada' : 'empresas selecionadas'}`;
    $('prCost').textContent = `Custo: ${n} tokens · Saldo atual: ${balance ?? 'indisponível'} · Saldo após aquisição: ${balance === undefined ? '—' : balance - n}`;
    $('prChoose').disabled = state.buying || state.loading || balance === undefined || n > balance;
    $('prChoose').textContent = balance !== undefined && n > balance ? 'Saldo insuficiente' : 'Escolher empresas';
  }
  function detail(label, value, css = '') { const n = node('div', `pr-detail ${css}`); n.append(node('small', '', label), node('span', '', clean(value) || 'Não informado')); return n; }
  function renderCards() {
    $('prCards').replaceChildren();
    for (const c of state.rows) {
      const card = node('article', 'pr-card'), heading = node('div', 'pr-company');
      if (state.tab === 'search') {
        const box = node('input'); box.type = 'checkbox'; box.setAttribute('aria-label', `Selecionar ${clean(c.trade_name || c.legal_name)}`); box.disabled = c.is_acquired || !c.selectable || state.buying; box.checked = state.selected.has(c.company_id);
        box.onchange = () => { if (box.checked && state.selected.size >= 100) { box.checked = false; notice('Selecione no máximo 100 empresas por aquisição.'); return; } if (box.checked) state.selected.set(c.company_id, c); else state.selected.delete(c.company_id); state.pending = null; renderSelection(); }; heading.append(box);
      }
      const names = node('div'); names.append(node('h3', '', clean(c.trade_name) || 'Sem nome fantasia'), node('p', '', clean(c.legal_name)));
      if (c.is_acquired) { const badge = node('span', 'pr-acquired', 'Já adquirida'); badge.title = 'Esta empresa já está disponível em Minhas empresas.'; badge.tabIndex = 0; badge.setAttribute('aria-label', 'Já adquirida. Esta empresa já está disponível em Minhas empresas.'); names.append(badge); }
      else names.append(node('small', 'pr-lock', 'Contatos protegidos · 1 token'));
      heading.append(names);
      const contacts = node('div', 'pr-contacts'); contacts.append(detail('Celular', c.mobile_1, 'pr-phone'), detail('CNPJ', cnpj(c.cnpj))); if (c.mobile_2) contacts.append(detail('Segundo celular', c.mobile_2)); contacts.append(detail('E-mail', c.email));
      const meta = node('div', 'pr-meta'); meta.append(detail('Categoria', c.category), detail('CNAE', c.cnae), detail('Abertura / Porte', `${c.opened_year || '—'} · ${c.company_size || '—'}`), detail('Cidade / UF', `${c.city || '—'} / ${c.state || '—'}`)); card.append(heading, contacts, meta);
      if (state.tab === 'mine') {
        const footer = node('div', 'pr-card-footer'); footer.append(node('span', '', `Adquirida em ${date(c.acquired_at)}`)); const actions = node('div', 'pr-future-actions');
        const phone = String(c.mobile_1 || '').replace(/\D/g, '');
        if (/^\d{10,13}$/.test(phone)) { const a = node('a', 'pr-button', 'WhatsApp ↗'); a.href = `https://wa.me/${phone.length <= 11 ? '55' : ''}${phone}`; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', 'Abrir conversa no WhatsApp com o número adquirido'); actions.append(a); }
        for (const label of ['◷ Agendamento','✉ E-mail','☎ VOIP','✎ Atendimento','➤ Meus Leads', ...(state.role === 'supervisor' ? ['♙ Equipe'] : [])]) { const b = node('button', '', label); b.disabled = true; b.title = 'Em breve'; b.setAttribute('aria-label', `${label} — Em breve`); actions.append(b); }
        const suggestion = node('button', '', 'Sugestão de abordagem'); suggestion.onclick = () => { $('prApproachText').value = approach; $('prCopyStatus').textContent = ''; $('prApproach').showModal(); }; actions.append(suggestion); footer.append(actions); card.append(footer);
      }
      $('prCards').append(card);
    }
  }
  function renderPagination() {
    const n = $('prPagination'); n.replaceChildren(); n.hidden = state.pages <= 1;
    for (const [label, page, disabled] of [['Anterior', state.page - 1, state.page <= 1], ['Próxima', state.page + 1, state.page >= state.pages]]) { const b = node('button', '', label); b.disabled = disabled || state.buying; b.onclick = () => loadList(page); n.append(b); if (label === 'Anterior') n.append(node('span', '', `Página ${state.page} de ${state.pages}`)); }
  }
  async function loadList(page = 1) {
    state.controller?.abort(); state.controller = new AbortController(); const request = ++state.request, g = state.generation;
    state.loading = true; state.page = page; state.rows = []; $('prCards').replaceChildren(); $('prPagination').hidden = true; $('prStatus').hidden = false; $('prStatus').textContent = 'Consultando empresas…'; $('prStatus').className = 'pr-status loading'; $('prCards').setAttribute('aria-busy', 'true'); renderSelection();
    const q = state.tab === 'search' ? new URLSearchParams(state.filters) : new URLSearchParams(); q.set('page', page); q.set('limit', state.limit);
    try {
      const r = await api(`${state.tab === 'search' ? 'companies' : 'my-companies'}?${q}`, null, state.controller.signal); if (request !== state.request || g !== state.generation) return;
      state.rows = r.companies; state.pages = r.pagination.totalPages; state.role = r.role || state.role;
      $('prCount').textContent = `${r.pagination.total.toLocaleString('pt-BR')} empresas`; $('prStatus').hidden = state.rows.length > 0; $('prStatus').className = 'pr-status';
      $('prStatus').textContent = state.tab === 'mine' ? 'Você ainda não adquiriu empresas. Encontre oportunidades em Buscar empresas.' : 'Nenhuma empresa encontrada. Experimente outros filtros.';
      if (r.ownershipUnavailable) { state.selected.clear(); notice('Não foi possível verificar suas aquisições. Os contatos estão protegidos. Tente novamente.'); }
      renderCards(); renderPagination();
    } catch (e) {
      if (request !== state.request || g !== state.generation) return;
      $('prCount').textContent = ''; $('prStatus').hidden = false; $('prStatus').className = 'pr-status error'; $('prStatus').replaceChildren(node('p', '', e.name === 'TimeoutError' ? 'A consulta demorou mais que o esperado.' : e.message)); const b = node('button', '', 'Tentar novamente'); b.onclick = () => { loadWallet(); loadList(page); }; $('prStatus').append(b);
    } finally { if (request === state.request && g === state.generation) { state.loading = false; $('prCards').setAttribute('aria-busy', 'false'); renderSelection(); } }
  }
  function setTab(tab) { if (state.buying) return; state.tab = tab; $('prFilters').hidden = tab !== 'search'; notice(); for (const b of $('view-business-intelligence').querySelectorAll('[data-pr-tab]')) b.setAttribute('aria-pressed', String(b.dataset.prTab === tab)); $('prListTitle').textContent = tab === 'mine' ? 'Suas empresas, seus próximos contatos' : 'Encontre sua próxima oportunidade'; renderSelection(); loadList(); }
  function renderChips() { $('prCnaeChips').replaceChildren(); for (const c of state.cnaes) { const b = node('button', '', `${c} ×`); b.type = 'button'; b.setAttribute('aria-label', `Remover CNAE ${c}`); b.onclick = () => { state.cnaes.delete(c); renderChips(); }; $('prCnaeChips').append(b); } }
  function addCnae() { const input = $('prCnaeInput'), v = input.value.trim(); if (!v) return true; if (!/^\d{7}$/.test(v) || state.cnaes.size >= 100) { input.setCustomValidity('Informe um CNAE com 7 dígitos (máximo 100 códigos).'); input.reportValidity(); return false; } input.setCustomValidity(''); state.cnaes.add(v); input.value = ''; renderChips(); return true; }
  function readFilters() { const q = new URLSearchParams(new FormData($('prFilters'))); for (const [k, v] of [...q]) if (!v) q.delete(k); for (const c of state.cnaes) q.append('cnae', c); state.filters = q; state.selected.clear(); state.pending = null; notice(); }
  async function acquire() {
    if (state.buying || !state.selected.size) return; const g = state.generation;
    state.pending ||= { company_ids: [...state.selected.keys()], idempotency_key: crypto.randomUUID() }; state.buying = true; $('prConfirmBuy').disabled = true; $('prCancel').disabled = true; $('prConfirmBuy').textContent = 'Adquirindo…'; $('prConfirmError').textContent = '';
    try { const r = await api('acquisitions', state.pending); if (g !== state.generation) return; state.pending = null; state.selected.clear(); $('prConfirm').close(); notice(`${r.charged} ${r.charged === 1 ? 'empresa adquirida' : 'empresas adquiridas'}. Seus contatos estão disponíveis em Minhas empresas.`); await Promise.all([loadWallet(), loadList(state.page)]); }
    catch (e) { if (g !== state.generation) return; $('prConfirmError').textContent = e.status ? e.message : 'Não foi possível confirmar o resultado. Tente novamente: a mesma solicitação será reutilizada para evitar cobrança duplicada.'; if (e.code === 'insufficient_tokens') loadWallet(); }
    finally { if (g === state.generation) { state.buying = false; $('prConfirmBuy').disabled = false; $('prCancel').disabled = false; $('prConfirmBuy').textContent = 'Confirmar aquisição'; renderCards(); renderPagination(); renderSelection(); } }
  }
  function reset() { state.generation++; state.request++; state.controller?.abort(); state.token = ''; state.wallet = null; state.rows = []; state.selected.clear(); state.pending = null; state.buying = false; state.loading = false; state.role = ''; if (!initialized) return; $('prCards').replaceChildren(); $('prCount').textContent = ''; $('prPagination').hidden = true; $('prSelection').hidden = true; $('prBalance').textContent = 'Consultando saldo…'; $('prBalanceDetails').replaceChildren(); notice(); for (const id of ['prConfirm','prApproach']) if ($(id).open) $(id).close(); $('prApproachText').value = ''; $('prConfirmBuy').disabled = false; $('prCancel').disabled = false; $('prConfirmBuy').textContent = 'Confirmar aquisição'; }
  function initialize() {
    if (initialized || !$('view-business-intelligence')) return; initialized = true;
    $('prRequestTokens').href = 'https://wa.me/5555992102864?text=' + encodeURIComponent('Olá! Gostaria de solicitar mais tokens para Prospecção de Empresas no Lungo CRM.');
    for (const uf of 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')) $('prState').append(new Option(uf, uf)); for (let y = new Date().getFullYear(); y >= 1900; y--) $('prYear').append(new Option(y, y));
    for (const c of categories) { const label = node('label'), input = node('input'); input.type = 'checkbox'; input.name = 'category'; input.value = c; label.append(input, node('span', '', c)); $('prCategories').append(label); }
    $('prCategories').onchange = () => { const n = $('prCategories').querySelectorAll(':checked').length; $('prCategoriesSummary').textContent = n ? `Categoria · ${n} selecionadas` : 'Categoria · Todas'; };
    $('prAddCnae').onclick = addCnae; $('prCnaeInput').oninput = () => $('prCnaeInput').setCustomValidity(''); $('prCnaeInput').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addCnae(); } };
    $('prFilters').onsubmit = e => { e.preventDefault(); if (state.buying || !addCnae()) return; readFilters(); loadList(); };
    $('prClear').onclick = () => { if (state.buying) return; $('prFilters').reset(); state.cnaes.clear(); $('prCnaeInput').setCustomValidity(''); $('prCategoriesSummary').textContent = 'Categoria · Todas'; renderChips(); readFilters(); loadList(); };
    $('prLimit').onchange = () => { if (!state.buying) { state.limit = +$('prLimit').value; loadList(); } };
    for (const b of $('view-business-intelligence').querySelectorAll('[data-pr-tab]')) b.onclick = () => setTab(b.dataset.prTab);
    $('prClearSelection').onclick = () => { if (state.buying) return; state.selected.clear(); state.pending = null; renderCards(); renderSelection(); };
    $('prChoose').onclick = () => { if ($('prChoose').disabled || !state.selected.size) return; $('prConfirmText').textContent = `Você selecionou ${state.selected.size} empresas. Custo máximo: ${state.selected.size} tokens. Saldo após aquisição: ${state.wallet.total_balance - state.selected.size}. Empresas já adquiridas não serão cobradas novamente.`; $('prConfirmError').textContent = ''; $('prConfirm').showModal(); };
    $('prCancel').onclick = () => $('prConfirm').close(); $('prConfirmBuy').onclick = acquire; $('prConfirm').oncancel = e => { if (state.buying) e.preventDefault(); };
    $('prCloseApproach').onclick = () => { $('prApproach').close(); $('prApproachText').value = ''; };
    $('prCopy').onclick = async () => { try { await navigator.clipboard.writeText($('prApproachText').value); $('prCopyStatus').textContent = 'Mensagem copiada.'; } catch { $('prApproachText').select(); $('prCopyStatus').textContent = 'Selecione e copie o texto manualmente.'; } };
  }
  function open(token) { initialize(); if (!initialized) return; const changed = state.token !== String(token || '').trim(); if (changed) { reset(); state.token = String(token || '').trim(); $('prFilters').reset(); state.cnaes.clear(); state.filters = new URLSearchParams(); renderChips(); $('prCategoriesSummary').textContent = 'Categoria · Todas'; setTab('search'); } else loadList(state.page); loadWallet(); }
  window.LungoBusinessIntelligence = { open, reset };
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
