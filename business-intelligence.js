(() => {
  'use strict';
  const API = String(window.LUNGO_CONFIG?.API_BASE_URL || '').replace(/\/+$/, '');
  const $ = id => document.getElementById(id);
  const categories = ['Alimentício e Bebidas','Saúde e Serviços Médicos','Estética, Beleza e Bem-Estar','Construção Civil e Imobiliário','Jurídico e Contábil','Tecnologia, Software e Comunicação','Comércio Varejista','Indústria e Manufatura','Transporte e Logística','Educação e Treinamentos','Serviços Financeiros e Seguros','Serviços Operacionais e Manutenção','Serviços Empresariais e Administrativos','Turismo, Hotelaria e Eventos','Automotivo','Comércio Atacadista e Distribuição','Serviços para Animais e Pet Care','Agropecuária e Agronegócio','Outros'];
  const capitals = [['Rio Branco','AC'],['Maceió','AL'],['Macapá','AP'],['Manaus','AM'],['Salvador','BA'],['Fortaleza','CE'],['Brasília','DF'],['Vitória','ES'],['Goiânia','GO'],['São Luís','MA'],['Cuiabá','MT'],['Campo Grande','MS'],['Belo Horizonte','MG'],['Belém','PA'],['João Pessoa','PB'],['Curitiba','PR'],['Recife','PE'],['Teresina','PI'],['Rio de Janeiro','RJ'],['Natal','RN'],['Porto Alegre','RS'],['Porto Velho','RO'],['Boa Vista','RR'],['Florianópolis','SC'],['São Paulo','SP'],['Aracaju','SE'],['Palmas','TO']];
  const approach = 'Olá! Tudo bem?\n\nMeu nome é ___ e sou consultor(a) de benefícios da ___.\n\nEstamos entrando em contato com algumas empresas da sua região para apresentar soluções e benefícios disponíveis para CNPJ, que também podem atender o proprietário e os colaboradores da empresa.\n\nPosso te enviar algumas informações para você conhecer?';
  const state = { token: '', tab: 'search', page: 1, pages: 0, limit: 25, rows: [], selected: new Map(), cnaes: new Set(), filters: new URLSearchParams(), wallet: null, role: '', loading: false, buying: false, generation: 0, request: 0, controller: null, pending: null };
  let initialized = false;
  function node(tag, className = '', value) { const n = document.createElement(tag); n.className = className; if (value !== undefined) n.textContent = String(value ?? '—'); return n; }
  function syncPicker(id) {
    const select = $(id), details = $(`${id}Picker`), summary = $(`${id}Summary`);
    summary.textContent = select.selectedOptions[0]?.textContent || select.options[0].textContent;
    for (const button of details.querySelectorAll('.pr-picker-choice')) button.setAttribute('aria-current', String(button.dataset.value === select.value));
  }
  function closePickers() { for (const id of ['prStatePicker','prCityPicker']) $(id).open = false; }
  function bindPicker(id) {
    const select = $(id), details = $(`${id}Picker`), choices = $(`${id}Choices`);
    for (const option of select.options) {
      const button = node('button', 'pr-picker-choice', option.textContent); button.type = 'button'; button.dataset.value = option.value;
      button.onclick = () => { select.value = option.value; select.dispatchEvent(new Event('change', { bubbles: true })); details.open = false; };
      choices.append(button);
    }
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      for (const other of ['prStatePicker','prCityPicker']) if (other !== details.id) $(other).open = false;
      requestAnimationFrame(() => { const bottom = choices.getBoundingClientRect().bottom, view = $('view-business-intelligence'); if (bottom > view.getBoundingClientRect().bottom - 8) view.scrollBy({ top: bottom - view.getBoundingClientRect().bottom + 16, behavior: 'smooth' }); });
    });
    syncPicker(id);
  }
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
  function openLeads() { document.querySelector(state.role === 'supervisor' ? '[data-supervisor-operation="crm"]' : '[data-view="crm"]')?.click(); }
  function dialog(title) {
    const modal = node('dialog', 'pr-dialog pr-action-dialog');
    const form = node('form', 'pr-action-form'); form.method = 'dialog';
    const header = node('header', 'pr-action-header'); header.append(node('h2', '', title)); form.append(header); modal.append(form); $('view-business-intelligence').append(modal);
    modal.addEventListener('close', () => modal.remove(), { once: true });
    modal.showModal(); return { modal, form };
  }
  function field(form, label, element) { const wrapper = node('label', 'pr-action-field'); wrapper.append(node('span', '', label), element); form.append(wrapper); return element; }
  function actions(form, modal, submitLabel, onSubmit) {
    const footer = node('footer', 'pr-action-footer'); const cancel = node('button', '', 'Cancelar'); cancel.type = 'button'; cancel.onclick = () => modal.close();
    const submit = node('button', 'pr-primary', submitLabel); submit.type = 'button'; submit.onclick = onSubmit;
    footer.append(cancel, submit); form.append(footer); return submit;
  }
  async function ensureLead(company) {
    let result = await api('exports', { company_id: company.id });
    const exportId = result.export_id;
    for (let attempt = 0; attempt < 12 && ['pending','processing'].includes(result.status); attempt++) { await new Promise(resolve => setTimeout(resolve, 1500)); result = await api(`exports/${encodeURIComponent(exportId)}`); }
    if (result.status !== 'exported' || !result.lead_id) throw new Error('A empresa ainda não está disponível em Meus Leads. Tente novamente em instantes.');
    return result.lead_id;
  }
  async function scheduledAvailable() {
    const response = await fetch(`${API}/api/scheduled/health`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    const health = await response.json().catch(() => ({}));
    if (!response.ok || health.ok !== true || health.disabled !== false) throw new Error('O envio programado está indisponível neste ambiente.');
  }
  function agenda(company) {
    const { modal, form } = dialog(`Programar mensagem · ${clean(company.trade_name || company.legal_name)}`);
    const grid = node('div', 'pr-action-grid'); form.append(grid);
    const day = field(grid, 'Data de retorno', node('input')); day.type = 'date'; day.min = new Date().toISOString().slice(0, 10);
    const hour = field(grid, 'Hora', node('input')); hour.type = 'time'; hour.value = '09:00';
    const messageText = field(form, 'Mensagem WhatsApp', node('textarea')); messageText.rows = 5; messageText.maxLength = 4000; messageText.value = `Olá! Gostaria de retomar nosso contato com ${clean(company.trade_name || company.legal_name)}.`;
    const message = node('p', 'pr-action-status'); form.append(message); let pending, ready = false;
    const submit = actions(form, modal, 'Salvar programação', async () => {
      if (!day.value || !hour.value || !messageText.value.trim()) { message.textContent = 'Informe data, hora e mensagem.'; return; }
      if (new Date(`${day.value}T${hour.value}:00`) <= new Date()) { message.textContent = 'Escolha uma data e hora futuras.'; return; }
      const input = { data: day.value, hora: hour.value, mensagem: messageText.value.trim() };
      if (!pending || JSON.stringify(pending.input) !== JSON.stringify(input)) pending = { input };
      submit.disabled = true; message.textContent = 'Preparando lead e salvando programação…';
      try {
        await scheduledAvailable(); ready = true;
        const leadId = await ensureLead(company);
        const response = await fetch(`${API}/api/scheduled/leads/${encodeURIComponent(leadId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: state.token, ...pending.input, recorrencia: 'unica', tipo: 'retorno' }), cache: 'no-store', signal: AbortSignal.timeout(30000) });
        const result = await response.json().catch(() => ({})); if (!response.ok || result.ok !== true) throw new Error(result.error || 'Não foi possível programar a mensagem.');
        modal.close(); notice('Mensagem WhatsApp programada. Você pode acompanhá-la em Meus Leads.');
      } catch (error) { message.textContent = error.message; if (error.message.includes('envio programado')) ready = false; }
      finally { submit.disabled = !ready; }
    });
    submit.disabled = true; message.textContent = 'Conferindo disponibilidade do envio…';
    scheduledAvailable().then(() => { if (modal.open) { ready = true; submit.disabled = false; message.textContent = ''; } }).catch(error => { if (modal.open) message.textContent = error.message; });
  }
  async function assignTeam(company) {
    const { modal, form } = dialog(`Distribuir · ${clean(company.trade_name || company.legal_name)}`);
    const broker = field(form, 'Corretor', node('select')); broker.append(new Option('Carregando equipe…', ''));
    const message = node('p', 'pr-action-status'); form.append(message); let pending;
    const submit = actions(form, modal, 'Distribuir empresa', async () => {
      if (!broker.value) return; if (!pending || pending.broker_id !== broker.value) pending = { broker_id: broker.value, key: crypto.randomUUID() };
      submit.disabled = true; message.textContent = 'Distribuindo…';
      try { await api('assignments', { company_id: company.id, broker_id: pending.broker_id, idempotency_key: pending.key }); modal.close(); notice('Empresa distribuída. O corretor já pode vê-la em Minhas empresas.'); }
      catch (error) { message.textContent = error.message; }
      finally { submit.disabled = false; }
    });
    submit.disabled = true;
    try { const result = await api('team'); broker.replaceChildren(new Option('Selecione um corretor', '')); for (const user of result.brokers) broker.append(new Option(clean(user.name), user.id)); message.textContent = result.brokers.length ? 'A distribuição não consome tokens.' : 'Nenhum corretor ativo na equipe.'; submit.disabled = !result.brokers.length; }
    catch (error) { message.textContent = error.message; }
  }
  async function exportToLeads(company, button) {
    const generation = state.generation;
    button.disabled = true; button.textContent = 'Enviando para Meus Leads…'; notice();
    try {
      let result = await api('exports', { company_id: company.id });
      const exportId = result.export_id;
      for (let attempt = 0; attempt < 12 && ['pending','processing'].includes(result.status); attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (generation !== state.generation) return;
        result = await api(`exports/${encodeURIComponent(exportId)}`);
      }
      if (generation !== state.generation) return;
      if (result.status === 'exported') { button.textContent = 'Abrir Meus Leads'; button.onclick = openLeads; button.disabled = false; notice('Empresa enviada para Meus Leads.'); }
      else if (result.status === 'failed' || result.status === 'unknown') { button.textContent = 'Exportação requer revisão'; notice('A exportação não foi confirmada. Solicite revisão antes de tentar novamente.'); }
      else { button.textContent = 'Exportação em andamento'; button.disabled = false; button.onclick = () => exportToLeads(company, button); notice('A exportação foi solicitada. Consulte novamente em instantes.'); }
    } catch (error) { if (generation === state.generation) { button.disabled = false; button.textContent = 'Enviar para Meus Leads'; notice(error.message || 'Não foi possível solicitar a exportação.'); } }
  }
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
        const exportButton = node('button', '', 'Enviar para Meus Leads'); exportButton.onclick = () => exportToLeads(c, exportButton); actions.append(exportButton);
        const schedule = node('button', '', '◷ Agendamento'); schedule.onclick = () => agenda(c); actions.append(schedule);
        const email = String(c.email || '').trim();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { const link = node('a', 'pr-button', '✉ E-mail'); link.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Contato comercial · ${clean(c.trade_name || c.legal_name)}`)}`; link.title = 'Abrir aplicativo de e-mail padrão'; actions.append(link); }
        else { const b = node('button', '', '✉ E-mail'); b.disabled = true; b.title = 'E-mail não informado'; actions.append(b); }
        if (state.role === 'supervisor') { const team = node('button', '', '♙ Equipe'); team.onclick = () => assignTeam(c); actions.append(team); }
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
  function setTab(tab) { if (state.buying) return; closePickers(); state.tab = tab; $('prFilters').hidden = tab !== 'search'; notice(); for (const b of $('view-business-intelligence').querySelectorAll('[data-pr-tab]')) b.setAttribute('aria-pressed', String(b.dataset.prTab === tab)); $('prListTitle').textContent = tab === 'mine' ? 'Suas empresas, seus próximos contatos' : 'Encontre sua próxima oportunidade'; renderSelection(); loadList(); }
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
    for (const uf of capitals.map(([, state]) => state).sort()) $('prState').append(new Option(uf, uf));
    for (const [city, uf] of [...capitals].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))) { const option = new Option(`${city} / ${uf}`, city); option.dataset.state = uf; $('prCity').append(option); }
    for (let y = new Date().getFullYear(), min = y - 2; y >= min; y--) $('prYear').append(new Option(y, y));
    bindPicker('prState'); bindPicker('prCity');
    $('prCity').onchange = () => { const selected = $('prCity').selectedOptions[0]; if (selected?.dataset.state) $('prState').value = selected.dataset.state; syncPicker('prState'); syncPicker('prCity'); };
    $('prState').onchange = () => { if ($('prCity').selectedOptions[0]?.dataset.state !== $('prState').value) $('prCity').value = ''; syncPicker('prState'); syncPicker('prCity'); };
    document.addEventListener('click', event => { for (const id of ['prStatePicker','prCityPicker']) if ($(id).open && !$(id).contains(event.target)) $(id).open = false; });
    for (const c of categories) { const label = node('label'), input = node('input'); input.type = 'checkbox'; input.name = 'category'; input.value = c; label.append(input, node('span', '', c)); $('prCategories').append(label); }
    $('prCategories').onchange = () => { const n = $('prCategories').querySelectorAll(':checked').length; $('prCategoriesSummary').textContent = n ? `Categoria · ${n} selecionadas` : 'Categoria · Todas'; };
    $('prAddCnae').onclick = addCnae; $('prCnaeInput').oninput = () => $('prCnaeInput').setCustomValidity(''); $('prCnaeInput').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addCnae(); } };
    $('prFilters').onsubmit = e => { e.preventDefault(); if (state.buying || !addCnae()) return; readFilters(); loadList(); };
    $('prClear').onclick = () => { if (state.buying) return; closePickers(); $('prFilters').reset(); syncPicker('prState'); syncPicker('prCity'); state.cnaes.clear(); $('prCnaeInput').setCustomValidity(''); $('prCategoriesSummary').textContent = 'Categoria · Todas'; renderChips(); readFilters(); loadList(); };
    $('prLimit').onchange = () => { if (!state.buying) { state.limit = +$('prLimit').value; loadList(); } };
    for (const b of $('view-business-intelligence').querySelectorAll('[data-pr-tab]')) b.onclick = () => setTab(b.dataset.prTab);
    $('prClearSelection').onclick = () => { if (state.buying) return; state.selected.clear(); state.pending = null; renderCards(); renderSelection(); };
    $('prChoose').onclick = () => { if ($('prChoose').disabled || !state.selected.size) return; $('prConfirmText').textContent = `Você selecionou ${state.selected.size} empresas. Custo máximo: ${state.selected.size} tokens. Saldo após aquisição: ${state.wallet.total_balance - state.selected.size}. Empresas já adquiridas não serão cobradas novamente.`; $('prConfirmError').textContent = ''; $('prConfirm').showModal(); };
    $('prCancel').onclick = () => $('prConfirm').close(); $('prConfirmBuy').onclick = acquire; $('prConfirm').oncancel = e => { if (state.buying) e.preventDefault(); };
    $('prCloseApproach').onclick = () => { $('prApproach').close(); $('prApproachText').value = ''; };
    $('prCopy').onclick = async () => { try { await navigator.clipboard.writeText($('prApproachText').value); $('prCopyStatus').textContent = 'Mensagem copiada.'; } catch { $('prApproachText').select(); $('prCopyStatus').textContent = 'Selecione e copie o texto manualmente.'; } };
  }
  function open(token) { initialize(); if (!initialized) return; const changed = state.token !== String(token || '').trim(); if (changed) { reset(); state.token = String(token || '').trim(); $('prFilters').reset(); syncPicker('prState'); syncPicker('prCity'); state.cnaes.clear(); state.filters = new URLSearchParams(); renderChips(); $('prCategoriesSummary').textContent = 'Categoria · Todas'; setTab('search'); } else loadList(state.page); loadWallet(); }
  window.LungoBusinessIntelligence = { open, reset };
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
