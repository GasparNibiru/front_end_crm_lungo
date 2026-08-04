(() => {
  "use strict";

  const API = String(window.LUNGO_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");
  const STORAGE_KEY = "lungo-suite-access-v5";
  const THEME_KEY = "lungo-suite-theme-v5";
  const SIDEBAR_KEY = "lungo-suite-sidebar-v5";
  const SUPERVISOR_SIDEBAR_KEY = "lungo-supervisor-sidebar-v1";
  const LEAD_SEEN_PREFIX = "lungo-lead-seen-v1";
  const ADMIN_SESSION_KEY = "lungo-admin-master-session-v1";
  const TERMS_VERSION = "mvp-beta-v1-2026-07-31";
  const TERMS_ACCEPT_PREFIX = "lungo-terms-accepted";
  const COMPANY_BRANDING_KEY = "companyBranding";
  const COMPANY_GOALS_KEY = "companyGoals";
  const COMPANY_MESSAGE_KEY = "companyMessage";
  const COMPANY_THEME_KEY = "companyTheme";

  const STATUSES = [
    { value: "novo", label: "Novos" },
    { value: "em_atendimento", label: "Em atendimento" },
    { value: "cotacao_enviada", label: "Cotação enviada" },
    { value: "documentacao_recebida", label: "Documentação recebida" },
    { value: "venda_cadastrada", label: "Venda cadastrada" },
    { value: "boleto_gerado", label: "Boleto gerado" },
    { value: "fechamento", label: "Fechamento" },
    { value: "venda_perdida", label: "Venda perdida" }
  ];

  const FILTER_STATUSES = STATUSES.concat([{ value: "arquivado", label: "Arquivados" }]);
  const CLIENT_STATUSES = [
    { value: "ativo", label: "Ativo" },
    { value: "a_renovar", label: "A renovar" },
    { value: "renovado", label: "Renovado" },
    { value: "cancelado", label: "Cancelado" },
    { value: "inativo", label: "Inativo" }
  ];
  const CLIENT_STATUS_LABEL = Object.fromEntries(CLIENT_STATUSES.map((item) => [item.value, item.label]));
  const STATUS_LABEL = Object.fromEntries(FILTER_STATUSES.map((item) => [item.value, item.label]));
  const PRODUCT_OPTIONS = [
    { value: "Saúde", icon: "saude" },
    { value: "Vida", icon: "vida" },
    { value: "Auto", icon: "auto" },
    { value: "Residencial", icon: "residencial" },
    { value: "Viagem", icon: "viagem" },
    { value: "Odonto", icon: "odonto" },
    { value: "Consórcio", icon: "consorcio" },
    { value: "Outros", icon: "outros" }
  ];
  const PRODUCT_ICON = { saude: "saude", vida: "vida", auto: "auto", residencial: "residencial", viagem: "viagem", odonto: "odonto", consorcio: "consorcio", outros: "outros" };

  const state = {
    token: "",
    clientName: "",
    instanceName: "",
    connected: false,
    crmMode: "list",
    leads: [],
    clients: [],
    clientMetrics: null,
    crmRealtimeTimer: null,
    campaignId: "",
    campaignTimer: null,
    clientDocumentPending: null,
    baseSaleDocumentPending: null,
    currentSaleView: null,
    currentProductFolder: null,
    confirmResolver: null,
    termsResolver: null,
    selectedLeadIds: new Set(),
    trashLeads: [],
    leadScheduleTarget: null,
    adminKey: "",
    adminLogged: false,
    adminDashboard: null
  };

  const SUPERVISOR_BROKERS = [
    { id: "s1", name: "Mariana Costa", token: "SUPERVISOR", status: "online", statusLabel: "Supervisor", sales: 6, goal: 86, login: "Hoje, 10:16", supervisor: true, revenue: "R$ 27.500", leads: 31, clients: 18, postSales: 9 },
    { id: "b1", name: "Ana Souza", token: "ANA-LUNGO-26", status: "online", statusLabel: "Online", sales: 9, goal: 90, login: "Hoje, 09:42" },
    { id: "b2", name: "Bruno Lima", token: "BRUNO-LUNGO-26", status: "online", statusLabel: "Online", sales: 8, goal: 82, login: "Hoje, 09:18" },
    { id: "b3", name: "Carla Mendes", token: "CARLA-LUNGO-26", status: "away", statusLabel: "Ausente", sales: 7, goal: 74, login: "Hoje, 08:51" },
    { id: "b4", name: "Diego Alves", token: "DIEGO-LUNGO-26", status: "online", statusLabel: "Online", sales: 6, goal: 68, login: "Hoje, 08:30" },
    { id: "b5", name: "Elisa Rocha", token: "ELISA-LUNGO-26", status: "", statusLabel: "Offline", sales: 5, goal: 61, login: "Ontem, 18:14" },
    { id: "b6", name: "Felipe Costa", token: "FELIPE-LUNGO-26", status: "online", statusLabel: "Online", sales: 4, goal: 53, login: "Hoje, 10:02" },
    { id: "b7", name: "Giovana Reis", token: "GIOVANA-LUNGO-26", status: "away", statusLabel: "Ausente", sales: 2, goal: 39, login: "Ontem, 16:40" },
    { id: "b8", name: "Hugo Martins", token: "HUGO-LUNGO-26", status: "online", statusLabel: "Online", sales: 1, goal: 26, login: "Hoje, 07:55" }
  ];
  const SUPERVISOR_DEALS = [
    { id: "d1", stage: "novos", client: "Marina Prado", seller: "Ana Souza", phone: "(11) 99991-1020", product: "Saúde", value: "R$ 3.480" },
    { id: "d2", stage: "em_atendimento", client: "Rafael Nunes", seller: "Bruno Lima", phone: "(21) 98810-3344", product: "Vida", value: "R$ 1.920" },
    { id: "d3", stage: "cotacao", client: "Cláudia Melo", seller: "Carla Mendes", phone: "(31) 99102-8877", product: "Saúde", value: "R$ 4.150" },
    { id: "d4", stage: "documentacao", client: "Otávio Ramos", seller: "Diego Alves", phone: "(41) 99777-1212", product: "Auto", value: "R$ 2.640" },
    { id: "d5", stage: "venda", client: "Beatriz Freire", seller: "Ana Souza", phone: "(11) 97654-0909", product: "Odonto", value: "R$ 980" },
    { id: "d6", stage: "boleto", client: "Lucas Tavares", seller: "Elisa Rocha", phone: "(51) 98832-4550", product: "Saúde", value: "R$ 5.230" },
    { id: "d7", stage: "fechamento", client: "Sofia Barros", seller: "Bruno Lima", phone: "(19) 99934-6210", email: "sofia@exemplo.com", personType: "PF", document: "123.456.789-00", lives: 1, product: "Vida", city: "Campinas", value: "R$ 3.790", notes: "Venda concluída e cliente encaminhado ao pós-venda." },
    { id: "d8", stage: "perdida", client: "André Paiva", seller: "Felipe Costa", phone: "(85) 98711-5522", email: "andre@exemplo.com", personType: "PF", document: "987.654.321-00", lives: 1, product: "Auto", city: "Fortaleza", value: "R$ 2.100", notes: "Cliente optou por outra proposta." },
    { id: "d9", stage: "fechamento", client: "Marina Prado", seller: "Ana Souza", phone: "(11) 99991-1020", email: "marina@exemplo.com", personType: "PF", document: "321.654.987-00", lives: 3, product: "Saúde", city: "São Paulo", value: "R$ 3.480", notes: "Plano empresarial familiar." },
    { id: "d10", stage: "fechamento", client: "Otávio Ramos", seller: "Diego Alves", phone: "(41) 99777-1212", email: "otavio@exemplo.com", personType: "PF", document: "456.789.123-00", lives: 1, product: "Auto", city: "Curitiba", value: "R$ 2.640", notes: "Renovação automática em análise." }
  ];
  const SUPERVISOR_CUSTOMERS = [
    { id: "c-d7", leadId: "d7", client: "Sofia Barros", seller: "Bruno Lima", phone: "(19) 99934-6210", email: "sofia@exemplo.com", product: "Vida", status: "Ativo", lives: 1, value: "R$ 3.790", date: "12/08/2026", renewal: "12/08/2027", post: "Pendente", notes: "Originado do fechamento d7." },
    { id: "c-d9", leadId: "d9", client: "Marina Prado", seller: "Ana Souza", phone: "(11) 99991-1020", email: "marina@exemplo.com", product: "Saúde", status: "Ativo", lives: 3, value: "R$ 3.480", date: "10/08/2026", renewal: "10/08/2027", post: "Em dia", notes: "Originado do fechamento d9." },
    { id: "c-d10", leadId: "d10", client: "Otávio Ramos", seller: "Diego Alves", phone: "(41) 99777-1212", email: "otavio@exemplo.com", product: "Auto", status: "Ativo", lives: 1, value: "R$ 2.640", date: "08/08/2026", renewal: "08/08/2027", post: "Contato agendado", notes: "Originado do fechamento d10." }
  ];
  const supervisorSelectedClientIds = new Set();
  let supervisorActiveClientId = "";
  let pendingCompanyLogo = "";
  let pendingCompanyBanner = "";
  const supervisorSharedViewState = new Map();
  let supervisorMountedView = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const el = {
    root: document.documentElement,
    body: document.body,
    authScreen: $("#authScreen"),
    accessTokenInput: $("#accessTokenInput"),
    rememberAccessCheck: $("#rememberAccessCheck"),
    accessLoginBtn: $("#accessLoginBtn"),
    corretorTabBtn: $("#corretorTabBtn"),
    supervisorTabBtn: $("#supervisorTabBtn"),
    corretorAuthPanel: $("#corretorAuthPanel"),
    supervisorAuthPanel: $("#supervisorAuthPanel"),
    supervisorEmailInput: $("#supervisorEmailInput"),
    supervisorPasswordInput: $("#supervisorPasswordInput"),
    supervisorLoginBtn: $("#supervisorLoginBtn"),
    supervisorStatus: $("#supervisorStatus"),
    supervisorScreen: $("#supervisorScreen"),
    supervisorSidebarToggle: $("#supervisorSidebarToggle"),
    supervisorLogoutBtn: $("#supervisorLogoutBtn"),
    supervisorThemeBtn: $("#supervisorThemeBtn"),
    supervisorViewTitle: $("#supervisorViewTitle"),
    supervisorNavItems: $$(".supervisor-nav-item"),
    supervisorViews: $$(".supervisor-view"),
    supervisorBrokerList: $("#supervisorBrokerList"),
    supervisorBrokerRows: $("#supervisorBrokerRows"),
    supervisorKanban: $("#supervisorKanban"),
    supervisorCustomerRows: $("#supervisorCustomerRows"),
    supervisorClientMetrics: $("#supervisorClientMetrics"),
    supervisorClientSearch: $("#supervisorClientSearch"),
    supervisorClientStatusFilter: $("#supervisorClientStatusFilter"),
    supervisorClientPeriodFilter: $("#supervisorClientPeriodFilter"),
    supervisorNewClientBtn: $("#supervisorNewClientBtn"),
    supervisorExportBtn: $("#supervisorExportBtn"),
    supervisorSelectAllClients: $("#supervisorSelectAllClients"),
    supervisorGoalRows: $("#supervisorGoalRows"),
    supervisorBrokerName: $("#supervisorBrokerName"),
    supervisorBrokerToken: $("#supervisorBrokerToken"),
    supervisorGenerateMessageBtn: $("#supervisorGenerateMessageBtn"),
    supervisorGeneratedMessage: $("#supervisorGeneratedMessage"),
    supervisorCopyMessageBtn: $("#supervisorCopyMessageBtn"),
    supervisorAccessStatus: $("#supervisorAccessStatus"),
    supervisorGenerateReportBtn: $("#supervisorGenerateReportBtn"),
    supervisorReportStatus: $("#supervisorReportStatus"),
    supervisorMessageRecipient: $("#supervisorMessageRecipient"),
    supervisorMessageText: $("#supervisorMessageText"),
    supervisorSendMessageBtn: $("#supervisorSendMessageBtn"),
    supervisorMessageStatus: $("#supervisorMessageStatus"),
    supervisorMessageHistory: $("#supervisorMessageHistory"),
    supervisorImportBtn: $("#supervisorImportBtn"),
    supervisorArchiveBtn: $("#supervisorArchiveBtn"),
    supervisorDetailModal: $("#supervisorDetailModal"),
    supervisorModalTitle: $("#supervisorModalTitle"),
    supervisorModalSubtitle: $("#supervisorModalSubtitle"),
    supervisorModalBody: $("#supervisorModalBody"),
    supervisorModalCloseBtn: $("#supervisorModalCloseBtn"),
    supervisorModalFooterCloseBtn: $("#supervisorModalFooterCloseBtn"),
    supervisorClientModal: $("#supervisorClientModal"),
    supervisorClientForm: $("#supervisorClientForm"),
    supervisorClientModalTitle: $("#supervisorClientModalTitle"),
    supervisorClientName: $("#supervisorClientName"),
    supervisorClientSeller: $("#supervisorClientSeller"),
    supervisorClientPhone: $("#supervisorClientPhone"),
    supervisorClientEmail: $("#supervisorClientEmail"),
    supervisorClientStatus: $("#supervisorClientStatus"),
    supervisorClientNotes: $("#supervisorClientNotes"),
    supervisorProductModal: $("#supervisorProductModal"),
    supervisorProductForm: $("#supervisorProductForm"),
    supervisorProductClientName: $("#supervisorProductClientName"),
    supervisorProductFolderModal: $("#supervisorProductFolderModal"),
    supervisorFolderTitle: $("#supervisorFolderTitle"),
    supervisorFolderClientName: $("#supervisorFolderClientName"),
    supervisorProductDetails: $("#supervisorProductDetails"),
    supervisorDocumentList: $("#supervisorDocumentList"),
    supervisorUploadPdfBtn: $("#supervisorUploadPdfBtn"),
    supervisorPdfInput: $("#supervisorPdfInput"),
    supervisorSaveProductBtn: $("#supervisorSaveProductBtn"),
    supervisorPostSaleModal: $("#supervisorPostSaleModal"),
    supervisorPostSaleForm: $("#supervisorPostSaleForm"),
    supervisorPostSaleClientName: $("#supervisorPostSaleClientName"),
    supervisorOperationContent: $("#supervisorOperationContent"),
    companySettingsForm: $("#companySettingsForm"),
    companyLogoInput: $("#companyLogoInput"),
    companyBannerInput: $("#companyBannerInput"),
    companyLogoName: $("#companyLogoName"),
    companyLogoPreview: $("#companyLogoPreview"),
    supervisorCompanyLogo: $("#supervisorCompanyLogo"),
    supervisorCompanyName: $("#supervisorCompanyName"),
    companyBannerName: $("#companyBannerName"),
    companyNameInput: $("#companyNameInput"),
    companySloganInput: $("#companySloganInput"),
    companyPhoneInput: $("#companyPhoneInput"),
    companyWhatsappInput: $("#companyWhatsappInput"),
    companyEmailInput: $("#companyEmailInput"),
    companySiteInput: $("#companySiteInput"),
    companyInstagramInput: $("#companyInstagramInput"),
    companyCityInput: $("#companyCityInput"),
    companyStateInput: $("#companyStateInput"),
    companyMonthlyGoalInput: $("#companyMonthlyGoalInput"),
    companyAnnualGoalInput: $("#companyAnnualGoalInput"),
    companyBrokerGoalInput: $("#companyBrokerGoalInput"),
    companyWeeklyMessageInput: $("#companyWeeklyMessageInput"),
    companyPrimaryColorInput: $("#companyPrimaryColorInput"),
    companySecondaryColorInput: $("#companySecondaryColorInput"),
    companySettingsStatus: $("#companySettingsStatus"),
    saveCompanyMessageBtn: $("#saveCompanyMessageBtn"),
    brokerCompanyLogo: $("#brokerCompanyLogo"),
    brokerCompanyName: $("#brokerCompanyName"),
    brokerBrandingBanner: $("#brokerBrandingBanner"),
    brokerBannerImage: $("#brokerBannerImage"),
    brokerBannerCompanyName: $("#brokerBannerCompanyName"),
    brokerWeeklyMessage: $("#brokerWeeklyMessage"),
    brokerMonthlyGoal: $("#brokerMonthlyGoal"),
    defaultSoonPanel: $("#defaultSoonPanel"),
    teamUpgradePanel: $("#teamUpgradePanel"),
    contactLungoTeamPlanBtn: $("#contactLungoTeamPlanBtn"),
    openAdminBtn: $("#openAdminBtn"),
    accessStatus: $("#accessStatus"),
    adminScreen: $("#adminScreen"),
    adminLoginPanel: $("#adminLoginPanel"),
    adminDashboardPanel: $("#adminDashboardPanel"),
    adminKeyInput: $("#adminKeyInput"),
    adminLoginBtn: $("#adminLoginBtn"),
    adminStatus: $("#adminStatus"),
    adminBackToAccessBtn: $("#adminBackToAccessBtn"),
    adminLogoutBtn: $("#adminLogoutBtn"),
    adminRefreshBtn: $("#adminRefreshBtn"),
    adminMetrics: $("#adminMetrics"),
    adminRows: $("#adminRows"),
    adminSearch: $("#adminSearch"),
    adminNewName: $("#adminNewName"),
    adminNewWhatsapp: $("#adminNewWhatsapp"),
    adminNewInstance: $("#adminNewInstance"),
    adminCreateClientBtn: $("#adminCreateClientBtn"),
    adminCreatedToken: $("#adminCreatedToken"),
    appShell: $("#appShell"),
    sidebarToggleBtn: $("#sidebarToggleBtn"),
    logoutBtn: $("#logoutBtn"),
    navItems: $$(".nav-item"),
    views: {
      crm: $("#view-crm"),
      connect: $("#view-connect"),
      broadcast: $("#view-broadcast"),
      instance: $("#view-instance"),
      clients: $("#view-clients"),
      soon: $("#view-soon")
    },
    viewTitle: $("#viewTitle"),
    viewSubtitle: $("#viewSubtitle"),
    soonTitle: $("#soonTitle"),
    soonText: $("#soonText"),
    globalToken: $("#globalToken"),
    saveTokenBtn: $("#saveTokenBtn"),
    toggleTokenBtn: $("#toggleTokenBtn"),
    themeBtn: $("#themeBtn"),
    todayLabel: $("#todayLabel"),
    topStatus: $("#topStatus"),
    topLogoutBtn: $("#topLogoutBtn"),
    sidebarClient: $("#sidebarClient"),

    metricsBar: $("#metricsBar"),
    listModeBtn: $("#listModeBtn"),
    kanbanModeBtn: $("#kanbanModeBtn"),
    crmSearch: $("#crmSearch"),
    crmStatusFilter: $("#crmStatusFilter"),
    crmPeriodFilter: $("#crmPeriodFilter"),
    crmDateFrom: $("#crmDateFrom"),
    crmDateTo: $("#crmDateTo"),
    newLeadBtn: $("#newLeadBtn"),
    configureAutoBtn: $("#configureAutoBtn"),
    importBtn: $("#importBtn"),
    importFile: $("#importFile"),
    exportBtn: $("#exportBtn"),
    listView: $("#listView"),
    kanbanView: $("#kanbanView"),
    crmRows: $("#crmRows"),
    leadSelectAll: $("#leadSelectAll"),
    deleteSelectedLeadsBtn: $("#deleteSelectedLeadsBtn"),
    openTrashBtn: $("#openTrashBtn"),
    trashModal: $("#trashModal"),
    trashRows: $("#trashRows"),
    trashCount: $("#trashCount"),
    restoreAllTrashBtn: $("#restoreAllTrashBtn"),
    closeTrashModalBtn: $("#closeTrashModalBtn"),
    closeTrashFooterBtn: $("#closeTrashFooterBtn"),

    clientMetrics: $("#clientMetrics"),
    clientSearch: $("#clientSearch"),
    clientStatusFilter: $("#clientStatusFilter"),
    clientPeriodFilter: $("#clientPeriodFilter"),
    clientDateFrom: $("#clientDateFrom"),
    clientDateTo: $("#clientDateTo"),
    newClientBtn: $("#newClientBtn"),
    exportClientsBtn: $("#exportClientsBtn"),
    importClientsBtn: $("#importClientsBtn"),
    importClientsFile: $("#importClientsFile"),
    syncClosedClientsBtn: $("#syncClosedClientsBtn"),
    clientRows: $("#clientRows"),
    revenueChart: $("#revenueChart"),
    revenueChartTotal: $("#revenueChartTotal"),
    productsChart: $("#productsChart"),
    productsChartTotal: $("#productsChartTotal"),
    baseSalesChart: $("#baseSalesChart"),
    baseSalesChartTotal: $("#baseSalesChartTotal"),

    clientModal: $("#clientModal"),
    clientForm: $("#clientForm"),
    clientModalTitle: $("#clientModalTitle"),
    closeClientModalBtn: $("#closeClientModalBtn"),
    cancelClientModalBtn: $("#cancelClientModalBtn"),
    clientId: $("#clientId"),
    clientNome: $("#clientNome"),
    clientTelefone: $("#clientTelefone"),
    clientEmail: $("#clientEmail"),
    clientDocumento: $("#clientDocumento"),
    clientCidade: $("#clientCidade"),
    clientProduto: $("#clientProduto"),
    productSuggestions: $("#productSuggestions"),
    clientQtdVidas: $("#clientQtdVidas"),
    clientValorFechado: $("#clientValorFechado"),
    clientStatus: $("#clientStatus"),
    clientDataContratacao: $("#clientDataContratacao"),
    clientDataRenovacao: $("#clientDataRenovacao"),
    clientObservacao: $("#clientObservacao"),
    clientDocumentName: $("#clientDocumentName"),
    attachClientDocBtn: $("#attachClientDocBtn"),
    downloadClientDocBtn: $("#downloadClientDocBtn"),
    downloadSelectedDocsBtn: $("#downloadSelectedDocsBtn"),
    clientDocumentFile: $("#clientDocumentFile"),
    sellAgainBtn: $("#sellAgainBtn"),
    clientBaseSalesList: $("#clientBaseSalesList"),

    baseSaleModal: $("#baseSaleModal"),
    baseSaleForm: $("#baseSaleForm"),
    closeBaseSaleModalBtn: $("#closeBaseSaleModalBtn"),
    cancelBaseSaleModalBtn: $("#cancelBaseSaleModalBtn"),
    baseSaleClientId: $("#baseSaleClientId"),
    baseSaleClientName: $("#baseSaleClientName"),
    baseSaleProduto: $("#baseSaleProduto"),
    baseSaleVidas: $("#baseSaleVidas"),
    baseSaleValor: $("#baseSaleValor"),
    baseSaleData: $("#baseSaleData"),
    baseSaleObs: $("#baseSaleObs"),
    baseSaleDocumentName: $("#baseSaleDocumentName"),
    attachBaseSaleDocBtn: $("#attachBaseSaleDocBtn"),
    baseSaleDocumentFile: $("#baseSaleDocumentFile"),
    saleViewModal: $("#saleViewModal"),
    saleViewClientName: $("#saleViewClientName"),
    saleViewBody: $("#saleViewBody"),
    closeSaleViewModalBtn: $("#closeSaleViewModalBtn"),
    closeSaleViewFooterBtn: $("#closeSaleViewFooterBtn"),
    downloadSaleDocBtn: $("#downloadSaleDocBtn"),
    productFolderModal: $("#productFolderModal"),
    productFolderForm: $("#productFolderForm"),
    productFolderTitle: $("#productFolderTitle"),
    productFolderSubtitle: $("#productFolderSubtitle"),
    productFolderClientId: $("#productFolderClientId"),
    productFolderProductId: $("#productFolderProductId"),
    productFolderProduto: $("#productFolderProduto"),
    productFolderVidas: $("#productFolderVidas"),
    productFolderValor: $("#productFolderValor"),
    productFolderData: $("#productFolderData"),
    productFolderObs: $("#productFolderObs"),
    productFolderDocs: $("#productFolderDocs"),
    productFolderAttachBtn: $("#productFolderAttachBtn"),
    productFolderFile: $("#productFolderFile"),
    closeProductFolderModalBtn: $("#closeProductFolderModalBtn"),
    cancelProductFolderModalBtn: $("#cancelProductFolderModalBtn"),
    confirmModal: $("#confirmModal"),
    confirmTitle: $("#confirmTitle"),
    confirmMessage: $("#confirmMessage"),
    confirmCancelBtn: $("#confirmCancelBtn"),
    confirmOkBtn: $("#confirmOkBtn"),

    postSaleModal: $("#postSaleModal"),
    postSaleForm: $("#postSaleForm"),
    postSaleClientId: $("#postSaleClientId"),
    postSaleClientName: $("#postSaleClientName"),
    postSaleTipo: $("#postSaleTipo"),
    postSaleData: $("#postSaleData"),
    postSaleHora: $("#postSaleHora"),
    postSaleRecorrencia: $("#postSaleRecorrencia"),
    postSaleMensagem: $("#postSaleMensagem"),
    closePostSaleModalBtn: $("#closePostSaleModalBtn"),
    cancelPostSaleModalBtn: $("#cancelPostSaleModalBtn"),

    leadModal: $("#leadModal"),
    leadForm: $("#leadForm"),
    modalTitle: $("#modalTitle"),
    modalSubtitle: $("#modalSubtitle"),
    closeModalBtn: $("#closeModalBtn"),
    cancelModalBtn: $("#cancelModalBtn"),
    archiveLeadBtn: $("#archiveLeadBtn"),
    leadId: $("#leadId"),
    leadNome: $("#leadNome"),
    leadTelefone: $("#leadTelefone"),
    leadEmail: $("#leadEmail"),
    leadPessoaTipo: $("#leadPessoaTipo"),
    leadCnpjOuPf: $("#leadCnpjOuPf"),
    leadQtdVidas: $("#leadQtdVidas"),
    leadValorNegocio: $("#leadValorNegocio"),
    leadPlanoInteresse: $("#leadPlanoInteresse"),
    leadCidade: $("#leadCidade"),
    leadStatus: $("#leadStatus"),
    leadObservacao: $("#leadObservacao"),
    scheduleLeadBtn: $("#scheduleLeadBtn"),
    leadScheduleModal: $("#leadScheduleModal"),
    leadScheduleForm: $("#leadScheduleForm"),
    leadScheduleName: $("#leadScheduleName"),
    leadScheduleId: $("#leadScheduleId"),
    leadScheduleData: $("#leadScheduleData"),
    leadScheduleHora: $("#leadScheduleHora"),
    leadScheduleMensagem: $("#leadScheduleMensagem"),
    closeLeadScheduleModalBtn: $("#closeLeadScheduleModalBtn"),
    cancelLeadScheduleModalBtn: $("#cancelLeadScheduleModalBtn"),

    tokenInput: $("#tokenInput"),
    connectPhone: $("#connectPhone"),
    generateQrBtn: $("#generateQrBtn"),
    refreshQrBtn: $("#refreshQrBtn"),
    connectStatus: $("#connectStatus"),
    qrBox: $("#qrBox"),
    qrImage: $("#qrImage"),
    connClient: $("#connClient"),
    connInstance: $("#connInstance"),
    connState: $("#connState"),

    broadcastInstance: $("#broadcastInstance"),
    broadcastFile: $("#broadcastFile"),
    broadcastMessage: $("#broadcastMessage"),
    validateInstanceBtn: $("#validateInstanceBtn"),
    startCampaignBtn: $("#startCampaignBtn"),
    stopCampaignBtn: $("#stopCampaignBtn"),
    statTotal: $("#statTotal"),
    statSent: $("#statSent"),
    statPending: $("#statPending"),
    statErrors: $("#statErrors"),
    progressBar: $("#progressBar"),
    campaignLog: $("#campaignLog"),

    instClient: $("#instClient"),
    instName: $("#instName"),
    instState: $("#instState"),
    instConnected: $("#instConnected"),
    refreshInstanceBtn: $("#refreshInstanceBtn"),
    termsModal: $("#termsModal"),
    termsAcceptCheck: $("#termsAcceptCheck"),
    termsContinueBtn: $("#termsContinueBtn"),
    termsDeclineBtn: $("#termsDeclineBtn"),
    termsVersionLabel: $("#termsVersionLabel"),
    toast: $("#toast")
  };

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.toast.classList.remove("show"), 2600);
  }

  function popupConfirm(message, title = "Confirmar ação", okText = "Confirmar") {
    if (!el.confirmModal) return Promise.resolve(window.confirm(message));
    el.confirmTitle.textContent = title;
    el.confirmMessage.textContent = message;
    el.confirmOkBtn.textContent = okText;
    el.confirmModal.showModal();
    return new Promise((resolve) => {
      state.confirmResolver = resolve;
    });
  }

  function resolveConfirm(value) {
    if (state.confirmResolver) state.confirmResolver(value);
    state.confirmResolver = null;
    if (el.confirmModal?.open) el.confirmModal.close();
  }


  function normalizeTermsToken(value) {
    return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function termsStorageKey() {
    const token = normalizeTermsToken(state.token || el.accessTokenInput?.value || el.globalToken?.value || "sem-token");
    return `${TERMS_ACCEPT_PREFIX}:${TERMS_VERSION}:${token}`;
  }

  function hasAcceptedTerms() {
    try {
      const saved = JSON.parse(localStorage.getItem(termsStorageKey()) || "{}");
      return Boolean(saved.accepted && saved.version === TERMS_VERSION && saved.token === normalizeTermsToken(state.token));
    } catch {
      return false;
    }
  }

  function saveTermsAcceptance() {
    const payload = {
      accepted: true,
      version: TERMS_VERSION,
      token: normalizeTermsToken(state.token),
      clientName: state.clientName || "",
      instanceName: state.instanceName || "",
      acceptedAt: new Date().toISOString()
    };
    localStorage.setItem(termsStorageKey(), JSON.stringify(payload));
    return payload;
  }

  function showTermsModal() {
    if (!el.termsModal) return Promise.resolve(window.confirm("Para continuar, aceite os Termos de Uso da Lungo Corretores."));
    if (el.termsVersionLabel) el.termsVersionLabel.textContent = `Versão ${TERMS_VERSION}`;
    if (el.termsAcceptCheck) el.termsAcceptCheck.checked = false;
    if (el.termsContinueBtn) el.termsContinueBtn.disabled = true;
    el.termsModal.showModal();
    return new Promise((resolve) => {
      state.termsResolver = resolve;
    });
  }

  function resolveTerms(value) {
    if (value) saveTermsAcceptance();
    if (state.termsResolver) state.termsResolver(Boolean(value));
    state.termsResolver = null;
    if (el.termsModal?.open) el.termsModal.close();
  }

  async function ensureTermsAccepted() {
    if (hasAcceptedTerms()) return true;
    const accepted = await showTermsModal();
    if (!accepted) {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      state.token = "";
      state.connected = false;
      renderAccess();
      return false;
    }
    return true;
  }

  function seenStorageKey() {
    return `${LEAD_SEEN_PREFIX}-${state.token || "sem-token"}`;
  }

  function loadSeenMap() {
    try { return JSON.parse(localStorage.getItem(seenStorageKey()) || "{}"); }
    catch { return {}; }
  }

  function saveSeenMap(map) {
    try { localStorage.setItem(seenStorageKey(), JSON.stringify(map || {})); }
    catch {}
  }

  function leadSeenKey(lead) {
    return lead?.id || lead?.whatsappJid || displayPhone(lead) || "";
  }

  function leadLastMessageTime(lead) {
    const raw = lead?.lastMessageAt || lead?.updatedAt || lead?.createdAt || "";
    const time = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  }

  function isLeadUnread(lead) {
    if (!lead?.lastMessage || lead.lastMessageFromMe) return false;
    const key = leadSeenKey(lead);
    if (!key) return false;
    const map = loadSeenMap();
    return leadLastMessageTime(lead) > Number(map[key] || 0);
  }

  function markLeadSeen(leadOrId) {
    const lead = typeof leadOrId === "string" ? getLead(leadOrId) : leadOrId;
    if (!lead) return;
    const key = leadSeenKey(lead);
    if (!key) return;
    const map = loadSeenMap();
    map[key] = Math.max(Date.now(), leadLastMessageTime(lead));
    saveSeenMap(map);
  }

  function markVisibleLeadsSeen() {
    const map = loadSeenMap();
    (state.leads || []).forEach((lead) => {
      const key = leadSeenKey(lead);
      if (key) map[key] = Math.max(Number(map[key] || 0), leadLastMessageTime(lead));
    });
    saveSeenMap(map);
  }

  function unreadDotHtml(lead) {
    return isLeadUnread(lead) ? `<span class="unread-dot" title="Nova mensagem"></span>` : "";
  }

  function productKey(value) {
    return stripAccents(String(value || "")).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function cleanProduct(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const key = productIcon(raw);
    const found = PRODUCT_OPTIONS.find((item) => item.icon === key || productKey(item.value) === key);
    return found?.value || raw;
  }

  function productIcon(value) {
    const raw = productKey(value);
    if (!raw) return "outros";
    if (raw.includes("odonto") || raw.includes("dental") || raw.includes("dent")) return "odonto";
    if (raw.includes("auto") || raw.includes("carro") || raw.includes("veiculo") || raw.includes("automovel")) return "auto";
    if (raw.includes("vida")) return "vida";
    if (raw.includes("saude") || raw.includes("medico") || raw.includes("hospital") || raw.includes("plano_de_saude") || raw.includes("plano_saude")) return "saude";
    if (raw.includes("viagem")) return "viagem";
    if (raw.includes("resid") || raw.includes("casa") || raw.includes("lar")) return "residencial";
    if (raw.includes("consor")) return "consorcio";
    return PRODUCT_ICON[raw] || PRODUCT_ICON.outros || "outros";
  }

  function productIconSvg(value) {
    const key = productIcon(value);
    const icons = {
      saude: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.4-9-9.3C1.6 8.2 3.8 5 7.2 5c2 0 3.5 1.1 4.8 2.7C13.3 6.1 14.8 5 16.8 5c3.4 0 5.6 3.2 4.2 6.7C19 16.6 12 21 12 21Z"/></svg>`,
      vida: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 18 0Z"/><path d="M12 12v6a3 3 0 0 0 6 0"/><path d="M12 3v2"/></svg>`,
      auto: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12 7 7h10l2 5"/><path d="M4 12h16v6H4z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/></svg>`,
      residencial: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`,
      viagem: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 16 22 8l-8 13-3-7-9 2Z"/><path d="M11 14 22 8"/></svg>`,
      odonto: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3c2 0 2.5 1 4 1s2-1 4-1c2.5 0 4 2.1 3.3 5.2L17 20c-.3 1.3-2.1 1.3-2.4 0L13.5 15h-3L9.4 20c-.3 1.3-2.1 1.3-2.4 0L4.7 8.2C4 5.1 5.5 3 8 3Z"/></svg>`,
      consorcio: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4"/><path d="M8 11h8M8 15h8M8 19h5"/></svg>`,
      outros: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>`
    };
    return icons[key] || icons.outros;
  }

  function clockIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>`;
  }

  function productSelectOptions(selected = "") {
    const current = String(selected || "").trim();
    const known = PRODUCT_OPTIONS.some((item) => item.value === current);
    const options = PRODUCT_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === current ? "selected" : ""}>${escapeHtml(item.value)}</option>`).join("");
    return `${current && !known ? `<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>` : ""}${options}`;
  }

  function normalizeMoneyInput(value) {
    const numeric = moneyNumber(value);
    if (!numeric) return String(value || "").trim().startsWith("R$") ? String(value || "").trim() : "";
    return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function bindMoneyField(input) {
    if (!input) return;
    input.addEventListener("focus", () => { if (!input.value.trim()) input.value = "R$ "; });
    input.addEventListener("blur", () => { input.value = normalizeMoneyInput(input.value); });
  }

  function fileToDocument(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return reject(new Error("Envie apenas arquivo PDF."));
      const reader = new FileReader();
      reader.onload = () => resolve({ fileName: file.name, mimeType: "application/pdf", size: file.size, dataBase64: String(reader.result || "").split(",").pop() });
      reader.onerror = () => reject(new Error("Não foi possível ler o PDF."));
      reader.readAsDataURL(file);
    });
  }

  function downloadBase64Pdf(doc) {
    if (!doc?.dataBase64) return toast("Documentação não encontrada.");
    const byteChars = atob(doc.dataBase64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i += 1) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = doc.fileName || "documentacao.pdf";
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizePhone(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) digits = `55${digits}`;
    return digits;
  }

  function formatMoney(value) {
    const text = String(value || "").trim();
    if (!text) return "—";
    const numeric = Number(text.replace(/[^0-9,.-]/g, "").replace(".", "").replace(",", "."));
    if (Number.isFinite(numeric) && numeric > 0) return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    return text;
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }


  function formatFullDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function updateTodayLabel() {
    if (el.todayLabel) el.todayLabel.textContent = formatFullDate(new Date()).replace('.', '');
  }

  function stripAccents(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function isBadName(value) {
    const raw = String(value || "").trim();
    const normalized = stripAccents(raw).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!raw) return true;
    if (["voce", "voces", "eu", "me", "you", "self", "owner", "whatsapp", "unknown", "desconhecido"].includes(normalized)) return true;
    if (raw.includes("@")) return true;
    if (/^https?:\/\//i.test(raw)) return true;
    if (/^\+?\d{8,}$/.test(raw.replace(/[\s().-]/g, ""))) return true;
    return false;
  }

  function isWeirdPhone(value, lead = {}) {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return false;
    if (digits.length < 10 || digits.length > 15) return true;
    const jidLeft = String(lead.whatsappJid || "").split("@")[0].split(":")[0].replace(/\D/g, "");
    if (String(lead.whatsappJid || "").includes("@lid") && jidLeft && digits === jidLeft) return true;
    return false;
  }

  function displayPhone(lead) {
    return isWeirdPhone(lead.telefone, lead) ? "" : String(lead.telefone || "").trim();
  }

  function displayName(lead) {
    const phone = displayPhone(lead);
    const raw = String(lead.nome || "").trim();
    if (!isBadName(raw) && !/^Contato\s+\d{10,}/i.test(raw) && !/^Contato\s+WhatsApp$/i.test(raw)) return raw;
    return phone ? `Contato ${phone}` : "";
  }

  function isUsableLead(lead) {
    const phone = displayPhone(lead);
    const name = displayName(lead);
    const hasManualData = [lead.email, lead.cidade, lead.planoInteresse, lead.cnpjOuPf, lead.valorNegocio, lead.qtdVidas].some((v) => String(v || "").trim());
    if (phone && phone.length >= 10 && name) return true;
    if (hasManualData && name) return true;
    return false;
  }

  function moneyNumber(value) {
    const text = String(value || "").trim();
    if (!text) return 0;
    const numeric = Number(text.replace(/[^0-9,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function leadDateValue(lead) {
    const raw = lead.lastMessageAt || lead.updatedAt || lead.createdAt || "";
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function inSelectedPeriod(lead) {
    const mode = el.crmPeriodFilter?.value || "all";
    if (mode === "all") return true;
    const date = leadDateValue(lead);
    if (!date) return false;
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (mode === "today") return date >= start;
    if (mode === "yesterday") {
      const from = new Date(start);
      from.setDate(from.getDate() - 1);
      const to = new Date(start);
      to.setMilliseconds(-1);
      return date >= from && date <= to;
    }
    if (["7", "15", "30", "90", "365"].includes(mode)) {
      const days = Number(mode);
      const from = new Date(start);
      from.setDate(from.getDate() - days);
      return date >= from;
    }
    if (mode === "custom") {
      const fromRaw = el.crmDateFrom?.value || "";
      const toRaw = el.crmDateTo?.value || "";
      const from = fromRaw ? new Date(`${fromRaw}T00:00:00`) : null;
      const to = toRaw ? new Date(`${toRaw}T23:59:59`) : null;
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    }
    return true;
  }

  function toggleCustomPeriodFields() {
    const show = el.crmPeriodFilter?.value === "custom";
    if (el.crmDateFrom) el.crmDateFrom.hidden = !show;
    if (el.crmDateTo) el.crmDateTo.hidden = !show;
  }

  function hardenAutocomplete() {
    document.querySelectorAll("input, textarea").forEach((node, index) => {
      node.setAttribute("autocomplete", ["globalToken", "tokenInput", "accessTokenInput"].includes(node.id) ? "new-password" : "off");
      node.setAttribute("data-lpignore", "true");
      node.setAttribute("data-form-type", "other");
      if (!node.name || /token|lead|nome|telefone|email/i.test(node.name)) node.name = `${node.id || "field"}_v30_${index}`;
    });
  }

  async function api(path, options = {}) {
    if (!API) throw new Error("API_BASE_URL não configurado no config.js.");
    const response = await fetch(`${API}${path}`, options);
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { ok: false, error: text || "Resposta inválida." }; }
    if (!response.ok || data.ok === false) throw new Error(data.error || data.message || `Erro HTTP ${response.status}`);
    return data;
  }


  function setAdminStatus(message, tone = "") {
    if (!el.adminStatus) return;
    el.adminStatus.textContent = message || "";
    el.adminStatus.classList.toggle("error", tone === "error");
    el.adminStatus.classList.toggle("ok", tone === "ok");
  }

  function adminQuery() {
    if (!state.adminKey) throw new Error("Informe a chave admin.");
    return encodeURIComponent(state.adminKey);
  }

  function openAdminArea() {
    stopCrmRealtime();
    document.body.classList.add("admin-mode");
    if (el.adminScreen) el.adminScreen.hidden = false;
    if (el.adminLoginPanel) el.adminLoginPanel.hidden = state.adminLogged;
    if (el.adminDashboardPanel) el.adminDashboardPanel.hidden = !state.adminLogged;
    setWhatsappPending(false);
    setAuthStatus("", "");
    const savedAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) || "";
    if (!state.adminKey && savedAdmin) {
      state.adminKey = savedAdmin;
      if (el.adminKeyInput) el.adminKeyInput.value = savedAdmin;
    }
    if (state.adminKey && !state.adminLogged) adminLogin(true);
    setTimeout(() => el.adminKeyInput?.focus(), 60);
  }

  function closeAdminArea() {
    document.body.classList.remove("admin-mode");
    if (el.adminScreen) el.adminScreen.hidden = true;
    if (!state.token) setAuthLocked(true);
    else setAuthLocked(false);
    renderAccess();
  }

  function adminLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    state.adminKey = "";
    state.adminLogged = false;
    state.adminDashboard = null;
    if (el.adminKeyInput) el.adminKeyInput.value = "";
    if (el.adminLoginPanel) el.adminLoginPanel.hidden = false;
    if (el.adminDashboardPanel) el.adminDashboardPanel.hidden = true;
    setAdminStatus("Digite sua chave admin para entrar.", "");
    closeAdminArea();
  }

  async function adminLogin(silent = false) {
    const key = String(el.adminKeyInput?.value || state.adminKey || "").trim();
    try {
      if (!key) throw new Error("Informe a chave admin.");
      if (!silent) setAdminStatus("Validando chave admin...", "");
      await api("/api/admin-master/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: key })
      });
      state.adminKey = key;
      state.adminLogged = true;
      sessionStorage.setItem(ADMIN_SESSION_KEY, key);
      if (el.adminLoginPanel) el.adminLoginPanel.hidden = true;
      if (el.adminDashboardPanel) el.adminDashboardPanel.hidden = false;
      await loadAdminDashboard(true);
      setAdminStatus("Admin Master liberado.", "ok");
    } catch (error) {
      state.adminLogged = false;
      if (el.adminLoginPanel) el.adminLoginPanel.hidden = false;
      if (el.adminDashboardPanel) el.adminDashboardPanel.hidden = true;
      setAdminStatus(error.message || "Chave admin inválida.", "error");
      if (!silent) toast(error.message || "Chave admin inválida.");
    }
  }

  async function loadAdminDashboard(silent = false) {
    try {
      if (!silent) setAdminStatus("Atualizando dashboard...", "");
      const data = await api(`/api/admin-master/dashboard?adminKey=${adminQuery()}&_=${Date.now()}`);
      state.adminDashboard = data;
      renderAdminDashboard();
      if (!silent) setAdminStatus("Dashboard atualizado.", "ok");
    } catch (error) {
      setAdminStatus(error.message || "Erro ao carregar dashboard.", "error");
    }
  }

  function adminFilteredRows() {
    const q = String(el.adminSearch?.value || "").trim().toLowerCase();
    const rows = state.adminDashboard?.corretores || [];
    if (!q) return rows;
    return rows.filter((row) => [row.nome, row.token, row.instanceName, row.whatsapp].join(" ").toLowerCase().includes(q));
  }

  function adminMetricCard(label, value, hint = "") {
    return `<article class="admin-metric"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b>${hint ? `<small>${escapeHtml(hint)}</small>` : ""}</article>`;
  }

  function adminFunnelHtml(row) {
    const order = state.adminDashboard?.funnelOrder || [];
    const labels = state.adminDashboard?.statusLabels || {};
    return `<div class="admin-funnel-mini">${order.map((status) => {
      const count = Number(row.funil?.[status] || 0);
      return `<span title="${escapeHtml(labels[status] || status)}"><b>${count}</b>${escapeHtml((labels[status] || status).slice(0, 3))}</span>`;
    }).join("")}</div>`;
  }

  function renderAdminDashboard() {
    const data = state.adminDashboard || {};
    const totals = data.totals || {};
    if (el.adminMetrics) {
      el.adminMetrics.innerHTML = [
        adminMetricCard("Corretores", totals.corretores || 0, `${totals.ativos || 0} ativos`),
        adminMetricCard("Leads", totals.leads || 0, "sem lixeira"),
        adminMetricCard("Clientes", totals.clientes || 0, "carteira"),
        adminMetricCard("Fechamentos", totals.fechamentos || 0, "funil"),
        adminMetricCard("Valor", formatMoney(totals.valorFechado || 0), "clientes + base")
      ].join("");
    }
    const rows = adminFilteredRows();
    if (el.adminRows) {
      el.adminRows.innerHTML = rows.length ? rows.map((row) => `
        <tr>
          <td><div class="admin-person"><b>${escapeHtml(row.nome || "Corretor")}</b><span>${escapeHtml(row.instanceName || "—")}</span><small>${row.ativo ? "Ativo" : "Inativo"}</small></div></td>
          <td>${escapeHtml(formatDate(row.lastAccessAt))}</td>
          <td><b>${Number(row.leadCount || 0)}</b></td>
          <td>${adminFunnelHtml(row)}</td>
          <td>${Number(row.clientes || 0)}</td>
          <td>${Number(row.fechamentos || 0)}</td>
          <td>${escapeHtml(formatMoney(row.valorFechado || 0))}</td>
          <td><div class="admin-token-cell"><code>${escapeHtml(row.token || "—")}</code><button class="tiny-btn" type="button" data-copy-token="${escapeHtml(row.token || "")}">Copiar</button></div></td>
        </tr>
      `).join("") : `<tr><td colspan="8" class="empty-admin-row">Nenhum corretor encontrado.</td></tr>`;
    }
  }

  async function createAdminClient() {
    const nome = String(el.adminNewName?.value || "").trim();
    const whatsapp = String(el.adminNewWhatsapp?.value || "").trim();
    const instanceName = String(el.adminNewInstance?.value || "").trim();
    try {
      if (!nome) throw new Error("Informe o nome do corretor.");
      const data = await api("/api/admin-master/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: state.adminKey, nome, whatsapp, instanceName })
      });
      state.adminDashboard = data.dashboard || state.adminDashboard;
      if (el.adminNewName) el.adminNewName.value = "";
      if (el.adminNewWhatsapp) el.adminNewWhatsapp.value = "";
      if (el.adminNewInstance) el.adminNewInstance.value = "";
      if (el.adminCreatedToken) {
        const client = data.client || {};
        el.adminCreatedToken.hidden = false;
        el.adminCreatedToken.innerHTML = `<span>Token gerado</span><code>${escapeHtml(client.token || "")}</code><button class="tiny-btn" type="button" data-copy-token="${escapeHtml(client.token || "")}">Copiar</button><small>Instância: ${escapeHtml(client.instanceName || "")}</small>`;
      }
      renderAdminDashboard();
      setAdminStatus("Token criado com segurança.", "ok");
    } catch (error) {
      setAdminStatus(error.message || "Erro ao gerar token.", "error");
      toast(error.message || "Erro ao gerar token.");
    }
  }

  function copyAdminToken(token) {
    if (!token) return;
    navigator.clipboard?.writeText(token).then(() => toast("Token copiado."), () => toast("Não foi possível copiar o token."));
  }

  function saveAccess() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      token: state.token,
      clientName: state.clientName,
      instanceName: state.instanceName,
      connected: state.connected
    }));
  }

  function loadAccess() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      state.token = saved.token || "";
      state.clientName = saved.clientName || "";
      state.instanceName = saved.instanceName || "";
      state.connected = Boolean(saved.connected);
    } catch {}
    if (el.globalToken) el.globalToken.value = state.token;
    if (el.tokenInput) el.tokenInput.value = state.token;
    if (el.accessTokenInput) el.accessTokenInput.value = state.token;
    if (el.broadcastInstance) el.broadcastInstance.value = state.instanceName;
    if (el.rememberAccessCheck) el.rememberAccessCheck.checked = true;
    renderAccess();
  }

  function renderAccess() {
    const statusText = state.connected ? "Conectado" : (state.token ? "Token salvo" : "Aguardando token");
    if (el.topStatus) el.topStatus.textContent = `Status: ${statusText}`;
    el.sidebarClient.textContent = state.clientName || state.instanceName || (state.token ? "Token salvo" : "Aguardando token");
    el.connClient.textContent = state.clientName || "—";
    el.connInstance.textContent = state.instanceName || "—";
    el.connState.textContent = state.connected ? "Conectado" : "—";
    el.instClient.textContent = state.clientName || "—";
    el.instName.textContent = state.instanceName || "—";
    el.instState.textContent = state.connected ? "open" : "—";
    el.instConnected.textContent = state.connected ? "Sim" : "Não";
    if (state.instanceName && !el.broadcastInstance.value) el.broadcastInstance.value = state.instanceName;
  }


  function setAuthStatus(message, tone = "") {
    if (!el.accessStatus) return;
    el.accessStatus.textContent = message || "";
    el.accessStatus.classList.toggle("error", tone === "error");
    el.accessStatus.classList.toggle("ok", tone === "ok");
  }

  function setAuthLocked(locked) {
    document.body.classList.toggle("auth-locked", Boolean(locked));
  }

  function setAuthRole(role) {
    const supervisorActive = role === "supervisor";
    el.corretorTabBtn?.classList.toggle("active", !supervisorActive);
    el.supervisorTabBtn?.classList.toggle("active", supervisorActive);
    el.corretorTabBtn?.setAttribute("aria-selected", String(!supervisorActive));
    el.supervisorTabBtn?.setAttribute("aria-selected", String(supervisorActive));
    if (el.corretorAuthPanel) el.corretorAuthPanel.hidden = supervisorActive;
    if (el.supervisorAuthPanel) el.supervisorAuthPanel.hidden = !supervisorActive;
    setTimeout(() => (supervisorActive ? el.supervisorEmailInput : el.accessTokenInput)?.focus(), 0);
  }

  function readLocalObject(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); }
    catch { return {}; }
  }

  function loadCompanyBranding() {
    return {
      branding: readLocalObject(COMPANY_BRANDING_KEY),
      goals: readLocalObject(COMPANY_GOALS_KEY),
      message: localStorage.getItem(COMPANY_MESSAGE_KEY) || "",
      theme: readLocalObject(COMPANY_THEME_KEY)
    };
  }

  function fillCompanySettings() {
    const data = loadCompanyBranding();
    const branding = data.branding;
    if (el.companyNameInput) el.companyNameInput.value = branding.name || "";
    if (el.companySloganInput) el.companySloganInput.value = branding.slogan || "";
    if (el.companyPhoneInput) el.companyPhoneInput.value = branding.phone || "";
    if (el.companyWhatsappInput) el.companyWhatsappInput.value = branding.whatsapp || "";
    if (el.companyEmailInput) el.companyEmailInput.value = branding.email || "";
    if (el.companySiteInput) el.companySiteInput.value = branding.site || "";
    if (el.companyInstagramInput) el.companyInstagramInput.value = branding.instagram || "";
    if (el.companyCityInput) el.companyCityInput.value = branding.city || "";
    if (el.companyStateInput) el.companyStateInput.value = branding.state || "";
    if (el.companyMonthlyGoalInput) el.companyMonthlyGoalInput.value = data.goals.monthly || "";
    if (el.companyAnnualGoalInput) el.companyAnnualGoalInput.value = data.goals.annual || "";
    if (el.companyBrokerGoalInput) el.companyBrokerGoalInput.value = data.goals.broker || "";
    if (el.companyWeeklyMessageInput) el.companyWeeklyMessageInput.value = data.message || "";
    if (el.companyPrimaryColorInput) el.companyPrimaryColorInput.value = data.theme.primary || "#0ea5a5";
    if (el.companySecondaryColorInput) el.companySecondaryColorInput.value = data.theme.secondary || "#10b8a8";
    const themeRadio = document.querySelector(`input[name="companyTheme"][value="${data.theme.mode || "dark"}"]`);
    if (themeRadio) themeRadio.checked = true;
    pendingCompanyLogo = branding.logo || "";
    pendingCompanyBanner = branding.banner || "";
    if (el.companyLogoName) el.companyLogoName.textContent = branding.logo ? "Logo salva localmente" : "Nenhum arquivo";
    if (el.companyBannerName) el.companyBannerName.textContent = branding.banner ? "Banner salvo localmente" : "Nenhum arquivo";
  }

  function saveCompanyBranding(options = {}) {
    const current = loadCompanyBranding();
    const branding = {
      name: el.companyNameInput?.value.trim() || "", slogan: el.companySloganInput?.value.trim() || "",
      phone: el.companyPhoneInput?.value.trim() || "", whatsapp: el.companyWhatsappInput?.value.trim() || "",
      email: el.companyEmailInput?.value.trim() || "", site: el.companySiteInput?.value.trim() || "",
      instagram: el.companyInstagramInput?.value.trim() || "", city: el.companyCityInput?.value.trim() || "",
      state: el.companyStateInput?.value.trim().toUpperCase() || "", logo: pendingCompanyLogo || current.branding.logo || "",
      banner: pendingCompanyBanner || current.branding.banner || ""
    };
    const goals = { monthly: el.companyMonthlyGoalInput?.value.trim() || "", annual: el.companyAnnualGoalInput?.value.trim() || "", broker: el.companyBrokerGoalInput?.value.trim() || "" };
    const message = el.companyWeeklyMessageInput?.value.trim() || "";
    const theme = { primary: el.companyPrimaryColorInput?.value || "#0ea5a5", secondary: el.companySecondaryColorInput?.value || "#10b8a8", mode: document.querySelector('input[name="companyTheme"]:checked')?.value || "dark" };
    try {
      localStorage.setItem(COMPANY_BRANDING_KEY, JSON.stringify(branding));
      localStorage.setItem(COMPANY_GOALS_KEY, JSON.stringify(goals));
      localStorage.setItem(COMPANY_MESSAGE_KEY, message);
      localStorage.setItem(COMPANY_THEME_KEY, JSON.stringify(theme));
    } catch {
      if (el.companySettingsStatus) { el.companySettingsStatus.textContent = "Não foi possível salvar. Use imagens menores."; el.companySettingsStatus.classList.add("error"); }
      return null;
    }
    renderCompanyBranding();
    if (el.companySettingsStatus) { el.companySettingsStatus.textContent = options.messageOnly ? "Mensagem atualizada." : "Configurações salvas neste dispositivo."; el.companySettingsStatus.classList.add("ok"); }
    return { branding, goals, message, theme };
  }

  function renderCompanyBranding() {
    const data = loadCompanyBranding();
    const branding = data.branding;
    const hasBranding = Boolean(branding.name || branding.logo || branding.banner || data.message || data.goals.monthly);
    const defaultLogo = "https://imagensconrato.pagecor.com.br/logo-lungo.png";
    if (el.brokerCompanyLogo) el.brokerCompanyLogo.src = branding.logo || defaultLogo;
    if (el.brokerCompanyLogo) el.brokerCompanyLogo.alt = branding.name || "Lungo";
    if (el.brokerCompanyName) el.brokerCompanyName.textContent = branding.name || "Lungo";
    if (el.brokerBrandingBanner) el.brokerBrandingBanner.hidden = !hasBranding;
    if (el.brokerBannerImage) el.brokerBannerImage.src = branding.logo || defaultLogo;
    if (el.brokerBannerCompanyName) el.brokerBannerCompanyName.textContent = branding.name || "Lungo Corretores";
    if (el.brokerWeeklyMessage) el.brokerWeeklyMessage.textContent = data.message || branding.slogan || "Bem-vindo ao seu painel comercial.";
    if (el.brokerMonthlyGoal) el.brokerMonthlyGoal.textContent = data.goals.monthly || "Não definida";
    if (el.brokerBrandingBanner) {
      el.brokerBrandingBanner.classList.toggle("has-background", Boolean(branding.banner));
      el.brokerBrandingBanner.style.setProperty("--company-banner", branding.banner ? `url("${branding.banner}")` : "none");
    }
  }

  function loadCompanyIdentity() {
    const stored = readLocalObject(COMPANY_BRANDING_KEY);
    return { name: String(stored.name || "").trim(), logo: String(stored.logo || "") };
  }

  function saveCompanyIdentity() {
    const name = String(el.companyNameInput?.value || "").trim();
    if (!name) {
      el.companySettingsStatus.textContent = "Informe o nome da corretora.";
      el.companySettingsStatus.classList.add("error");
      return null;
    }
    const current = loadCompanyIdentity();
    const identity = { name, logo: pendingCompanyLogo || current.logo || "" };
    try { localStorage.setItem(COMPANY_BRANDING_KEY, JSON.stringify(identity)); }
    catch {
      el.companySettingsStatus.textContent = "Não foi possível salvar. Use uma imagem menor.";
      el.companySettingsStatus.classList.add("error");
      return null;
    }
    renderCompanyIdentity();
    el.companySettingsStatus.textContent = "Identidade atualizada.";
    el.companySettingsStatus.classList.remove("error");
    el.companySettingsStatus.classList.add("ok");
    return identity;
  }

  function renderCompanyIdentity() {
    const identity = loadCompanyIdentity();
    const defaultLogo = "https://imagensconrato.pagecor.com.br/logo-lungo.png";
    const name = identity.name || "Lungo";
    const logo = identity.logo || defaultLogo;
    [[el.brokerCompanyLogo, logo], [el.supervisorCompanyLogo, logo]].forEach(([image, src]) => { if (image) { image.src = src; image.alt = name; } });
    if (el.brokerCompanyName) el.brokerCompanyName.textContent = name;
    if (el.supervisorCompanyName) el.supervisorCompanyName.textContent = name;
    if (el.companyNameInput) el.companyNameInput.value = identity.name || "";
    pendingCompanyLogo = identity.logo || pendingCompanyLogo;
    if (el.companyLogoName) el.companyLogoName.textContent = identity.logo ? "Logo salva localmente" : "Nenhum arquivo";
    const previewImage = el.companyLogoPreview?.querySelector("img");
    if (previewImage) previewImage.src = logo;
  }

  function readCompanyImage(file, kind) {
    if (!file || !String(file.type).startsWith("image/")) { toast("Selecione uma imagem válida."); return; }
    if (file.size > 1500000) { toast("Use uma imagem de até 1,5 MB para o armazenamento local."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (kind === "logo") { pendingCompanyLogo = String(reader.result || ""); el.companyLogoName.textContent = file.name; const preview = el.companyLogoPreview?.querySelector("img"); if (preview) preview.src = pendingCompanyLogo; }
      else { pendingCompanyBanner = String(reader.result || ""); el.companyBannerName.textContent = file.name; }
    };
    reader.readAsDataURL(file);
  }

  function renderSupervisorOperation(name) {
    const labels = { instance: "Minha Instância", connect: "Conectar WhatsApp", crm: "Meus Leads", clients: "Clientes", broadcast: "Disparos", cotador: "Cotador", comprar_leads: "Comprar Leads", treinamentos: "Treinamentos", agenda: "Agenda" };
    const descriptions = { instance: "Status da instância própria do Supervisor.", connect: "Conexão visual da conta WhatsApp do Supervisor.", crm: "Pipeline próprio do Supervisor.", clients: "Carteira própria do Supervisor.", broadcast: "Campanhas próprias do Supervisor.", cotador: "Cotações comerciais.", comprar_leads: "Aquisição de oportunidades.", treinamentos: "Trilhas e materiais comerciais.", agenda: "Compromissos e retornos comerciais." };
    const cards = name === "crm" ? [["Leads próprios", "31"], ["Em atendimento", "12"], ["Fechamentos", "6"]] : name === "clients" ? [["Clientes próprios", "18"], ["Vidas", "37"], ["Pós-vendas", "9"]] : [["Ambiente", "Supervisor"], ["Status", "Mock visual"], ["Integração", "Aguardando backend"]];
    el.supervisorOperationContent.innerHTML = `<header class="supervisor-operation-header"><div><h2>${escapeHtml(labels[name] || "Operação")}</h2><p>${escapeHtml(descriptions[name] || "Módulo operacional")}</p></div><span class="status-mini">Sessão própria · mock</span></header><div class="supervisor-operation-grid">${cards.map(([label, value]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></article>`).join("")}</div><section class="supervisor-card"><header><div><h2>Estrutura operacional</h2><p>Esta prévia segue o padrão do corretor sem usar seu token ou chamar endpoints.</p></div></header><div class="toolbar"><input class="search" placeholder="Buscar neste módulo" disabled><button class="btn primary" type="button" disabled>Nova ação</button><button class="btn" type="button" disabled>Atualizar</button></div></section>`;
  }

  function restoreSupervisorSharedView() {
    if (!supervisorMountedView) return;
    const stateEntry = supervisorSharedViewState.get(supervisorMountedView);
    if (stateEntry?.placeholder?.parentNode) stateEntry.placeholder.parentNode.insertBefore(supervisorMountedView, stateEntry.placeholder.nextSibling);
    supervisorMountedView.classList.remove("supervisor-shared-view");
    supervisorMountedView.classList.toggle("active", Boolean(stateEntry?.wasActive));
    supervisorMountedView = null;
  }

  function mountSupervisorSharedView(name) {
    restoreSupervisorSharedView();
    const soonModules = ["cotador", "comprar_leads", "treinamentos", "agenda"];
    const viewName = soonModules.includes(name) ? "soon" : name;
    const node = el.views[viewName];
    if (!node || !el.supervisorOperationContent) { renderSupervisorOperation(name); return; }
    let stateEntry = supervisorSharedViewState.get(node);
    if (!stateEntry) {
      const placeholder = document.createComment(`supervisor-shared-${viewName}`);
      node.parentNode.insertBefore(placeholder, node);
      stateEntry = { placeholder, wasActive: node.classList.contains("active") };
      supervisorSharedViewState.set(node, stateEntry);
    } else stateEntry.wasActive = node.classList.contains("active");
    if (viewName === "soon") {
      if (el.defaultSoonPanel) el.defaultSoonPanel.hidden = false;
      if (el.teamUpgradePanel) el.teamUpgradePanel.hidden = true;
      const titles = { cotador: "Cotador", comprar_leads: "Comprar Leads", treinamentos: "Treinamentos", agenda: "Agenda" };
      if (el.soonTitle) el.soonTitle.textContent = titles[name] || "Módulo em breve";
      if (el.soonText) el.soonText.textContent = `${titles[name] || "Este módulo"} está no roadmap e será liberado em uma próxima atualização.`;
    }
    el.supervisorOperationContent.replaceChildren(node);
    node.classList.add("active", "supervisor-shared-view");
    supervisorMountedView = node;
  }

  function setSupervisorOperation(name) {
    el.supervisorNavItems.forEach((button) => button.classList.toggle("active", button.dataset.supervisorOperation === name));
    el.supervisorViews.forEach((view) => view.classList.toggle("active", view.id === "supervisor-view-operation"));
    if (["instance", "connect", "crm", "broadcast", "cotador", "comprar_leads", "treinamentos", "agenda"].includes(name)) mountSupervisorSharedView(name);
    else renderSupervisorOperation(name);
    const labels = { instance: "Minha Instância", connect: "Conectar WhatsApp", crm: "Meus Leads", clients: "Clientes", broadcast: "Disparos", cotador: "Cotador", comprar_leads: "Comprar Leads", treinamentos: "Treinamentos", agenda: "Agenda" };
    if (el.supervisorViewTitle) el.supervisorViewTitle.textContent = labels[name] || "Operação";
  }

  function mockSupervisorLogin() {
    if (el.supervisorStatus) {
      el.supervisorStatus.textContent = "Acesso supervisor em preparação.";
      el.supervisorStatus.classList.remove("error");
      el.supervisorStatus.classList.add("ok");
    }
    openSupervisorArea();
  }

  function supervisorInitials(name) {
    return String(name || "").split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
  }

  function renderSupervisorMocks() {
    const brokerRows = SUPERVISOR_BROKERS.map((broker) => `
      <div class="supervisor-broker-row">
        <div class="supervisor-person"><span class="supervisor-avatar">${escapeHtml(supervisorInitials(broker.name))}</span><b>${escapeHtml(broker.name)}${broker.supervisor ? ' <small class="supervisor-role-badge">Supervisor</small>' : ""}</b></div>
        <span><i class="status-dot ${escapeHtml(broker.status)}"></i>${escapeHtml(broker.statusLabel)}</span>
        <b>${broker.sales} vendas</b>
        <div><div class="supervisor-progress"><i style="width:${broker.goal}%"></i></div><small>${broker.goal}% da meta</small></div>
        <span>${escapeHtml(broker.login)}</span>
      </div>`).join("");
    if (el.supervisorBrokerList) el.supervisorBrokerList.innerHTML = brokerRows;
    if (el.supervisorBrokerRows) el.supervisorBrokerRows.innerHTML = SUPERVISOR_BROKERS.map((broker) => `
      <tr><td><div class="supervisor-person"><span class="supervisor-avatar">${escapeHtml(supervisorInitials(broker.name))}</span><b>${escapeHtml(broker.name)}</b></div></td><td><code>${escapeHtml(broker.token)}</code></td><td><i class="status-dot ${escapeHtml(broker.status)}"></i>${escapeHtml(broker.statusLabel)}</td><td>${escapeHtml(broker.login)}</td><td>${broker.sales}</td><td><div class="supervisor-broker-actions"><button class="tiny-btn" type="button" data-supervisor-broker-action="copy" data-broker-id="${broker.id}">Copiar acesso</button><button class="tiny-btn" type="button" data-supervisor-broker-action="edit" data-broker-id="${broker.id}">Editar</button><button class="tiny-btn" type="button" data-supervisor-broker-action="disable" data-broker-id="${broker.id}">Desativar</button></div></td></tr>`).join("");

    const stages = [
      ["novos", "Novos", "Novos"], ["em_atendimento", "Em atendimento", "Em atendimento"], ["cotacao", "Cotação", "Cotação Enviada"], ["documentacao", "Doc. recebida", "Documentação recebida"],
      ["venda", "Venda cadastrada", "Venda cadastrada"], ["boleto", "Boleto gerado", "Boleto Gerado"], ["fechamento", "Fechamento", "Fechamento"], ["perdida", "Venda perdida", "Venda Perdida"]
    ];
    if (el.supervisorKanban) el.supervisorKanban.innerHTML = stages.map(([key, label, fullLabel]) => {
      const deals = SUPERVISOR_DEALS.filter((deal) => deal.stage === key);
      const total = deals.reduce((sum, deal) => sum + Number(String(deal.value || "").replace(/[^0-9,]/g, "").replace(",", ".") || 0), 0);
      const totalLabel = ["novos", "em_atendimento"].includes(key) ? "Valor especulativo" : key === "fechamento" ? "Realizado" : key === "perdida" ? "Perdido" : "Previsto";
      return `<section class="supervisor-lane"><header title="${escapeHtml(fullLabel)}"><b>${escapeHtml(label)}</b><span>${deals.length}</span></header><div class="supervisor-lane-cards">${deals.map((deal) => `<article class="supervisor-deal"><b title="${escapeHtml(deal.client)}">${escapeHtml(deal.client)}</b><span title="Responsável: ${escapeHtml(deal.seller)}">${escapeHtml(deal.seller)}</span><div><small>${escapeHtml(deal.value)}</small><button class="tiny-btn" type="button" data-supervisor-deal="${deal.id}">Ver</button></div></article>`).join("")}</div><footer class="supervisor-lane-total ${key === "perdida" ? "lost" : ""}"><b>${deals.length} negócio${deals.length === 1 ? "" : "s"}</b><span>${totalLabel}: ${formatMoney(String(total))}</span></footer></section>`;
    }).join("");

    renderSupervisorCustomers();
    if (el.supervisorGoalRows) el.supervisorGoalRows.innerHTML = SUPERVISOR_BROKERS.slice(0, 6).map((broker) => `<div class="supervisor-goal-row"><b>${escapeHtml(broker.name)}</b><div class="supervisor-progress"><i style="width:${broker.goal}%"></i></div><span>${broker.goal}% · ${broker.sales} vendas</span></div>`).join("");
  }

  function filteredSupervisorCustomers() {
    const search = String(el.supervisorClientSearch?.value || "").trim().toLowerCase();
    const status = el.supervisorClientStatusFilter?.value || "";
    return SUPERVISOR_CUSTOMERS.filter((customer) => (!search || [customer.client, customer.seller, customer.product, customer.phone].join(" ").toLowerCase().includes(search)) && (!status || customer.status === status));
  }

  function renderSupervisorCustomers() {
    const rows = filteredSupervisorCustomers();
    if (el.supervisorClientMetrics) el.supervisorClientMetrics.innerHTML = [
      ["Clientes", SUPERVISOR_CUSTOMERS.length], ["Ativos", SUPERVISOR_CUSTOMERS.filter((item) => item.status === "Ativo").length], ["A renovar", SUPERVISOR_CUSTOMERS.filter((item) => item.status === "A renovar").length], ["Vidas", SUPERVISOR_CUSTOMERS.reduce((sum, item) => sum + item.lives, 0)], ["Produção", "R$ 13.170"]
    ].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></article>`).join("");
    if (el.supervisorCustomerRows) el.supervisorCustomerRows.innerHTML = rows.map((customer) => `
      <tr><td class="select-col"><input type="checkbox" data-supervisor-select-client="${customer.id}" ${supervisorSelectedClientIds.has(customer.id) ? "checked" : ""}></td><td><div class="supervisor-client-name"><b title="${escapeHtml(customer.client)}">${escapeHtml(customer.client)}</b><span title="${escapeHtml(customer.phone)}">${escapeHtml(customer.phone)}</span></div></td><td title="${escapeHtml(customer.seller)}">${escapeHtml(customer.seller)}</td><td><span class="product-icons compact-products clickable-products supervisor-product-icons"><button class="product-icon-button" type="button" data-supervisor-product="${customer.id}" title="Abrir ${escapeHtml(customer.product)}">${productIconSvg(customer.product)}</button></span></td><td title="${escapeHtml(customer.status)}">${escapeHtml(customer.status)}</td><td>${customer.lives}</td><td>${escapeHtml(customer.value)}</td><td title="${escapeHtml(customer.renewal)}">${escapeHtml(customer.renewal)}</td><td title="${escapeHtml(customer.post)}">${escapeHtml(customer.post)}</td><td><div class="supervisor-client-actions"><button class="supervisor-row-action" type="button" data-supervisor-client-action="edit" data-client-id="${customer.id}" title="Editar cliente" aria-label="Editar cliente">✎</button><button class="supervisor-row-action" type="button" data-supervisor-client-action="product" data-client-id="${customer.id}" title="Novo produto" aria-label="Novo produto">＋</button><button class="supervisor-row-action" type="button" data-supervisor-client-action="post-sale" data-client-id="${customer.id}" title="Agendar pós-venda" aria-label="Agendar pós-venda">◷</button><button class="supervisor-row-action" type="button" data-supervisor-client-action="archive" data-client-id="${customer.id}" title="Arquivar cliente" aria-label="Arquivar cliente">□</button></div></td></tr>`).join("");
    if (el.supervisorSelectAllClients) el.supervisorSelectAllClients.checked = rows.length > 0 && rows.every((customer) => supervisorSelectedClientIds.has(customer.id));
  }

  function openSupervisorArea() {
    stopCrmRealtime();
    if (el.supervisorScreen) el.supervisorScreen.hidden = false;
    document.body.classList.add("supervisor-mode");
    setSupervisorView("dashboard");
    renderSupervisorMocks();
    renderCompanyIdentity();
  }

  function closeSupervisorArea() {
    restoreSupervisorSharedView();
    document.body.classList.remove("supervisor-mode");
    if (el.supervisorScreen) el.supervisorScreen.hidden = true;
    setAuthLocked(true);
    [el.supervisorDetailModal, el.supervisorClientModal, el.supervisorProductModal, el.supervisorProductFolderModal, el.supervisorPostSaleModal].forEach((modal) => {
      if (modal?.open) modal.close();
    });
  }

  function setSupervisorView(name) {
    restoreSupervisorSharedView();
    const titles = { dashboard: "Dashboard da Equipe", brokers: "Corretores", funnel: "Funil de Vendas", customers: "Todos os Clientes", goals: "Metas", reports: "Relatórios", messages: "Mensagens", settings: "Configurações da Corretora" };
    el.supervisorNavItems.forEach((button) => button.classList.toggle("active", button.dataset.supervisorView === name));
    el.supervisorViews.forEach((view) => view.classList.toggle("active", view.id === `supervisor-view-${name}`));
    if (el.supervisorViewTitle) el.supervisorViewTitle.textContent = titles[name] || "Supervisor";
    if (name === "settings") renderCompanyIdentity();
  }

  function openSupervisorModal(title, subtitle, fields) {
    if (!el.supervisorDetailModal) return;
    el.supervisorModalTitle.textContent = title;
    el.supervisorModalSubtitle.textContent = subtitle || "";
    el.supervisorModalBody.innerHTML = fields.map(([label, value]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></article>`).join("");
    el.supervisorDetailModal.showModal();
  }

  function generateSupervisorAccessMessage() {
    const name = String(el.supervisorBrokerName?.value || "").trim();
    const token = String(el.supervisorBrokerToken?.value || "").trim();
    if (!name || !token) {
      el.supervisorGeneratedMessage.hidden = true;
      el.supervisorAccessStatus.textContent = "Preencha o nome do corretor e o token personalizado.";
      el.supervisorAccessStatus.classList.add("error");
      el.supervisorAccessStatus.classList.remove("ok");
      return;
    }
    const message = supervisorAccessMessage(name, token);
    if (!el.supervisorGeneratedMessage) return;
    el.supervisorGeneratedMessage.hidden = false;
    el.supervisorGeneratedMessage.querySelector("p").textContent = message;
    el.supervisorAccessStatus.textContent = "Acesso gerado. Revise e copie a mensagem.";
    el.supervisorAccessStatus.classList.remove("error");
    el.supervisorAccessStatus.classList.add("ok");
  }

  function supervisorAccessMessage(name, token) {
    return `Olá, ${name}. Seu acesso à Lungo Corretores foi liberado.\n\nLink: https://crm.lungocorretores.com.br\nToken: ${token}\n\nAcesse, aceite os termos de uso e conecte seu WhatsApp pelo QR Code.`;
  }

  async function copySupervisorText(value, successMessage) {
    if (!navigator.clipboard?.writeText) { toast("Cópia automática indisponível neste navegador."); return false; }
    try { await navigator.clipboard.writeText(value); toast(successMessage); return true; }
    catch { toast("Não foi possível copiar."); return false; }
  }

  async function copySupervisorMessage() {
    const message = el.supervisorGeneratedMessage?.querySelector("p")?.textContent || "";
    if (!message) return;
    const copied = await copySupervisorText(message, "Mensagem copiada");
    el.supervisorAccessStatus.textContent = copied ? "Mensagem copiada" : "Não foi possível copiar a mensagem.";
    el.supervisorAccessStatus.classList.toggle("ok", copied);
    el.supervisorAccessStatus.classList.toggle("error", !copied);
  }

  function openSupervisorClientEditor(customer = null) {
    supervisorActiveClientId = customer?.id || "";
    el.supervisorClientModalTitle.textContent = customer ? "Editar cliente" : "Novo cliente";
    el.supervisorClientName.value = customer?.client || "";
    el.supervisorClientSeller.value = customer?.seller || "Ana Souza";
    el.supervisorClientPhone.value = customer?.phone || "";
    el.supervisorClientEmail.value = customer?.email || "";
    el.supervisorClientStatus.value = customer?.status || "Ativo";
    el.supervisorClientNotes.value = customer?.notes || "";
    el.supervisorClientModal.showModal();
  }

  function openSupervisorNewProduct(customer) {
    supervisorActiveClientId = customer.id;
    el.supervisorProductClientName.textContent = customer.client;
    el.supervisorProductModal.showModal();
  }

  function openSupervisorProductFolder(customer) {
    supervisorActiveClientId = customer.id;
    el.supervisorFolderTitle.textContent = customer.product;
    el.supervisorFolderClientName.textContent = `${customer.client} · ${customer.seller}`;
    el.supervisorProductDetails.innerHTML = [["Produto", customer.product], ["Vidas", String(customer.lives)], ["Valor", customer.value], ["Data", customer.date], ["Renovação", customer.renewal], ["Observação", customer.notes]].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></article>`).join("");
    el.supervisorDocumentList.innerHTML = `<div class="supervisor-document-row"><div><b>proposta-assinada.pdf</b><span>PDF · 1,2 MB</span></div><button class="tiny-btn" type="button" data-supervisor-remove-document>Remover</button></div><div class="supervisor-document-row"><div><b>documentos-cliente.pdf</b><span>PDF · 840 KB</span></div><button class="tiny-btn" type="button" data-supervisor-remove-document>Remover</button></div>`;
    el.supervisorProductFolderModal.showModal();
  }

  function openSupervisorPostSale(customer) {
    supervisorActiveClientId = customer.id;
    el.supervisorPostSaleClientName.textContent = `${customer.client} · ${customer.seller}`;
    el.supervisorPostSaleModal.showModal();
  }

  function sendSupervisorMessage() {
    const message = String(el.supervisorMessageText?.value || "").trim();
    if (!message) {
      el.supervisorMessageStatus.textContent = "Digite uma mensagem antes de enviar.";
      el.supervisorMessageStatus.classList.add("error");
      return;
    }
    const recipient = el.supervisorMessageRecipient?.value || "Todos os corretores";
    el.supervisorMessageHistory?.insertAdjacentHTML("afterbegin", `<article><b>${escapeHtml(recipient)}</b><span>${escapeHtml(message)}</span><small>Agora · envio simulado</small></article>`);
    el.supervisorMessageText.value = "";
    el.supervisorMessageStatus.textContent = "Notificação adicionada ao histórico fictício.";
    el.supervisorMessageStatus.classList.remove("error");
    el.supervisorMessageStatus.classList.add("ok");
  }

  function setWhatsappPending(pending) {
    document.body.classList.toggle("whatsapp-pending", Boolean(pending));
  }

  async function validateTokenAccess(token) {
    const value = String(token || "").trim();
    if (!value) throw new Error("Informe o token de acesso.");
    const data = await api("/api/onboarding/check-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: value })
    });
    state.token = value;
    state.clientName = data.client?.nome || data.nome || state.clientName || "";
    state.instanceName = data.instanceName || data.client?.instanceName || data.instance || state.instanceName || "";
    if (el.globalToken) el.globalToken.value = state.token;
    if (el.tokenInput) el.tokenInput.value = state.token;
    if (el.accessTokenInput) el.accessTokenInput.value = state.token;
    if (state.instanceName && el.broadcastInstance) el.broadcastInstance.value = state.instanceName;
    try {
      await api("/api/admin-master/touch-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: value })
      });
    } catch {}
    return data;
  }

  async function refreshInstanceSilent() {
    const data = await api("/api/onboarding/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: state.token })
    });
    state.clientName = data.client?.nome || state.clientName || "";
    state.instanceName = data.instanceName || data.client?.instanceName || state.instanceName || "";
    state.connected = Boolean(data.connected);
    if (state.instanceName && el.broadcastInstance) el.broadcastInstance.value = state.instanceName;
    saveAccess();
    renderAccess();
    return data;
  }

  async function enterWithToken(options = {}) {
    const silent = Boolean(options.silent);
    const fromTopbar = Boolean(options.fromTopbar);
    const rawToken = fromTopbar ? el.globalToken?.value : el.accessTokenInput?.value;
    const token = String(rawToken || state.token || "").trim();
    try {
      if (!silent) setAuthStatus("Validando token...", "");
      await validateTokenAccess(token);
      if (el.rememberAccessCheck?.checked !== false || fromTopbar) saveAccess();
      let status = null;
      try { status = await refreshInstanceSilent(); }
      catch { state.connected = false; saveAccess(); renderAccess(); }
      const termsAccepted = await ensureTermsAccepted();
      if (!termsAccepted) {
        setAuthLocked(true);
        setWhatsappPending(false);
        setAuthStatus("Aceite os Termos de Uso para continuar.", "error");
        return false;
      }
      setAuthLocked(false);
      setWhatsappPending(!state.connected);
      setAuthStatus(state.connected ? "Acesso liberado." : "Token validado. Conecte o WhatsApp pelo QR Code.", "ok");
      if (state.connected) {
        setView("crm");
        if (isLeadSyncEnabled()) { loadCrm(true); startCrmRealtime(); }
      } else {
        setView("connect");
        if (!status?.qrCodeBase64 && !status?.qrCode) connectWhatsApp();
      }
      return true;
    } catch (error) {
      setAuthLocked(true);
      setWhatsappPending(false);
      setAuthStatus(error.message || "Token inválido ou inativo.", "error");
      if (!silent) toast(error.message || "Token inválido ou inativo.");
      return false;
    }
  }

  async function bootAccess() {
    if (!state.token) {
      setAuthLocked(true);
      setWhatsappPending(false);
      setAuthStatus("Informe o token para liberar o sistema.", "");
      renderCrm();
      return;
    }
    setAuthLocked(true);
    setAuthStatus("Validando acesso salvo...", "");
    await enterWithToken({ silent: true });
  }

  function setView(name) {
    if (!state.token) {
      setAuthLocked(true);
      setAuthStatus("Informe o token para liberar o sistema.", "");
      return;
    }
    if (!state.connected && !["connect", "instance"].includes(name)) {
      name = "connect";
      setWhatsappPending(true);
      if (el.connectStatus) el.connectStatus.textContent = "Token validado. Conecte o WhatsApp para liberar o painel.";
    }
    const titles = {
      crm: ["Meus Leads", "Pipeline comercial com lista, kanban, importação e exportação."],
      clients: ["Clientes", "Carteira ativa, clientes em fechamento, pós-venda e faturamento."],
      connect: ["Conectar WhatsApp", "Conecte a instância por QR Code."],
      broadcast: ["Disparos", "Envie mensagens para bases autorizadas."],
      instance: ["Minha Instância", "Consulte o status da conexão."],
      cotador: ["Cotador", "Cotação de planos e propostas comerciais."],
      comprar_leads: ["Comprar leads", "Aquisição e distribuição de oportunidades."],
      vendedores: ["Vendedores", "Gestão de equipe e acompanhamento comercial."],
      treinamentos: ["Treinamentos", "Materiais e trilhas para capacitação da equipe."],
      relatorios: ["Relatórios", "Indicadores comerciais e relatórios avançados."],
      agenda: ["Agenda", "Compromissos, retornos e programação comercial."]
    };
    const isSoon = ["cotador", "comprar_leads", "vendedores", "treinamentos", "relatorios", "agenda"].includes(name);
    const activeView = isSoon ? "soon" : name;
    el.navItems.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === name));
    Object.entries(el.views).forEach(([key, node]) => node?.classList.toggle("active", key === activeView));
    const title = titles[name] || ["Módulo", "Em breve."];
    el.viewTitle.textContent = title[0];
    el.viewSubtitle.textContent = title[1];
    if (isSoon) {
      if (el.soonTitle) el.soonTitle.textContent = title[0];
      if (el.soonText) el.soonText.textContent = `${title[0]} está no roadmap e será liberado em uma próxima atualização.`;
      stopCrmRealtime();
    }
    if (name === "crm") {
      if (isLeadSyncEnabled()) { loadCrm(true); startCrmRealtime(); }
      else { state.leads = []; renderCrm(); stopCrmRealtime(); }
    }
    else stopCrmRealtime();
    if (name === "clients") loadClients();
  }

  function tokenQuery() {
    if (!state.token) throw new Error("Informe e salve o token do usuário.");
    return encodeURIComponent(state.token);
  }

  function leadSyncKey() {
    return state.token ? `lungo-leads-sync-enabled-${state.token}` : "lungo-leads-sync-enabled";
  }

  function isLeadSyncEnabled() {
    return state.token && localStorage.getItem(leadSyncKey()) === "1";
  }

  function setLeadSyncEnabled(value) {
    if (!state.token) return;
    if (value) localStorage.setItem(leadSyncKey(), "1");
    else localStorage.removeItem(leadSyncKey());
  }

  function fillStatusOptions() {
    const options = [`<option value="">Todos os status</option>`]
      .concat(FILTER_STATUSES.map((item) => `<option value="${item.value}">${item.label}</option>`));
    el.crmStatusFilter.innerHTML = options.join("");
    el.leadStatus.innerHTML = STATUSES.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
    if (el.clientStatusFilter) {
      el.clientStatusFilter.innerHTML = [`<option value="">Todos os status</option>`].concat(CLIENT_STATUSES.map((item) => `<option value="${item.value}">${item.label}</option>`)).join("");
    }
    if (el.clientStatus) {
      el.clientStatus.innerHTML = CLIENT_STATUSES.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
    }
    if (el.clientProduto) el.clientProduto.innerHTML = productSelectOptions(el.clientProduto.value || "Saúde");
    if (el.baseSaleProduto) el.baseSaleProduto.innerHTML = productSelectOptions(el.baseSaleProduto.value || "Saúde");
  }

  function filteredLeads() {
    const q = el.crmSearch.value.trim().toLowerCase();
    const status = el.crmStatusFilter.value;
    return state.leads.filter((lead) => {
      if (!isUsableLead(lead)) return false;
      if (status && lead.status !== status) return false;
      if (!status && ["arquivado", "lixeira"].includes(lead.status)) return false;
      if (!inSelectedPeriod(lead)) return false;
      if (!q) return true;
      return [displayName(lead), displayPhone(lead), lead.email, lead.cidade, lead.planoInteresse, lead.cnpjOuPf, lead.lastMessage]
        .join(" ").toLowerCase().includes(q);
    });
  }

  function avatarHtml(lead) {
    const initial = escapeHtml((displayName(lead) || displayPhone(lead) || "?").trim().slice(0, 1).toUpperCase() || "?");
    if (lead.profilePictureUrl) return `<span class="avatar"><img src="${escapeHtml(lead.profilePictureUrl)}" alt=""></span>`;
    return `<span class="avatar">${initial}</span>`;
  }

  function iconSvg(name) {
    const icons = {
      whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.7a8 8 0 0 1-11.7 7.1L4 20l1.2-4.1A8 8 0 1 1 20 11.7Z"/><path d="M9 8.7c.2 2.7 2 5 4.8 6.2l1.4-1.3 2 .5"/></svg>`,
      edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13 7 4 4"/></svg>`,
      archive: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M6 7v12h12V7"/><path d="M9 11h6"/></svg>`,
      restore: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M6 7v12h12V7"/><path d="M8 14h8"/><path d="m11 11-3 3 3 3"/></svg>`,
      delete: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
      view: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`,
      clock: clockIcon()
    };
    return icons[name] || "";
  }

  function whatsappUrl(lead) {
    const digits = normalizePhone(displayPhone(lead) || "");
    if (digits.length < 10) return "";
    return `https://wa.me/${digits}`;
  }

  function leadScheduleActive(lead) {
    const s = lead?.mensagemProgramada || lead?.followUpSchedule || null;
    if (!s || s.ativo === false || s.status === "sent" || s.status === "cancelled") return false;
    if (!s.data) return false;
    const dt = new Date(`${s.data}T${s.hora || "09:00"}`);
    return Number.isNaN(dt.getTime()) ? true : dt >= new Date();
  }

  function actionButtons(lead) {
    const wa = whatsappUrl(lead);
    const whatsapp = wa
      ? `<a class="icon-action whatsapp" href="${escapeHtml(wa)}" target="_blank" rel="noopener" title="Falar no WhatsApp" data-action="chat" data-id="${escapeHtml(lead.id)}">${iconSvg("whatsapp")}</a>`
      : `<button class="icon-action disabled" type="button" title="WhatsApp indisponível">${iconSvg("whatsapp")}</button>`;
    const scheduled = leadScheduleActive(lead);
    const scheduleBtn = `<button class="icon-action schedule ${scheduled ? "active-schedule" : ""}" type="button" data-action="schedule" data-id="${escapeHtml(lead.id)}" title="Programar mensagem">${iconSvg("clock")}</button>`;
    return `<div class="row-buttons">${whatsapp}${scheduleBtn}<button class="icon-action" type="button" data-action="view" data-id="${escapeHtml(lead.id)}" title="Ver mais">${iconSvg("edit")}</button></div>`;
  }

  function renderMetrics() {
    const activeLeads = state.leads.filter((lead) => !["arquivado", "lixeira"].includes(lead.status) && isUsableLead(lead));
    const items = [{ value: "total", label: "Total", count: activeLeads.length }]
      .concat(STATUSES.map((status) => ({ ...status, count: activeLeads.filter((lead) => lead.status === status.value).length })));
    el.metricsBar.innerHTML = items.map((item) => `
      <article class="metric metric-${escapeHtml(item.value)}">
        <span>${escapeHtml(item.label)}</span>
        <b>${item.count}</b>
      </article>
    `).join("");
  }

  function renderList() {
    const leads = filteredLeads();
    if (!leads.length) {
      const msg = isLeadSyncEnabled() ? "Nenhum lead encontrado." : "Clique em Sincronizar conversas para carregar as conversas do WhatsApp.";
      el.crmRows.innerHTML = `<tr><td colspan="9"><div class="empty-state">${msg}</div></td></tr>`;
      renderLeadSelectionState();
      return;
    }

    el.crmRows.innerHTML = leads.map((lead) => `
      <tr data-id="${escapeHtml(lead.id)}" class="lead-row status-row-${escapeHtml(lead.status)} ${isLeadUnread(lead) ? "lead-unread" : ""}">
        <td class="select-col"><input type="checkbox" data-select-lead="${escapeHtml(lead.id)}" ${state.selectedLeadIds.has(lead.id) ? "checked" : ""} aria-label="Selecionar lead"></td>
        <td>
          <div class="contact-cell">
            ${avatarHtml(lead)}
            <div class="contact-main">
              <b title="${escapeHtml(displayName(lead))}">${unreadDotHtml(lead)}${escapeHtml(displayName(lead))}</b>
              <span>${escapeHtml(displayPhone(lead) || "—")}${lead.email ? ` • ${escapeHtml(lead.email)}` : ""}</span>
            </div>
          </div>
        </td>
        <td><span class="status-badge status-${escapeHtml(lead.status)}">${escapeHtml(lead.statusLabel || STATUS_LABEL[lead.status] || lead.status)}</span></td>
        <td>${escapeHtml(lead.qtdVidas || "—")}</td>
        <td>${escapeHtml(formatMoney(lead.valorNegocio))}</td>
        <td><div class="truncate" title="${escapeHtml(lead.planoInteresse)}">${escapeHtml(lead.planoInteresse || "—")}</div></td>
        <td>${escapeHtml(lead.cidade || "—")}</td>
        <td><div class="truncate" title="${escapeHtml(lead.lastMessage)}">${escapeHtml(lead.lastMessage || "—")}</div><span class="muted">${formatDate(lead.lastMessageAt || lead.updatedAt)}</span></td>
        <td>${actionButtons(lead)}</td>
      </tr>
    `).join("");
    renderLeadSelectionState();
  }

  function renderKanban() {
    const leads = filteredLeads().filter((lead) => !["arquivado", "lixeira"].includes(lead.status));
    const grouped = Object.fromEntries(STATUSES.map((status) => [status.value, []]));
    leads.forEach((lead) => {
      const key = grouped[lead.status] ? lead.status : "novo";
      grouped[key].push(lead);
    });

    el.kanbanView.innerHTML = `
      <div class="kanban-scroll">
        <div class="kanban-board">
          ${STATUSES.map((status) => `
            <section class="kanban-col" data-status="${status.value}">
              <header><b>${status.label}</b><span>${grouped[status.value].length}</span></header>
              <div class="kanban-lane" data-lane="${status.value}">
                ${grouped[status.value].map((lead) => `
                  <article class="kanban-card status-card-${escapeHtml(lead.status)} ${isLeadUnread(lead) ? "lead-unread" : ""}" draggable="true" data-id="${escapeHtml(lead.id)}">
                    <div class="top">${avatarHtml(lead)}<b title="${escapeHtml(displayName(lead))}">${unreadDotHtml(lead)}${escapeHtml(displayName(lead))}</b></div>
                    <small>${escapeHtml(displayPhone(lead) || "—")}</small>
                    <small title="${escapeHtml(lead.lastMessage)}">${escapeHtml(lead.lastMessage || lead.planoInteresse || "Sem mensagem")}</small>
                    <div class="card-meta">
                      ${lead.qtdVidas ? `<span>${escapeHtml(lead.qtdVidas)} vidas</span>` : ""}
                      ${lead.valorNegocio ? `<span>${escapeHtml(formatMoney(lead.valorNegocio))}</span>` : ""}
                      ${lead.cidade ? `<span>${escapeHtml(lead.cidade)}</span>` : ""}
                    </div>
                    ${actionButtons(lead)}
                  </article>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderCrm() {
    renderMetrics();
    renderList();
    renderKanban();
  }

  async function loadCrm(silent = false) {
    try {
      if (!state.token) return;
      if (!isLeadSyncEnabled()) { state.leads = []; renderCrm(); return; }
      const data = await api(`/api/crm/auto-leads?token=${tokenQuery()}&limit=500&includeArchived=true&_=${Date.now()}`);
      state.leads = (data.leads || []).map((lead) => ({ ...lead, status: normalizeStatus(lead.status) })).filter((lead) => normalizeStatus(lead.status) !== "lixeira" && isUsableLead(lead));
      if (data.client) {
        state.clientName = data.client.nome || state.clientName;
        state.instanceName = data.client.instanceName || state.instanceName;
        saveAccess();
        renderAccess();
      }
      renderCrm();
    } catch (error) {
      if (!silent) toast(error.message);
    }
  }

  function startCrmRealtime() {
    stopCrmRealtime();
    state.crmRealtimeTimer = setInterval(async () => {
      if (!state.token || !isLeadSyncEnabled()) return;
      await loadCrm(true);
      if (el.views.clients?.classList.contains("active")) await loadClients(true);
    }, 12000);
  }

  function stopCrmRealtime() {
    if (state.crmRealtimeTimer) clearInterval(state.crmRealtimeTimer);
    state.crmRealtimeTimer = null;
  }

  function normalizeStatus(value) {
    const raw = String(value || "novo").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const aliases = {
      conversa_recente: "novo",
      novo_lead: "novo",
      novo: "novo",
      novos: "novo",
      atendimento: "em_atendimento",
      em_atendimento: "em_atendimento",
      cotacao: "cotacao_enviada",
      cotacao_enviada: "cotacao_enviada",
      documentacao: "documentacao_recebida",
      documentacao_recebida: "documentacao_recebida",
      venda_cadastrada: "venda_cadastrada",
      boleto: "boleto_gerado",
      boleto_gerado: "boleto_gerado",
      fechamento: "fechamento",
      fechado: "fechamento",
      perdido: "venda_perdida",
      venda_perdida: "venda_perdida",
      arquivado: "arquivado",
      arquivo: "arquivado",
      lixeira: "lixeira",
      excluido: "lixeira",
      deletado: "lixeira",
      ignorado: "lixeira"
    };
    return aliases[raw] || (STATUS_LABEL[raw] ? raw : (raw === "lixeira" ? "lixeira" : "novo"));
  }

  function setMode(mode) {
    state.crmMode = mode;
    el.listModeBtn.classList.toggle("active", mode === "list");
    el.kanbanModeBtn.classList.toggle("active", mode === "kanban");
    el.listView.classList.toggle("active", mode === "list");
    el.kanbanView.classList.toggle("active", mode === "kanban");
    if (mode === "kanban") renderKanban();
  }

  function getLead(id) {
    return state.leads.find((lead) => lead.id === id) || null;
  }

  function openLeadModal(lead = null) {
    if (lead?.id) markLeadSeen(lead);
    const item = lead || { status: "novo" };
    el.leadId.value = item.id || "";
    el.leadNome.value = item.nome || "";
    el.leadTelefone.value = item.telefone || "";
    el.leadEmail.value = item.email || "";
    el.leadPessoaTipo.value = item.pessoaTipo || "";
    el.leadCnpjOuPf.value = item.cnpjOuPf || "";
    el.leadQtdVidas.value = item.qtdVidas || "";
    el.leadValorNegocio.value = item.valorNegocio || "";
    el.leadPlanoInteresse.value = item.planoInteresse || "";
    el.leadCidade.value = item.cidade || "";
    el.leadStatus.value = normalizeStatus(item.status);
    el.leadObservacao.value = item.observacao || "";
    el.modalTitle.textContent = item.id ? "Editar lead" : "Novo lead";
    el.modalSubtitle.textContent = item.lastMessage ? `Última mensagem: ${item.lastMessage.slice(0, 120)}` : "Preencha os dados comerciais.";
    el.archiveLeadBtn.hidden = !item.id;
    if (el.scheduleLeadBtn) el.scheduleLeadBtn.hidden = !item.id;
    el.leadModal.showModal();
  }

  function closeLeadModal() {
    el.leadModal.close();
  }

  function openLeadScheduleModal(lead = null) {
    const item = lead || getLead(el.leadId.value);
    if (!item?.id) return toast("Salve o lead antes de programar a mensagem.");
    const s = item.mensagemProgramada || {};
    state.leadScheduleTarget = item.id;
    el.leadScheduleId.value = item.id;
    el.leadScheduleName.textContent = displayName(item) || displayPhone(item) || "Lead";
    el.leadScheduleData.value = s.data || item.proximoRetorno || "";
    el.leadScheduleHora.value = s.hora || "09:00";
    el.leadScheduleMensagem.value = s.mensagem || `Olá, ${displayName(item) || "{nome}"}! Conforme combinado, estou retomando nosso atendimento.`;
    el.leadScheduleModal.showModal();
  }

  function closeLeadScheduleModal() {
    el.leadScheduleModal?.close();
    state.leadScheduleTarget = null;
  }

  async function saveLeadSchedule(event) {
    event.preventDefault();
    try {
      const id = el.leadScheduleId.value || state.leadScheduleTarget;
      if (!id) throw new Error("Lead não encontrado.");
      const payload = {
        token: state.token,
        data: el.leadScheduleData.value,
        hora: el.leadScheduleHora.value || "09:00",
        mensagem: el.leadScheduleMensagem.value.trim(),
        recorrencia: "unica",
        tipo: "retorno"
      };
      if (!payload.data) throw new Error("Informe a data de retorno.");
      if (!payload.hora) throw new Error("Informe a hora.");
      if (!payload.mensagem) throw new Error("Informe a mensagem.");
      await api(`/api/scheduled/leads/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      closeLeadScheduleModal();
      if (el.leadModal?.open) closeLeadModal();
      toast("Mensagem programada.");
      await loadCrm(true);
    } catch (error) {
      toast(error.message);
    }
  }

  function leadPayload() {
    return {
      token: state.token,
      nome: el.leadNome.value.trim(),
      telefone: normalizePhone(el.leadTelefone.value),
      email: el.leadEmail.value.trim(),
      pessoaTipo: el.leadPessoaTipo.value,
      cnpjOuPf: el.leadCnpjOuPf.value.trim(),
      qtdVidas: el.leadQtdVidas.value.trim(),
      valorNegocio: el.leadValorNegocio.value.trim(),
      planoInteresse: el.leadPlanoInteresse.value.trim(),
      cidade: el.leadCidade.value.trim(),
      status: el.leadStatus.value,
      observacao: el.leadObservacao.value.trim()
    };
  }

  async function saveLead(event) {
    event.preventDefault();
    try {
      const id = el.leadId.value;
      const payload = leadPayload();
      const path = id ? `/api/crm/auto-leads/${encodeURIComponent(id)}` : "/api/crm/auto-leads";
      const method = id ? "PATCH" : "POST";
      await api(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      closeLeadModal();
      toast("Lead salvo.");
      await loadCrm();
    } catch (error) {
      toast(error.message);
    }
  }

  async function archiveLead(id) {
    if (!id) return;
    try {
      await api(`/api/crm/auto-leads/${encodeURIComponent(id)}/archive?token=${tokenQuery()}`, { method: "POST" });
      const lead = getLead(id);
      if (lead) lead.status = "arquivado";
      renderCrm();
      toast("Lead arquivado.");
    } catch (error) {
      toast(error.message);
    }
  }

  async function unarchiveLead(id) {
    if (!id) return;
    try {
      await api(`/api/crm/auto-leads/${encodeURIComponent(id)}/unarchive?token=${tokenQuery()}`, { method: "POST" });
      const lead = getLead(id);
      if (lead) lead.status = "novo";
      renderCrm();
      toast("Lead desarquivado.");
    } catch (error) {
      toast(error.message);
    }
  }

  function renderLeadSelectionState() {
    if (!el.deleteSelectedLeadsBtn) return;
    const visible = filteredLeads().map((lead) => lead.id);
    state.selectedLeadIds = new Set(Array.from(state.selectedLeadIds).filter((id) => visible.includes(id)));
    const count = state.selectedLeadIds.size;
    el.deleteSelectedLeadsBtn.innerHTML = iconSvg("delete");
    el.deleteSelectedLeadsBtn.title = count ? `Excluir ${count} lead(s) selecionado(s)` : "Selecione leads para excluir";
    el.deleteSelectedLeadsBtn.setAttribute("aria-label", el.deleteSelectedLeadsBtn.title);
    el.deleteSelectedLeadsBtn.disabled = count === 0;
    if (el.leadSelectAll) {
      el.leadSelectAll.checked = visible.length > 0 && visible.every((id) => state.selectedLeadIds.has(id));
      el.leadSelectAll.indeterminate = count > 0 && !el.leadSelectAll.checked;
    }
  }

  async function deleteSelectedLeads() {
    const ids = Array.from(state.selectedLeadIds);
    if (!ids.length) return toast("Selecione pelo menos um lead.");
    const ok = await popupConfirm(`Mover ${ids.length} lead(s) para a Lixeira? Eles não voltarão ao sincronizar conversas.`, "Mover para Lixeira", "Mover");
    if (!ok) return;
    try {
      if (ids.some((id) => normalizeStatus(getLead(id)?.status) === "fechamento")) {
        await syncClosedClients(true);
      }
      for (const id of ids) {
        await api(`/api/crm/auto-leads/${encodeURIComponent(id)}?token=${tokenQuery()}`, { method: "DELETE" });
      }
      state.leads = state.leads.filter((item) => !state.selectedLeadIds.has(item.id));
      state.selectedLeadIds.clear();
      renderCrm();
      toast("Leads movidos para a Lixeira.");
    } catch (error) {
      toast(error.message);
      await loadCrm(true);
    }
  }

  async function deleteLead(id) {
    if (!id) return;
    const lead = getLead(id);
    const label = lead ? (displayName(lead) || displayPhone(lead) || "este lead") : "este lead";
    const ok = await popupConfirm(`Mover ${label} para a Lixeira? Ele não voltará ao sincronizar conversas.`, "Mover para Lixeira", "Mover");
    if (!ok) return;
    try {
      await api(`/api/crm/auto-leads/${encodeURIComponent(id)}?token=${tokenQuery()}`, { method: "DELETE" });
      state.leads = state.leads.filter((item) => item.id !== id);
      state.selectedLeadIds.delete(id);
      renderCrm();
      toast("Lead movido para a Lixeira.");
    } catch (error) {
      toast(error.message);
    }
  }

  async function loadTrashLeads() {
    if (!state.token) throw new Error("Informe e salve o token do usuário.");
    const data = await api(`/api/crm/auto-leads?token=${tokenQuery()}&limit=1000&trash=1&_=${Date.now()}`);
    state.trashLeads = (data.leads || []).map((lead) => ({ ...lead, status: normalizeStatus(lead.status) }));
    renderTrashLeads();
  }

  function renderTrashLeads() {
    const rows = state.trashLeads || [];
    if (el.trashCount) el.trashCount.textContent = `${rows.length} contato${rows.length === 1 ? "" : "s"} na lixeira`;
    if (el.restoreAllTrashBtn) el.restoreAllTrashBtn.disabled = rows.length === 0;
    if (!el.trashRows) return;
    if (!rows.length) {
      el.trashRows.innerHTML = `<div class="empty-state compact-empty">Nenhum lead na lixeira.</div>`;
      return;
    }
    el.trashRows.innerHTML = rows.map((lead) => `
      <div class="trash-row" data-trash-id="${escapeHtml(lead.id)}">
        <div class="trash-main">
          <b>${escapeHtml(displayName(lead) || displayPhone(lead) || lead.whatsappJid || "Lead")}</b>
          <span>${escapeHtml(displayPhone(lead) || lead.whatsappJid || "—")} · removido ${escapeHtml(formatDate(lead.trashedAt || lead.updatedAt))}</span>
        </div>
        <button class="btn small" type="button" data-trash-action="restore" data-id="${escapeHtml(lead.id)}">Restaurar</button>
      </div>
    `).join("");
  }

  async function openTrashModal() {
    try {
      await loadTrashLeads();
      el.trashModal?.showModal();
    } catch (error) {
      toast(error.message);
    }
  }

  function closeTrashModal() {
    el.trashModal?.close();
  }

  async function restoreTrashLead(id) {
    if (!id) return;
    try {
      await api(`/api/crm/auto-leads/${encodeURIComponent(id)}/restore?token=${tokenQuery()}`, { method: "POST" });
      state.trashLeads = state.trashLeads.filter((lead) => lead.id !== id);
      renderTrashLeads();
      await loadCrm(true);
      toast("Lead restaurado.");
    } catch (error) {
      toast(error.message);
    }
  }

  async function restoreAllTrashLeads() {
    const count = state.trashLeads.length;
    if (!count) return toast("A lixeira está vazia.");
    const ok = await popupConfirm(`Restaurar todos os ${count} leads da Lixeira?`, "Restaurar leads", "Restaurar todos");
    if (!ok) return;
    try {
      await api(`/api/crm/auto-leads/restore-all?token=${tokenQuery()}`, { method: "POST" });
      state.trashLeads = [];
      renderTrashLeads();
      closeTrashModal();
      await loadCrm(true);
      toast("Leads restaurados.");
    } catch (error) {
      toast(error.message);
    }
  }

  async function updateLeadStatus(id, status) {
    const lead = getLead(id);
    if (!lead || lead.status === status) return;
    const oldStatus = lead.status;
    lead.status = status;
    renderCrm();
    try {
      await api(`/api/crm/auto-leads/${encodeURIComponent(id)}/status?token=${tokenQuery()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      toast(`Movido para ${STATUS_LABEL[status]}.`);
      if (normalizeStatus(status) === "fechamento") syncClosedClients(true);
    } catch (error) {
      lead.status = oldStatus;
      renderCrm();
      toast(error.message);
    }
  }

  async function configureAuto(silent = false) {
    try {
      if (!silent) {
        el.configureAutoBtn.disabled = true;
        el.configureAutoBtn.textContent = "Sincronizando...";
      }
      await api(`/api/crm/configure-auto-conversations-browser?token=${tokenQuery()}`);
      setLeadSyncEnabled(true);
      const sync = silent ? { created: 0, updated: 0 } : await api(`/api/crm/sync-recent-conversations-browser?token=${tokenQuery()}&limit=100`);
      sessionStorage.setItem(`lungo-auto-webhook-${state.token}`, String(Date.now()));
      await loadCrm(true);
      if (!silent) toast(`Sincronização concluída: ${sync.created || 0} novos, ${sync.updated || 0} atualizados.`);
    } catch (error) {
      if (!silent) toast(error.message);
    } finally {
      if (!silent) {
        el.configureAutoBtn.disabled = false;
        el.configureAutoBtn.textContent = "Sincronizar conversas";
      }
    }
  }

  async function ensureAutoWebhook() {
    // A captura só é ativada quando o usuário clica em Sincronizar conversas.
    return;
  }

  function mapImportedRow(row) {
    const normalized = {};
    Object.entries(row).forEach(([key, value]) => {
      const k = String(key || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      normalized[k] = value;
    });
    return {
      nome: normalized.nome || normalized.name || "",
      telefone: normalized.telefone || normalized.whatsapp || normalized.celular || normalized.phone || "",
      email: normalized.email || "",
      pessoaTipo: normalized.cnpj_ou_pf || normalized.pessoa_tipo || normalized.tipo || normalized.tipo_pessoa || "",
      cnpjOuPf: normalized.numero_cnpj_cpf || normalized.cnpj_cpf || normalized.cnpj || normalized.cpf || "",
      qtdVidas: normalized.qtd_de_vidas || normalized.quantidade_de_vidas || normalized.vidas || normalized.qtd_vidas || "",
      valorNegocio: normalized.valor_do_negocio || normalized.valor_negocio || normalized.valor || "",
      planoInteresse: normalized.plano_de_interesse || normalized.plano_interesse || normalized.plano || "",
      cidade: normalized.cidade || "",
      status: normalizeStatus(normalized.status || "novo"),
      observacao: normalized.observacao || normalized.observacoes || "",
      origem: "Importação"
    };
  }

  async function importLeads(file) {
    if (!file) return;
    try {
      let rows = [];
      if (window.XLSX) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      } else {
        const text = await file.text();
        const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
        const headers = headerLine.split(/[;,]/).map((h) => h.trim());
        rows = lines.map((line) => {
          const values = line.split(/[;,]/);
          return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
        });
      }
      const leads = rows.map(mapImportedRow).filter((lead) => lead.nome && lead.telefone);
      if (!leads.length) throw new Error("Nenhum contato válido encontrado no arquivo.");
      const result = await api("/api/crm/auto-leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token, leads })
      });
      toast(`Importação concluída: ${result.created || 0} criados, ${result.updated || 0} atualizados.`);
      await loadCrm();
    } catch (error) {
      toast(error.message);
    } finally {
      el.importFile.value = "";
    }
  }

  function exportLeads() {
    const rows = filteredLeads().map((lead) => ({
      Nome: displayName(lead) || "",
      Telefone: displayPhone(lead) || "",
      Email: lead.email || "",
      "CNPJ ou PF": lead.pessoaTipo || "",
      "Número CNPJ/CPF": lead.cnpjOuPf || "",
      "Qtd. de vidas": lead.qtdVidas || "",
      "Valor do negócio": lead.valorNegocio || "",
      "Plano de interesse": lead.planoInteresse || "",
      Cidade: lead.cidade || "",
      Status: lead.statusLabel || STATUS_LABEL[lead.status] || lead.status,
      "Última mensagem": lead.lastMessage || "",
      "Atualizado em": lead.updatedAt || ""
    }));
    if (!rows.length) return toast("Não há dados para exportar.");

    if (window.XLSX) {
      const sheet = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, "Leads");
      XLSX.writeFile(wb, `leads-lungo-corretores-${new Date().toISOString().slice(0, 10)}.xlsx`);
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [headers.join(";"), ...rows.map((row) => headers.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads-lungo-corretores-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function connectWhatsApp() {
    try {
      state.token = el.tokenInput.value.trim() || el.globalToken.value.trim();
      if (!state.token) throw new Error("Informe o token.");
      el.globalToken.value = state.token;
      el.connectStatus.textContent = "Gerando QR Code...";
      saveAccess();
      const data = await api("/api/onboarding/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token, number: el.connectPhone.value.trim() })
      });
      state.clientName = data.client?.nome || "";
      state.instanceName = data.instanceName || data.client?.instanceName || "";
      state.connected = Boolean(data.connected);
      saveAccess();
      renderAccess();
      setAuthLocked(false);
      setWhatsappPending(!state.connected);
      el.connectStatus.textContent = state.connected ? "WhatsApp conectado." : "Escaneie o QR Code.";
      await renderQr(data.qrCodeBase64 || data.qrCode || "");
      if (state.connected) setView("crm");
    } catch (error) {
      el.connectStatus.textContent = error.message;
      toast(error.message);
    }
  }

  async function renderQr(qr) {
    if (!qr) {
      el.qrImage.hidden = true;
      el.qrBox.querySelector("span")?.removeAttribute("hidden");
      return;
    }
    if (String(qr).startsWith("data:image")) {
      el.qrImage.src = qr;
    } else if (window.QRCode) {
      el.qrImage.src = await QRCode.toDataURL(qr, { width: 280, margin: 1 });
    } else {
      return;
    }
    const empty = el.qrBox.querySelector("span");
    if (empty) empty.hidden = true;
    el.qrImage.hidden = false;
  }

  async function refreshInstance() {
    try {
      const data = await api("/api/onboarding/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token })
      });
      state.clientName = data.client?.nome || state.clientName;
      state.instanceName = data.instanceName || data.client?.instanceName || state.instanceName;
      state.connected = Boolean(data.connected);
      saveAccess();
      renderAccess();
      setAuthLocked(false);
      setWhatsappPending(!state.connected);
      toast(state.connected ? "WhatsApp conectado." : "WhatsApp ainda desconectado.");
      if (state.connected) setView("crm");
    } catch (error) {
      toast(error.message);
    }
  }

  async function validateInstance() {
    try {
      const userId = el.broadcastInstance.value.trim();
      const data = await api("/api/instances/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      toast(data.valid || data.ok ? "Instância validada." : "Instância não conectada.");
    } catch (error) {
      toast(error.message);
    }
  }

  async function startCampaign() {
    try {
      const file = el.broadcastFile.files[0];
      const userId = el.broadcastInstance.value.trim();
      const message = el.broadcastMessage.value.trim();
      if (!file) throw new Error("Selecione a planilha.");
      if (!userId) throw new Error("Informe a instância.");
      if (!message) throw new Error("Informe a mensagem.");
      const form = new FormData();
      form.append("userId", userId);
      form.append("message", message);
      form.append("file", file);
      const data = await api("/api/campaigns/start", { method: "POST", body: form });
      state.campaignId = data.campaignId || data.id;
      el.campaignLog.textContent = "Campanha iniciada.";
      toast("Campanha iniciada.");
      pollCampaign();
    } catch (error) {
      toast(error.message);
    }
  }

  async function pollCampaign() {
    if (!state.campaignId) return;
    clearTimeout(state.campaignTimer);
    try {
      const data = await api(`/api/campaigns/${encodeURIComponent(state.campaignId)}/status`);
      const total = data.total || data.counts?.total || 0;
      const sent = data.sent || data.counts?.sent || 0;
      const errors = data.errors || data.counts?.errors || 0;
      const pending = Math.max(total - sent - errors, 0);
      el.statTotal.textContent = total;
      el.statSent.textContent = sent;
      el.statPending.textContent = pending;
      el.statErrors.textContent = errors;
      el.progressBar.style.width = total ? `${Math.round(((sent + errors) / total) * 100)}%` : "0";
      el.campaignLog.textContent = data.status ? `Status: ${data.status}` : "Campanha em andamento.";
      if (!["finished", "stopped", "completed", "done"].includes(String(data.status || "").toLowerCase())) {
        state.campaignTimer = setTimeout(pollCampaign, 2500);
      }
    } catch (error) {
      el.campaignLog.textContent = error.message;
    }
  }

  async function stopCampaign() {
    try {
      if (!state.campaignId) return toast("Nenhuma campanha ativa.");
      await api(`/api/campaigns/${encodeURIComponent(state.campaignId)}/stop`, { method: "POST" });
      toast("Campanha interrompida.");
      pollCampaign();
    } catch (error) {
      toast(error.message);
    }
  }



  function mailIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg>`;
  }

  function calendarIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M17 3v4"/><path d="M4 7h16v13H4z"/><path d="M4 11h16"/></svg>`;
  }

  function clientKey(item) {
    const phone = normalizePhone(item.telefone || "");
    if (phone) return `phone:${phone}`;
    const email = String(item.email || "").trim().toLowerCase();
    if (email) return `email:${email}`;
    return `name:${stripAccents(item.nome || "").toLowerCase()}|${stripAccents(item.produto || "").toLowerCase()}`;
  }

  function leadToClientCandidate(lead) {
    const date = lead.updatedAt || lead.lastMessageAt || lead.createdAt || "";
    return {
      id: `lead-${lead.id}`,
      sourceLeadId: lead.id,
      source: "lead_fechamento",
      nome: displayName(lead),
      telefone: displayPhone(lead),
      email: lead.email || "",
      documento: lead.cnpjOuPf || "",
      cpfCnpj: lead.cnpjOuPf || "",
      cidade: lead.cidade || "",
      produto: lead.planoInteresse || lead.planoAtual || "",
      qtdVidas: lead.qtdVidas || "",
      valorFechado: lead.valorNegocio || lead.valor || "",
      status: "ativo",
      statusLabel: "Ativo",
      dataContratacao: date ? String(date).slice(0, 10) : "",
      dataRenovacao: "",
      observacao: lead.observacao || lead.lastMessage || "",
      createdAt: lead.createdAt || date || null,
      updatedAt: lead.updatedAt || date || null
    };
  }

  function clientMatchesLocalFilters(client) {
    const q = el.clientSearch?.value.trim().toLowerCase() || "";
    const status = el.clientStatusFilter?.value || "";
    const period = el.clientPeriodFilter?.value || "all";
    if (status && normalizeClientStatus(client.status) !== normalizeClientStatus(status)) return false;
    if (period !== "all") {
      const date = clientDateValue(client);
      if (!date) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (period === "today" && date < today) return false;
      if (period === "yesterday") {
        const from = new Date(today);
        from.setDate(from.getDate() - 1);
        const to = new Date(today);
        to.setMilliseconds(-1);
        if (date < from || date > to) return false;
      }
      if (["7", "15", "30", "90", "365"].includes(period)) {
        const from = new Date(today);
        from.setDate(from.getDate() - Number(period));
        if (date < from) return false;
      }
      if (period === "custom") {
        const fromRaw = el.clientDateFrom?.value || "";
        const toRaw = el.clientDateTo?.value || "";
        const from = fromRaw ? new Date(`${fromRaw}T00:00:00`) : null;
        const to = toRaw ? new Date(`${toRaw}T23:59:59`) : null;
        if (from && date < from) return false;
        if (to && date > to) return false;
      }
    }
    if (q && ![client.nome, client.telefone, client.email, client.documento, client.cpfCnpj, client.cidade, client.produto, client.status, client.observacao].join(" ").toLowerCase().includes(q)) return false;
    return true;
  }

  function mergeClosingLeadsWithClients(savedClients, leads) {
    const items = [...savedClients];
    const existingKeys = new Set(items.map(clientKey));
    leads.filter((lead) => normalizeStatus(lead.status) === "fechamento" && isUsableLead(lead)).forEach((lead) => {
      const candidate = leadToClientCandidate(lead);
      if (!candidate.nome) return;
      const key = clientKey(candidate);
      if (existingKeys.has(key)) return;
      existingKeys.add(key);
      items.push(candidate);
    });
    return items.filter(clientMatchesLocalFilters);
  }

  function clientBaseSales(client) {
    return Array.isArray(client.vendasBase) ? client.vendasBase : [];
  }

  function baseSaleValue(sale) {
    return moneyNumber(sale.valor || sale.valorFechado || sale.valorVenda || "");
  }

  function calculateClientMetrics(items) {
    const produtos = {};
    const porMes = {};
    const vendasBaseMes = {};
    const totalVidas = items.reduce((sum, item) => sum + Number(item.qtdVidas || 0), 0);
    const faturamentoTotal = items.reduce((sum, item) => sum + moneyNumber(item.valorFechado), 0);
    let vendasBaseValor = 0;
    let vendasBaseQtd = 0;
    items.forEach((item) => {
      const itemProducts = clientProducts(item);
      if (itemProducts.length) itemProducts.forEach((produto) => { produtos[produto] = (produtos[produto] || 0) + 1; });
      else produtos["Não informado"] = (produtos["Não informado"] || 0) + 1;
      const date = String(item.dataContratacao || item.createdAt || item.updatedAt || "").slice(0, 7) || "Sem data";
      porMes[date] = (porMes[date] || 0) + moneyNumber(item.valorFechado);
      clientBaseSales(item).forEach((sale) => {
        const saleDate = String(sale.dataVenda || sale.createdAt || "").slice(0, 7) || "Sem data";
        const value = baseSaleValue(sale);
        vendasBaseValor += value;
        vendasBaseQtd += 1;
        vendasBaseMes[saleDate] = (vendasBaseMes[saleDate] || 0) + value;
      });
    });
    return {
      totalClientes: items.length,
      faturamentoTotal,
      totalVidas,
      aRenovar: items.filter((item) => normalizeClientStatus(item.status) === "a_renovar").length,
      vendasBaseValor,
      vendasBaseQtd,
      produtos: Object.entries(produtos).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      faturamentoMensal: Object.entries(porMes).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label)),
      vendasBaseMensal: Object.entries(vendasBaseMes).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label))
    };
  }
  function clientDateValue(client) {
    const raw = client.dataContratacao || client.createdAt || client.updatedAt || "";
    const date = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function clientPeriodParams() {
    const period = el.clientPeriodFilter?.value || "all";
    const params = new URLSearchParams({ token: state.token, period, syncFechamentos: "1" });
    const status = el.clientStatusFilter?.value || "";
    const q = el.clientSearch?.value.trim() || "";
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (period === "custom") {
      if (el.clientDateFrom?.value) params.set("from", el.clientDateFrom.value);
      if (el.clientDateTo?.value) params.set("to", el.clientDateTo.value);
    }
    return params.toString();
  }

  function toggleClientCustomPeriodFields() {
    const show = el.clientPeriodFilter?.value === "custom";
    if (el.clientDateFrom) el.clientDateFrom.hidden = !show;
    if (el.clientDateTo) el.clientDateTo.hidden = !show;
  }

  function normalizeClientStatus(value) {
    const raw = String(value || "ativo").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const aliases = { ativo: "ativo", renovar: "a_renovar", a_renovar: "a_renovar", renovado: "renovado", cancelado: "cancelado", inativo: "inativo" };
    return aliases[raw] || (CLIENT_STATUS_LABEL[raw] ? raw : "ativo");
  }

  function getClient(id) {
    return state.clients.find((client) => client.id === id) || null;
  }

  function formatDateOnly(value) {
    if (!value) return "—";
    const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  function renderClientMetrics() {
    const m = state.clientMetrics || { totalClientes: 0, faturamentoTotal: 0, totalVidas: 0, aRenovar: 0, vendasBaseValor: 0 };
    el.clientMetrics.innerHTML = [
      ["Clientes", m.totalClientes || 0],
      ["Faturamento", formatMoney(String(m.faturamentoTotal || 0))],
      ["Vendas da base", formatMoney(String(m.vendasBaseValor || 0))],
      ["Vidas totais", m.totalVidas || 0],
      ["A renovar", m.aRenovar || 0]
    ].map(([label, value]) => `<article class="metric"><span>${label}</span><b>${value}</b></article>`).join("");
  }

  function chartBars(items, container, formatter = (v) => v) {
    if (!container) return;
    const list = (items || []).slice(-6);
    const max = Math.max(1, ...list.map((item) => Number(item.value || 0)));
    container.innerHTML = list.length ? list.map((item) => {
      const pct = Math.max(4, Math.round((Number(item.value || 0) / max) * 100));
      return `<div class="bar-row"><span title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span><div><i style="width:${pct}%"></i></div><b>${escapeHtml(formatter(item.value))}</b></div>`;
    }).join("") : `<div class="empty-state compact-empty">Sem dados no período.</div>`;
  }

  function renderClientCharts() {
    const m = state.clientMetrics || {};
    if (el.revenueChartTotal) el.revenueChartTotal.textContent = formatMoney(String(m.faturamentoTotal || 0));
    if (el.productsChartTotal) el.productsChartTotal.textContent = `${(m.produtos || []).reduce((sum, item) => sum + Number(item.value || 0), 0)} vendas`;
    if (el.baseSalesChartTotal) el.baseSalesChartTotal.textContent = formatMoney(String(m.vendasBaseValor || 0));
    chartBars(m.faturamentoMensal || [], el.revenueChart, (value) => formatMoney(String(value || 0)));
    chartBars(m.produtos || [], el.productsChart, (value) => `${value}`);
    chartBars(m.vendasBaseMensal || [], el.baseSalesChart, (value) => formatMoney(String(value || 0)));
  }

  function productOptions() {
    const currentClient = el.clientProduto?.value || "Saúde";
    const currentBase = el.baseSaleProduto?.value || "Saúde";
    if (el.clientProduto) el.clientProduto.innerHTML = productSelectOptions(currentClient);
    if (el.baseSaleProduto) el.baseSaleProduto.innerHTML = productSelectOptions(currentBase);
  }

  function clientProductFolders(client) {
    const folders = [];
    if (cleanProduct(client?.produto)) {
      folders.push({
        id: "principal",
        kind: "principal",
        produto: cleanProduct(client.produto),
        qtdVidas: client.qtdVidas || "",
        valor: client.valorFechado || "",
        data: client.dataContratacao || "",
        observacao: client.observacao || "",
        documentos: normalizeProductDocuments(client)
      });
    }
    clientBaseSales(client).forEach((sale, index) => {
      const produto = cleanProduct(sale.produto) || "Outros";
      folders.push({
        id: sale.id || `sale-${index}`,
        kind: "venda_base",
        produto,
        qtdVidas: sale.qtdVidas || "",
        valor: sale.valor || sale.valorFechado || "",
        data: sale.dataVenda || sale.data || "",
        observacao: sale.observacao || "",
        documentos: normalizeProductDocuments(sale)
      });
    });
    return folders;
  }

  function normalizeProductDocuments(item = {}) {
    const docs = [];
    if (Array.isArray(item.documentosPdf)) docs.push(...item.documentosPdf);
    if (Array.isArray(item.documentos)) docs.push(...item.documentos);
    if (item.documentacaoPdf && typeof item.documentacaoPdf === "object") docs.push(item.documentacaoPdf);
    const seen = new Set();
    return docs.filter(Boolean).filter((doc) => {
      const key = doc.id || `${doc.fileName || doc.name || "doc"}-${doc.uploadedAt || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function clientProducts(client) {
    const set = new Map();
    clientProductFolders(client).forEach((folder) => {
      const value = cleanProduct(folder.produto);
      if (value && !set.has(value.toLowerCase())) set.set(value.toLowerCase(), value);
    });
    return Array.from(set.values());
  }

  function productIconsHtml(client) {
    const folders = clientProductFolders(client);
    if (!folders.length) return `<span class="muted">—</span>`;
    return `<span class="product-icons compact-products clickable-products" title="Clique no produto para abrir a pasta">${folders.slice(0, 12).map((folder) => `<button class="product-icon-button" type="button" data-product-open="${escapeHtml(client.id || "")}" data-product-id="${escapeHtml(folder.id)}" title="Abrir ${escapeHtml(folder.produto)}">${productIconSvg(folder.produto)}</button>`).join("")}</span>`;
  }

  function postSaleDateTime(posVenda = {}) {
    if (!posVenda?.data) return null;
    const dt = new Date(`${posVenda.data}T${posVenda.hora || "09:00"}`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function clientPostSaleActive(client) {
    const ps = client?.posVenda || null;
    if (!ps || ps.ativo === false || ps.status === "sent" || ps.status === "cancelled") return false;
    const recurring = ps.recorrencia && ps.recorrencia !== "unica";
    if (recurring) return true;
    const dt = postSaleDateTime(ps);
    return dt ? dt >= new Date() : true;
  }

  function postSaleClockHtml(client) {
    if (!clientPostSaleActive(client)) return "";
    const ps = client.posVenda || {};
    const label = ps.recorrencia && ps.recorrencia !== "unica" ? `Pós-venda recorrente · ${ps.hora || "09:00"}` : `Pós-venda programado · ${ps.data || ""} ${ps.hora || "09:00"}`;
    return `<span class="clock-indicator active" title="${escapeHtml(label)}">${clockIcon()}</span>`;
  }

  function renderClients() {
    renderClientMetrics();
    renderClientCharts();
    productOptions();
    if (!el.clientRows) return;
    const rows = state.clients;
    if (!rows.length) {
      el.clientRows.innerHTML = `<tr><td colspan="7"><div class="empty-state">Nenhum cliente encontrado para o período selecionado.</div></td></tr>`;
      return;
    }
    el.clientRows.innerHTML = rows.map((client) => {
      const phone = normalizePhone(client.telefone || "");
      const whatsapp = phone ? `https://wa.me/${phone}` : "#";
      const email = client.email ? `mailto:${encodeURIComponent(client.email)}` : "#";
      return `<tr>
        <td><div class="client-name-cell"><div class="contact-main client-name-only"><b>${postSaleClockHtml(client)}${escapeHtml(client.nome || "Cliente")}</b><span>${escapeHtml(phone || "—")}</span></div></div></td>
        <td class="product-icons-cell">${productIconsHtml(client)}</td>
        <td><span class="status-badge status-${escapeHtml(normalizeClientStatus(client.status))}">${escapeHtml(client.statusLabel || CLIENT_STATUS_LABEL[normalizeClientStatus(client.status)] || "Ativo")}</span></td>
        <td>${escapeHtml(client.qtdVidas || "—")}</td>
        <td>${escapeHtml(formatMoney(client.valorFechado || ""))}</td>
        <td><span class="truncate">${escapeHtml(formatDateOnly(client.dataRenovacao))}${client.diasParaRenovar !== null && client.diasParaRenovar !== undefined ? ` · ${escapeHtml(client.diasParaRenovar)}d` : ""}</span></td>
        <td><div class="row-buttons">
          <a class="icon-action whatsapp" href="${whatsapp}" target="_blank" rel="noopener" title="Falar no WhatsApp">${iconSvg("whatsapp")}</a>
          <a class="icon-action ${client.email ? "" : "disabled"}" href="${email}" title="Enviar e-mail">${mailIcon()}</a>
          <button class="icon-action" type="button" data-client-action="post-sale" data-id="${escapeHtml(client.id)}" title="Agendar pós-venda">${calendarIcon()}</button>
          <button class="icon-action" type="button" data-client-action="edit" data-id="${escapeHtml(client.id)}" title="Editar cliente">${iconSvg("edit")}</button>
        </div></td>
      </tr>`;
    }).join("");
  }

  async function syncClosedClients(silent = false) {
    try {
      if (!state.token) { if (!silent) toast("Informe e salve o token do usuário."); return; }
      const data = await api("/api/clientes/sync-fechamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token })
      });
      if (!silent) toast(`Fechamentos atualizados: ${data.sync?.created || 0} novos, ${data.sync?.updated || 0} atualizados.`);
      await loadClients(true);
    } catch (error) {
      if (!silent) toast(error.message);
    }
  }

  async function loadClients(silent = false) {
    try {
      if (!state.token) { if (!silent) toast("Informe e salve o token do usuário."); return; }
      if (!state.leads.length) await loadCrm(true);
      const data = await api(`/api/clientes?${clientPeriodParams()}&_=${Date.now()}`);
      const savedClients = (data.clientes || []).map((client) => ({ ...client, status: normalizeClientStatus(client.status), source: client.source || "clientes" }));
      state.clients = mergeClosingLeadsWithClients(savedClients, state.leads);
      state.clientMetrics = calculateClientMetrics(state.clients);
      if (data.client) {
        state.clientName = data.client.nome || state.clientName;
        state.instanceName = data.client.instanceName || state.instanceName;
        saveAccess();
        renderAccess();
      }
      renderClients();
    } catch (error) {
      if (!silent) toast(error.message);
    }
  }

  function renderClientBaseSales(client) {
    const sales = clientBaseSales(client);
    if (!el.clientBaseSalesList) return;
    if (!sales.length) {
      el.clientBaseSalesList.innerHTML = `<div class="empty-state compact-empty product-empty-state">Nenhum produto adicional registrado. Use “Cadastrar novo produto” para adicionar outra contratação.</div>`;
      return;
    }
    el.clientBaseSalesList.innerHTML = sales.map((sale, index) => {
      const fileName = sale.documentacaoPdf?.fileName || "";
      const docButton = fileName
        ? `<button class="doc-file-link" type="button" data-sale-action="download-doc" data-client-id="${escapeHtml(client.id || "")}" data-sale-id="${escapeHtml(sale.id || "")}" title="Baixar ${escapeHtml(fileName)}">${iconSvg("download")}<span>${escapeHtml(fileName)}</span></button>`
        : `<span class="no-doc-chip">Sem PDF anexado</span>`;
      return `<details class="product-contract-card" ${index === 0 ? "open" : ""}>
        <summary>
          <span class="contract-title"><span class="inline-product-svg">${productIconSvg(sale.produto)}</span><b>${escapeHtml(sale.produto || "Produto")}</b></span>
          <small>${escapeHtml(formatMoney(sale.valor || ""))} · ${escapeHtml(formatDateOnly(sale.dataVenda))}</small>
        </summary>
        <div class="contract-body">
          <div class="contract-mini-grid">
            <article><span>Valor</span><b>${escapeHtml(formatMoney(sale.valor || ""))}</b></article>
            <article><span>Vidas</span><b>${escapeHtml(sale.qtdVidas || "—")}</b></article>
            <article><span>Data</span><b>${escapeHtml(formatDateOnly(sale.dataVenda))}</b></article>
          </div>
          <div class="product-doc-download-row">
            <span>Documento deste produto</span>
            ${docButton}
          </div>
          ${sale.observacao ? `<p class="contract-note">${escapeHtml(sale.observacao)}</p>` : ""}
          <div class="contract-actions">
            <button class="btn small" type="button" data-sale-action="view" data-client-id="${escapeHtml(client.id || "")}" data-sale-id="${escapeHtml(sale.id || "")}">Ver dados do produto</button>
          </div>
        </div>
      </details>`;
    }).join("");
  }

  function openClientModal(client = null) {
    const item = client || { status: "ativo", produto: "Saúde" };
    state.clientDocumentPending = null;
    el.clientId.value = item.id || "";
    el.clientNome.value = item.nome || "";
    el.clientTelefone.value = item.telefone || "";
    el.clientEmail.value = item.email || "";
    el.clientDocumento.value = item.documento || item.cpfCnpj || "";
    el.clientCidade.value = item.cidade || "";
    el.clientProduto.innerHTML = productSelectOptions(item.produto || "Saúde");
    el.clientProduto.value = item.produto || "Saúde";
    el.clientQtdVidas.value = item.qtdVidas || "";
    el.clientValorFechado.value = normalizeMoneyInput(item.valorFechado || "");
    el.clientStatus.value = normalizeClientStatus(item.status || "ativo");
    el.clientDataContratacao.value = item.dataContratacao || "";
    el.clientDataRenovacao.value = item.dataRenovacao || "";
    el.clientObservacao.value = item.observacao || "";
    const mainDocName = item.documentacaoPdf?.fileName || "Nenhum PDF anexado";
    el.clientDocumentName.textContent = mainDocName;
    el.downloadClientDocBtn.textContent = item.documentacaoPdf?.fileName || "Nenhum PDF";
    el.downloadClientDocBtn.disabled = !item.id || !item.documentacaoPdf;
    renderClientBaseSales(item);
    if (el.sellAgainBtn) el.sellAgainBtn.hidden = !item.id;
    el.clientModalTitle.textContent = item.id ? "Editar cliente" : "Novo cliente";
    el.clientModal.showModal();
  }

  function closeClientModal() {
    el.clientModal.close();
  }

  function clientPayload() {
    return {
      token: state.token,
      nome: el.clientNome.value.trim(),
      telefone: normalizePhone(el.clientTelefone.value),
      email: el.clientEmail.value.trim(),
      documento: el.clientDocumento.value.trim(),
      cidade: el.clientCidade.value.trim(),
      produto: el.clientProduto.value.trim(),
      qtdVidas: el.clientQtdVidas.value.trim(),
      valorFechado: el.clientValorFechado.value.trim(),
      status: el.clientStatus.value,
      dataContratacao: el.clientDataContratacao.value,
      dataRenovacao: el.clientDataRenovacao.value,
      observacao: el.clientObservacao.value.trim(),
      ...(state.clientDocumentPending ? { documentacaoPdf: state.clientDocumentPending } : {})
    };
  }

  async function uploadClientDocument() {
    const id = el.clientId.value;
    if (!id || String(id).startsWith("lead-")) return toast("Salve o cliente antes de anexar documentação.");
    const file = el.clientDocumentFile.files?.[0];
    if (!file) return;
    try {
      const documentacaoPdf = await fileToDocument(file);
      await api(`/api/clientes/${encodeURIComponent(id)}/documentacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token, documentacaoPdf })
      });
      state.clientDocumentPending = null;
      el.clientDocumentName.textContent = documentacaoPdf.fileName;
      el.downloadClientDocBtn.textContent = documentacaoPdf.fileName;
      el.downloadClientDocBtn.disabled = false;
      toast("Documentação anexada.");
      await loadClients(true);
    } catch (error) { toast(error.message); }
    finally { el.clientDocumentFile.value = ""; }
  }

  async function downloadClientDocument() {
    const id = el.clientId.value;
    if (!id || String(id).startsWith("lead-")) return toast("Salve o cliente antes de baixar a documentação.");
    try {
      const data = await api(`/api/clientes/${encodeURIComponent(id)}/documentacao?token=${tokenQuery()}`);
      downloadBase64Pdf(data.documentacaoPdf);
    } catch (error) { toast(error.message); }
  }

  async function saveClient(event) {
    event.preventDefault();
    try {
      const id = el.clientId.value;
      const shouldCreate = !id || String(id).startsWith("lead-");
      const path = shouldCreate ? "/api/clientes" : `/api/clientes/${encodeURIComponent(id)}`;
      await api(path, { method: shouldCreate ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clientPayload()) });
      closeClientModal();
      toast("Cliente salvo.");
      await loadClients();
    } catch (error) {
      toast(error.message);
    }
  }

  function openPostSaleModal(client) {
    if (!client) return;
    el.postSaleClientId.value = client.id;
    el.postSaleClientName.textContent = client.nome || "Cliente";
    const ps = client.posVenda || {};
    el.postSaleTipo.value = ps.tipo || "relacionamento";
    el.postSaleData.value = ps.data || "";
    if (el.postSaleHora) el.postSaleHora.value = ps.hora || "09:00";
    el.postSaleRecorrencia.value = ps.recorrencia || "unica";
    el.postSaleMensagem.value = ps.mensagem || `Olá, ${client.nome || "{nome}"}! Passando para acompanhar seu plano.`;
    el.postSaleModal.showModal();
  }

  function closePostSaleModal() {
    el.postSaleModal.close();
  }

  async function savePostSale(event) {
    event.preventDefault();
    try {
      const id = el.postSaleClientId.value;
      await api(`/api/clientes/${encodeURIComponent(id)}/post-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token, tipo: el.postSaleTipo.value, data: el.postSaleData.value, hora: el.postSaleHora?.value || "09:00", recorrencia: el.postSaleRecorrencia.value, mensagem: el.postSaleMensagem.value.trim() })
      });
      closePostSaleModal();
      toast("Pós-venda agendado.");
      await loadClients();
    } catch (error) {
      toast(error.message);
    }
  }


  function openBaseSaleModal(client = null) {
    const item = client || getClient(el.clientId.value) || {};
    if (!item.id && !el.clientId.value) return toast("Salve o cliente antes de vender novamente.");
    state.baseSaleDocumentPending = null;
    el.baseSaleClientId.value = item.id || el.clientId.value;
    el.baseSaleClientName.textContent = item.nome || el.clientNome.value || "Cliente";
    el.baseSaleProduto.innerHTML = productSelectOptions("Saúde");
    el.baseSaleProduto.value = "Saúde";
    el.baseSaleVidas.value = "";
    el.baseSaleValor.value = "R$ ";
    el.baseSaleData.value = new Date().toISOString().slice(0, 10);
    el.baseSaleObs.value = "";
    el.baseSaleDocumentName.textContent = "Nenhum PDF anexado";
    if (el.baseSaleDocumentFile) el.baseSaleDocumentFile.value = "";
    el.baseSaleModal.showModal();
  }

  function closeBaseSaleModal() {
    el.baseSaleModal.close();
  }

  async function ensurePersistedClientForBaseSale() {
    let id = el.baseSaleClientId.value;
    if (id && !String(id).startsWith("lead-")) return id;
    const saved = await api("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientPayload())
    });
    id = saved.cliente?.id;
    if (!id) throw new Error("Não foi possível salvar o cliente antes da nova venda.");
    el.clientId.value = id;
    el.baseSaleClientId.value = id;
    return id;
  }

  async function saveBaseSale(event) {
    event.preventDefault();
    try {
      const id = await ensurePersistedClientForBaseSale();
      await api(`/api/clientes/${encodeURIComponent(id)}/base-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: state.token,
          produto: el.baseSaleProduto.value.trim(),
          qtdVidas: el.baseSaleVidas.value.trim(),
          valor: el.baseSaleValor.value.trim(),
          dataVenda: el.baseSaleData.value,
          observacao: el.baseSaleObs.value.trim(),
          ...(state.baseSaleDocumentPending ? { documentacaoPdf: state.baseSaleDocumentPending } : {})
        })
      });
      closeBaseSaleModal();
      if (el.clientModal.open) closeClientModal();
      toast("Venda da base registrada.");
      await loadClients();
    } catch (error) {
      toast(error.message);
    }
  }

  function openSaleView(client, sale) {
    if (!client || !sale) return;
    state.currentSaleView = { clientId: client.id, saleId: sale.id };
    el.saleViewClientName.textContent = client.nome || "Cliente";
    el.saleViewBody.innerHTML = `
      <article><span>Produto</span><b><span class="inline-product-svg">${productIconSvg(sale.produto)}</span>${escapeHtml(sale.produto || "—")}</b></article>
      <article><span>Valor</span><b>${escapeHtml(formatMoney(sale.valor || ""))}</b></article>
      <article><span>Qtd. de vidas</span><b>${escapeHtml(sale.qtdVidas || "—")}</b></article>
      <article><span>Data da venda</span><b>${escapeHtml(formatDateOnly(sale.dataVenda))}</b></article>
      <article class="full"><span>Observação</span><b>${escapeHtml(sale.observacao || "—")}</b></article>
      <article class="full"><span>Documentação</span><b>${escapeHtml(sale.documentacaoPdf?.fileName || "Nenhum PDF anexado")}</b></article>
    `;
    el.downloadSaleDocBtn.disabled = !sale.documentacaoPdf;
    el.saleViewModal.showModal();
  }

  function closeSaleViewModal() {
    el.saleViewModal.close();
    state.currentSaleView = null;
  }

  async function downloadSaleDocument() {
    const cur = state.currentSaleView;
    if (!cur) return;
    try {
      const data = await api(`/api/clientes/${encodeURIComponent(cur.clientId)}/base-sale/${encodeURIComponent(cur.saleId)}/documentacao?token=${tokenQuery()}`);
      downloadBase64Pdf(data.documentacaoPdf);
    } catch (error) { toast(error.message); }
  }

  async function downloadSelectedClientDocs() {
    const id = el.clientId.value;
    if (!id || String(id).startsWith("lead-")) return toast("Salve o cliente antes de baixar documentos.");
    const checked = Array.from(el.clientBaseSalesList?.querySelectorAll("[data-doc-select]:checked") || []);
    if (!checked.length) return toast("Selecione pelo menos um documento para baixar.");
    for (const item of checked) {
      try {
        if (item.dataset.docSelect === "client") {
          const data = await api(`/api/clientes/${encodeURIComponent(id)}/documentacao?token=${tokenQuery()}`);
          downloadBase64Pdf(data.documentacaoPdf);
        } else if (item.dataset.docSelect === "sale") {
          const data = await api(`/api/clientes/${encodeURIComponent(id)}/base-sale/${encodeURIComponent(item.value)}/documentacao?token=${tokenQuery()}`);
          downloadBase64Pdf(data.documentacaoPdf);
        }
      } catch (error) {
        toast(error.message);
      }
    }
  }

  async function ensureRealClient(client) {
    if (!client) throw new Error("Cliente não encontrado.");
    if (client.id && !String(client.id).startsWith("lead-")) return client.id;
    const saved = await api("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: state.token,
        nome: client.nome || "Cliente",
        telefone: normalizePhone(client.telefone || ""),
        email: client.email || "",
        documento: client.documento || client.cpfCnpj || "",
        cidade: client.cidade || "",
        produto: cleanProduct(client.produto || client.planoInteresse || "Saúde") || "Saúde",
        qtdVidas: client.qtdVidas || "",
        valorFechado: client.valorFechado || client.valorNegocio || "",
        status: normalizeClientStatus(client.status || "ativo"),
        dataContratacao: client.dataContratacao || new Date().toISOString().slice(0, 10),
        dataRenovacao: client.dataRenovacao || "",
        observacao: client.observacao || ""
      })
    });
    await loadClients(true);
    return saved.cliente?.id;
  }

  function productFolderEndpoint(clientId, productId = "") {
    const base = `/api/clientes/${encodeURIComponent(clientId)}/products`;
    return productId ? `${base}/${encodeURIComponent(productId)}` : base;
  }

  async function fetchClientProducts(clientId) {
    return api(`${productFolderEndpoint(clientId)}?token=${tokenQuery()}&_=${Date.now()}`);
  }

  function renderProductFolderDocs(product) {
    const docs = Array.isArray(product?.documentos) ? product.documentos : [];
    if (!el.productFolderDocs) return;
    if (!docs.length) {
      el.productFolderDocs.innerHTML = `<div class="empty-state compact-empty">Nenhum PDF anexado neste produto.</div>`;
      return;
    }
    el.productFolderDocs.innerHTML = docs.map((doc) => {
      const id = escapeHtml(doc.id || doc.fileName || "");
      const fileName = escapeHtml(doc.fileName || "documento.pdf");
      return `<div class="product-doc-row">
        <button class="product-doc-item" type="button" data-product-doc-id="${id}" title="Baixar ${fileName}">${iconSvg("download")}<span>${fileName}</span></button>
        <button class="product-doc-delete" type="button" data-product-doc-delete="${id}" title="Excluir documento">×</button>
      </div>`;
    }).join("");
  }

  async function openProductFolder(client, productId = "principal") {
    try {
      if (!state.token) return toast("Informe e salve o token do usuário.");
      if (!client) return toast("Cliente não encontrado.");
      const realClientId = await ensureRealClient(client);
      if (!realClientId) return toast("Salve o cliente antes de abrir a pasta do produto.");
      const data = await fetchClientProducts(realClientId);
      const products = data.products || [];
      let product = products.find((item) => String(item.id) === String(productId)) || products[0];
      if (!product) return toast("Produto não encontrado para este cliente.");
      state.currentProductFolder = { clientId: realClientId, productId: product.id, product };
      el.productFolderClientId.value = realClientId;
      el.productFolderProductId.value = product.id;
      el.productFolderTitle.innerHTML = `<span class="inline-product-svg">${productIconSvg(product.produto)}</span>${escapeHtml(product.produto || "Produto")}`;
      el.productFolderSubtitle.textContent = `${client.nome || "Cliente"} · pasta do produto`;
      el.productFolderProduto.innerHTML = productSelectOptions(product.produto || "Saúde");
      el.productFolderProduto.value = product.produto || "Saúde";
      el.productFolderVidas.value = product.qtdVidas || "";
      el.productFolderValor.value = normalizeMoneyInput(product.valor || "");
      el.productFolderData.value = product.data || "";
      el.productFolderObs.value = product.observacao || "";
      renderProductFolderDocs(product);
      el.productFolderModal.showModal();
    } catch (error) { toast(error.message); }
  }

  function closeProductFolderModal() {
    if (el.productFolderModal?.open) el.productFolderModal.close();
    state.currentProductFolder = null;
  }

  async function saveProductFolder(event) {
    event.preventDefault();
    const current = state.currentProductFolder;
    if (!current) return;
    try {
      await api(productFolderEndpoint(current.clientId, current.productId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: state.token,
          produto: el.productFolderProduto.value,
          qtdVidas: el.productFolderVidas.value.trim(),
          valor: el.productFolderValor.value.trim(),
          data: el.productFolderData.value,
          observacao: el.productFolderObs.value.trim()
        })
      });
      toast("Produto salvo.");
      await loadClients(true);
      const client = getClient(current.clientId) || state.clients.find((item) => item.id === current.clientId);
      await openProductFolder(client || { id: current.clientId, nome: el.productFolderSubtitle.textContent }, current.productId);
    } catch (error) { toast(error.message); }
  }

  async function uploadProductFolderDocuments() {
    const current = state.currentProductFolder;
    if (!current) return toast("Abra a pasta de um produto primeiro.");
    const files = Array.from(el.productFolderFile?.files || []);
    if (!files.length) return;
    try {
      for (const file of files) {
        const documento = await fileToDocument(file);
        await api(`${productFolderEndpoint(current.clientId, current.productId)}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: state.token, documento })
        });
      }
      toast(files.length === 1 ? "PDF anexado." : `${files.length} PDFs anexados.`);
      const client = getClient(current.clientId) || { id: current.clientId };
      await openProductFolder(client, current.productId);
      await loadClients(true);
    } catch (error) { toast(error.message); }
    finally { if (el.productFolderFile) el.productFolderFile.value = ""; }
  }

  async function downloadProductDocument(docId) {
    const current = state.currentProductFolder;
    if (!current || !docId) return;
    try {
      const data = await api(`${productFolderEndpoint(current.clientId, current.productId)}/documents/${encodeURIComponent(docId)}?token=${tokenQuery()}`);
      downloadBase64Pdf(data.documentacaoPdf || data.documento);
    } catch (error) { toast(error.message); }
  }

  async function deleteProductDocument(docId) {
    const current = state.currentProductFolder;
    if (!current || !docId) return;
    const ok = await popupConfirm("Excluir este PDF da pasta do produto?", "Excluir documento", "Excluir");
    if (!ok) return;
    try {
      await api(`${productFolderEndpoint(current.clientId, current.productId)}/documents/${encodeURIComponent(docId)}?token=${tokenQuery()}`, { method: "DELETE" });
      toast("Documento excluído.");
      const client = getClient(current.clientId) || { id: current.clientId };
      await openProductFolder(client, current.productId);
      await loadClients(true);
    } catch (error) { toast(error.message); }
  }

  function mapImportedClientRow(row) {
    const normalized = {};
    Object.entries(row || {}).forEach(([key, value]) => {
      const k = stripAccents(String(key || "")).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      normalized[k] = value;
    });
    return {
      nome: normalized.nome || normalized.cliente || normalized.nome_do_cliente || "",
      telefone: normalized.telefone || normalized.whatsapp || normalized.celular || "",
      email: normalized.email || normalized.e_mail || "",
      documento: normalized.documento || normalized.cpf_cnpj || normalized.cnpj || normalized.cpf || "",
      cidade: normalized.cidade || "",
      produto: normalized.produto || normalized.produto_vendido || normalized.plano || "",
      qtdVidas: normalized.qtd_vidas || normalized.vidas || normalized.quantidade_de_vidas || "",
      valorFechado: normalized.valor_fechado || normalized.valor || normalized.valor_vendido || "",
      status: normalized.status || "ativo",
      dataContratacao: normalized.data_contratacao || normalized.contratacao || normalized.data_da_contratacao || "",
      dataRenovacao: normalized.data_renovacao || normalized.renovacao || "",
      observacao: normalized.observacao || normalized.observacoes || ""
    };
  }

  async function importClients(file) {
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map(mapImportedClientRow).filter((row) => row.nome && row.telefone);
      if (!rows.length) throw new Error("A lista não tem clientes válidos. Use o modelo de lista.");
      const result = await api("/api/clientes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token, clientes: rows })
      });
      toast(`Importação concluída: ${result.created || 0} novos, ${result.updated || 0} atualizados.`);
      await loadClients();
    } catch (error) {
      toast(error.message);
    } finally {
      if (el.importClientsFile) el.importClientsFile.value = "";
    }
  }

  function exportClients() {
    const rows = state.clients.map((client) => ({
      Nome: client.nome || "",
      WhatsApp: client.telefone || "",
      Email: client.email || "",
      Documento: client.documento || client.cpfCnpj || "",
      Cidade: client.cidade || "",
      Produto: client.produto || "",
      Vidas: client.qtdVidas || "",
      Valor: client.valorFechado || "",
      VendasBase: clientBaseSales(client).map((sale) => `${sale.produto || "Produto"}: ${sale.valor || ""}`).join(" | "),
      ValorVendasBase: client.valorVendasBase || "",
      Status: client.statusLabel || CLIENT_STATUS_LABEL[client.status] || client.status || "",
      Contratacao: client.dataContratacao || "",
      Renovacao: client.dataRenovacao || "",
      Observacao: client.observacao || ""
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "clientes-lungo.xlsx");
  }

  function logout() {
    if (state.token) localStorage.removeItem(leadSyncKey());
    [STORAGE_KEY, "lungo-suite-access-v2", "lungo-suite-access-v3", "lungo-suite-access-v4"].forEach((key) => localStorage.removeItem(key));
    state.token = "";
    state.clientName = "";
    state.instanceName = "";
    state.connected = false;
    state.leads = [];
    state.clients = [];
    state.clientMetrics = null;
    state.campaignId = "";
    el.globalToken.value = "";
    el.tokenInput.value = "";
    if (el.accessTokenInput) el.accessTokenInput.value = "";
    el.broadcastInstance.value = "";
    el.crmSearch.value = "";
    el.crmStatusFilter.value = "";
    if (el.crmPeriodFilter) el.crmPeriodFilter.value = "all";
    if (el.crmDateFrom) el.crmDateFrom.value = "";
    if (el.crmDateTo) el.crmDateTo.value = "";
    if (el.clientSearch) el.clientSearch.value = "";
    if (el.clientStatusFilter) el.clientStatusFilter.value = "";
    if (el.clientPeriodFilter) el.clientPeriodFilter.value = "all";
    if (el.clientDateFrom) el.clientDateFrom.value = "";
    if (el.clientDateTo) el.clientDateTo.value = "";
    sessionStorage.clear();
    stopCrmRealtime();
    setWhatsappPending(false);
    setAuthLocked(true);
    setAuthStatus("Informe o token para liberar o sistema.", "");
    renderAccess();
    renderCrm();
    renderClients();
    toast("Logout realizado.");
  }

  function bindEvents() {
    el.navItems.forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.view)));
    el.navItems.forEach((btn) => btn.addEventListener("click", () => {
      const upgrade = btn.dataset.view === "vendedores";
      if (el.defaultSoonPanel) el.defaultSoonPanel.hidden = upgrade;
      if (el.teamUpgradePanel) el.teamUpgradePanel.hidden = !upgrade;
    }));
    el.sidebarToggleBtn?.addEventListener("click", () => {
      const collapsed = !el.appShell.classList.contains("sidebar-collapsed");
      el.appShell.classList.toggle("sidebar-collapsed", collapsed);
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    });
    el.themeBtn.addEventListener("click", () => {
      const current = localStorage.getItem(THEME_KEY) || "dark";
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      el.root.dataset.theme = next;
    });
    el.toggleTokenBtn?.addEventListener("click", () => {
      el.globalToken.type = el.globalToken.type === "password" ? "text" : "password";
    });

    el.saveTokenBtn.addEventListener("click", () => enterWithToken({ fromTopbar: true }));
    el.accessLoginBtn?.addEventListener("click", () => enterWithToken());
    el.accessTokenInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") enterWithToken();
    });
    el.contactLungoTeamPlanBtn?.addEventListener("click", () => {
      const message = encodeURIComponent("Olá! Gostaria de conhecer o Plano Gestão de Equipes da Lungo Corretores.");
      window.open(`https://wa.me/5555992102864?text=${message}`, "_blank", "noopener,noreferrer");
    });
    el.corretorTabBtn?.addEventListener("click", () => setAuthRole("corretor"));
    el.supervisorTabBtn?.addEventListener("click", () => setAuthRole("supervisor"));
    el.supervisorLoginBtn?.addEventListener("click", mockSupervisorLogin);
    [el.supervisorEmailInput, el.supervisorPasswordInput].forEach((input) => {
      input?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") mockSupervisorLogin();
      });
    });
    el.supervisorLogoutBtn?.addEventListener("click", closeSupervisorArea);
    el.supervisorSidebarToggle?.addEventListener("click", () => {
      const collapsed = !el.supervisorScreen.classList.contains("sidebar-collapsed");
      el.supervisorScreen.classList.toggle("sidebar-collapsed", collapsed);
      el.supervisorSidebarToggle.setAttribute("aria-expanded", String(!collapsed));
      el.supervisorSidebarToggle.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
      el.supervisorSidebarToggle.title = collapsed ? "Expandir menu" : "Recolher menu";
      localStorage.setItem(SUPERVISOR_SIDEBAR_KEY, collapsed ? "1" : "0");
    });
    el.supervisorThemeBtn?.addEventListener("click", () => {
      const next = el.root.dataset.theme === "dark" ? "light" : "dark";
      el.root.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
    });
    el.supervisorNavItems.filter((button) => button.dataset.supervisorView).forEach((button) => button.addEventListener("click", () => setSupervisorView(button.dataset.supervisorView)));
    el.supervisorNavItems.filter((button) => button.dataset.supervisorOperation).forEach((button) => button.addEventListener("click", () => setSupervisorOperation(button.dataset.supervisorOperation)));
    document.querySelectorAll("[data-company-upload]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.companyUpload)?.click()));
    el.companyLogoInput?.addEventListener("change", () => readCompanyImage(el.companyLogoInput.files?.[0], "logo"));
    el.companyBannerInput?.addEventListener("change", () => readCompanyImage(el.companyBannerInput.files?.[0], "banner"));
    el.companySettingsForm?.addEventListener("submit", (event) => { event.preventDefault(); saveCompanyIdentity(); });
    el.supervisorGenerateMessageBtn?.addEventListener("click", generateSupervisorAccessMessage);
    el.supervisorCopyMessageBtn?.addEventListener("click", copySupervisorMessage);
    el.supervisorClientSearch?.addEventListener("input", renderSupervisorCustomers);
    el.supervisorClientStatusFilter?.addEventListener("change", renderSupervisorCustomers);
    el.supervisorClientPeriodFilter?.addEventListener("change", renderSupervisorCustomers);
    el.supervisorNewClientBtn?.addEventListener("click", () => openSupervisorClientEditor());
    el.supervisorSelectAllClients?.addEventListener("change", () => {
      filteredSupervisorCustomers().forEach((customer) => el.supervisorSelectAllClients.checked ? supervisorSelectedClientIds.add(customer.id) : supervisorSelectedClientIds.delete(customer.id));
      renderSupervisorCustomers();
    });
    el.supervisorClientForm?.addEventListener("submit", () => toast(supervisorActiveClientId ? "Cliente atualizado visualmente." : "Novo cliente simulado."));
    el.supervisorProductForm?.addEventListener("submit", () => toast("Novo produto cadastrado visualmente."));
    el.supervisorPostSaleForm?.addEventListener("submit", () => toast("Pós-venda agendado visualmente."));
    document.querySelectorAll("[data-close-supervisor-modal]").forEach((button) => button.addEventListener("click", () => {
      const modal = document.getElementById(button.dataset.closeSupervisorModal);
      if (modal?.open) modal.close();
    }));
    el.supervisorUploadPdfBtn?.addEventListener("click", () => el.supervisorPdfInput?.click());
    el.supervisorSaveProductBtn?.addEventListener("click", () => {
      if (el.supervisorProductFolderModal?.open) el.supervisorProductFolderModal.close();
      toast("Produto salvo visualmente.");
    });
    el.supervisorDocumentList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-supervisor-remove-document]");
      if (!button) return;
      button.closest(".supervisor-document-row")?.remove();
      toast("Documento removido visualmente.");
    });
    el.supervisorPdfInput?.addEventListener("change", () => {
      const file = el.supervisorPdfInput.files?.[0];
      if (!file) return;
      el.supervisorDocumentList?.insertAdjacentHTML("afterbegin", `<div class="supervisor-document-row"><div><b>${escapeHtml(file.name)}</b><span>PDF · anexo simulado</span></div><button class="tiny-btn" type="button" data-supervisor-remove-document>Remover</button></div>`);
      toast("PDF adicionado visualmente.");
      el.supervisorPdfInput.value = "";
    });
    el.supervisorGenerateReportBtn?.addEventListener("click", () => {
      el.supervisorReportStatus.textContent = "Relatório demonstrativo gerado com sucesso.";
      el.supervisorReportStatus.classList.add("ok");
    });
    el.supervisorSendMessageBtn?.addEventListener("click", sendSupervisorMessage);
    el.supervisorImportBtn?.addEventListener("click", () => toast("Importação simulada. Nenhum arquivo foi enviado."));
    el.supervisorExportBtn?.addEventListener("click", () => toast("Exportação simulada. Nenhum arquivo foi gerado."));
    el.supervisorArchiveBtn?.addEventListener("click", () => {
      if (!supervisorSelectedClientIds.size) { toast("Selecione ao menos um cliente."); return; }
      toast(`${supervisorSelectedClientIds.size} cliente(s) arquivado(s) visualmente.`);
      supervisorSelectedClientIds.clear();
      renderSupervisorCustomers();
    });
    [el.supervisorModalCloseBtn, el.supervisorModalFooterCloseBtn].forEach((button) => button?.addEventListener("click", () => el.supervisorDetailModal?.close()));
    el.supervisorScreen?.addEventListener("click", (event) => {
      const dealButton = event.target.closest("[data-supervisor-deal]");
      if (dealButton) {
        const deal = SUPERVISOR_DEALS.find((item) => item.id === dealButton.dataset.supervisorDeal);
        const stageLabels = { novos: "Novos", em_atendimento: "Em atendimento", cotacao: "Cotação Enviada", documentacao: "Documentação recebida", venda: "Venda cadastrada", boleto: "Boleto Gerado", fechamento: "Fechamento", perdida: "Venda Perdida" };
        if (deal) openSupervisorModal(deal.client, "Ficha completa do lead", [["Nome", deal.client], ["Telefone", deal.phone || "—"], ["E-mail", deal.email || "—"], ["CNPJ ou PF", deal.personType || "PF"], ["Número CNPJ/CPF", deal.document || "—"], ["Qtd. de vidas", String(deal.lives || 1)], ["Valor do negócio", deal.value || "—"], ["Plano de interesse", deal.product || "—"], ["Cidade", deal.city || "—"], ["Vendedor responsável", deal.seller], ["Etapa atual", stageLabels[deal.stage] || deal.stage], ["Observações", deal.notes || "Sem observações."]]);
        return;
      }
      const brokerButton = event.target.closest("[data-supervisor-broker-action]");
      if (brokerButton) {
        const broker = SUPERVISOR_BROKERS.find((item) => item.id === brokerButton.dataset.brokerId);
        if (!broker) return;
        const action = brokerButton.dataset.supervisorBrokerAction;
        if (action === "copy") copySupervisorText(supervisorAccessMessage(broker.name, broker.token), "Acesso copiado.");
        if (action === "edit") toast(`Edição visual de ${broker.name} em preparação.`);
        if (action === "disable") toast(`${broker.name} foi desativado visualmente.`);
        return;
      }
      const productButton = event.target.closest("[data-supervisor-product]");
      if (productButton) {
        const customer = SUPERVISOR_CUSTOMERS.find((item) => item.id === productButton.dataset.supervisorProduct);
        if (customer) openSupervisorProductFolder(customer);
        return;
      }
      const actionButton = event.target.closest("[data-supervisor-client-action]");
      if (actionButton) {
        const customer = SUPERVISOR_CUSTOMERS.find((item) => item.id === actionButton.dataset.clientId);
        if (!customer) return;
        const action = actionButton.dataset.supervisorClientAction;
        if (action === "edit") openSupervisorClientEditor(customer);
        if (action === "product") openSupervisorNewProduct(customer);
        if (action === "post-sale") openSupervisorPostSale(customer);
        if (action === "archive") toast(`${customer.client} foi arquivado visualmente.`);
      }
    });
    el.supervisorScreen?.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-supervisor-select-client]");
      if (!checkbox) return;
      if (checkbox.checked) supervisorSelectedClientIds.add(checkbox.dataset.supervisorSelectClient);
      else supervisorSelectedClientIds.delete(checkbox.dataset.supervisorSelectClient);
      renderSupervisorCustomers();
    });
    el.openAdminBtn?.addEventListener("click", openAdminArea);
    el.adminBackToAccessBtn?.addEventListener("click", closeAdminArea);
    el.adminLogoutBtn?.addEventListener("click", adminLogout);
    el.adminLoginBtn?.addEventListener("click", () => adminLogin(false));
    el.adminKeyInput?.addEventListener("keydown", (event) => { if (event.key === "Enter") adminLogin(false); });
    el.adminRefreshBtn?.addEventListener("click", () => loadAdminDashboard(false));
    el.adminCreateClientBtn?.addEventListener("click", createAdminClient);
    el.adminSearch?.addEventListener("input", renderAdminDashboard);
    el.adminScreen?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-copy-token]");
      if (btn) copyAdminToken(btn.dataset.copyToken || "");
    });

    el.listModeBtn.addEventListener("click", () => setMode("list"));
    el.kanbanModeBtn.addEventListener("click", () => setMode("kanban"));
    el.crmSearch.addEventListener("input", renderCrm);
    el.crmStatusFilter.addEventListener("change", renderCrm);
    el.crmPeriodFilter?.addEventListener("change", () => { toggleCustomPeriodFields(); renderCrm(); });
    el.crmDateFrom?.addEventListener("change", renderCrm);
    el.crmDateTo?.addEventListener("change", renderCrm);
    el.configureAutoBtn.addEventListener("click", configureAuto);
    el.newLeadBtn.addEventListener("click", () => openLeadModal());
    el.importBtn.addEventListener("click", () => el.importFile.click());
    el.importFile.addEventListener("change", () => importLeads(el.importFile.files[0]));
    el.exportBtn.addEventListener("click", exportLeads);
    el.deleteSelectedLeadsBtn?.addEventListener("click", deleteSelectedLeads);
    el.openTrashBtn?.addEventListener("click", openTrashModal);
    el.closeTrashModalBtn?.addEventListener("click", closeTrashModal);
    el.closeTrashFooterBtn?.addEventListener("click", closeTrashModal);
    el.restoreAllTrashBtn?.addEventListener("click", restoreAllTrashLeads);

    el.clientSearch?.addEventListener("input", loadClients);
    el.clientStatusFilter?.addEventListener("change", loadClients);
    el.clientPeriodFilter?.addEventListener("change", () => { toggleClientCustomPeriodFields(); loadClients(); });
    el.clientDateFrom?.addEventListener("change", loadClients);
    el.clientDateTo?.addEventListener("change", loadClients);
    el.newClientBtn?.addEventListener("click", () => openClientModal());
    el.importClientsBtn?.addEventListener("click", () => el.importClientsFile?.click());
    el.importClientsFile?.addEventListener("change", () => importClients(el.importClientsFile.files[0]));
    el.exportClientsBtn?.addEventListener("click", exportClients);
    el.syncClosedClientsBtn?.addEventListener("click", () => syncClosedClients(false));
    el.clientForm?.addEventListener("submit", saveClient);
    el.closeClientModalBtn?.addEventListener("click", closeClientModal);
    el.cancelClientModalBtn?.addEventListener("click", closeClientModal);
    el.sellAgainBtn?.addEventListener("click", () => openBaseSaleModal(getClient(el.clientId.value)));
    el.attachClientDocBtn?.addEventListener("click", () => el.clientDocumentFile?.click());
    el.downloadClientDocBtn?.addEventListener("click", downloadClientDocument);
    el.downloadSelectedDocsBtn?.addEventListener("click", downloadSelectedClientDocs);
    el.clientDocumentFile?.addEventListener("change", async () => {
      const file = el.clientDocumentFile.files?.[0];
      if (!file) return;
      if (el.clientId.value && !String(el.clientId.value).startsWith("lead-")) return uploadClientDocument();
      try {
        state.clientDocumentPending = await fileToDocument(file);
        el.clientDocumentName.textContent = state.clientDocumentPending.fileName;
        el.downloadClientDocBtn.textContent = state.clientDocumentPending.fileName;
        el.downloadClientDocBtn.disabled = true;
        toast("PDF preparado. Salve o cliente para anexar.");
      } catch (error) { toast(error.message); }
      finally { el.clientDocumentFile.value = ""; }
    });
    el.postSaleForm?.addEventListener("submit", savePostSale);
    el.closePostSaleModalBtn?.addEventListener("click", closePostSaleModal);
    el.cancelPostSaleModalBtn?.addEventListener("click", closePostSaleModal);
    el.baseSaleForm?.addEventListener("submit", saveBaseSale);
    el.attachBaseSaleDocBtn?.addEventListener("click", () => el.baseSaleDocumentFile?.click());
    el.baseSaleDocumentFile?.addEventListener("change", async () => {
      const file = el.baseSaleDocumentFile.files?.[0];
      if (!file) return;
      try {
        state.baseSaleDocumentPending = await fileToDocument(file);
        el.baseSaleDocumentName.textContent = state.baseSaleDocumentPending.fileName;
        toast("PDF preparado para a venda.");
      } catch (error) { toast(error.message); }
      finally { el.baseSaleDocumentFile.value = ""; }
    });
    el.closeBaseSaleModalBtn?.addEventListener("click", closeBaseSaleModal);
    el.cancelBaseSaleModalBtn?.addEventListener("click", closeBaseSaleModal);
    el.closeSaleViewModalBtn?.addEventListener("click", closeSaleViewModal);
    el.closeSaleViewFooterBtn?.addEventListener("click", closeSaleViewModal);
    el.downloadSaleDocBtn?.addEventListener("click", downloadSaleDocument);
    el.productFolderForm?.addEventListener("submit", saveProductFolder);
    el.closeProductFolderModalBtn?.addEventListener("click", closeProductFolderModal);
    el.cancelProductFolderModalBtn?.addEventListener("click", closeProductFolderModal);
    el.productFolderAttachBtn?.addEventListener("click", () => el.productFolderFile?.click());
    el.productFolderFile?.addEventListener("change", uploadProductFolderDocuments);
    el.confirmCancelBtn?.addEventListener("click", () => resolveConfirm(false));
    el.confirmOkBtn?.addEventListener("click", () => resolveConfirm(true));
    el.termsAcceptCheck?.addEventListener("change", () => {
      if (el.termsContinueBtn) el.termsContinueBtn.disabled = !el.termsAcceptCheck.checked;
    });
    el.termsContinueBtn?.addEventListener("click", () => resolveTerms(true));
    el.termsDeclineBtn?.addEventListener("click", () => resolveTerms(false));
    el.termsModal?.addEventListener("cancel", (event) => event.preventDefault());

    el.leadForm.addEventListener("submit", saveLead);
    el.leadScheduleForm?.addEventListener("submit", saveLeadSchedule);
    el.scheduleLeadBtn?.addEventListener("click", () => openLeadScheduleModal(getLead(el.leadId.value)));
    el.closeLeadScheduleModalBtn?.addEventListener("click", closeLeadScheduleModal);
    el.cancelLeadScheduleModalBtn?.addEventListener("click", closeLeadScheduleModal);
    el.closeModalBtn.addEventListener("click", closeLeadModal);
    el.cancelModalBtn.addEventListener("click", closeLeadModal);
    el.archiveLeadBtn.addEventListener("click", async () => {
      const id = el.leadId.value;
      await deleteLead(id);
      closeLeadModal();
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const id = button.dataset.id;
      if (button.dataset.action === "view") openLeadModal(getLead(id));
      if (button.dataset.action === "archive") archiveLead(id);
      if (button.dataset.action === "unarchive") unarchiveLead(id);
      if (button.dataset.action === "delete") deleteLead(id);
      if (button.dataset.action === "schedule") openLeadScheduleModal(getLead(id));
      if (button.dataset.action === "chat") { markLeadSeen(id); renderCrm(); }
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-product-open]");
      if (!button) return;
      const client = getClient(button.dataset.productOpen);
      openProductFolder(client, button.dataset.productId || "principal");
    });

    document.addEventListener("click", (event) => {
      const deleteButton = event.target.closest("[data-product-doc-delete]");
      if (deleteButton) {
        event.preventDefault();
        event.stopPropagation();
        deleteProductDocument(deleteButton.dataset.productDocDelete);
        return;
      }
      const button = event.target.closest("[data-product-doc-id]");
      if (!button) return;
      downloadProductDocument(button.dataset.productDocId);
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-client-action]");
      if (!button) return;
      const client = getClient(button.dataset.id);
      if (button.dataset.clientAction === "edit") openClientModal(client);
      if (button.dataset.clientAction === "post-sale") openPostSaleModal(client);
    });

    document.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-sale-action]");
      if (!button) return;
      const client = getClient(button.dataset.clientId);
      const sale = clientBaseSales(client || {}).find((item) => item.id === button.dataset.saleId);
      if (button.dataset.saleAction === "view") openSaleView(client, sale);
      if (button.dataset.saleAction === "download-doc") {
        try {
          const data = await api(`/api/clientes/${encodeURIComponent(button.dataset.clientId)}/base-sale/${encodeURIComponent(button.dataset.saleId)}/documentacao?token=${tokenQuery()}`);
          downloadBase64Pdf(data.documentacaoPdf);
        } catch (error) { toast(error.message); }
      }
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-trash-action]");
      if (!button) return;
      if (button.dataset.trashAction === "restore") restoreTrashLead(button.dataset.id);
    });

    document.addEventListener("change", (event) => {
      const check = event.target.closest("[data-select-lead]");
      if (!check) return;
      const id = check.dataset.selectLead;
      if (check.checked) state.selectedLeadIds.add(id);
      else state.selectedLeadIds.delete(id);
      renderLeadSelectionState();
    });

    el.leadSelectAll?.addEventListener("change", () => {
      const visible = filteredLeads().map((lead) => lead.id);
      if (el.leadSelectAll.checked) visible.forEach((id) => state.selectedLeadIds.add(id));
      else visible.forEach((id) => state.selectedLeadIds.delete(id));
      renderCrm();
    });

    document.addEventListener("dragstart", (event) => {
      const card = event.target.closest(".kanban-card");
      if (!card) return;
      event.dataTransfer.setData("text/plain", card.dataset.id);
      event.dataTransfer.effectAllowed = "move";
    });
    document.addEventListener("dragover", (event) => {
      const lane = event.target.closest(".kanban-lane");
      if (!lane) return;
      event.preventDefault();
      lane.classList.add("drag-over");
    });
    document.addEventListener("dragleave", (event) => {
      const lane = event.target.closest(".kanban-lane");
      if (lane) lane.classList.remove("drag-over");
    });
    document.addEventListener("drop", (event) => {
      const lane = event.target.closest(".kanban-lane");
      if (!lane) return;
      event.preventDefault();
      lane.classList.remove("drag-over");
      const id = event.dataTransfer.getData("text/plain");
      updateLeadStatus(id, lane.dataset.lane);
    });

    el.generateQrBtn.addEventListener("click", connectWhatsApp);
    el.refreshQrBtn.addEventListener("click", connectWhatsApp);
    el.refreshInstanceBtn.addEventListener("click", refreshInstance);
    el.logoutBtn?.addEventListener("click", logout);
    el.topLogoutBtn?.addEventListener("click", logout);

    el.validateInstanceBtn.addEventListener("click", validateInstance);
    el.startCampaignBtn.addEventListener("click", startCampaign);
    el.stopCampaignBtn.addEventListener("click", stopCampaign);
  }

  function init() {
    const theme = localStorage.getItem(THEME_KEY) || "dark";
    el.root.dataset.theme = theme;
    el.appShell.classList.toggle("sidebar-collapsed", localStorage.getItem(SIDEBAR_KEY) === "1");
    const supervisorSidebarCollapsed = localStorage.getItem(SUPERVISOR_SIDEBAR_KEY) === "1";
    el.supervisorScreen?.classList.toggle("sidebar-collapsed", supervisorSidebarCollapsed);
    el.supervisorSidebarToggle?.setAttribute("aria-expanded", String(!supervisorSidebarCollapsed));
    el.supervisorSidebarToggle?.setAttribute("aria-label", supervisorSidebarCollapsed ? "Expandir menu" : "Recolher menu");
    if (el.supervisorSidebarToggle) el.supervisorSidebarToggle.title = supervisorSidebarCollapsed ? "Expandir menu" : "Recolher menu";
    fillStatusOptions();
    bindMoneyField(el.leadValorNegocio);
    bindMoneyField(el.clientValorFechado);
    bindMoneyField(el.baseSaleValor);
    updateTodayLabel();
    setInterval(updateTodayLabel, 60000);
    hardenAutocomplete();
    renderCompanyIdentity();
    toggleCustomPeriodFields();
    toggleClientCustomPeriodFields();
    loadAccess();
    bindEvents();
    setMode("list");
    renderCrm();
    bootAccess();
  }

  init();
})();
