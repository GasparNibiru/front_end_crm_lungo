(() => {
  'use strict';

  const API = String(window.LUNGO_CONFIG?.API_BASE_URL || '').replace(/\/+$/, '');
  const V1_PATH = '/api/business-intelligence/companies';
  const V2_PATH = '/api/business-intelligence/companies-v2';
  const configuredPath = String(window.LUNGO_CONFIG?.BUSINESS_INTELLIGENCE_API_PATH || V2_PATH);
  const COMPANIES_PATH = configuredPath === V1_PATH ? V1_PATH : V2_PATH;
  const USING_V2 = COMPANIES_PATH === V2_PATH;
  const AUTH_SESSION_KEY = 'lungo-auth-session-v1';
  const BROKER_SESSION_KEY = 'lungo-suite-access-v5';
  const state = { companies: [], page: 1, limit: 25, total: 0, totalPages: 0, loading: false, initialized: false, loaded: false, accessToken: '', appliedFilters: null };

  const $ = (selector) => document.querySelector(selector);
  const elements = {};
  const SEGMENTS = [
    { label: 'Restaurantes e alimentação', prefixes: ['561'] },
    { label: 'Comércio', prefixes: ['45', '46', '47'] },
    { label: 'Tecnologia', prefixes: ['62', '63'] },
    { label: 'Clínicas e saúde', prefixes: ['86'] },
    { label: 'Advocacia', prefixes: ['6911'] },
    { label: 'Construção', prefixes: ['41', '42', '43'] },
    { label: 'Transporte e logística', prefixes: ['49', '50', '51', '52', '53'] },
    { label: 'Educação', prefixes: ['85'] },
    { label: 'Serviços financeiros', prefixes: ['64', '65', '66'] },
    { label: 'Imobiliário', prefixes: ['68'] },
    { label: 'Indústria', prefixes: Array.from({ length: 24 }, (_, index) => String(index + 10)) }
  ];

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

  function digits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatCnpj(value) {
    const original = String(value ?? '').trim();
    const number = digits(original);
    if (number.length !== 14) return original || 'CNPJ não informado';
    return `${number.slice(0, 2)}.${number.slice(2, 5)}.${number.slice(5, 8)}/${number.slice(8, 12)}-${number.slice(12)}`;
  }

  function repairText(value) {
    const original = String(value ?? '').trim();
    if (!/[ÃÂ]/.test(original)) return original;
    try {
      const bytes = Uint8Array.from([...original].map((character) => character.charCodeAt(0)));
      const repaired = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return repaired || original;
    } catch {
      return original;
    }
  }

  function displayCity(value) {
    const original = String(value ?? '').trim();
    const city = repairText(original);
    return /^s.{0,3}o paulo$/i.test(original) || /^s.{0,3}o paulo$/i.test(city) ? 'São Paulo' : city;
  }

  function formatCnae(value) {
    const number = digits(value);
    return number.length === 7 ? `${number.slice(0, 4)}-${number.slice(4, 5)}/${number.slice(5)}` : number || '—';
  }

  function segmentLabel(value) {
    const number = digits(value);
    return SEGMENTS.find((segment) => segment.prefixes.some((prefix) => number.startsWith(prefix)))?.label || 'Outros serviços';
  }

  function normalizeCompany(company) {
    if (USING_V2) return company;
    return {
      cnpj: company.cnpj,
      trade_name: company.trade_name,
      legal_name: company.legal_name,
      mobile_1: company.phone_1,
      mobile_2: company.phone_2,
      email: company.email,
      category: segmentLabel(company.primary_cnae_code),
      cnae: company.primary_cnae_code,
      opened_year: String(company.opened_at || '').slice(0, 4),
      company_size: company.company_size,
      city: company.city_name,
      state: company.state
    };
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
      state: filterValue('#biState'),
      city: filterValue('#biCity'),
      category: filterValue('#biCategory'),
      cnae: filterValue('#biCnae'),
      opened_year: filterValue('#biOpenedYear'),
      company_size: filterValue('#biCompanySize')
    };
    if (!USING_V2) {
      filters.city_name = filters.city;
      filters.primary_cnae_code = filters.cnae;
      delete filters.city;
      delete filters.category;
      delete filters.cnae;
      delete filters.company_size;
    }
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
      elements.tableWrap.hidden = true;
      elements.pagination.hidden = true;
      elements.status.hidden = false;
      elements.status.className = 'bi-status loading';
      text(elements.status, 'Consultando empresas…');
    }
  }

  function openFilters() {
    if (!elements.filtersModal?.open) elements.filtersModal?.showModal();
    window.setTimeout(() => $('#biState')?.focus(), 0);
  }

  function closeFilters() {
    if (elements.filtersModal?.open) elements.filtersModal.close();
  }

  function contactValue(label, value) {
    const item = element('span', 'bi-contact-value');
    item.append(element('small', '', label), element('b', '', String(value || '').trim() || 'Não informado'));
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
      companyCell.append(element('b', '', repairText(company.trade_name) || 'Sem nome fantasia'), element('span', '', repairText(company.legal_name)), element('small', '', formatCnpj(company.cnpj)));

      const segmentCell = element('td', 'bi-segment-cell');
      segmentCell.append(element('b', '', repairText(company.category) || 'Outros'));

      const locationCell = element('td');
      locationCell.append(element('b', '', displayCity(company.city) || '—'), element('span', '', company.state || '—'));

      const contactCell = element('td', 'bi-contact-list');
      contactCell.append(contactValue('Celular principal', company.mobile_1));
      if (company.mobile_2) contactCell.append(contactValue('Segundo celular', company.mobile_2));
      contactCell.append(contactValue('E-mail', company.email));

      const actionCell = document.createElement('td');
      const details = element('button', 'btn tiny bi-details-button', 'Ver detalhes');
      details.type = 'button';
      details.dataset.companyCnpj = company.cnpj;
      actionCell.append(details);

      row.append(companyCell, contactCell, segmentCell, element('td', '', formatCnae(company.cnae)), element('td', '', company.opened_year || '—'), element('td', '', repairText(company.company_size) || '—'), locationCell, actionCell);
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
    button.disabled = options.disabled;
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
      const response = await fetch(`${API}${COMPANIES_PATH}?${queryParameters(page, applyCurrentFilters)}`, { headers: { 'x-access-token': token } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) throw new Error(payload.error || `Erro HTTP ${response.status}`);
      state.companies = Array.isArray(payload.companies) ? payload.companies.map(normalizeCompany) : [];
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
    text(elements.drawerTitle, repairText(company.trade_name) || repairText(company.legal_name));
    elements.drawerContent.replaceChildren(
      detail('Nome fantasia', repairText(company.trade_name) || 'Não informado'),
      detail('Razão social', repairText(company.legal_name) || '—'),
      detail('CNPJ', formatCnpj(company.cnpj)),
      detail('Celular principal', company.mobile_1 || 'Não informado'),
      detail('Segundo celular', company.mobile_2 || 'Não informado'),
      detail('E-mail', company.email || 'Não informado'),
      detail('Categoria', repairText(company.category) || 'Outros'),
      detail('CNAE', formatCnae(company.cnae)),
      detail('Ano de abertura', company.opened_year || '—'),
      detail('Porte', company.company_size || '—'),
      detail('Cidade', displayCity(company.city) || '—'),
      detail('UF', company.state || '—')
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
    closeFilters();
    state.appliedFilters = null;
    load(1);
  }

  function initialize() {
    if (state.initialized) return;
    Object.assign(elements, {
      filters: $('#biFilters'), searchButton: $('#biSearchButton'), clearButton: $('#biClearFilters'),
      filtersModal: $('#biFiltersModal'), openFilters: $('#biOpenFilters'), closeFilters: $('#biCloseFilters'),
      openedYear: $('#biOpenedYear'), total: $('#biResultsTotal'), status: $('#biStatus'),
      pageSize: $('#biPageSize'), tableWrap: $('#biTableWrap'), rows: $('#biRows'), pagination: $('#biPagination'),
      drawer: $('#biDrawer'), drawerTitle: $('#biDrawerTitle'), drawerContent: $('#biDrawerContent'), closeDrawer: $('#biDrawerClose'), backdrop: $('#biDrawerBackdrop')
    });
    if (!elements.filters) return;
    state.initialized = true;
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2023; year -= 1) elements.openedYear.append(new Option(String(year), String(year)));
    elements.filters.addEventListener('submit', (event) => { event.preventDefault(); closeFilters(); load(1); });
    elements.openFilters.addEventListener('click', openFilters);
    elements.closeFilters.addEventListener('click', closeFilters);
    elements.filtersModal.addEventListener('click', (event) => { if (event.target === elements.filtersModal) closeFilters(); });
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
