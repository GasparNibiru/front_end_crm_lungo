(() => {
  'use strict';

  const API = String(window.LUNGO_CONFIG?.API_BASE_URL || '').replace(/\/+$/, '');
  const AUTH_SESSION_KEY = 'lungo-auth-session-v1';
  const BROKER_SESSION_KEY = 'lungo-suite-access-v5';
  const state = { companies: [], page: 1, limit: 25, total: 0, totalPages: 0, loading: false, initialized: false, loaded: false, accessToken: '', appliedFilters: null };

  const $ = (selector) => document.querySelector(selector);
  const elements = {};

  function sessionToken() {
    if (state.accessToken) return state.accessToken;
    for (const key of [AUTH_SESSION_KEY, BROKER_SESSION_KEY]) {
      try {
        const token = String(JSON.parse(localStorage.getItem(key) || '{}').token || '').trim();
        if (token) return token;
      } catch {}
    }
    return '';
  }

  function text(node, value) {
    if (node) node.textContent = value == null || value === '' ? '—' : String(value);
  }

  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) text(node, value);
    return node;
  }

  function formatDate(value) {
    if (!value) return '—';
    const [year, month, day] = String(value).slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : '—';
  }

  function formatMoney(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
  }

  function yesNo(value) {
    return value === true ? 'Sim' : 'Não';
  }

  function filterValue(id) {
    return String($(id)?.value || '').trim();
  }

  function currentFilters() {
    const params = new URLSearchParams();
    const filters = {
      q: filterValue('#biSearch'),
      state: filterValue('#biState'),
      city_name: filterValue('#biCity'),
      primary_cnae_code: filterValue('#biCnae'),
      opened_at_start: filterValue('#biOpenedStart'),
      opened_at_end: filterValue('#biOpenedEnd'),
      share_capital_min: filterValue('#biCapitalMin'),
      share_capital_max: filterValue('#biCapitalMax'),
      simples_opt_in: filterValue('#biSimples'),
      mei_opt_in: filterValue('#biMei'),
      has_phone: filterValue('#biHasPhone'),
      has_email: filterValue('#biHasEmail')
    };
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    return params;
  }

  function queryParameters(page = state.page, applyCurrentFilters = true) {
    if (applyCurrentFilters || !state.appliedFilters) state.appliedFilters = currentFilters();
    const params = new URLSearchParams(state.appliedFilters);
    params.set('page', String(page));
    params.set('limit', String(state.limit));
    return params;
  }

  function setLoading(loading) {
    state.loading = loading;
    elements.searchButton.disabled = loading;
    elements.clearButton.disabled = loading;
    elements.pageSize.disabled = loading;
    elements.searchButton.textContent = loading ? 'Buscando…' : 'Buscar empresas';
    if (loading) {
      elements.status.hidden = false;
      elements.status.className = 'bi-status loading';
      text(elements.status, 'Consultando empresas…');
    }
  }

  function openFilters() {
    if (!elements.filtersModal?.open) elements.filtersModal?.showModal();
    window.setTimeout(() => elements.search?.focus(), 0);
  }

  function closeFilters() {
    if (elements.filtersModal?.open) elements.filtersModal.close();
  }

  function contactIndicator(label, available) {
    const item = element('span', `bi-contact-indicator ${available ? 'available' : ''}`);
    item.append(element('i', '', available ? '✓' : '–'), document.createTextNode(`${label} ${available ? 'disponível' : 'indisponível'}`));
    return item;
  }

  function badge(label, active) {
    return element('span', `bi-badge ${active ? 'active' : ''}`, `${label}: ${yesNo(active)}`);
  }

  function renderRows() {
    elements.rows.replaceChildren();
    state.companies.forEach((company) => {
      const row = document.createElement('tr');

      const companyCell = element('td', 'bi-company-cell');
      companyCell.append(element('b', '', company.legal_name), element('span', '', company.trade_name || 'Sem nome fantasia'), element('small', '', company.cnpj));

      const segmentCell = element('td');
      segmentCell.append(element('span', 'bi-code', company.primary_cnae_code || '—'));

      const locationCell = element('td');
      locationCell.append(element('b', '', company.city_name || '—'), element('span', '', company.state || '—'));

      const statusCell = element('td', 'bi-badges');
      statusCell.append(badge('Simples', company.simples_opt_in), badge('MEI', company.mei_opt_in));

      const contactCell = element('td', 'bi-contact-list');
      contactCell.append(contactIndicator('Telefone', company.has_phone), contactIndicator('E-mail', company.has_email));

      const actionCell = document.createElement('td');
      const details = element('button', 'btn tiny bi-details-button', 'Ver detalhes');
      details.type = 'button';
      details.dataset.companyCnpj = company.cnpj;
      actionCell.append(details);

      row.append(companyCell, segmentCell, locationCell, element('td', '', formatDate(company.opened_at)), element('td', 'bi-money', formatMoney(company.share_capital)), statusCell, contactCell, actionCell);
      elements.rows.append(row);
    });
  }

  function paginationItems() {
    const current = state.page;
    const last = state.totalPages;
    if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);
    const pages = new Set([1, last, current - 1, current, current + 1].filter((page) => page > 0 && page <= last));
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((page, index) => {
      if (index && page - sorted[index - 1] > 1) result.push('…');
      result.push(page);
    });
    return result;
  }

  function pageButton(label, page, options = {}) {
    const button = element('button', `btn tiny ${options.active ? 'active' : ''}`, label);
    button.type = 'button';
    button.disabled = options.disabled || state.loading;
    button.dataset.biPage = String(page);
    if (options.active) button.setAttribute('aria-current', 'page');
    return button;
  }

  function renderPagination() {
    elements.pagination.replaceChildren();
    if (state.totalPages <= 1) {
      elements.pagination.hidden = true;
      return;
    }
    elements.pagination.hidden = false;
    elements.pagination.append(pageButton('Anterior', state.page - 1, { disabled: state.page === 1 }));
    paginationItems().forEach((item) => {
      if (item === '…') elements.pagination.append(element('span', 'bi-page-ellipsis', item));
      else elements.pagination.append(pageButton(String(item), item, { active: item === state.page }));
    });
    elements.pagination.append(pageButton('Próxima', state.page + 1, { disabled: state.page === state.totalPages }));
  }

  function renderResults() {
    text(elements.total, `${state.total.toLocaleString('pt-BR')} ${state.total === 1 ? 'empresa encontrada' : 'empresas encontradas'}`);
    if (!state.companies.length) {
      elements.tableWrap.hidden = true;
      elements.pagination.hidden = true;
      elements.status.hidden = false;
      elements.status.className = 'bi-status empty';
      text(elements.status, 'Nenhuma empresa foi encontrada com esses filtros.');
      return;
    }
    elements.status.hidden = true;
    elements.tableWrap.hidden = false;
    renderRows();
    renderPagination();
  }

  async function load(page = 1, applyCurrentFilters = true) {
    if (state.loading) return;
    const token = sessionToken();
    if (!token) {
      elements.status.hidden = false;
      elements.status.className = 'bi-status error';
      text(elements.status, 'Sua sessão não foi encontrada. Entre novamente no CRM.');
      return;
    }
    state.page = page;
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/business-intelligence/companies?${queryParameters(page, applyCurrentFilters)}`, { headers: { 'x-access-token': token } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) throw new Error(payload.error || `Erro HTTP ${response.status}`);
      state.companies = Array.isArray(payload.companies) ? payload.companies : [];
      state.total = Number(payload.pagination?.total || 0);
      state.page = Number(payload.pagination?.page || page);
      state.limit = Number(payload.pagination?.limit || state.limit);
      state.totalPages = Number(payload.pagination?.totalPages || 0);
      state.loaded = true;
      renderResults();
    } catch (error) {
      state.companies = [];
      elements.tableWrap.hidden = true;
      elements.pagination.hidden = true;
      elements.status.hidden = false;
      elements.status.className = 'bi-status error';
      text(elements.status, /token|acesso|sessão|401/i.test(error.message) ? 'Sua sessão expirou ou não possui acesso. Entre novamente no CRM.' : 'Não foi possível consultar as empresas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function detail(label, value) {
    const item = element('div', 'bi-detail-item');
    item.append(element('span', '', label), element('b', '', value));
    return item;
  }

  function openDrawer(cnpj) {
    const company = state.companies.find((item) => item.cnpj === cnpj);
    if (!company) return;
    text(elements.drawerTitle, company.legal_name);
    elements.drawerContent.replaceChildren(
      detail('Razão social', company.legal_name || '—'),
      detail('Nome fantasia', company.trade_name || 'Não informado'),
      detail('CNPJ', company.cnpj || '—'),
      detail('Cidade / UF', [company.city_name, company.state].filter(Boolean).join(' / ') || '—'),
      detail('CNAE principal', company.primary_cnae_code || '—'),
      detail('Data de abertura', formatDate(company.opened_at)),
      detail('Porte', company.company_size || '—'),
      detail('Capital social', formatMoney(company.share_capital)),
      detail('Estabelecimento', company.headquarters_or_branch || '—'),
      detail('Simples Nacional', yesNo(company.simples_opt_in)),
      detail('MEI', yesNo(company.mei_opt_in)),
      detail('Telefone disponível', yesNo(company.has_phone)),
      detail('E-mail disponível', yesNo(company.has_email))
    );
    elements.backdrop.hidden = false;
    elements.drawer.classList.add('open');
    elements.drawer.setAttribute('aria-hidden', 'false');
    elements.closeDrawer.focus();
  }

  function closeDrawer() {
    elements.drawer.classList.remove('open');
    elements.drawer.setAttribute('aria-hidden', 'true');
    elements.backdrop.hidden = true;
  }

  function clearFilters() {
    elements.filters.reset();
    state.limit = Number(elements.pageSize.value || 25);
    closeDrawer();
  }

  function initialize() {
    if (state.initialized) return;
    Object.assign(elements, {
      filters: $('#biFilters'), search: $('#biSearch'), searchButton: $('#biSearchButton'), clearButton: $('#biClearFilters'),
      filtersModal: $('#biFiltersModal'), openFilters: $('#biOpenFilters'), closeFilters: $('#biCloseFilters'),
      moreButton: $('#biMoreFilters'), advanced: $('#biAdvancedFilters'), total: $('#biResultsTotal'), status: $('#biStatus'),
      pageSize: $('#biPageSize'), tableWrap: $('#biTableWrap'), rows: $('#biRows'), pagination: $('#biPagination'),
      drawer: $('#biDrawer'), drawerTitle: $('#biDrawerTitle'), drawerContent: $('#biDrawerContent'), closeDrawer: $('#biDrawerClose'), backdrop: $('#biDrawerBackdrop')
    });
    if (!elements.filters) return;
    state.initialized = true;
    elements.filters.addEventListener('submit', (event) => { event.preventDefault(); closeFilters(); load(1); });
    elements.openFilters.addEventListener('click', openFilters);
    elements.closeFilters.addEventListener('click', closeFilters);
    elements.filtersModal.addEventListener('click', (event) => { if (event.target === elements.filtersModal) closeFilters(); });
    elements.moreButton.addEventListener('click', () => {
      const expanded = elements.moreButton.getAttribute('aria-expanded') === 'true';
      elements.moreButton.setAttribute('aria-expanded', String(!expanded));
      elements.moreButton.textContent = expanded ? 'Mais filtros' : 'Menos filtros';
      elements.advanced.hidden = expanded;
    });
    elements.clearButton.addEventListener('click', clearFilters);
    elements.pageSize.addEventListener('change', () => { state.limit = Number(elements.pageSize.value); load(1, false); });
    elements.pagination.addEventListener('click', (event) => {
      const button = event.target.closest('[data-bi-page]');
      if (button && !button.disabled) load(Number(button.dataset.biPage), false);
    });
    elements.rows.addEventListener('click', (event) => {
      const button = event.target.closest('[data-company-cnpj]');
      if (button) openDrawer(button.dataset.companyCnpj);
    });
    elements.closeDrawer.addEventListener('click', closeDrawer);
    elements.backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && elements.drawer.classList.contains('open')) closeDrawer(); });
  }

  function open(accessToken) {
    state.accessToken = String(accessToken || '').trim();
    initialize();
    if (!state.loaded) load(1);
  }

  window.LungoBusinessIntelligence = { open };
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
