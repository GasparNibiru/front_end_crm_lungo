(() => {
  "use strict";

  const API = String(window.LUNGO_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");
  const STORAGE_KEY = "lungo-suite-access-v5";
  const THEME_KEY = "lungo-suite-theme-v5";
  const SIDEBAR_KEY = "lungo-suite-sidebar-v5";
  const SUPERVISOR_SIDEBAR_KEY = "lungo-supervisor-sidebar-v1";
  const SUPERVISOR_SESSION_KEY = "lungo-supervisor-session-v1";
  const ACTIVE_PROFILE_KEY = "lungo-active-profile-v1";
  const AUTH_SESSION_KEY = "lungo-auth-session-v1";
  const TAB_PROFILE_KEY = "lungo-tab-profile-v1";
  const LEAD_SEEN_PREFIX = "lungo-lead-seen-v1";
  const ADMIN_SESSION_KEY = "lungo-admin-master-session-v1";
  const TERMS_VERSION = "mvp-beta-v1-2026-07-31";
  const TERMS_ACCEPT_PREFIX = "lungo-terms-accepted";
  const COMPANY_BRANDING_KEY = "companyBranding";
  const COMPANY_GOALS_KEY = "companyGoals";
  const COMPANY_MESSAGE_KEY = "companyMessage";
  const COMPANY_THEME_KEY = "companyTheme";
  const ADMIN_MASTER_MOCK_SESSION_KEY = "lungo-admin-master-mock-session-v1";
  const ADMIN_MASTER_SIDEBAR_KEY = "lungo-admin-master-sidebar-v1";
  const ADMIN_MASTER_SETTINGS_KEY = "lungo-admin-master-settings-v1";
  const ADMIN_DATA_KEY = "lungoAdminDataV2";
  const ADMIN_DATA_VERSION = 2;
  const ADMIN_EXTRA_ACCESS_PRICE = 15.90;
  const ADMIN_PLAN_DEFINITIONS = [
    { id: "free", name: "Plano Free", price: 0, brokerLimit: 1, managerLimit: 0, description: "1 acesso gratuito" },
    { id: "individual", name: "Plano Individual", price: 25.90, brokerLimit: 1, managerLimit: 0, description: "1 acesso para corretor" },
    { id: "team", name: "Plano Equipe", price: 49.90, brokerLimit: 2, managerLimit: 1, description: "1 supervisor + 2 corretores" },
    { id: "broker10", name: "Plano Corretora 10", price: 149.90, brokerLimit: 10, managerLimit: 1, description: "1 master ou supervisor + 10 corretores" },
    { id: "broker16", name: "Plano Corretora 16", price: 199.90, brokerLimit: 16, managerLimit: 1, description: "1 supervisor + 16 corretores" },
    { id: "broker20", name: "Plano Corretora 20", price: 239.90, brokerLimit: 20, managerLimit: 1, description: "1 supervisor + 20 corretores" }
  ];

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
  let supervisorAccessToken = "";
  let supervisorUserId = "";
  let supervisorDashboard = null;
  let supervisorOrganizationName = "";
  const supervisorSelectedClientIds = new Set();
  let supervisorActiveClientId = "";
  let pendingCompanyLogo = "";
  let pendingBrokerProfilePhoto = "";
  const brokerPhotoCrop = { image: null, zoom: 1, offsetX: 0, offsetY: 0, dragging: false, lastX: 0, lastY: 0 };
  let pendingCompanyBanner = "";
  const supervisorSharedViewState = new Map();
  let supervisorMountedView = null;

  const ADMIN_MASTER_ACCOUNTS = [
    { id: "am1", name: "Alvorada Benefícios", type: "Supervisor", responsible: "Camila Torres", login: "camila@alvorada.com.br", contact: "(11) 99910-2020", credential: "ALV-2026", status: "active", plan: "Equipe 10", limit: 10, used: 8, due: "10/09/2026", last: "Hoje, 10:22", revenue: 2490, legacy: "Não", payment: "Em dia", lastPayment: "10/08/2026", sellers: "Ana Souza, Bruno Lima, Carla Mendes, Diego Alves, Elisa Rocha, Felipe Costa, Giovana Reis e Hugo Martins", notes: "Equipe em expansão e acompanhamento mensal." },
    { id: "am2", name: "Pedro Martins", type: "Individual", responsible: "Pedro Martins", login: "PEDRO-LUNGO", contact: "(21) 98820-7744", credential: "PEDRO-LUNGO", status: "active", plan: "Individual", limit: 1, used: 1, due: "12/09/2026", last: "Hoje, 09:48", revenue: 249, legacy: "Não", payment: "Em dia", lastPayment: "12/08/2026", notes: "Conta individual ativa." },
    { id: "am3", name: "Norte Vida Corretora", type: "Supervisor", responsible: "Rafael Braga", login: "rafael@nortevida.com.br", contact: "(85) 99771-3300", credential: "NV-TEMP-26", status: "attention", plan: "Equipe 6", limit: 6, used: 6, due: "05/09/2026", last: "Ontem, 17:31", revenue: 1690, legacy: "Não", payment: "Vence em breve", lastPayment: "05/08/2026", sellers: "Marina Lopes, Júlio Freitas, Renata Luz, Caio Nunes, Bia Melo e Luiz Prado", notes: "Limite totalmente utilizado." },
    { id: "am4", name: "Juliana Freire", type: "Individual", responsible: "Juliana Freire", login: "JULIANA-LEGACY", contact: "(31) 99105-4432", credential: "JULIANA-LEGACY", status: "inactive", plan: "Individual", limit: 1, used: 0, due: "28/08/2026", last: "24/07/2026", revenue: 199, legacy: "Sim", payment: "Atrasado", lastPayment: "28/06/2026", notes: "Aguardar retorno comercial." },
    { id: "am5", name: "Horizonte Seguros", type: "Supervisor", responsible: "Lívia Ramos", login: "livia@horizonte.com.br", contact: "(41) 99662-1188", credential: "HOR-ADMIN", status: "active", plan: "Equipe 4", limit: 4, used: 3, due: "18/09/2026", last: "Hoje, 08:17", revenue: 1190, legacy: "Sim", payment: "Em dia", lastPayment: "18/08/2026", sellers: "Paulo Reis, Davi Rocha e Sara Leal", notes: "Cliente legacy migrado para gestão de equipe." },
    { id: "am6", name: "Marcelo Antunes", type: "Individual", responsible: "Marcelo Antunes", login: "MARCELO-2026", contact: "(51) 98710-6090", credential: "MARCELO-2026", status: "attention", plan: "Individual", limit: 1, used: 1, due: "06/09/2026", last: "Ontem, 15:02", revenue: 249, legacy: "Não", payment: "Vence em breve", lastPayment: "06/08/2026", notes: "Renovação comercial pendente." }
  ];
  const ADMIN_MASTER_PLANS = [
    { name: "Individual", limit: "1 acesso", value: "R$ 249/mês", status: "Ativo" },
    { name: "Equipe 4", limit: "1 supervisor + 4 corretores", value: "R$ 1.190/mês", status: "Ativo" },
    { name: "Equipe 6", limit: "1 supervisor + 6 corretores", value: "R$ 1.690/mês", status: "Ativo" },
    { name: "Equipe 10", limit: "1 supervisor + 10 corretores", value: "R$ 2.490/mês", status: "Ativo" },
    { name: "Personalizado", limit: "Limite manual", value: "Sob consulta", status: "Ativo" }
  ];
  let adminMasterLogged = false;
  let adminMasterKey = "";
  let adminMasterCurrentView = "dashboard";
  const adminMasterViewHistory = [];
  let adminTrainings = [];
  let brokerMessageTimer = null;
  let supervisorMessageTimer = null;
  let recruitmentData = { vacancy: null, candidates: [] };
  let recruitmentTimer = null;
  let calendarReminderTimer = null;
  let calendarWeekOffset = 0;
  let rhFormDirty = false;
  let activeBrokerMessage = null;
  let adminMasterAccessType = "individual";
  let adminMasterGeneratedMessage = "";
  let adminData = null;
  let adminCalendarDate = new Date();
  let leadMarketplaceAdminData = null;
  let leadMarketplaceAdminTab = 'users';

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
    supervisorBrokerEmail: $("#supervisorBrokerEmail"),
    supervisorBrokerPhone: $("#supervisorBrokerPhone"),
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
    supervisorImportFile: $("#supervisorImportFile"),
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
    companySidebarColor: $("#companySidebarColor"),
    companyBackgroundPicker: $("#companyBackgroundPicker"),
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
    brokerReportLogo: $("#brokerReportLogo"),
    brokerReportCompany: $("#brokerReportCompany"),
    brokerReportOwner: $("#brokerReportOwner"),
    brokerReportNumbers: $("#brokerReportNumbers"),
    brokerReportFunnel: $("#brokerReportFunnel"),
    brokerReportClientRows: $("#brokerReportClientRows"),
    brokerReportFooter: $("#brokerReportFooter"),
    brokerReportStatus: $("#brokerReportStatus"),
    brokerRefreshReportBtn: $("#brokerRefreshReportBtn"),
    brokerPrintReportBtn: $("#brokerPrintReportBtn"),
    brokerTrainingLibrary: $("#brokerTrainingLibrary"),
    brokerTrainingTrackFilter: $("#brokerTrainingTrackFilter"),
    brokerTrainingStatus: $("#brokerTrainingStatus"),
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
      treinamentos: $("#view-trainings"),
      relatorios: $("#view-reports"),
      vendedores: $("#view-vendedores"),
      agenda: $("#view-agenda"),
      comprar_leads: $("#view-comprar_leads"),
      settings: $("#view-settings"),
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
    brokerPersonalizationForm: $("#brokerPersonalizationForm"),
    brokerFixedCompanyName: $("#brokerFixedCompanyName"),
    brokerProfilePhotoInput: $("#brokerProfilePhotoInput"),
    brokerProfilePhotoButton: $("#brokerProfilePhotoButton"),
    brokerProfilePhotoName: $("#brokerProfilePhotoName"),
    brokerProfilePhotoPreview: $("#brokerProfilePhotoPreview"),
    brokerProfileInitials: $("#brokerProfileInitials"),
    brokerSidebarColor: $("#brokerSidebarColor"),
    brokerThemeSelect: $("#brokerThemeSelect"),
    brokerBackgroundPicker: $("#brokerBackgroundPicker"),
    brokerPersonalizationStatus: $("#brokerPersonalizationStatus"),

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
    supervisorClientOwnerLabel: $("#supervisorClientOwnerLabel"),
    supervisorClientOwner: $("#supervisorClientOwner"),
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
    baseSaleSellerLabel: $("#baseSaleSellerLabel"),
    baseSaleSeller: $("#baseSaleSeller"),
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

  function toast(message, tone = "auto") {
    const text = String(message || "");
    const normalized = text.toLocaleLowerCase("pt-BR");
    const resolvedTone = tone === "auto"
      ? (/erro|inválid|não foi possível|não encontrado|falhou|selecione|informe|atenção/.test(normalized) ? "error"
        : /salv|atualiz|cadastr|criad|confirm|conclu|adicion|exclu|removid|restaur|enviad|copiad|conectad|registrad|gerad|realizad/.test(normalized) ? "success" : "info")
      : tone;
    el.toast.dataset.tone = resolvedTone;
    el.toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${resolvedTone === "success" ? "✓" : resolvedTone === "error" ? "!" : "i"}</span><span>${escapeHtml(text)}</span>`;
    el.toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.toast.classList.remove("show"), 4600);
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
    return `${TERMS_ACCEPT_PREFIX}:${token}`;
  }

  function hasAcceptedTerms() {
    try {
      const saved = JSON.parse(localStorage.getItem(termsStorageKey()) || "{}");
      return Boolean(saved.accepted && saved.token === normalizeTermsToken(state.token));
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
    try {
      const remote = await api('/api/access/terms', { headers: { 'x-access-token': state.token } });
      if (remote.accepted) { saveTermsAcceptance(); return true; }
    } catch {}
    const accepted = await showTermsModal();
    if (!accepted) {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      state.token = "";
      state.connected = false;
      renderAccess();
      return false;
    }
    try { await api('/api/access/terms', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-access-token': state.token }, body: JSON.stringify({ version: TERMS_VERSION }) }); }
    catch { toast('Termos aceitos neste dispositivo; a sincronização com o servidor será tentada novamente.'); }
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

  function formatBrazilPhone(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
    digits = digits.slice(0, 11);
    if (!digits) return "";
    if (digits.length < 3) return `(${digits}`;
    const ddd = digits.slice(0, 2), number = digits.slice(2);
    if (number.length <= 4) return `(${ddd}) ${number}`;
    const split = number.length > 8 ? 5 : 4;
    return `(${ddd}) ${number.slice(0, split)}${number.length > split ? `-${number.slice(split)}` : ""}`;
  }

  function isContactPhoneField(field) {
    if (!(field instanceof HTMLInputElement) || field.id === "connectPhone") return false;
    return field.inputMode === "tel" || /(phone|telefone|whatsapp)/i.test(`${field.id} ${field.name || ""}`);
  }

  function bindBrazilPhoneMasks() {
    document.addEventListener("focusin", (event) => { if (isContactPhoneField(event.target)) { event.target.placeholder ||= "(DDD) 99999-9999"; if (event.target.value) event.target.value = formatBrazilPhone(event.target.value); } });
    document.addEventListener("input", (event) => { if (isContactPhoneField(event.target)) event.target.value = formatBrazilPhone(event.target.value); });
    document.querySelectorAll("input").forEach((field) => { if (isContactPhoneField(field)) { field.placeholder ||= "(DDD) 99999-9999"; if (field.value) field.value = formatBrazilPhone(field.value); } });
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) { const [year, month, day] = String(value).split("-"); return `${day}/${month}/${year}`; }
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
    return phone ? `Contato ${phone}` : (lead?.whatsappJid && lead?.lastMessage ? "Contato WhatsApp" : "");
  }

  function isUsableLead(lead) {
    const phone = displayPhone(lead);
    const name = displayName(lead);
    const hasManualData = [lead.email, lead.cidade, lead.planoInteresse, lead.cnpjOuPf, lead.valorNegocio, lead.qtdVidas].some((v) => String(v || "").trim());
    if (phone && phone.length >= 10 && name) return true;
    if (hasManualData && name) return true;
    if (lead?.lastMessage && lead?.whatsappJid && name) return true;
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

  function adminTrendBuckets(range="month",metric="revenue") {
    const definitions={day:{days:7,step:1},week:{days:28,step:7},fortnight:{days:90,step:15},month:{days:180,step:30}},definition=definitions[range]||definitions.month,end=new Date();end.setHours(23,59,59,999);
    const buckets=[];for(let offset=definition.days;offset>0;offset-=definition.step){const start=new Date(end);start.setDate(end.getDate()-offset+1);start.setHours(0,0,0,0);const finish=new Date(start);finish.setDate(start.getDate()+definition.step-1);finish.setHours(23,59,59,999);buckets.push({start,finish:finish>end?end:finish,value:0,count:0})}
    const source=adminData.salesTimeline?.length?adminData.salesTimeline:adminData.clients.map(client=>({date:client.saleDate,value:calculateSubscriptionTotal(client.planId,client.extraAccesses)}));source.forEach(sale=>{const date=new Date(sale.date);if(Number.isNaN(date.getTime()))return;const bucket=buckets.find(item=>date>=item.start&&date<=item.finish);if(bucket){bucket.count++;bucket.value+=Number(sale.value||0)}});
    return buckets.map(bucket=>({...bucket,total:metric==="sales"?bucket.count:bucket.value,label:range==="day"?bucket.start.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""):range==="month"?bucket.start.toLocaleDateString("pt-BR",{month:"short"}).replace(".",""):bucket.start.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}));
  }

  function renderAdminSalesTrend() {
    const target=$("#adminSalesTrend");if(!target)return;const range=$("#adminTrendRange")?.value||"month",metric=$("#adminTrendMetric")?.value||"revenue",data=adminTrendBuckets(range,metric),values=data.map(item=>item.total),max=Math.max(...values,1),width=720,height=170,padX=24,padTop=24,padBottom=28,plotHeight=height-padTop-padBottom,step=(width-padX*2)/Math.max(data.length-1,1),points=data.map((item,index)=>({x:padX+index*step,y:padTop+plotHeight-(item.total/max)*plotHeight,...item}));
    const line=points.length?points.slice(1).reduce((path,point,index)=>{const previous=points[index],controlX=(previous.x+point.x)/2;return `${path} C${controlX.toFixed(1)} ${previous.y.toFixed(1)}, ${controlX.toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`},`M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`):"";const area=`${line} L${points.at(-1)?.x||padX} ${height-padBottom} L${points[0]?.x||padX} ${height-padBottom} Z`,total=values.reduce((sum,value)=>sum+value,0),peak=Math.max(...values,0);
    target.innerHTML=`<div class="admin-trend-summary"><div><small>${metric==="sales"?"Vendas no período":"Faturamento no período"}</small><b>${metric==="sales"?total:formatCurrency(total)}</b></div><span>Pico: ${metric==="sales"?peak:formatCurrency(peak)}</span></div><svg class="admin-trend-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${metric==="sales"?"Vendas":"Faturamento"} por período"><defs><linearGradient id="adminTrendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--primary)" stop-opacity=".28"/><stop offset="1" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>${[0,.5,1].map(scale=>`<line class="admin-trend-grid" x1="${padX}" y1="${padTop+plotHeight*scale}" x2="${width-padX}" y2="${padTop+plotHeight*scale}"/>`).join("")}<path class="admin-trend-area" d="${area}"/><path class="admin-trend-line" d="${line}"/>${points.map(point=>`<g class="admin-trend-point"><circle cx="${point.x}" cy="${point.y}" r="3"/><title>${point.label}: ${metric==="sales"?point.total:formatCurrency(point.total)}</title>${(point.total>0||data.length<=7)?`<text x="${point.x}" y="${Math.max(12,point.y-9)}" text-anchor="middle">${metric==="sales"?point.total:formatCurrency(point.total)}</text>`:""}<text class="admin-trend-label" x="${point.x}" y="${height-8}" text-anchor="middle">${point.label}</text></g>`).join("")}</svg>`;
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
    // Componentes do Corretor também são reutilizados pelo Supervisor.
    // Nunca grave o token do Supervisor no armazenamento do Corretor.
    if (supervisorAccessToken || document.body.classList.contains("supervisor-mode")) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      token: state.token,
      clientName: state.clientName,
      instanceName: state.instanceName,
      connected: state.connected
    }));
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ role: "broker", token: state.token }));
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
    if (!locked) el.root.classList.remove("session-restoring");
  }

  function formatLastAccess(value) {
    if (!value || value === "Nunca") return "Nunca";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Nunca";
    return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
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
    return { name: String(stored.name || "").trim(), logo: String(stored.logo || ""), sidebarColor: String(stored.sidebarColor || "").trim(), background: String(stored.background || "none") };
  }

  const COMPANY_BACKGROUNDS = {
    "mountain-lake": "assets/backgrounds/mountain-lake.jpg",
    "misty-forest": "assets/backgrounds/misty-forest.jpg",
    "tropical-beach": "assets/backgrounds/tropical-beach.jpg",
    "green-hills": "assets/backgrounds/green-hills.jpg",
    "night-city": "assets/backgrounds/night-city.jpg"
  };

  function applyCompanyBackground(value) {
    const background = Object.hasOwn(COMPANY_BACKGROUNDS, value) ? value : "none";
    document.body.dataset.companyBackground = background;
    document.documentElement.style.setProperty("--company-background-image", background === "none" ? "none" : `url("${COMPANY_BACKGROUNDS[background]}")`);
    return background;
  }

  function brokerPreferenceKey(token = state.token) {
    let hash = 2166136261;
    for (const char of String(token || "")) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return `lungo-broker-appearance-v1-${(hash >>> 0).toString(36)}`;
  }

  function loadBrokerPersonalization() {
    if (!state.token) return { photo: "", sidebarColor: "", background: "none", theme: "" };
    const stored = readLocalObject(brokerPreferenceKey());
    return { photo: String(stored.photo || ""), sidebarColor: String(stored.sidebarColor || ""), background: String(stored.background || "none"), theme: stored.theme === "light" ? "light" : stored.theme === "dark" ? "dark" : "" };
  }

  function brokerInitials() {
    return String(state.clientName || "Corretor").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function applyBrokerPersonalization(preferences = loadBrokerPersonalization()) {
    const company = loadCompanyIdentity();
    const color = preferences.sidebarColor || company.sidebarColor || "#0b7658";
    const background = applyCompanyBackground(preferences.background || "none");
    const theme = preferences.theme || localStorage.getItem(THEME_KEY) || "dark";
    applyCompanySidebarColor(color);
    el.root.dataset.theme = theme;
    if (el.brokerFixedCompanyName) el.brokerFixedCompanyName.value = company.name || "Lungo";
    if (el.brokerSidebarColor) el.brokerSidebarColor.value = color;
    if (el.brokerThemeSelect) el.brokerThemeSelect.value = theme;
    const radio = document.querySelector(`input[name="brokerBackground"][value="${background}"]`) || document.querySelector('input[name="brokerBackground"][value="none"]');
    if (radio) radio.checked = true;
    pendingBrokerProfilePhoto = preferences.photo || "";
    if (el.brokerCompanyLogo) {
      el.brokerCompanyLogo.src = pendingBrokerProfilePhoto || company.logo || "https://imagensconrato.pagecor.com.br/logo-lungo.png";
      el.brokerCompanyLogo.alt = pendingBrokerProfilePhoto ? `Foto de ${state.clientName || "corretor"}` : company.name || "Lungo";
      el.brokerCompanyLogo.classList.toggle("broker-personal-photo", Boolean(pendingBrokerProfilePhoto));
    }
    if (el.brokerProfilePhotoPreview) { el.brokerProfilePhotoPreview.src = pendingBrokerProfilePhoto; el.brokerProfilePhotoPreview.hidden = !pendingBrokerProfilePhoto; }
    if (el.brokerProfileInitials) { el.brokerProfileInitials.textContent = brokerInitials(); el.brokerProfileInitials.hidden = Boolean(pendingBrokerProfilePhoto); }
    if (el.brokerProfilePhotoName) el.brokerProfilePhotoName.textContent = pendingBrokerProfilePhoto ? "Foto pessoal salva" : "Nenhuma foto";
  }

  function saveBrokerPersonalization(event) {
    event.preventDefault();
    if (!state.token) return;
    const preferences = { photo: pendingBrokerProfilePhoto, sidebarColor: el.brokerSidebarColor?.value || "#0b7658", background: document.querySelector('input[name="brokerBackground"]:checked')?.value || "none", theme: el.brokerThemeSelect?.value === "light" ? "light" : "dark" };
    try { localStorage.setItem(brokerPreferenceKey(), JSON.stringify(preferences)); }
    catch { toast("Não foi possível salvar. Tente uma foto menor."); return; }
    applyBrokerPersonalization(preferences);
    if (el.brokerPersonalizationStatus) { el.brokerPersonalizationStatus.textContent = "Personalização salva para o seu acesso."; el.brokerPersonalizationStatus.className = "auth-status ok"; }
    toast("Personalização atualizada com sucesso.");
  }

  function drawBrokerPhotoCrop() {
    const canvas = $("#brokerPhotoCropCanvas"), image = brokerPhotoCrop.image;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d"), size = canvas.width;
    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight), scale = baseScale * brokerPhotoCrop.zoom;
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    const maxX = Math.max(0, (width - size) / 2), maxY = Math.max(0, (height - size) / 2);
    brokerPhotoCrop.offsetX = Math.max(-maxX, Math.min(maxX, brokerPhotoCrop.offsetX));
    brokerPhotoCrop.offsetY = Math.max(-maxY, Math.min(maxY, brokerPhotoCrop.offsetY));
    ctx.clearRect(0, 0, size, size); ctx.save(); ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(image, (size - width) / 2 + brokerPhotoCrop.offsetX, (size - height) / 2 + brokerPhotoCrop.offsetY, width, height); ctx.restore();
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,255,255,.92)"; ctx.lineWidth = 5; ctx.stroke();
  }

  function openBrokerPhotoEditor(source) {
    const image = new Image();
    image.onload = () => { brokerPhotoCrop.image = image; brokerPhotoCrop.zoom = 1; brokerPhotoCrop.offsetX = 0; brokerPhotoCrop.offsetY = 0; if ($("#brokerPhotoZoom")) $("#brokerPhotoZoom").value = "1"; drawBrokerPhotoCrop(); $("#brokerPhotoEditorModal")?.showModal(); };
    image.onerror = () => toast("Não foi possível abrir essa imagem."); image.src = source;
  }

  function applyBrokerPhotoCrop() {
    const preview = $("#brokerPhotoCropCanvas"); if (!preview || !brokerPhotoCrop.image) return;
    const output = document.createElement("canvas"); output.width = 512; output.height = 512;
    const ctx = output.getContext("2d"), image = brokerPhotoCrop.image, ratio = output.width / preview.width;
    const baseScale = Math.max(preview.width / image.naturalWidth, preview.height / image.naturalHeight) * brokerPhotoCrop.zoom;
    const width = image.naturalWidth * baseScale * ratio, height = image.naturalHeight * baseScale * ratio;
    ctx.drawImage(image, (output.width - width) / 2 + brokerPhotoCrop.offsetX * ratio, (output.height - height) / 2 + brokerPhotoCrop.offsetY * ratio, width, height);
    pendingBrokerProfilePhoto = output.toDataURL("image/webp", .86);
    if (el.brokerProfilePhotoPreview) { el.brokerProfilePhotoPreview.src = pendingBrokerProfilePhoto; el.brokerProfilePhotoPreview.hidden = false; }
    if (el.brokerProfileInitials) el.brokerProfileInitials.hidden = true;
    if (el.brokerProfilePhotoName) el.brokerProfilePhotoName.textContent = "Foto ajustada — salve para confirmar";
    $("#brokerPhotoEditorModal")?.close();
  }

  function sidebarColorData(value) {
    const hex = /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value) : "#0b7658";
    const rgb = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
    const luminance = rgb.reduce((sum, channel, index) => sum + (channel / 255) * [0.2126, 0.7152, 0.0722][index], 0);
    const darkText = luminance > 0.62;
    return {
      hex, rgb,
      deep: rgb.map((channel) => Math.max(0, Math.round(channel * 0.56))),
      text: darkText ? "#10251e" : "#f5fff9",
      muted: darkText ? "rgba(16,37,30,.76)" : "rgba(225,250,239,.78)",
      icon: darkText ? "#073d2d" : "#a2f8d2",
      line: darkText ? "rgba(7,61,45,.28)" : "rgba(220,255,240,.3)",
      highlight: darkText ? "rgba(7,61,45,.13)" : "rgba(235,255,247,.16)"
    };
  }

  function applyCompanySidebarColor(value) {
    const color = sidebarColorData(value);
    document.querySelectorAll(".sidebar, .supervisor-sidebar").forEach((sidebar) => {
      sidebar.classList.add("company-sidebar-custom");
      sidebar.style.setProperty("--company-sidebar", `rgba(${color.rgb.join(",")},.97)`);
      sidebar.style.setProperty("--company-sidebar-deep", `rgb(${color.deep.join(",")})`);
      sidebar.style.setProperty("--company-sidebar-text", color.text);
      sidebar.style.setProperty("--company-sidebar-muted", color.muted);
      sidebar.style.setProperty("--company-sidebar-icon", color.icon);
      sidebar.style.setProperty("--company-sidebar-line", color.line);
      sidebar.style.setProperty("--company-sidebar-highlight", color.highlight);
    });
    return color.hex;
  }

  function saveCompanyIdentity() {
    const name = String(el.companyNameInput?.value || "").trim();
    if (!name) {
      el.companySettingsStatus.textContent = "Informe o nome da corretora.";
      el.companySettingsStatus.classList.add("error");
      return null;
    }
    const current = loadCompanyIdentity();
    const selectedBackground = document.querySelector('input[name="companyBackground"]:checked')?.value || current.background || "none";
    const identity = { name, logo: pendingCompanyLogo || current.logo || "", sidebarColor: applyCompanySidebarColor(el.companySidebarColor?.value || current.sidebarColor || "#0b7658"), background: applyCompanyBackground(selectedBackground) };
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
    if (el.companySidebarColor) el.companySidebarColor.value = identity.sidebarColor || "#0b7658";
    applyCompanySidebarColor(identity.sidebarColor || "#0b7658");
    applyCompanyBackground(identity.background);
    const backgroundRadio = document.querySelector(`input[name="companyBackground"][value="${identity.background}"]`) || document.querySelector('input[name="companyBackground"][value="none"]');
    if (backgroundRadio) backgroundRadio.checked = true;
    const supervisorReportLogo = document.querySelector("#supervisor-view-reports .supervisor-report-sheet header img");
    [[el.brokerCompanyLogo, logo], [el.supervisorCompanyLogo, logo], [supervisorReportLogo, logo], [el.brokerReportLogo, logo]].forEach(([image, src]) => { if (image) { image.src = src; image.alt = name; } });
    [el.brokerCompanyLogo, el.supervisorCompanyLogo].forEach((image) => image?.classList.toggle("company-custom-photo", Boolean(identity.logo)));
    if (el.brokerCompanyName) el.brokerCompanyName.textContent = name;
    if (el.supervisorCompanyName) {
      el.supervisorCompanyName.textContent = name;
      el.supervisorCompanyName.title = name;
      el.supervisorCompanyName.classList.toggle("medium-name", name.length > 16 && name.length <= 27);
      el.supervisorCompanyName.classList.toggle("long-name", name.length > 27);
    }
    if (el.brokerReportCompany) el.brokerReportCompany.textContent = name;
    if (el.companyNameInput) el.companyNameInput.value = identity.name || "";
    pendingCompanyLogo = identity.logo || pendingCompanyLogo;
    if (el.companyLogoName) el.companyLogoName.textContent = identity.logo ? "Logo salva localmente" : "Nenhum arquivo";
    const previewImage = el.companyLogoPreview?.querySelector("img");
    if (previewImage) { previewImage.src = logo; previewImage.classList.toggle("company-custom-photo", Boolean(identity.logo)); }
  }

  function readCompanyImage(file, kind) {
    if (!file || !String(file.type).startsWith("image/")) { toast("Selecione uma imagem válida."); return; }
    if (file.size > 1500000) { toast("Use uma imagem de até 1,5 MB para o armazenamento local."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (kind === "logo") { pendingCompanyLogo = String(reader.result || ""); el.companyLogoName.textContent = file.name; const preview = el.companyLogoPreview?.querySelector("img"); if (preview) { preview.src = pendingCompanyLogo; preview.classList.add("company-custom-photo"); } }
      else { pendingCompanyBanner = String(reader.result || ""); el.companyBannerName.textContent = file.name; }
    };
    reader.readAsDataURL(file);
  }

  function renderSupervisorOperation(name) {
    const labels = { instance: "Meus dados", connect: "Conectar WhatsApp", crm: "Meus Leads", clients: "Clientes", broadcast: "Disparos", cotador: "Cotador", comprar_leads: "Comprar Leads", treinamentos: "Treinamentos", agenda: "Agenda" };
    const descriptions = { instance: "Status da instância própria do Supervisor.", connect: "Conexão visual da conta WhatsApp do Supervisor.", crm: "Pipeline próprio do Supervisor.", clients: "Carteira própria do Supervisor.", broadcast: "Campanhas próprias do Supervisor.", cotador: "Cotações comerciais.", comprar_leads: "Aquisição de oportunidades.", treinamentos: "Trilhas e materiais comerciais.", agenda: "Compromissos e retornos comerciais." };
    const cards = name === "crm" ? [["Leads próprios", "31"], ["Em atendimento", "12"], ["Fechamentos", "6"]] : name === "clients" ? [["Clientes próprios", "18"], ["Vidas", "37"], ["Pós-vendas", "9"]] : [["Ambiente", "Supervisor"], ["Status", "Mock visual"], ["Integração", "Aguardando backend"]];
    el.supervisorOperationContent.innerHTML = `<header class="supervisor-operation-header"><div><h2>${escapeHtml(labels[name] || "Operação")}</h2><p>${escapeHtml(descriptions[name] || "Módulo operacional")}</p></div><span class="status-mini">Sessão própria · mock</span></header><div class="supervisor-operation-grid">${cards.map(([label, value]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></article>`).join("")}</div><section class="supervisor-card"><header><div><h2>Estrutura operacional</h2><p>Esta prévia segue o padrão do corretor sem usar seu token ou chamar endpoints.</p></div></header><div class="toolbar"><input class="search" placeholder="Buscar neste módulo" disabled><button class="btn primary" type="button" disabled>Nova ação</button><button class="btn" type="button" disabled>Atualizar</button></div></section>`;
  }

  function trainingStars(count) { return count > 0 ? `<span class="training-stars" aria-label="${count} estrelas">${'★'.repeat(count)}</span>` : ''; }

  function trainingCards(trainings) {
    if (!trainings.length) return '<div class="empty-state">Nenhum treinamento publicado nesta trilha.</div>';
    const tracks = [...new Set(trainings.map((item) => item.track || 'Geral'))];
    return tracks.map((track) => `<section class="training-track"><header><div><span>Trilha de conhecimento</span><h3>${escapeHtml(track)}</h3></div><b>${trainings.filter((item) => (item.track || 'Geral') === track).length} aulas</b></header><div class="training-card-grid">${trainings.filter((item) => (item.track || 'Geral') === track).map((item) => `<article class="training-card"><button type="button" class="training-thumb" data-training-play="${escapeHtml(item.youtubeId)}" data-training-title="${escapeHtml(item.title)}" data-training-track="${escapeHtml(item.track || 'Geral')}"><img src="https://i.ytimg.com/vi/${escapeHtml(item.youtubeId)}/hqdefault.jpg" alt="Capa de ${escapeHtml(item.title)}"><span>▶ Assistir agora</span></button><div><small>${escapeHtml(item.track || 'Geral')}</small><h4>${escapeHtml(item.title)}</h4>${trainingStars(item.stars)}<p>${escapeHtml(item.description || 'Treinamento em vídeo.')}</p></div></article>`).join('')}</div></section>`).join('');
  }

  function ensureTrainingPlayer() {
    let modal = $('#trainingPlayerModal');
    if (modal) return modal;
    document.body.insertAdjacentHTML('beforeend', `<dialog id="trainingPlayerModal" class="modal training-player-modal"><div class="modal-card"><header><div><h2 id="trainingPlayerTitle">Treinamento</h2><p id="trainingPlayerTrack">Trilha de conhecimento</p></div><button class="btn icon" type="button" data-training-player-close aria-label="Fechar">×</button></header><div class="training-player-frame"><iframe id="trainingPlayerFrame" title="Player do treinamento" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><footer><span class="footer-spacer"></span><button class="btn primary" type="button" data-training-player-close>Fechar</button></footer></div></dialog>`);
    modal = $('#trainingPlayerModal');
    modal.addEventListener('close', closeTrainingPlayer);
    modal.addEventListener('click', (event) => { if (event.target === modal || event.target.closest('[data-training-player-close]')) closeTrainingPlayer(); });
    return modal;
  }

  function openTrainingPlayer(button) {
    const modal = ensureTrainingPlayer();
    $('#trainingPlayerTitle').textContent = button.dataset.trainingTitle || 'Treinamento';
    $('#trainingPlayerTrack').textContent = `Trilha: ${button.dataset.trainingTrack || 'Geral'}`;
    $('#trainingPlayerFrame').src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(button.dataset.trainingPlay)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    modal.showModal();
  }

  function closeTrainingPlayer() {
    const modal = $('#trainingPlayerModal'); const frame = $('#trainingPlayerFrame');
    if (frame) frame.src = '';
    if (modal?.open) modal.close();
  }

  function calendarToken() { return supervisorAccessToken || state.token; }
  function calendarDateTime(value) { return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  async function renderTeamCalendar(target = 'broker') {
    const container = target === 'supervisor' ? el.supervisorOperationContent : el.views.agenda;
    if (!container) return;
    if (target === 'supervisor') container.replaceChildren();
    if (target === 'broker') Array.from(container.children).forEach((child) => { if (!child.classList.contains('team-calendar')) child.hidden = true; });
    let host = container.querySelector(':scope > .team-calendar');
    if (!host) { host = document.createElement('section'); host.className = 'team-calendar'; container.appendChild(host); }
    host.hidden = false; host.innerHTML = '<div class="empty-state">Carregando agenda...</div>';
    try {
      const result = await window.LungoSupervisorApi.getCalendarEvents(calendarToken()); const events = result.events || []; const canShare = target === 'supervisor';
      host.innerHTML = `<div class="calendar-layout"><form class="calendar-form"><header><div><h2>Novo agendamento</h2><p>Lembretes na tela 24 horas e 2 horas antes.</p></div></header><div class="calendar-form-grid"><label><span>Título</span><input name="title" maxlength="160" required></label><label><span>Tipo</span><select name="type"><option>Visita</option><option>Lembrete</option><option>Treinamento</option><option>Reunião</option><option>Retorno</option></select></label><label><span>Data</span><input name="date" type="date" min="${new Date().toISOString().slice(0, 10)}" required></label><label><span>Hora</span><input name="time" type="time" value="09:00" required></label><label><span>Local ou link</span><input name="location" maxlength="240"></label>${canShare ? '<label><span>Quem visualiza</span><select name="audience"><option value="self">Somente eu</option><option value="team">Toda a equipe</option></select></label>' : ''}<label class="full"><span>Descrição</span><textarea name="description" rows="3" maxlength="2000"></textarea></label></div><button class="btn primary" type="submit">Salvar agendamento</button><span class="auth-status calendar-form-status"></span></form><section class="calendar-events"><header><div><h2>Próximos compromissos</h2><p>${canShare ? 'Agenda própria e agendamentos dos corretores.' : 'Seus compromissos e eventos enviados pelo supervisor.'}</p></div><button class="btn calendar-refresh" type="button">Atualizar</button></header><div class="calendar-event-list">${events.length ? events.map((item) => `<article class="calendar-event-card"><time><b>${new Date(item.startsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</b><span>${new Date(item.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></time><div><span class="calendar-event-type">${escapeHtml(item.type)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || 'Sem descrição')}</p><small>${escapeHtml(item.location || 'Local não informado')} · Criado por ${escapeHtml(item.creatorName)}${item.audience === 'team' ? ' · Toda a equipe' : ''}</small></div>${item.canDelete ? `<button class="tiny-btn danger" type="button" data-calendar-delete="${escapeHtml(item.id)}">Excluir</button>` : ''}</article>`).join('') : '<div class="empty-state">Nenhum compromisso agendado.</div>'}</div></section></div>`;
      host.querySelector('.calendar-form').hidden = true;
      host.querySelector('.calendar-refresh').textContent = 'Novo agendamento';
      host.querySelector('.calendar-refresh').classList.add('primary');
      host.querySelector('.calendar-form').addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const status = form.querySelector('.calendar-form-status'); const data = new FormData(form); try { const startsAt = new Date(`${data.get('date')}T${data.get('time')}:00`); if (startsAt <= new Date()) throw new Error('Escolha uma data e hora futuras.'); await window.LungoSupervisorApi.createCalendarEvent({ title: data.get('title'), type: data.get('type'), description: data.get('description'), location: data.get('location'), audience: data.get('audience') || 'self', startsAt: startsAt.toISOString() }, calendarToken()); await renderTeamCalendar(target); toast('Agendamento salvo.'); } catch (error) { status.textContent = error.message; status.className = 'auth-status calendar-form-status error'; } });
      host.querySelector('.calendar-refresh').onclick = () => openCalendarEditor(target);
      host.querySelector('.calendar-event-list').addEventListener('click', async (event) => { const button = event.target.closest('[data-calendar-delete]'); if (!button || !confirm('Excluir este agendamento?')) return; try { await window.LungoSupervisorApi.deleteCalendarEvent(button.dataset.calendarDelete, calendarToken()); await renderTeamCalendar(target); toast('Agendamento excluído.'); } catch (error) { toast(error.message); } });
    } catch (error) { host.innerHTML = `<div class="auth-status error">${escapeHtml(error.message)}</div>`; }
  }

  function weekDays() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + calendarWeekOffset * 7);
    return Array.from({ length: 7 }, (_, index) => { const day = new Date(monday); day.setDate(monday.getDate() + index); return day; });
  }
  function localDateKey(value) { const date = value instanceof Date ? value : new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

  function openCalendarEditor(target) {
    let modal = $('#calendarEditorModal');
    if (!modal) { document.body.insertAdjacentHTML('beforeend', '<dialog id="calendarEditorModal" class="modal calendar-editor-modal"><form class="modal-card calendar-form"><header><div><h2>Novo agendamento</h2><p>Lembretes na tela 24 horas e 2 horas antes.</p></div><button class="btn icon" type="button" data-calendar-editor-close>×</button></header><div class="calendar-form-fields"></div><footer><span class="calendar-form-status auth-status"></span><span class="footer-spacer"></span><button class="btn" type="button" data-calendar-editor-close>Cancelar</button><button class="btn primary" type="submit">Salvar agendamento</button></footer></form></dialog>'); modal = $('#calendarEditorModal'); modal.addEventListener('click', (event) => { if (event.target.closest('[data-calendar-editor-close]')) modal.close(); }); }
    const canShare = target === 'supervisor'; const form = modal.querySelector('form');
    form.querySelector('.calendar-form-fields').innerHTML = `<div class="calendar-form-grid"><label><span>Título</span><input name="title" maxlength="160" required autofocus></label><label><span>Tipo</span><select name="type"><option>Visita</option><option>Lembrete</option><option>Treinamento</option><option>Reunião</option><option>Retorno</option></select></label><label><span>Data</span><input name="date" type="date" min="${new Date().toISOString().slice(0, 10)}" required></label><label><span>Hora</span><input name="time" type="time" value="09:00" required></label><label><span>Local ou link</span><input name="location" maxlength="240"></label>${canShare ? '<label><span>Quem visualiza</span><select name="audience"><option value="self">Somente eu</option><option value="team">Toda a equipe</option></select></label>' : ''}<label class="full"><span>Descrição</span><textarea name="description" rows="4" maxlength="2000"></textarea></label></div>`;
    form.onsubmit = async (event) => { event.preventDefault(); const status = form.querySelector('.calendar-form-status'); const data = new FormData(form); try { const startsAt = new Date(`${data.get('date')}T${data.get('time')}:00`); if (startsAt <= new Date()) throw new Error('Escolha uma data e hora futuras.'); await window.LungoSupervisorApi.createCalendarEvent({ title: data.get('title'), type: data.get('type'), description: data.get('description'), location: data.get('location'), audience: data.get('audience') || 'self', startsAt: startsAt.toISOString() }, calendarToken()); modal.close(); await renderTeamCalendar(target); toast('Agendamento salvo.'); } catch (error) { status.textContent = error.message; status.className = 'calendar-form-status auth-status error'; } };
    form.reset(); form.querySelector('[name="time"]').value = '09:00'; form.querySelector('.calendar-form-status').textContent = ''; modal.showModal();
  }

  async function renderTeamCalendarWeekly(target = 'broker') {
    const container = target === 'supervisor' ? el.supervisorOperationContent : el.views.agenda; if (!container) return;
    let host = container.querySelector(':scope > .team-calendar'); if (!host) { host = document.createElement('section'); host.className = 'team-calendar'; container.appendChild(host); }
    host.hidden = false; host.innerHTML = '<div class="empty-state">Carregando agenda...</div>';
    try {
      const result = await window.LungoSupervisorApi.getCalendarEvents(calendarToken()); const events = result.events || []; const days = weekDays();
      const weekLabel = `${days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a ${days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      host.innerHTML = `<section class="calendar-week-panel"><header class="calendar-week-header"><div><h2>Agenda da semana</h2><p>${escapeHtml(weekLabel)} · ${target === 'supervisor' ? 'Equipe completa' : 'Seus compromissos'}</p></div><div><button class="btn" type="button" data-calendar-week="prev">Anterior</button><button class="btn" type="button" data-calendar-week="today">Hoje</button><button class="btn" type="button" data-calendar-week="next">Próxima</button><button class="btn primary" type="button" data-calendar-new>Novo agendamento</button></div></header><div class="calendar-week-grid">${days.map((day) => { const key = localDateKey(day); const dayEvents = events.filter((item) => localDateKey(item.startsAt) === key); const today = new Date().toDateString() === day.toDateString(); return `<section class="calendar-day-column ${today ? 'today' : ''}"><header><span>${day.toLocaleDateString('pt-BR', { weekday: 'short' })}</span><b>${day.getDate()}</b></header><div>${dayEvents.map((item) => `<article class="calendar-week-event"><time>${new Date(item.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time><span class="calendar-event-type">${escapeHtml(item.type)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.location || item.description || 'Sem detalhes')}</p><small>${escapeHtml(item.creatorName)}${item.audience === 'team' ? ' · Equipe' : ''}</small>${item.canDelete ? `<button class="tiny-btn danger" type="button" data-calendar-delete="${escapeHtml(item.id)}">Excluir</button>` : ''}</article>`).join('') || '<span class="calendar-day-empty">Sem compromissos</span>'}</div></section>`; }).join('')}</div></section>`;
      host.querySelector('[data-calendar-new]').onclick = () => openCalendarEditor(target);
      host.querySelectorAll('[data-calendar-week]').forEach((button) => button.onclick = () => { calendarWeekOffset = button.dataset.calendarWeek === 'today' ? 0 : calendarWeekOffset + (button.dataset.calendarWeek === 'next' ? 1 : -1); renderTeamCalendar(target); });
      host.querySelector('.calendar-week-grid').addEventListener('click', async (event) => { const button = event.target.closest('[data-calendar-delete]'); if (!button || !confirm('Excluir este agendamento?')) return; try { await window.LungoSupervisorApi.deleteCalendarEvent(button.dataset.calendarDelete, calendarToken()); await renderTeamCalendar(target); toast('Agendamento excluído.'); } catch (error) { toast(error.message); } });
    } catch (error) { host.innerHTML = `<div class="auth-status error">${escapeHtml(error.message)}</div>`; }
  }

  function showCalendarReminder(item) {
    let modal = $('#calendarReminderModal');
    if (!modal) { document.body.insertAdjacentHTML('beforeend', '<dialog id="calendarReminderModal" class="modal small-modal"><div class="modal-card"><header><div><h2>Lembrete da agenda</h2><p id="calendarReminderWindow"></p></div><button class="btn icon" type="button" data-calendar-reminder-close>×</button></header><div class="calendar-reminder-body"><h3 id="calendarReminderTitle"></h3><p id="calendarReminderDescription"></p><b id="calendarReminderWhen"></b><span id="calendarReminderLocation"></span></div><footer><span class="footer-spacer"></span><button class="btn primary" type="button" data-calendar-reminder-close>Entendi</button></footer></div></dialog>'); modal = $('#calendarReminderModal'); modal.addEventListener('click', (event) => { if (event.target.closest('[data-calendar-reminder-close]')) modal.close(); }); }
    $('#calendarReminderWindow').textContent = item.reminderWindow === '2h' ? 'Este compromisso começa em até 2 horas.' : 'Este compromisso acontece nas próximas 24 horas.'; $('#calendarReminderTitle').textContent = item.title; $('#calendarReminderDescription').textContent = item.description || item.type; $('#calendarReminderWhen').textContent = calendarDateTime(item.startsAt); $('#calendarReminderLocation').textContent = item.location || 'Local não informado'; if (!modal.open) modal.showModal();
  }

  async function checkCalendarReminders() { if (!calendarToken()) return; try { const result = await window.LungoSupervisorApi.checkCalendarReminders(calendarToken()); (result.reminders || []).forEach((item, index) => setTimeout(() => showCalendarReminder(item), index * 500)); } catch {} }
  function startCalendarReminders() { clearInterval(calendarReminderTimer); checkCalendarReminders(); calendarReminderTimer = setInterval(checkCalendarReminders, 60000); }
  function stopCalendarReminders() { clearInterval(calendarReminderTimer); calendarReminderTimer = null; }

  function leadAge(value) { const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value || Date.now())) / 60000)); return minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 1440)} d`; }
  function leadStoreContainer(target) { if (target === 'supervisor') return el.supervisorOperationContent; return el.views.comprar_leads?.querySelector('.lead-storefront'); }
  async function renderLeadStorefront(target = 'broker') {
    const container = leadStoreContainer(target); if (!container) return; container.innerHTML = '<div class="empty-state">Carregando leads disponíveis...</div>';
    try { const result = await window.LungoSupervisorApi.getLeadMarketplace(calendarToken()); const leads = result.leads || []; const support = String(result.supportWhatsapp || '5555992102864').replace(/\D/g, ''); const message = encodeURIComponent(`Olá! Gostaria de solicitar créditos para comprar leads. Meu acesso é ${state.clientName || 'usuário Lungo'}.`); container.innerHTML = `<section class="lead-store-header"><div><span>Saldo disponível</span><b>${formatCurrency(result.balance || 0)}</b><small>Use seus créditos para adquirir oportunidades exclusivas.</small></div><div><button class="btn" type="button" data-lead-history>Histórico de compras</button><a class="btn primary" href="https://wa.me/${support}?text=${message}" target="_blank" rel="noopener">Solicitar créditos</a></div></section><div class="lead-store-grid">${leads.length ? leads.map((lead) => `<article class="lead-offer-card ${lead.status === 'reserved' ? 'reserved' : ''}"><header><span>${lead.status === 'reserved' ? 'Em compra' : 'Novo lead'}</span><small>Captado há ${escapeHtml(leadAge(lead.capturedAt))}</small></header><h3>${escapeHtml(lead.name)}</h3><dl><div><dt>Telefone</dt><dd>${escapeHtml(lead.phone)}</dd></div><div><dt>Perfil</dt><dd>${escapeHtml(lead.profile)}</dd></div><div><dt>Qtd. de vidas</dt><dd>${Number(lead.livesCount || 0)}</dd></div><div><dt>Interesse</dt><dd>${escapeHtml(lead.productInterest || 'Não informado')}</dd></div><div><dt>Região</dt><dd>${escapeHtml([lead.city, lead.state].filter(Boolean).join(' / ') || 'Não informada')}</dd></div></dl><footer><div><small>Valor do lead</small><b>${formatCurrency(lead.price)}</b></div><button class="btn primary" type="button" data-lead-buy="${escapeHtml(lead.id)}" ${lead.status === 'reserved' ? 'disabled' : ''}>${lead.status === 'reserved' ? 'Reservado' : 'Comprar'}</button></footer></article>`).join('') : '<div class="empty-state lead-store-empty">Nenhum lead disponível neste momento.</div>'}</div>`;
      container.querySelector('[data-lead-history]').onclick = () => openLeadPurchaseHistory(target);
      container.querySelector('.lead-store-grid').addEventListener('click', async (event) => { const button = event.target.closest('[data-lead-buy]'); if (!button) return; const lead = leads.find((item) => item.id === button.dataset.leadBuy); if (!lead || !await popupConfirm(`Comprar este lead por ${formatCurrency(lead.price)}? O valor será descontado do seu saldo.`, 'Confirmar compra')) return; button.disabled = true; button.textContent = 'Processando...'; try { await window.LungoSupervisorApi.buyMarketplaceLead(lead.id, calendarToken()); toast('Lead comprado e enviado para Meus Leads.'); await renderLeadStorefront(target); if (target === 'broker') await loadCrm(true); else await loadSupervisorRemoteData(); } catch (error) { toast(error.message); await renderLeadStorefront(target); } });
    } catch (error) { container.innerHTML = `<div class="auth-status error">${escapeHtml(error.message)}</div>`; }
  }
  async function openLeadPurchaseHistory(target) { try { const result = await window.LungoSupervisorApi.getLeadPurchaseHistory(calendarToken()); let modal = $('#leadPurchaseHistoryModal'); if (!modal) { document.body.insertAdjacentHTML('beforeend', '<dialog id="leadPurchaseHistoryModal" class="modal"><div class="modal-card"><header><div><h2>Histórico de compras</h2><p>Leads adquiridos com seus créditos.</p></div><button class="btn icon" type="button" data-lead-history-close>×</button></header><div class="lead-purchase-history"></div><footer><span class="footer-spacer"></span><button class="btn primary" type="button" data-lead-history-close>Fechar</button></footer></div></dialog>'); modal = $('#leadPurchaseHistoryModal'); modal.addEventListener('click', (event) => { if (event.target.closest('[data-lead-history-close]')) modal.close(); }); } modal.querySelector('.lead-purchase-history').innerHTML = (result.purchases || []).map((item) => { const lead = item.marketplace_leads || {}; return `<article><div><b>${escapeHtml(lead.name || 'Lead')}</b><span>${escapeHtml(lead.phone || '')} · ${escapeHtml(lead.profile || '')} · ${Number(lead.lives_count || 0)} vidas · ${escapeHtml(lead.product_interest || '')}</span></div><div><b>${formatCurrency(item.price)}</b><small>${calendarDateTime(item.purchased_at)}</small></div></article>`; }).join('') || '<div class="empty-state">Nenhuma compra realizada.</div>'; modal.showModal(); } catch (error) { toast(error.message); } }

  async function loadTrainingLibrary(token, target = 'broker') {
    const library = target === 'broker' ? el.brokerTrainingLibrary : el.supervisorOperationContent;
    const status = target === 'broker' ? el.brokerTrainingStatus : null;
    if (status) status.textContent = 'Carregando treinamentos...';
    try {
      const result = await window.LungoSupervisorApi.getTrainings(token);
      const trainings = result.trainings || [];
      if (target === 'supervisor') {
        library.innerHTML = `<div class="training-library"><header class="training-library-header"><div><h2>Central de treinamentos</h2><p>Conteúdos organizados pelo Admin Master.</p></div><select id="supervisorTrainingTrackFilter" class="select"><option value="">Todas as trilhas</option></select></header><div id="supervisorTrainingLibrary" class="training-tracks">${trainingCards(trainings)}</div></div>`;
        const filter = $('#supervisorTrainingTrackFilter');
        [...new Set(trainings.map((item) => item.track || 'Geral'))].forEach((track) => filter.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(track)}">${escapeHtml(track)}</option>`));
        filter.addEventListener('change', () => { $('#supervisorTrainingLibrary').innerHTML = trainingCards(filter.value ? trainings.filter((item) => (item.track || 'Geral') === filter.value) : trainings); });
      } else {
        library.innerHTML = trainingCards(trainings);
        el.brokerTrainingTrackFilter.innerHTML = '<option value="">Todas as trilhas</option>' + [...new Set(trainings.map((item) => item.track || 'Geral'))].map((track) => `<option value="${escapeHtml(track)}">${escapeHtml(track)}</option>`).join('');
        el.brokerTrainingTrackFilter.onchange = () => { library.innerHTML = trainingCards(el.brokerTrainingTrackFilter.value ? trainings.filter((item) => (item.track || 'Geral') === el.brokerTrainingTrackFilter.value) : trainings); };
        if (status) status.textContent = `${trainings.length} treinamento(s) disponível(is).`;
      }
    } catch (error) { if (status) { status.textContent = error.message; status.classList.add('error'); } else library.innerHTML = `<div class="auth-status error">${escapeHtml(error.message)}</div>`; }
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
    if (name === 'treinamentos') { loadTrainingLibrary(supervisorAccessToken, 'supervisor'); return; }
    if (name === 'agenda') { renderTeamCalendar('supervisor'); return; }
    if (name === 'comprar_leads') { renderLeadStorefront('supervisor'); return; }
    const soonModules = ["cotador"];
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
    if (name === "crm") { loadCrm(true); startCrmRealtime(); }
    else stopCrmRealtime();
    const labels = { instance: "Meus dados", connect: "Conectar WhatsApp", crm: "Meus Leads", clients: "Clientes", broadcast: "Disparos", cotador: "Cotador", comprar_leads: "Comprar Leads", treinamentos: "Treinamentos", agenda: "Agenda" };
    if (el.supervisorViewTitle) el.supervisorViewTitle.textContent = labels[name] || "Operação";
  }

  async function loadSupervisorRemoteData() {
    const [dashboardResult, brokersResult, clientsResult, leadsResult, operationalClientsResult, goalResult] = await Promise.all([
      window.LungoSupervisorApi.getDashboard(supervisorAccessToken),
      window.LungoSupervisorApi.getBrokers(supervisorAccessToken),
      window.LungoSupervisorApi.getClients(supervisorAccessToken),
      window.LungoSupervisorApi.getLeads(supervisorAccessToken),
      window.LungoSupervisorApi.getOperationalClients(supervisorAccessToken),
      window.LungoSupervisorApi.getTeamGoal(supervisorAccessToken).catch(() => ({ teamGoal: supervisorTeamGoal() }))
    ]);
    localStorage.setItem(supervisorTeamGoalKey(), String(goalResult.teamGoal || 0));
    supervisorDashboard = dashboardResult.dashboard || {};
    SUPERVISOR_BROKERS.splice(0, SUPERVISOR_BROKERS.length, ...(brokersResult.brokers || []).map((broker) => ({ id: broker.id, name: broker.name, email: broker.email || "—", phone: broker.phone || "", token: broker.token || "", status: broker.status === "active" ? "online" : "", statusLabel: broker.status === "active" ? "Ativo" : "Bloqueado", sales: Number(broker.sales || 0), revenue: Number(broker.revenue || 0), goal: Number(broker.goalPercent || 0), login: formatLastAccess(broker.lastLoginAt), tokenActive: broker.tokenActive })));
    renderSupervisorMessageRecipients();
    const stageMap = { novo: "novos", novo_lead: "novos", em_atendimento: "em_atendimento", cotacao_enviada: "cotacao", documentacao_recebida: "documentacao", venda_cadastrada: "venda", boleto_gerado: "boleto", fechamento: "fechamento", venda_perdida: "perdida" };
    const activeBrokerIds = new Set(SUPERVISOR_BROKERS.filter((broker) => broker.statusLabel === "Ativo").map((broker) => String(broker.id)));
    const activeBrokerNames = new Set(SUPERVISOR_BROKERS.filter((broker) => broker.statusLabel === "Ativo").map((broker) => stripAccents(broker.name).toLowerCase()));
    const belongsToActiveBroker = (lead) => lead.brokerUserId ? activeBrokerIds.has(String(lead.brokerUserId)) : activeBrokerNames.has(stripAccents(lead.brokerName || "").toLowerCase());
    SUPERVISOR_DEALS.splice(0, SUPERVISOR_DEALS.length, ...(leadsResult.leads || []).filter((lead) => !["arquivado", "lixeira"].includes(lead.status) && belongsToActiveBroker(lead)).map((lead) => ({ id: lead.id, brokerUserId: lead.brokerUserId || null, stage: stageMap[lead.status] || "novos", client: lead.nome || lead.pushName || lead.telefone || "Lead", seller: lead.brokerName || "Corretor", phone: lead.telefone || lead.phone || "—", email: lead.email || "", personType: lead.pessoaTipo || "", document: lead.cnpjOuPf || "", lives: Number(lead.qtdVidas || 0), product: lead.planoInteresse || "—", city: lead.cidade || "", value: lead.valorNegocio ? formatMoney(lead.valorNegocio) : "R$ 0", notes: lead.observacao || lead.lastMessage || "" })));
    SUPERVISOR_BROKERS.forEach((broker) => {
      const closed = SUPERVISOR_DEALS.filter((deal) => deal.stage === 'fechamento' && stripAccents(deal.seller).toLowerCase() === stripAccents(broker.name).toLowerCase());
      broker.sales = closed.length;
      broker.revenue = closed.reduce((sum, deal) => sum + reportMoneyNumber(deal.value), 0);
    });
    const operationalCustomers = (operationalClientsResult.clients || []).map((client) => ({ id: `operational-${client.id}`, client: client.nome || "Cliente", seller: client.brokerName || "Corretor", phone: client.telefone || "—", email: client.email || "", product: client.produto || "Cliente", status: ({ ativo: "Ativo", a_renovar: "A renovar", renovado: "Renovado" })[client.status] || "Ativo", lives: Number(client.qtdVidas || 0), value: client.valorFechado ? formatMoney(client.valorFechado) : "—", date: client.dataContratacao || String(client.createdAt || "").slice(0, 10), renewal: client.dataRenovacao || "—", post: client.posVenda ? "Agendado" : "Pendente", notes: client.observacao || "" }));
    const registeredCustomers = (clientsResult.clients || []).map((client) => ({ id: `registered-${client.id}`, client: client.name || "Cliente", seller: client.users?.name || "Supervisor", phone: client.phone || "—", email: client.email || "", product: "Cliente importado", status: client.status === "inactive" ? "Inativo" : "Ativo", lives: 0, value: "—", date: String(client.created_at || "").slice(0, 10), renewal: "—", post: "Pendente", notes: [client.document_number, client.city].filter(Boolean).join(" · ") }));
    const pipelineCustomers = SUPERVISOR_DEALS.filter((deal) => deal.stage === "fechamento").map((deal) => ({ id: `lead-${deal.id}`, leadId: deal.id, client: deal.client, seller: deal.seller, phone: deal.phone, email: deal.email, product: deal.product, status: "Ativo", lives: deal.lives, value: deal.value, date: "—", renewal: "—", post: "Pendente", notes: deal.notes }));
    const customerKey = (item) => String(item.email || item.phone || item.client || item.id).replace(/\D/g, "") || String(item.email || item.client || item.id).trim().toLowerCase();
    const consolidatedCustomers = new Map();
    [...pipelineCustomers, ...operationalCustomers, ...registeredCustomers].forEach((customer) => consolidatedCustomers.set(customerKey(customer), { ...(consolidatedCustomers.get(customerKey(customer)) || {}), ...customer }));
    SUPERVISOR_CUSTOMERS.splice(0, SUPERVISOR_CUSTOMERS.length, ...consolidatedCustomers.values());
  }

  async function supervisorLogin(options = {}) {
    const silent = Boolean(options.silent);
    const token = String(options.token || el.supervisorEmailInput?.value || "").trim();
    if (!token) { el.supervisorStatus.textContent = "Informe o token de Supervisor."; el.supervisorStatus.classList.add("error"); return; }
    el.supervisorLoginBtn.disabled = true; el.supervisorStatus.textContent = "Validando acesso..."; el.supervisorStatus.classList.remove("error", "ok");
    try {
      const auth = await window.LungoSupervisorApi.verify(token);
      if (auth.user?.role !== "supervisor") throw new Error("Este token não pertence a um Supervisor.");
      supervisorAccessToken = token;
      supervisorUserId = auth.user.id || "";
      state.token = token;
      state.clientName = auth.user.name || "Supervisor";
      state.instanceName = auth.client?.instanceName || "";
      localStorage.setItem(SUPERVISOR_SESSION_KEY, token);
      localStorage.setItem(ACTIVE_PROFILE_KEY, "supervisor");
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ role: "supervisor", token }));
      sessionStorage.setItem(TAB_PROFILE_KEY, "supervisor");
      if (!await ensureTermsAccepted()) return;
      await Promise.all([loadSupervisorRemoteData(), loadCrm(true)]);
      if (el.supervisorEmailInput) el.supervisorEmailInput.value = "";
      el.supervisorStatus.textContent = "Acesso liberado."; el.supervisorStatus.classList.add("ok");
      supervisorOrganizationName = auth.user.organization?.name || "Corretora";
      openSupervisorArea();
    } catch (error) { supervisorAccessToken = ""; supervisorUserId = ""; el.root.classList.remove("session-restoring"); setAuthLocked(true); el.supervisorStatus.textContent = error.message || "Acesso inválido."; el.supervisorStatus.classList.add("error"); if (!silent) toast(error.message || "Acesso inválido."); }
    finally { el.supervisorLoginBtn.disabled = false; }
  }

  function supervisorInitials(name) {
    return String(name || "").split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
  }

  function supervisorBrokerMarkerColor(deal) {
    const identity = String(deal?.brokerUserId || deal?.seller || "corretor");
    let hash = 0;
    for (let index = 0; index < identity.length; index += 1) hash = ((hash << 5) - hash + identity.charCodeAt(index)) | 0;
    const palette = ["#22c55e", "#38bdf8", "#f59e0b", "#a78bfa", "#fb7185", "#2dd4bf", "#f97316", "#60a5fa", "#e879f9", "#84cc16"];
    return palette[Math.abs(hash) % palette.length];
  }

  function actionIcon(name) {
    const paths = {
      copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
      email: '<path d="M3 6h18v12H3z"/><path d="m3 7 9 7 9-7"/>',
      renew: '<path d="M20 7v5h-5"/><path d="M18.4 16a8 8 0 1 1 .1-8.1L20 12"/>',
      block: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      reactivate: '<path d="M7 10V7a4 4 0 0 1 7.5-2"/><rect x="5" y="10" width="14" height="10" rx="2"/>',
      edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
      archive: '<path d="M6 6l12 12M18 6 6 18"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
  }

  function supervisorTeamGoalKey() { return `lungo-supervisor-team-goal:${supervisorAccessToken || state.token || "sem-token"}`; }
  function supervisorTeamGoal() { return Math.max(0, Number(localStorage.getItem(supervisorTeamGoalKey()) || 0)); }

  async function refreshBrokerHeaderGoal() {
    if (!state.token || supervisorAccessToken) return;
    try {
      const goal = await window.LungoSupervisorApi.getTeamGoal(state.token);
      if ($("#brokerHeaderGoal")) $("#brokerHeaderGoal").textContent = formatCurrency(goal.target || 0);
      if ($("#brokerHeaderGoalProposals")) $("#brokerHeaderGoalProposals").textContent = Number(goal.proposals || 0).toLocaleString("pt-BR");
      if ($("#brokerHeaderGoalRealized")) $("#brokerHeaderGoalRealized").textContent = formatCurrency(goal.realized || 0);
      if ($("#brokerHeaderGoalPercent")) $("#brokerHeaderGoalPercent").textContent = `${Number(goal.percent || 0)}%`;
      if ($("#brokerHeaderGoalBar")) $("#brokerHeaderGoalBar").style.width = `${Math.min(100, Math.max(0, Number(goal.percent || 0)))}%`;
    } catch (_) {
      if ($("#brokerHeaderGoal")) $("#brokerHeaderGoal").textContent = "Não definida";
      if ($("#brokerHeaderGoalProposals")) $("#brokerHeaderGoalProposals").textContent = "0";
      if ($("#brokerHeaderGoalRealized")) $("#brokerHeaderGoalRealized").textContent = formatCurrency(0);
      if ($("#brokerHeaderGoalPercent")) $("#brokerHeaderGoalPercent").textContent = "0%";
    }
  }

  function renderSupervisorGoalsAndReport() {
    const goal = supervisorTeamGoal();
    const teamRevenue = SUPERVISOR_DEALS.filter((deal) => deal.stage === 'fechamento').reduce((sum, deal) => sum + reportMoneyNumber(deal.value), 0);
    const teamSales = SUPERVISOR_BROKERS.reduce((sum, broker) => sum + Number(broker.sales || 0), 0);
    const revenue = teamRevenue;
    const percent = goal > 0 ? Math.min(999, Math.round((revenue / goal) * 100)) : 0;
    if ($('#supervisorTeamGoalInput')) $('#supervisorTeamGoalInput').value = goal || '';
    if ($('#supervisorGoalTarget')) $('#supervisorGoalTarget').textContent = formatCurrency(goal);
    if ($('#supervisorGoalRealized')) $('#supervisorGoalRealized').textContent = formatCurrency(revenue);
    if ($('#supervisorGoalPercent')) $('#supervisorGoalPercent').textContent = `${percent}%`;
    if ($('#supervisorGoalRing')) $('#supervisorGoalRing').style.setProperty('--goal-progress', `${Math.min(100, percent) * 3.6}deg`);
    if ($('#supervisorGoalModalSplit')) $('#supervisorGoalModalSplit').textContent = `${formatCurrency(goal && SUPERVISOR_BROKERS.length ? goal / SUPERVISOR_BROKERS.length : 0)} por corretor`;
    const identity = loadCompanyIdentity();
    const companyName = identity.name || supervisorOrganizationName || 'Corretora';
    const logo = identity.logo || 'https://imagensconrato.pagecor.com.br/logo-lungo.png';
    if ($('#supervisorReportLogo')) { $('#supervisorReportLogo').src = logo; $('#supervisorReportLogo').alt = companyName; }
    if ($('#supervisorReportCompany')) $('#supervisorReportCompany').textContent = companyName;
    if ($('#supervisorReportOwner')) $('#supervisorReportOwner').textContent = `Supervisor: ${state.clientName || 'Supervisor'} · ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
    if ($('#supervisorReportNumbers')) $('#supervisorReportNumbers').innerHTML = [['Meta da equipe', formatCurrency(goal)], ['Faturamento', formatCurrency(revenue)], ['Meta alcançada', `${percent}%`], ['Vendas', Number(supervisorDashboard?.sales || 0) || teamSales], ['Clientes ativos', SUPERVISOR_CUSTOMERS.length], ['Corretores', SUPERVISOR_BROKERS.length]].map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join('');
    if ($('#supervisorReportRows')) $('#supervisorReportRows').innerHTML = SUPERVISOR_BROKERS.map((broker, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(broker.name)}</td><td>${broker.sales}</td><td>${formatCurrency(goal && SUPERVISOR_BROKERS.length ? goal / SUPERVISOR_BROKERS.length : 0)}</td><td>${broker.goal}%</td><td>${escapeHtml(broker.login)}</td></tr>`).join('') || '<tr><td colspan="6">Nenhum corretor cadastrado.</td></tr>';
    if ($('#supervisorReportFunnel')) $('#supervisorReportFunnel').innerHTML = [['novos','Novos'],['em_atendimento','Em atendimento'],['cotacao','Cotação'],['documentacao','Documentação'],['venda','Venda cadastrada'],['boleto','Boleto'],['fechamento','Fechamento'],['perdida','Perdida']].map(([stage,label]) => `<span><b>${SUPERVISOR_DEALS.filter((deal) => deal.stage === stage).length}</b>${label}</span>`).join('');
    if ($('#supervisorReportFooter')) $('#supervisorReportFooter').textContent = `${companyName} · 1/1`;
  }

  function renderSupervisorMocks() {
    const teamGoal = supervisorTeamGoal();
    const brokerTarget = teamGoal && SUPERVISOR_BROKERS.length ? teamGoal / SUPERVISOR_BROKERS.length : 0;
    SUPERVISOR_BROKERS.forEach((broker) => { broker.goal = brokerTarget > 0 ? Math.min(999, Math.round((Number(broker.revenue || 0) / brokerTarget) * 100)) : 0; });
    const closedDeals = SUPERVISOR_DEALS.filter((deal) => deal.stage === "fechamento");
    const closedSales = closedDeals.length;
    const closedRevenue = closedDeals.reduce((sum, deal) => sum + reportMoneyNumber(deal.value), 0);
    const totalLeads = SUPERVISOR_DEALS.length;
    const conversion = totalLeads > 0 ? (closedSales / totalLeads) * 100 : 0;
    const dashboardCards = $$("#supervisor-view-dashboard .supervisor-kpis article");
    const dashboardValues = [
      [String((supervisorDashboard?.brokers || 0) + 1), `${supervisorDashboard?.brokers || 0} corretores + Supervisor`],
      [String(closedSales), "negócios em fechamento"],
      [formatCurrency(closedRevenue), "produção dos fechamentos"],
      [`${conversion.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`, `${closedSales} fechamentos em ${totalLeads} leads`]
    ];
    dashboardCards.forEach((card, index) => { if (dashboardValues[index]) { card.querySelector("b").textContent = dashboardValues[index][0]; card.querySelector("small").textContent = dashboardValues[index][1]; } });
    const brokerRows = SUPERVISOR_BROKERS.map((broker) => `
      <div class="supervisor-broker-row">
        <div class="supervisor-person"><span class="supervisor-avatar">${escapeHtml(supervisorInitials(broker.name))}</span><b>${escapeHtml(broker.name)}${broker.supervisor ? ' <small class="supervisor-role-badge">Supervisor</small>' : ""}<small class="supervisor-target-badge">Meta ${formatCurrency(brokerTarget)}</small></b></div>
        <span><i class="status-dot ${escapeHtml(broker.status)}"></i>${escapeHtml(broker.statusLabel)}</span>
        <b>${broker.sales} vendas</b>
        <div><div class="supervisor-progress"><i style="width:${broker.goal}%"></i></div><small>${broker.goal}% da meta</small></div>
        <span>${formatCurrency(broker.revenue || 0)} vendidos</span>
      </div>`).join("");
    if (el.supervisorBrokerList) el.supervisorBrokerList.innerHTML = brokerRows;
    const dashboardFunnel = $('#supervisorDashboardFunnel');
    if (dashboardFunnel) {
      const funnelStages = [['novos','Novos'],['em_atendimento','Atendimento'],['cotacao','Cotação'],['documentacao','Documentação'],['venda','Venda'],['boleto','Boleto'],['fechamento','Fechamento']];
      const largestStage = Math.max(1, ...funnelStages.map(([stage]) => SUPERVISOR_DEALS.filter((deal) => deal.stage === stage).length));
      dashboardFunnel.innerHTML = funnelStages.map(([stage, label]) => { const count = SUPERVISOR_DEALS.filter((deal) => deal.stage === stage).length; return `<div><span><b>${escapeHtml(label)}</b><small>${count}</small></span><i><em style="width:${Math.max(count ? 8 : 0, (count / largestStage) * 100)}%"></em></i></div>`; }).join('');
    }
    const pendingHires = recruitmentData.candidates.filter((candidate) => candidate.stage === 'aprovado' && candidate.hirePending && !candidate.hiredUserId);
    const pendingHireRows = pendingHires.map((candidate) => `<tr class="pending-hire-row"><td><div class="supervisor-person"><span class="supervisor-avatar">${escapeHtml(supervisorInitials(candidate.name))}</span><b>${escapeHtml(candidate.name)}</b></div></td><td>${escapeHtml(candidate.email || '—')}</td><td><span class="status-badge">Aguardando acesso</span></td><td>—</td><td><span>Token ainda não gerado</span></td><td><button class="tiny-btn" type="button" data-rh-generate-token="${candidate.id}">Gerar token</button></td></tr>`).join('');
    if (el.supervisorBrokerRows) el.supervisorBrokerRows.innerHTML = SUPERVISOR_BROKERS.map((broker) => `
      <tr><td><div class="supervisor-person"><span class="supervisor-avatar">${escapeHtml(supervisorInitials(broker.name))}</span><b>${escapeHtml(broker.name)}</b></div></td><td>${escapeHtml(broker.email)}</td><td><i class="status-dot ${escapeHtml(broker.status)}"></i>${escapeHtml(broker.statusLabel)}</td><td>${escapeHtml(broker.login)}</td><td><div class="supervisor-token-cell">${broker.token ? `<code>${escapeHtml(broker.token)}</code><button class="tiny-btn icon-action-btn" type="button" data-supervisor-broker-action="copy" data-broker-id="${broker.id}" title="Copiar token" aria-label="Copiar token">${actionIcon('copy')}</button>` : `<span>${broker.tokenActive ? "Token legado — renove para visualizar" : "Sem token ativo"}</span>`}</div></td><td><div class="supervisor-broker-actions"><button class="tiny-btn icon-action-btn" type="button" data-supervisor-broker-action="email" data-broker-id="${broker.id}" title="Reenviar token por e-mail" aria-label="Reenviar token por e-mail">${actionIcon('email')}</button><button class="tiny-btn icon-action-btn" type="button" data-supervisor-broker-action="renew" data-broker-id="${broker.id}" title="Renovar token" aria-label="Renovar token">${actionIcon('renew')}</button><button class="tiny-btn icon-action-btn" type="button" data-supervisor-broker-action="${broker.statusLabel === "Ativo" ? "disable" : "reactivate"}" data-broker-id="${broker.id}" title="${broker.statusLabel === "Ativo" ? "Bloquear" : "Reativar"}" aria-label="${broker.statusLabel === "Ativo" ? "Bloquear" : "Reativar"}">${actionIcon(broker.statusLabel === "Ativo" ? 'block' : 'reactivate')}</button><button class="tiny-btn icon-action-btn" type="button" data-supervisor-broker-action="edit" data-broker-id="${broker.id}" title="Editar corretor" aria-label="Editar corretor">${actionIcon('edit')}</button><button class="tiny-btn icon-action-btn danger" type="button" data-supervisor-broker-action="archive" data-broker-id="${broker.id}" title="Arquivar corretor" aria-label="Arquivar corretor">${actionIcon('archive')}</button></div></td></tr>`).join("") + pendingHireRows;
    el.supervisorBrokerRows?.querySelectorAll('[data-supervisor-broker-action="archive"]').forEach((button) => { button.title = 'Excluir corretor'; button.setAttribute('aria-label', 'Excluir corretor'); });

    const stages = [
      ["novos", "Novos", "Novos"], ["em_atendimento", "Em atendimento", "Em atendimento"], ["cotacao", "Cotação", "Cotação Enviada"], ["documentacao", "Doc. recebida", "Documentação recebida"],
      ["venda", "Venda cadastrada", "Venda cadastrada"], ["boleto", "Boleto gerado", "Boleto Gerado"], ["fechamento", "Fechamento", "Fechamento"], ["perdida", "Venda perdida", "Venda Perdida"]
    ];
    if (el.supervisorKanban) el.supervisorKanban.innerHTML = stages.map(([key, label, fullLabel]) => {
      const deals = SUPERVISOR_DEALS.filter((deal) => deal.stage === key);
      const total = deals.reduce((sum, deal) => sum + Number(String(deal.value || "").replace(/[^0-9,]/g, "").replace(",", ".") || 0), 0);
      const totalLabel = ["novos", "em_atendimento"].includes(key) ? "Valor especulativo" : key === "fechamento" ? "Realizado" : key === "perdida" ? "Perdido" : "Previsto";
      return `<section class="supervisor-lane"><header title="${escapeHtml(fullLabel)}"><b>${escapeHtml(label)}</b><span>${deals.length}</span></header><div class="supervisor-lane-cards">${deals.map((deal) => `<article class="supervisor-deal"><b title="${escapeHtml(deal.client)}">${escapeHtml(deal.client)}</b><span class="supervisor-deal-seller" title="Responsável: ${escapeHtml(deal.seller)}"><i style="--broker-marker:${supervisorBrokerMarkerColor(deal)}" aria-hidden="true"></i>${escapeHtml(deal.seller)}</span><div><small>${escapeHtml(deal.value)}</small><button class="tiny-btn" type="button" data-supervisor-deal="${deal.id}">Ver</button></div></article>`).join("")}</div><footer class="supervisor-lane-total ${key === "perdida" ? "lost" : ""}"><b>${deals.length} negócio${deals.length === 1 ? "" : "s"}</b><span>${totalLabel}: ${formatMoney(String(total))}</span></footer></section>`;
    }).join("");

    renderSupervisorCustomers();
    if (el.supervisorGoalRows) el.supervisorGoalRows.innerHTML = SUPERVISOR_BROKERS.slice(0, 6).map((broker) => `<div class="supervisor-goal-row"><b>${escapeHtml(broker.name)}</b><div class="supervisor-progress"><i style="width:${broker.goal}%"></i></div><span>${broker.goal}% · ${broker.sales} vendas</span></div>`).join("");
    renderSupervisorGoalsAndReport();
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
    if (el.supervisorCompanyName) el.supervisorCompanyName.textContent = supervisorOrganizationName || "Corretora";
    const topOrganization = document.querySelector(".supervisor-top-actions strong");
    if (topOrganization) topOrganization.textContent = supervisorOrganizationName || "Corretora";
    clearInterval(recruitmentTimer); loadRecruitment(true, false); recruitmentTimer = setInterval(() => loadRecruitment(true, true), 20000);
    startCalendarReminders();
  }

  function closeSupervisorArea() {
    stopCalendarReminders();
    clearInterval(supervisorMessageTimer); supervisorMessageTimer = null;
    clearInterval(recruitmentTimer); recruitmentTimer = null;
    supervisorAccessToken = "";
    supervisorUserId = "";
    supervisorDashboard = null;
    supervisorOrganizationName = "";
    state.token = ""; state.clientName = ""; state.instanceName = ""; state.connected = false; state.leads = [];
    localStorage.removeItem(SUPERVISOR_SESSION_KEY);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(TAB_PROFILE_KEY);
    if (el.supervisorEmailInput) el.supervisorEmailInput.value = "";
    restoreSupervisorSharedView();
    document.body.classList.remove("supervisor-mode");
    if (el.supervisorScreen) el.supervisorScreen.hidden = true;
    setAuthLocked(true);
    [el.supervisorDetailModal, el.supervisorClientModal, el.supervisorProductModal, el.supervisorProductFolderModal, el.supervisorPostSaleModal].forEach((modal) => {
      if (modal?.open) modal.close();
    });
  }

  const RH_STAGES = [['novo', 'Novos'], ['triagem', 'Triagem'], ['contato', 'Contato'], ['entrevista', 'Entrevista'], ['aprovado', 'Aprovados'], ['recusado', 'Recusados']];

  function recruitmentLink() { const vacancy = recruitmentData.vacancy; return vacancy ? `${location.origin}${location.pathname}?vaga=${encodeURIComponent(vacancy.slug)}` : ''; }
  function candidateWhatsApp(candidate) { const phone = String(candidate.phone || '').replace(/\D/g, ''); const text = `Olá, ${candidate.name}! Recebemos sua candidatura para a vaga de ${recruitmentData.vacancy?.title || 'Consultor de Planos de Saúde'}. Gostaríamos de conversar sobre a oportunidade. Podemos falar agora?`; return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`; }
  function recruitmentCandidateAction(candidate) { if (candidate.stage === 'aprovado' && !candidate.hiredUserId) return candidate.hirePending ? '<span class="rh-hire-pending">Aguardando token na aba Corretores</span>' : `<button class="btn small primary" type="button" data-rh-hire="${candidate.id}">Cadastrar novo corretor</button>`; if (candidate.hiredUserId) return '<span class="rh-hire-pending done">Corretor cadastrado</span>'; return ''; }

  function ensureRhEditorModal() {
    let modal = $('#rhEditorModal');
    if (!modal) { document.body.insertAdjacentHTML('beforeend', `<dialog id="rhEditorModal" class="modal rh-editor-modal"><div class="modal-card"><header><div><h2>Personalizar landing page</h2><p>Configure o conteúdo e a publicação da vaga.</p></div><button id="rhEditorClose" class="btn icon" type="button">×</button></header><div id="rhEditorBody" class="rh-editor-body"></div></div></dialog>`); modal = $('#rhEditorModal'); $('#rhEditorClose').onclick = () => modal.close(); modal.addEventListener('cancel', (event) => { event.preventDefault(); modal.close(); }); }
    const editor = $('.rh-vacancy-editor'); if (editor && editor.parentElement !== $('#rhEditorBody')) $('#rhEditorBody').appendChild(editor);
    const panelHeader = $('.rh-candidates-panel > header'); if (panelHeader && !$('#rhOpenEditorBtn')) panelHeader.insertAdjacentHTML('beforeend', '<button id="rhOpenEditorBtn" class="btn primary" type="button">Personalizar landing page</button>');
    if ($('#rhOpenEditorBtn')) $('#rhOpenEditorBtn').onclick = () => modal.showModal();
    return modal;
  }

  function renderRecruitment(preserveForm = false) {
    ensureRhEditorModal();
    const vacancy = recruitmentData.vacancy || {}; const fields = { rhVacancyTitle: vacancy.title, rhVacancyHeadline: vacancy.headline, rhVacancyLocation: vacancy.location, rhVacancyWorkModel: vacancy.workModel, rhVacancyDescription: vacancy.description, rhVacancyRequirements: vacancy.requirements, rhVacancyBenefits: vacancy.benefits, rhVacancyActive: String(Boolean(vacancy.active)) };
    if (!preserveForm && !rhFormDirty) Object.entries(fields).forEach(([id, value]) => { if ($(`#${id}`)) $(`#${id}`).value = value || ''; });
    const kanban = $('#rhCandidateKanban'); if (!kanban) return;
    kanban.innerHTML = RH_STAGES.map(([stage, label]) => { const rows = recruitmentData.candidates.filter((item) => item.stage === stage); return `<section class="rh-lane" data-rh-lane="${stage}"><header><b>${label}</b><span>${rows.length}</span></header><div>${rows.map((candidate) => `<article class="rh-candidate-card ${candidate.seenAt ? '' : 'new'}" draggable="true" data-rh-candidate="${candidate.id}"><header><b>${escapeHtml(candidate.name)}</b><span class="rh-candidate-head-actions">${candidate.seenAt ? '' : '<em>Novo</em>'}<button class="tiny-btn icon-action-btn danger" type="button" data-rh-delete="${candidate.id}" title="Excluir candidato" aria-label="Excluir candidato">${actionIcon('archive')}</button></span></header><small>${escapeHtml(candidate.city || 'Cidade não informada')} · ${escapeHtml(candidate.experience || 'Experiência não informada')}</small><p>${escapeHtml(candidate.phone)}${candidate.email ? ` · ${escapeHtml(candidate.email)}` : ''}</p><select data-rh-stage="${candidate.id}">${RH_STAGES.map(([value, text]) => `<option value="${value}" ${value === candidate.stage ? 'selected' : ''}>${text}</option>`).join('')}</select><div><a class="btn small" href="${candidateWhatsApp(candidate)}" target="_blank" rel="noopener">WhatsApp</a><button class="btn small" type="button" data-rh-details="${candidate.id}">Detalhes</button>${recruitmentCandidateAction(candidate)}</div></article>`).join('') || '<div class="empty-state compact-empty">Nenhum candidato</div>'}</div></section>`; }).join('');
    if ($('#rhVacancyStatus')) $('#rhVacancyStatus').textContent = vacancy.active ? `Vaga publicada: ${recruitmentLink()}` : 'Vaga salva, mas ainda desativada.';
  }

  function showRecruitmentNotification(candidate) {
    if ($('#rhCandidateNotification')?.open || !candidate) return;
    document.body.insertAdjacentHTML('beforeend', `<dialog id="rhCandidateNotification" class="modal rh-notification-modal"><div class="modal-card"><header><div><h2>Novo candidato!</h2><p>Uma candidatura acaba de chegar.</p></div></header><div class="broker-message-body"><b>${escapeHtml(candidate.name)}</b><p>${escapeHtml(candidate.city || 'Cidade não informada')} · ${escapeHtml(candidate.experience || 'Experiência não informada')}</p></div><footer><span class="footer-spacer"></span><button id="rhNotificationOpen" class="btn primary" type="button">Ver candidato</button><button id="rhNotificationClose" class="btn" type="button">Fechar</button></footer></div></dialog>`);
    const modal = $('#rhCandidateNotification'); const finish = async (open) => { await window.LungoSupervisorApi.markCandidatesSeen(supervisorAccessToken); modal.close(); modal.remove(); if (open) setSupervisorView('rh'); };
    $('#rhNotificationOpen').onclick = () => finish(true); $('#rhNotificationClose').onclick = () => finish(false); modal.addEventListener('cancel', (event) => event.preventDefault()); modal.showModal();
  }

  async function loadRecruitment(notify = true, preserveForm = true) {
    if (!supervisorAccessToken) return;
    try { const result = await window.LungoSupervisorApi.getRecruitment(supervisorAccessToken); const identity = loadCompanyIdentity(); let vacancy = result.vacancy; if (identity.name && (vacancy?.companyName !== identity.name || (identity.logo && vacancy?.logo !== identity.logo))) { const logo = await compactRecruitmentLogo(identity.logo || ''); const updated = await window.LungoSupervisorApi.updateVacancy({ companyName: identity.name, logo }, supervisorAccessToken); vacancy = updated.vacancy; } recruitmentData = { vacancy, candidates: result.candidates || [] }; renderRecruitment(preserveForm); if ($('#supervisor-view-brokers')?.classList.contains('active')) renderSupervisorMocks(); if (notify) showRecruitmentNotification(recruitmentData.candidates.find((item) => !item.seenAt)); }
    catch (error) { if ($('#rhVacancyStatus')) { $('#rhVacancyStatus').textContent = error.message; $('#rhVacancyStatus').classList.add('error'); } }
  }

  function compactRecruitmentLogo(source) {
    if (!source || source.length < 400000) return Promise.resolve(source || '');
    return new Promise((resolve) => { const image = new Image(); image.onload = () => { const scale = Math.min(1, 360 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/webp', .82)); }; image.onerror = () => resolve(''); image.src = source; });
  }

  async function saveRecruitmentVacancy(event) {
    event.preventDefault(); const identity = loadCompanyIdentity(); const logo = await compactRecruitmentLogo(identity.logo || ''); const payload = { title: $('#rhVacancyTitle').value.trim(), headline: $('#rhVacancyHeadline').value.trim(), location: $('#rhVacancyLocation').value.trim(), workModel: $('#rhVacancyWorkModel').value, description: $('#rhVacancyDescription').value.trim(), requirements: $('#rhVacancyRequirements').value.trim(), benefits: $('#rhVacancyBenefits').value.trim(), active: $('#rhVacancyActive').value === 'true', companyName: identity.name || supervisorOrganizationName || 'Corretora', logo };
    try { const result = await window.LungoSupervisorApi.updateVacancy(payload, supervisorAccessToken); recruitmentData.vacancy = result.vacancy; rhFormDirty = false; renderRecruitment(false); $('#rhEditorModal')?.close(); toast('Página da vaga atualizada.'); } catch (error) { toast(error.message); }
  }

  async function updateRecruitmentStage(candidateId, stage) {
    await window.LungoSupervisorApi.updateCandidate(candidateId, { stage, seen: true }, supervisorAccessToken);
    if (stage === 'aprovado') { const candidate = recruitmentData.candidates.find((item) => item.id === candidateId); if (candidate && await popupConfirm(`Deseja enviar ${candidate.name} para a aba Corretores aguardando a geração do token?`, 'Candidato aprovado')) await window.LungoSupervisorApi.updateCandidate(candidateId, { hirePending: true, seen: true }, supervisorAccessToken); }
    await loadRecruitment(false, true);
  }

  async function loadPublicVacancy(slug) {
    document.body.classList.add('public-vacancy-mode'); $('#publicVacancyScreen').hidden = false; $('#authScreen').hidden = true;
    try {
      const response = await fetch(`${API}/api/public/vacancies/${encodeURIComponent(slug)}`); const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Vaga indisponível.');
      const vacancy = data.vacancy; const header = $('.public-vacancy-page > header'); const logo = header?.querySelector('img');
      if (logo && vacancy.logo) { logo.src = vacancy.logo; logo.alt = vacancy.companyName || 'Corretora'; }
      if (header && !$('#publicVacancyCompany')) logo?.insertAdjacentHTML('afterend', `<b id="publicVacancyCompany">${escapeHtml(vacancy.companyName || 'Corretora')}</b>`);
      $('#publicVacancyTitle').textContent = vacancy.title; $('#publicVacancyHeadline').textContent = vacancy.headline || ''; $('#publicVacancyLocation').textContent = [vacancy.workModel, vacancy.location].filter(Boolean).join(' · '); $('#publicVacancyDescription').textContent = vacancy.description || '';
      const lines = (value) => String(value || '').split('\n').filter(Boolean).map((line) => `<span>✓ ${escapeHtml(line)}</span>`).join('') || '<span>Consulte a equipe responsável.</span>';
      $('#publicVacancyRequirements').innerHTML = lines(vacancy.requirements); $('#publicVacancyBenefits').innerHTML = lines(vacancy.benefits);
    }
    catch (error) { $('.public-vacancy-content').innerHTML = `<div class="empty-state"><h2>Vaga indisponível</h2><p>${escapeHtml(error.message)}</p></div>`; }
  }

  async function submitPublicApplication(event) {
    event.preventDefault(); const form = event.currentTarget; const slug = new URLSearchParams(location.search).get('vaga'); const status = $('#publicApplicationStatus');
    const payload = { name: $('#applicationName').value.trim(), phone: $('#applicationPhone').value.trim(), email: $('#applicationEmail').value.trim(), city: $('#applicationCity').value.trim(), experience: $('#applicationExperience').value, resumeUrl: $('#applicationResumeUrl').value.trim(), message: $('#applicationMessage').value.trim(), website: $('#applicationWebsite').value };
    if (payload.name.length < 2 || payload.phone.replace(/\D/g, '').length < 10) { status.textContent = 'Informe seu nome completo e um WhatsApp válido.'; status.classList.add('error'); status.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const button = form.querySelector('button[type="submit"]'); if (button) { button.disabled = true; button.textContent = 'Enviando...'; }
    try { const response = await fetch(`${API}/api/public/vacancies/${encodeURIComponent(slug)}/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); form.innerHTML = `<div class="application-success"><span>✓</span><h2>Candidatura enviada!</h2><p>Recebemos seus dados com sucesso. A equipe responsável entrará em contato pelo WhatsApp informado.</p><small>Não é necessário enviar novamente.</small></div>`; }
    catch (error) { status.textContent = error.message || 'Não foi possível enviar sua candidatura. Tente novamente.'; status.classList.add('error'); if (button) { button.disabled = false; button.textContent = 'Enviar candidatura'; } }
  }

  function setSupervisorView(name) {
    restoreSupervisorSharedView();
    const titles = { dashboard: "Dashboard da Equipe", brokers: "Corretores", funnel: "Funil de Vendas", customers: "Todos os Clientes", reports: "Relatórios", messages: "Mensagens", rh: "Recursos Humanos", settings: "Configurações da Corretora" };
    el.supervisorNavItems.forEach((button) => button.classList.toggle("active", button.dataset.supervisorView === name));
    el.supervisorViews.forEach((view) => view.classList.toggle("active", view.id === `supervisor-view-${name}`));
    if (name === "customers") {
      const node = el.views.clients;
      const target = $("#supervisor-view-customers");
      if (node && target) {
        let stateEntry = supervisorSharedViewState.get(node);
        if (!stateEntry) {
          const placeholder = document.createComment("supervisor-shared-clients");
          node.parentNode.insertBefore(placeholder, node);
          stateEntry = { placeholder, wasActive: node.classList.contains("active") };
          supervisorSharedViewState.set(node, stateEntry);
        }
        target.replaceChildren(node);
        node.classList.add("active", "supervisor-shared-view");
        supervisorMountedView = node;
        loadClients(true);
      }
    }
    if (el.supervisorViewTitle) el.supervisorViewTitle.textContent = titles[name] || "Supervisor";
    if (name === "settings") renderCompanyIdentity();
    clearInterval(supervisorMessageTimer); supervisorMessageTimer = null;
    if (name === "messages") { loadSupervisorMessages(); supervisorMessageTimer = setInterval(loadSupervisorMessages, 10000); }
    if (name === 'rh') loadRecruitment(false);
  }

  function openSupervisorModal(title, subtitle, fields) {
    if (!el.supervisorDetailModal) return;
    el.supervisorModalTitle.textContent = title;
    el.supervisorModalSubtitle.textContent = subtitle || "";
    el.supervisorModalBody.innerHTML = fields.map(([label, value]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></article>`).join("");
    el.supervisorDetailModal.showModal();
  }

  function showAccessLimitModal() {
    const modal = $('#accessLimitModal');
    if (modal && !modal.open) modal.showModal();
  }

  function isAccessLimitError(error) {
    return /limite de acessos|número máximo|numero maximo|access_limit_reached/i.test(String(error?.message || error || ''));
  }

  function supervisorBrokerCapacity() {
    const subscription = supervisorDashboard?.subscription;
    if (!subscription) return Infinity;
    return Math.max(0, Number(subscription.plans?.included_brokers || 0) + Number(subscription.extra_accesses || 0));
  }

  async function generateSupervisorAccessMessage() {
    const name = String(el.supervisorBrokerName?.value || "").trim();
    const email = String(el.supervisorBrokerEmail?.value || "").trim();
    const phone = String(el.supervisorBrokerPhone?.value || "").trim();
    if (!name || !email) {
      el.supervisorGeneratedMessage.hidden = true;
      el.supervisorAccessStatus.textContent = "Preencha o nome e um e-mail válido.";
      el.supervisorAccessStatus.classList.add("error");
      el.supervisorAccessStatus.classList.remove("ok");
      return;
    }
    el.supervisorGenerateMessageBtn.disabled = true; el.supervisorAccessStatus.textContent = "Criando acesso...";
    try {
      const result = await window.LungoSupervisorApi.createBroker({ name, email, phone: phone || null, expiresAt: null }, supervisorAccessToken);
      const message = supervisorAccessMessage(name, result.token);
      el.supervisorGeneratedMessage.hidden = false; el.supervisorGeneratedMessage.querySelector("p").textContent = message;
      el.supervisorAccessStatus.textContent = result.emailDelivery?.sent ? `Acesso criado e enviado para ${email}.` : "Acesso criado, mas o e-mail não pôde ser enviado. Use o botão de reenvio."; el.supervisorAccessStatus.classList.toggle("error", !result.emailDelivery?.sent); el.supervisorAccessStatus.classList.toggle("ok", Boolean(result.emailDelivery?.sent));
      el.supervisorBrokerName.value = ""; el.supervisorBrokerEmail.value = ""; el.supervisorBrokerPhone.value = "";
      await loadSupervisorRemoteData(); renderSupervisorMocks();
    } catch (error) { el.supervisorGeneratedMessage.hidden = true; el.supervisorAccessStatus.textContent = error.message; el.supervisorAccessStatus.classList.add("error"); el.supervisorAccessStatus.classList.remove("ok"); if (isAccessLimitError(error)) showAccessLimitModal(); }
    finally { el.supervisorGenerateMessageBtn.disabled = false; }
  }

  function supervisorAccessMessage(name, token) {
    return `Olá, ${name}. Seu acesso à Lungo Corretores foi liberado.\n\nLink: https://crm.lungocorretores.com.br\nToken: ${token}\n\nAcesse, aceite os termos de uso e conecte seu WhatsApp pelo QR Code.`;
  }

  async function copySupervisorText(value, successMessage) {
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); toast(successMessage); return true; } } catch {}
    const helper = document.createElement("textarea"); helper.value = value; helper.setAttribute("readonly", ""); helper.style.position = "fixed"; helper.style.opacity = "0"; document.body.appendChild(helper); helper.select();
    let copied = false; try { copied = document.execCommand("copy"); } catch {} helper.remove();
    if (copied) { toast(successMessage); return true; }
    window.prompt("Copie o token abaixo:", value); toast("Selecione e copie o token exibido."); return false;
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

  function renderSupervisorMessageRecipients() {
    if (!el.supervisorMessageRecipient) return;
    el.supervisorMessageRecipient.innerHTML = '<option value="all">Todos os corretores</option>' + SUPERVISOR_BROKERS.filter((broker) => !broker.supervisor && broker.id).map((broker) => `<option value="${escapeHtml(broker.id)}">${escapeHtml(broker.name)}</option>`).join('');
  }

  function renderSupervisorMessageHistory(messages) {
    if (!el.supervisorMessageHistory) return;
    el.supervisorMessageHistory.innerHTML = messages.length ? messages.map((item) => {
      const read = item.recipients.filter((recipient) => recipient.readAt).length; const total = item.recipients.length;
      const audience = item.audience === 'all' ? 'Todos os corretores' : item.recipients.map((recipient) => recipient.name).join(', ');
      const status = read === total ? 'Lida por todos' : read ? `Lida por ${read} de ${total}` : 'Ainda não lida';
      return `<article><b>${escapeHtml(audience)}</b><span>${escapeHtml(item.message)}</span><small>${escapeHtml(formatLastAccess(item.createdAt))} · <strong class="message-read-status ${read === total ? 'read' : ''}">${escapeHtml(status)}</strong></small></article>`;
    }).join('') : '<div class="empty-state compact-empty">Nenhuma mensagem enviada.</div>';
  }

  async function loadSupervisorMessages() {
    if (!supervisorAccessToken) return;
    try { const result = await window.LungoSupervisorApi.getTeamMessages(supervisorAccessToken); renderSupervisorMessageHistory(result.messages || []); }
    catch (error) { if (el.supervisorMessageStatus) { el.supervisorMessageStatus.textContent = error.message; el.supervisorMessageStatus.classList.add('error'); } }
  }

  async function sendSupervisorMessage() {
    const message = String(el.supervisorMessageText?.value || "").trim();
    if (!message) {
      el.supervisorMessageStatus.textContent = "Digite uma mensagem antes de enviar.";
      el.supervisorMessageStatus.classList.add("error");
      return;
    }
    try {
      el.supervisorSendMessageBtn.disabled = true;
      await window.LungoSupervisorApi.sendTeamMessage({ recipientId: el.supervisorMessageRecipient?.value || 'all', message }, supervisorAccessToken);
      el.supervisorMessageText.value = "";
      el.supervisorMessageStatus.textContent = "Mensagem enviada. Aguardando leitura.";
      el.supervisorMessageStatus.classList.remove("error"); el.supervisorMessageStatus.classList.add("ok");
      await loadSupervisorMessages();
    } catch (error) { el.supervisorMessageStatus.textContent = error.message; el.supervisorMessageStatus.classList.add('error'); }
    finally { el.supervisorSendMessageBtn.disabled = false; }
  }

  function ensureBrokerMessageModal() {
    let modal = $('#brokerMessageModal'); if (modal) return modal;
    document.body.insertAdjacentHTML('beforeend', `<dialog id="brokerMessageModal" class="modal broker-message-modal"><div class="modal-card"><header><div><h2>Mensagem da supervisão</h2><p id="brokerMessageSender">Supervisor</p></div></header><div class="broker-message-body"><span id="brokerMessageDate"></span><p id="brokerMessageText"></p></div><footer><span class="footer-spacer"></span><button id="brokerMessageReadBtn" class="btn primary" type="button">Li a mensagem</button></footer></div></dialog>`);
    modal = $('#brokerMessageModal'); modal.addEventListener('cancel', (event) => event.preventDefault());
    $('#brokerMessageReadBtn').addEventListener('click', closeBrokerMessageAsRead); return modal;
  }

  async function closeBrokerMessageAsRead() {
    if (!activeBrokerMessage) return;
    const button = $('#brokerMessageReadBtn'); button.disabled = true;
    try { await window.LungoSupervisorApi.markBrokerMessageRead(activeBrokerMessage.id, state.token); const modal = $('#brokerMessageModal'); activeBrokerMessage = null; if (modal?.open) modal.close(); setTimeout(checkBrokerMessages, 250); }
    catch (error) { toast(error.message); }
    finally { button.disabled = false; }
  }

  async function checkBrokerMessages() {
    if (!state.token || activeBrokerMessage || document.body.classList.contains('supervisor-mode')) return;
    try { const result = await window.LungoSupervisorApi.getBrokerMessages(state.token, true); const message = result.messages?.[0]; if (!message) return; activeBrokerMessage = message; const modal = ensureBrokerMessageModal(); $('#brokerMessageSender').textContent = message.senderName || 'Supervisor'; $('#brokerMessageDate').textContent = formatLastAccess(message.createdAt); $('#brokerMessageText').textContent = message.message; modal.showModal(); }
    catch (_) {}
  }

  function startBrokerMessagePolling() { clearInterval(brokerMessageTimer); checkBrokerMessages(); brokerMessageTimer = setInterval(checkBrokerMessages, 15000); }
  function stopBrokerMessagePolling() { clearInterval(brokerMessageTimer); brokerMessageTimer = null; activeBrokerMessage = null; const modal = $('#brokerMessageModal'); if (modal?.open) modal.close(); }

  function setWhatsappPending(pending) {
    document.body.classList.toggle("whatsapp-pending", Boolean(pending));
  }

  async function validateTokenAccess(token) {
    const value = String(token || "").trim();
    if (!value) throw new Error("Informe o token de acesso.");
    let data;
    try {
      const verified = await api("/api/access/auth/verify", { method: "POST", headers: { "Content-Type": "application/json", "x-access-token": value }, body: "{}" });
      if (verified.user?.role !== "broker") throw new Error("Este token não pertence a um Corretor.");
      data = { client: { nome: verified.user.name, instanceName: verified.client?.instanceName || "" }, instanceName: verified.client?.instanceName || "", accessUser: verified.user };
    } catch (realAccessError) {
      if (/não pertence a um Corretor/i.test(realAccessError.message || "")) throw realAccessError;
      data = await api("/api/onboarding/check-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: value }) });
    }
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
      // Uma autenticação válida permanece neste dispositivo até o usuário clicar em Sair.
      saveAccess();
      localStorage.setItem(ACTIVE_PROFILE_KEY, "broker");
      sessionStorage.setItem(TAB_PROFILE_KEY, "broker");
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
      applyBrokerPersonalization();
      refreshBrokerHeaderGoal();
      startBrokerMessagePolling();
      startCalendarReminders();
      setWhatsappPending(false);
      setAuthStatus(state.connected ? "Acesso liberado. WhatsApp conectado." : "Acesso liberado. A conexão com o WhatsApp é opcional.", "ok");
      setView("crm");
      loadCrm(true); startCrmRealtime();
      return true;
    } catch (error) {
      el.root.classList.remove("session-restoring");
      setAuthLocked(true);
      setWhatsappPending(false);
      setAuthStatus(error.message || "Token inválido ou inativo.", "error");
      if (!silent) toast(error.message || "Token inválido ou inativo.");
      return false;
    }
  }

  async function bootAccess() {
    if (!state.token) {
      el.root.classList.remove("session-restoring");
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
    const titles = {
      crm: ["Meus Leads", "Pipeline comercial com lista, kanban, importação e exportação."],
      clients: ["Clientes", "Carteira ativa, clientes em fechamento, pós-venda e faturamento."],
      connect: ["Conectar WhatsApp", "Conecte a instância por QR Code."],
      broadcast: ["Disparos", "Envie mensagens para bases autorizadas."],
      instance: ["Meus dados", "Consulte o status da conexão."],
      cotador: ["Cotador", "Cotação de planos e propostas comerciais."],
      comprar_leads: ["Comprar leads", "Aquisição e distribuição de oportunidades."],
      vendedores: ["Vendedores", "Gestão de equipe e acompanhamento comercial."],
      treinamentos: ["Treinamentos", "Materiais e trilhas para capacitação da equipe."],
      relatorios: ["Relatórios", "Indicadores comerciais e relatórios avançados."],
      agenda: ["Agenda", "Compromissos, retornos e programação comercial."],
      settings: ["Configurações", "Personalize individualmente a aparência do seu acesso."]
    };
    const isSoon = ["cotador"].includes(name);
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
      loadCrm(true); startCrmRealtime();
    }
    else stopCrmRealtime();
    if (name === "clients") loadClients();
    if (name === "relatorios") refreshBrokerReport();
    if (name === "treinamentos") loadTrainingLibrary(state.token, 'broker');
    if (name === "agenda") { renderTeamCalendar('broker'); startCalendarReminders(); }
    if (name === "comprar_leads") renderLeadStorefront('broker');
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
    if (el.leadPlanoInteresse) el.leadPlanoInteresse.innerHTML = productSelectOptions(el.leadPlanoInteresse.value || "Saúde");
  }

  function whatsappConversationWindowKey() {
    return `lungo-whatsapp-conversation-window-${state.token || "sem-token"}`;
  }

  function isWhatsappConversation(lead) {
    return Boolean(lead?.lastMessage && (lead?.whatsappJid || String(lead?.externalId || "").startsWith("whatsapp:") || String(lead?.origem || "").toLowerCase() === "whatsapp"));
  }

  function loadWhatsappConversationWindow() {
    try {
      const saved = JSON.parse(localStorage.getItem(whatsappConversationWindowKey()) || "null");
      return saved && Array.isArray(saved.initialIds) ? saved : null;
    } catch {
      return null;
    }
  }

  function saveWhatsappConversationWindow() {
    const initialIds = state.leads
      .filter(isWhatsappConversation)
      .sort((a, b) => leadLastMessageTime(b) - leadLastMessageTime(a))
      .slice(0, 20)
      .map((lead) => lead.id);
    localStorage.setItem(whatsappConversationWindowKey(), JSON.stringify({ initialIds, syncedAt: Date.now() }));
  }

  function belongsToWhatsappConversationWindow(lead) {
    if (!isWhatsappConversation(lead)) return true;
    const window = loadWhatsappConversationWindow();
    if (!window) return false;
    return window.initialIds.includes(lead.id) || leadLastMessageTime(lead) > Number(window.syncedAt || 0);
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
      team: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M14 14c.8-.6 1.8-1 3-1 2.2 0 4 1.8 4 4"/></svg>`,
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
    const teamBtn = supervisorAccessToken ? `<button class="icon-action team" type="button" data-action="assign-team" data-id="${escapeHtml(lead.id)}" title="Enviar para corretor">${iconSvg("team")}</button>` : "";
    return `<div class="row-buttons">${whatsapp}${scheduleBtn}<button class="icon-action" type="button" data-action="view" data-id="${escapeHtml(lead.id)}" title="Ver mais">${iconSvg("edit")}</button>${teamBtn}</div>`;
  }

  function openLeadAssignmentModal(lead) {
    if (!lead || !supervisorAccessToken) return;
    const activeBrokers = SUPERVISOR_BROKERS.filter((broker) => broker.id && broker.statusLabel === "Ativo");
    const previous = $("#leadAssignmentModal");
    if (previous) previous.remove();
    const modal = document.createElement("dialog");
    modal.id = "leadAssignmentModal";
    modal.className = "modal lead-assignment-modal";
    modal.innerHTML = `<form method="dialog" class="modal-card">
      <header><div><h2>Enviar lead para a equipe</h2><p>Escolha quem receberá o lead de ${escapeHtml(displayName(lead) || "cliente sem nome")}.</p></div><button class="btn ghost" type="button" data-close-assignment aria-label="Fechar">×</button></header>
      <div class="lead-assignment-list">${activeBrokers.length ? activeBrokers.map((broker) => `<label><input type="radio" name="leadBroker" value="${escapeHtml(broker.id)}"><span><b>${escapeHtml(broker.name)}</b><small>${escapeHtml(broker.email || "Corretor ativo")}</small></span></label>`).join("") : `<p class="lead-assignment-empty">Nenhum corretor ativo disponível.</p>`}</div>
      <footer><button class="btn ghost" type="button" data-close-assignment>Cancelar</button><button class="btn primary" type="submit" ${activeBrokers.length ? "" : "disabled"}>Enviar lead</button></footer>
    </form>`;
    document.body.appendChild(modal);
    modal.querySelectorAll("[data-close-assignment]").forEach((button) => button.addEventListener("click", () => modal.close()));
    modal.addEventListener("close", () => modal.remove(), { once: true });
    modal.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const brokerId = modal.querySelector('input[name="leadBroker"]:checked')?.value;
      if (!brokerId) { toast("Escolha um corretor para receber o lead.", "error"); return; }
      const submit = modal.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = "Enviando...";
      try {
        const broker = activeBrokers.find((item) => item.id === brokerId);
        await window.LungoSupervisorApi.assignLead(lead.id, brokerId, supervisorAccessToken);
        modal.close();
        toast(`Lead enviado para ${broker?.name || "o corretor"}.`);
        await Promise.all([loadCrm(true), loadSupervisorRemoteData()]);
        renderSupervisorMocks();
      } catch (error) {
        submit.disabled = false;
        submit.textContent = "Enviar lead";
        toast(error.message, "error");
      }
    });
    modal.showModal();
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
      const msg = "Nenhum lead encontrado. Use Novo lead ou Sincronizar conversas para adicionar contatos.";
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
      if (!state.token) return;
      await loadCrm(true);
      if (el.views.clients?.classList.contains("active")) await loadClients(true);
    }, 5000);
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
    const selectedProduct = cleanProduct(item.planoInteresse || "Saúde") || "Saúde";
    el.leadPlanoInteresse.innerHTML = productSelectOptions(selectedProduct);
    el.leadPlanoInteresse.value = selectedProduct;
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
    silent = silent === true;
    try {
      if (!silent) {
        el.configureAutoBtn.disabled = true;
        el.configureAutoBtn.textContent = "Sincronizando...";
      }
      const connection = await refreshInstanceSilent().catch(() => ({ connected: state.connected }));
      if (!connection?.connected && !state.connected) throw new Error("Conecte o WhatsApp pelo QR Code antes de sincronizar as conversas.");
      await api(`/api/crm/configure-auto-conversations-browser?token=${tokenQuery()}`);
      setLeadSyncEnabled(true);
      const sync = silent ? { created: 0, updated: 0 } : await api(`/api/crm/sync-recent-conversations-browser?token=${tokenQuery()}&limit=20`);
      sessionStorage.setItem(`lungo-auto-webhook-${state.token}`, String(Date.now()));
      await loadCrm(true);
      if (!silent && Array.isArray(sync.leads) && sync.leads.length) {
        const syncedIds = new Set(sync.leads.map((lead) => lead.id));
        state.leads = sync.leads.map((lead) => ({ ...lead, status: normalizeStatus(lead.status) })).concat(state.leads.filter((lead) => !syncedIds.has(lead.id)));
      }
      if (!silent) saveWhatsappConversationWindow();
      renderCrm();
      if (!silent) toast(`Sincronização concluída: ${sync.scanned || 0} conversas encontradas, ${sync.created || 0} novas e ${sync.updated || 0} atualizadas.`);
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
      setWhatsappPending(false);
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
      setWhatsappPending(false);
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
      const campaign = data.campaign || data;
      state.campaignId = campaign.campaignId || campaign.id;
      renderCampaignProgress(campaign);
      el.campaignLog.textContent = "Campanha iniciada.";
      toast("Campanha iniciada.");
      pollCampaign();
    } catch (error) {
      toast(error.message);
    }
  }

  function renderCampaignProgress(payload) {
    const campaign = payload?.campaign || payload || {};
    const stats = campaign.stats || campaign.counts || {};
    const progress = campaign.progress || {};
    const total = Number(campaign.total ?? stats.total ?? stats.valid ?? 0);
    const sent = Number(campaign.sent ?? progress.sent ?? stats.sent ?? 0);
    const errors = Number(campaign.errors ?? progress.errors ?? stats.errors ?? 0);
    const pending = Number(campaign.pending ?? progress.pending ?? Math.max(total - sent - errors, 0));
    el.statTotal.textContent = total;
    el.statSent.textContent = sent;
    el.statPending.textContent = pending;
    el.statErrors.textContent = errors;
    el.progressBar.style.width = total ? `${Math.round(((sent + errors) / total) * 100)}%` : "0";
    return campaign;
  }

  async function pollCampaign() {
    if (!state.campaignId) return;
    clearTimeout(state.campaignTimer);
    try {
      const data = await api(`/api/campaigns/${encodeURIComponent(state.campaignId)}/status`);
      const campaign = renderCampaignProgress(data);
      el.campaignLog.textContent = campaign.status ? `Status: ${campaign.status}` : "Campanha em andamento.";
      if (!["finished", "stopped", "completed", "done"].includes(String(campaign.status || "").toLowerCase())) {
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

  function saleResponsibilityLabel(sale = {}) {
    if (sale.responsavelVendaTipo === "supervisor" || sale.responsavelVendaTipo === "administrativo") return "Venda administrativa";
    return sale.responsavelVendaNome ? `Venda realizada por ${sale.responsavelVendaNome}` : "Venda do corretor";
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
        <td><div class="client-name-cell"><div class="contact-main client-name-only"><b>${postSaleClockHtml(client)}${escapeHtml(client.nome || "Cliente")}</b><span>${escapeHtml(phone || "—")}${supervisorAccessToken && client.brokerName ? ` · ${escapeHtml(client.brokerName)}` : ""}</span></div></div></td>
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
      const tokens = supervisorAccessToken ? SUPERVISOR_BROKERS.filter((broker) => broker.statusLabel === "Ativo" && broker.token).map((broker) => broker.token) : [state.token];
      const results = await Promise.all(tokens.map((token) => api("/api/clientes/sync-fechamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })));
      const sync = results.reduce((total, result) => ({ created: total.created + Number(result.sync?.created || 0), updated: total.updated + Number(result.sync?.updated || 0) }), { created: 0, updated: 0 });
      if (!silent) toast(`Fechamentos atualizados: ${sync.created} novos, ${sync.updated} atualizados.`);
      await loadClients(true);
    } catch (error) {
      if (!silent) toast(error.message);
    }
  }

  async function loadClients(silent = false) {
    try {
      if (!state.token) { if (!silent) toast("Informe e salve o token do usuário."); return; }
      if (!state.leads.length) await loadCrm(true);
      let data;
      let sourceClients;
      if (supervisorAccessToken) {
        const [teamData, supervisorData] = await Promise.all([
          window.LungoSupervisorApi.getOperationalClients(supervisorAccessToken),
          api(`/api/clientes?${clientPeriodParams()}&_=${Date.now()}`)
        ]);
        data = teamData;
        const consolidated = new Map();
        (teamData.clients || []).forEach((client) => consolidated.set(String(client.id), client));
        (supervisorData.clientes || []).forEach((client) => consolidated.set(String(client.id), { ...client, brokerUserId: supervisorUserId, brokerName: "Supervisor", ownerRole: "supervisor" }));
        sourceClients = [...consolidated.values()];
      } else {
        data = await api(`/api/clientes?${clientPeriodParams()}&_=${Date.now()}`);
        sourceClients = data.clientes || [];
      }
      const savedClients = sourceClients.map((client) => ({
        ...client,
        status: normalizeClientStatus(client.status),
        source: client.source || "clientes",
        _brokerToken: supervisorAccessToken ? (client.ownerRole === "supervisor" || String(client.brokerUserId) === String(supervisorUserId) ? supervisorAccessToken : (SUPERVISOR_BROKERS.find((broker) => String(broker.id) === String(client.brokerUserId))?.token || "")) : ""
      }));
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

  function reportMoneyNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const text = String(value || "").replace(/[^0-9,.-]/g, "");
    const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
    return Number(normalized) || 0;
  }

  function renderBrokerReport() {
    const identity = loadCompanyIdentity();
    const clients = state.clients || [];
    const leads = state.leads || [];
    const closed = leads.filter((lead) => lead.status === "fechamento");
    const activeClients = clients.filter((client) => !["cancelado", "inativo"].includes(normalizeClientStatus(client.status)));
    const revenue = clients.reduce((total, client) => total + reportMoneyNumber(client.valorFechado || client.valor || 0), 0);
    if (el.brokerReportOwner) el.brokerReportOwner.textContent = `Corretor: ${state.clientName || "Usuário"} · ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
    if (el.brokerReportNumbers) el.brokerReportNumbers.innerHTML = [["Leads", leads.length], ["Fechamentos", closed.length], ["Clientes ativos", activeClients.length], ["Faturamento", revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })], ["Conversão", leads.length ? `${Math.round((closed.length / leads.length) * 100)}%` : "0%"], ["Total de clientes", clients.length]].map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join("");
    if (el.brokerReportFunnel) el.brokerReportFunnel.innerHTML = STATUSES.map((stage) => `<span><b>${leads.filter((lead) => lead.status === stage.value).length}</b>${escapeHtml(stage.label)}</span>`).join("");
    if (el.brokerReportClientRows) el.brokerReportClientRows.innerHTML = clients.slice(0, 10).map((client) => `<tr><td>${escapeHtml(client.nome || client.name || "—")}</td><td>${escapeHtml(client.produto || "—")}</td><td>${escapeHtml(CLIENT_STATUS_LABEL[normalizeClientStatus(client.status)] || "Ativo")}</td><td>${escapeHtml(formatMoney(client.valorFechado || client.valor || ""))}</td><td>${escapeHtml(formatDateOnly(client.dataContratacao || client.createdAt))}</td></tr>`).join("") || `<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>`;
    if (el.brokerReportFooter) el.brokerReportFooter.textContent = `${identity.name || "Lungo"} · ${new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · 1/1`;
  }

  async function refreshBrokerReport() {
    if (el.brokerReportStatus) el.brokerReportStatus.textContent = "Atualizando dados...";
    await Promise.all([loadCrm(true), loadClients(true)]);
    renderBrokerReport();
    if (el.brokerReportStatus) el.brokerReportStatus.textContent = "Relatório atualizado com seus dados.";
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
          <p class="contract-note"><b>${escapeHtml(saleResponsibilityLabel(sale))}</b></p>
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
    if (el.supervisorClientOwnerLabel && el.supervisorClientOwner) {
      el.supervisorClientOwnerLabel.hidden = !supervisorAccessToken;
      if (supervisorAccessToken) {
        const owner = SUPERVISOR_BROKERS.find((broker) => String(broker.id) === String(item.brokerUserId));
        const supervisorOwned = !item.id || item.ownerRole === "supervisor" || String(item.brokerUserId || supervisorUserId) === String(supervisorUserId);
        el.supervisorClientOwner.innerHTML = supervisorOwned
          ? `<option value="${escapeHtml(supervisorUserId)}">Supervisor · carteira exclusiva</option>`
          : `<option value="${escapeHtml(owner?.id || item.brokerUserId || "")}">${escapeHtml(owner?.name || item.brokerName || "Corretor responsável")}</option>`;
        el.supervisorClientOwner.disabled = true;
      }
    }
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

  function clientAccessToken(clientOrId) {
    if (!supervisorAccessToken) return state.token;
    const client = typeof clientOrId === "object" ? clientOrId : state.clients.find((item) => String(item.id) === String(clientOrId));
    const token = client?._brokerToken || (client?.ownerRole === "supervisor" || String(client?.brokerUserId) === String(supervisorUserId) ? supervisorAccessToken : SUPERVISOR_BROKERS.find((broker) => String(broker.id) === String(client?.brokerUserId))?.token);
    if (!token) throw new Error("O token do corretor responsável não está disponível. Renove o acesso dele antes de alterar este cliente.");
    return token;
  }

  function clientTokenQuery(clientOrId) {
    return encodeURIComponent(clientAccessToken(clientOrId));
  }

  function clientPayload(token = state.token) {
    return {
      token,
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
        body: JSON.stringify({ token: clientAccessToken(id), documentacaoPdf })
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
      const data = await api(`/api/clientes/${encodeURIComponent(id)}/documentacao?token=${clientTokenQuery(id)}`);
      downloadBase64Pdf(data.documentacaoPdf);
    } catch (error) { toast(error.message); }
  }

  async function saveClient(event) {
    event.preventDefault();
    try {
      const id = el.clientId.value;
      const shouldCreate = !id || String(id).startsWith("lead-");
      const path = shouldCreate ? "/api/clientes" : `/api/clientes/${encodeURIComponent(id)}`;
      const accessToken = shouldCreate ? (supervisorAccessToken || state.token) : clientAccessToken(id);
      const payload = clientPayload(accessToken);
      if (shouldCreate) {
        payload.responsavelVendaTipo = supervisorAccessToken ? "supervisor" : "broker";
        payload.responsavelVendaNome = supervisorAccessToken ? "Supervisor" : (state.clientName || "Corretor");
      }
      await api(path, { method: shouldCreate ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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
        body: JSON.stringify({ token: clientAccessToken(id), tipo: el.postSaleTipo.value, data: el.postSaleData.value, hora: el.postSaleHora?.value || "09:00", recorrencia: el.postSaleRecorrencia.value, mensagem: el.postSaleMensagem.value.trim() })
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
    if (el.baseSaleSellerLabel && el.baseSaleSeller) {
      el.baseSaleSellerLabel.hidden = !supervisorAccessToken;
      if (supervisorAccessToken) {
        const owner = SUPERVISOR_BROKERS.find((broker) => String(broker.id) === String(item.brokerUserId));
        const brokerOption = item.ownerRole === "broker" && owner ? `<option value="broker:${escapeHtml(owner.id)}">${escapeHtml(owner.name)} · Corretor</option>` : "";
        el.baseSaleSeller.innerHTML = `<option value="supervisor">Administrativo · Supervisor</option>${brokerOption}`;
        el.baseSaleSeller.value = "supervisor";
      }
    }
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
      const client = getClient(id) || {};
      const sellerChoice = supervisorAccessToken ? (el.baseSaleSeller?.value || "supervisor") : "broker";
      const selectedBroker = sellerChoice.startsWith("broker:") ? SUPERVISOR_BROKERS.find((broker) => broker.id === sellerChoice.slice(7)) : null;
      await api(`/api/clientes/${encodeURIComponent(id)}/base-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: clientAccessToken(id),
          produto: el.baseSaleProduto.value.trim(),
          qtdVidas: el.baseSaleVidas.value.trim(),
          valor: el.baseSaleValor.value.trim(),
          dataVenda: el.baseSaleData.value,
          observacao: el.baseSaleObs.value.trim(),
          responsavelVendaTipo: sellerChoice === "supervisor" ? "supervisor" : "broker",
          responsavelVendaNome: sellerChoice === "supervisor" ? "Supervisor" : (selectedBroker?.name || client.brokerName || state.clientName || "Corretor"),
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
      <article><span>Responsável pela venda</span><b>${escapeHtml(saleResponsibilityLabel(sale))}</b></article>
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
      const data = await api(`/api/clientes/${encodeURIComponent(cur.clientId)}/base-sale/${encodeURIComponent(cur.saleId)}/documentacao?token=${clientTokenQuery(cur.clientId)}`);
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
          const data = await api(`/api/clientes/${encodeURIComponent(id)}/documentacao?token=${clientTokenQuery(id)}`);
          downloadBase64Pdf(data.documentacaoPdf);
        } else if (item.dataset.docSelect === "sale") {
          const data = await api(`/api/clientes/${encodeURIComponent(id)}/base-sale/${encodeURIComponent(item.value)}/documentacao?token=${clientTokenQuery(id)}`);
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
    return api(`${productFolderEndpoint(clientId)}?token=${clientTokenQuery(clientId)}&_=${Date.now()}`);
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
      el.productFolderSubtitle.textContent = `${client.nome || "Cliente"} · ${saleResponsibilityLabel(product)}`;
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
          token: clientAccessToken(current.clientId),
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
          body: JSON.stringify({ token: clientAccessToken(current.clientId), documento })
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
      const data = await api(`${productFolderEndpoint(current.clientId, current.productId)}/documents/${encodeURIComponent(docId)}?token=${clientTokenQuery(current.clientId)}`);
      downloadBase64Pdf(data.documentacaoPdf || data.documento);
    } catch (error) { toast(error.message); }
  }

  async function deleteProductDocument(docId) {
    const current = state.currentProductFolder;
    if (!current || !docId) return;
    const ok = await popupConfirm("Excluir este PDF da pasta do produto?", "Excluir documento", "Excluir");
    if (!ok) return;
    try {
      await api(`${productFolderEndpoint(current.clientId, current.productId)}/documents/${encodeURIComponent(docId)}?token=${clientTokenQuery(current.clientId)}`, { method: "DELETE" });
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
      let importedRows;
      if (/\.csv$/i.test(file.name)) {
        const text = await file.text();
        const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
        const separator = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
        const headers = lines.shift().split(separator).map((value) => value.trim());
        importedRows = lines.map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split(separator)[index]?.trim() || ''])));
      } else {
        if (!window.XLSX) throw new Error('O leitor de Excel não carregou. Use o modelo CSV ou atualize a página.');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        importedRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      }
      const rows = importedRows.map(mapImportedClientRow).filter((row) => row.nome && row.telefone);
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
    if (!rows.length) return toast("Não há clientes para exportar.");
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(';'), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = `clientes-lungo-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
    toast('Lista de clientes exportada.');
  }

  async function importSupervisorClients(file) {
    if (!file) return;
    try {
      let importedRows;
      if (/\.csv$/i.test(file.name)) {
        const text = await file.text();
        const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
        const separator = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
        const headers = lines.shift().split(separator).map((value) => value.trim());
        importedRows = lines.map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split(separator)[index]?.replace(/^"|"$/g, '').trim() || ''])));
      } else {
        if (!window.XLSX) throw new Error('O leitor de Excel não carregou. Use o modelo CSV.');
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        importedRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
      }
      const clientes = importedRows.map(mapImportedClientRow).filter((row) => row.nome && row.telefone);
      if (!clientes.length) throw new Error('Nenhum cliente válido foi encontrado. Use o modelo disponível na tela.');
      const result = await api('/api/supervisor/clients/import', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-access-token': supervisorAccessToken }, body: JSON.stringify({ clientes }) });
      await loadSupervisorRemoteData(); renderSupervisorMocks();
      toast(`Importação concluída: ${result.created || 0} novos e ${result.updated || 0} atualizados.`);
    } catch (error) { toast(error.message); }
    finally { if (el.supervisorImportFile) el.supervisorImportFile.value = ''; }
  }

  function exportSupervisorClients() {
    const rows = filteredSupervisorCustomers().map((client) => ({ Nome: client.client || '', Vendedor: client.seller || '', WhatsApp: client.phone || '', Email: client.email || '', Produto: client.product || '', Status: client.status || '', Vidas: client.lives || '', Valor: client.value || '', Contratacao: client.date || '', Renovacao: client.renewal || '', PosVenda: client.post || '', Observacao: client.notes || '' }));
    if (!rows.length) return toast('Não há clientes para exportar.');
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(';'), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = `clientes-equipe-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
    toast('Clientes da equipe exportados.');
  }

  function logout() {
    stopCalendarReminders();
    stopBrokerMessagePolling();
    if (state.token) localStorage.removeItem(leadSyncKey());
    [STORAGE_KEY, "lungo-suite-access-v2", "lungo-suite-access-v3", "lungo-suite-access-v4"].forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(TAB_PROFILE_KEY);
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
    toast("Saída realizada.");
  }

  function getPlanDefinition(planId) {
    return ADMIN_PLAN_DEFINITIONS.find((plan) => plan.id === planId) || ADMIN_PLAN_DEFINITIONS[0];
  }

  function calculateSubscriptionTotal(planId, extraAccesses = 0) {
    const plan=getPlanDefinition(planId);return plan.price+(plan.id==="free"?0:Math.max(0,Number(extraAccesses)||0)*ADMIN_EXTRA_ACCESS_PRICE);
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function adminIsoDate(date) {
    const safe = new Date(date);
    return `${safe.getFullYear()}-${String(safe.getMonth() + 1).padStart(2, "0")}-${String(safe.getDate()).padStart(2, "0")}`;
  }

  function adminDateOffset(days, base = new Date()) {
    const date = new Date(base);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return adminIsoDate(date);
  }

  function calculateNextDueDate(paymentDate, dueMode, fixedDay) {
    const source = new Date(`${paymentDate}T12:00:00`);
    if (Number.isNaN(source.getTime())) return "";
    if (dueMode === "30days") { source.setDate(source.getDate() + 30); return adminIsoDate(source); }
    const day = Number(fixedDay) || 1;
    let target = new Date(source.getFullYear(), source.getMonth(), day, 12);
    if (target <= source) target = new Date(source.getFullYear(), source.getMonth() + 1, day, 12);
    return adminIsoDate(target);
  }

  function seedAdminData() {
    const clients = [
      { id: "cl1", name: "Pedro Martins", responsible: "Pedro Martins", document: "123.456.789-00", email: "pedro@exemplo.com", whatsapp: "(11) 99910-1010", type: "individual", planId: "individual", extraAccesses: 0, activeAccesses: 1, legacy: false, saleDate: adminDateOffset(-40), nextDue: adminDateOffset(5), financialStatus: "due", accountStatus: "active", dueMode: "30days", fixedDay: 10, notes: "Corretor individual em dia.", history: [{ date: adminDateOffset(-40), text: "Venda criada no Plano Individual." }] },
      { id: "cl2", name: "Equipe Conquista", responsible: "Marina Lopes", document: "12.345.678/0001-11", email: "marina@conquista.com", whatsapp: "(21) 98820-2020", type: "team", planId: "team", extraAccesses: 0, activeAccesses: 3, legacy: false, saleDate: adminDateOffset(-32), nextDue: adminDateOffset(9), financialStatus: "pending", accountStatus: "attention", dueMode: "fixed", fixedDay: 10, notes: "Equipe com dois corretores e uma supervisora.", history: [{ date: adminDateOffset(-32), text: "Venda criada no Plano Equipe." }] },
      { id: "cl3", name: "Alvorada Benefícios", responsible: "Camila Torres", document: "22.456.789/0001-20", email: "camila@alvorada.com", whatsapp: "(31) 99770-3030", type: "team", planId: "broker10", extraAccesses: 0, activeAccesses: 9, legacy: false, saleDate: adminDateOffset(-70), nextDue: adminDateOffset(15), financialStatus: "paid", accountStatus: "active", dueMode: "fixed", fixedDay: 20, notes: "Corretora com dez vagas contratadas.", history: [{ date: adminDateOffset(-70), text: "Venda criada no Plano Corretora 10." }] },
      { id: "cl4", name: "Horizonte Seguros", responsible: "Lívia Ramos", document: "33.567.890/0001-33", email: "livia@horizonte.com", whatsapp: "(41) 99660-4040", type: "team", planId: "broker16", extraAccesses: 3, activeAccesses: 18, legacy: true, saleDate: adminDateOffset(-90), nextDue: adminDateOffset(-8), financialStatus: "late", accountStatus: "suspended", dueMode: "fixed", fixedDay: 25, notes: "Conta suspensa manualmente por inadimplência.", history: [{ date: adminDateOffset(-90), text: "Venda criada com três acessos extras." }, { date: adminDateOffset(-3), text: "Conta suspensa por inadimplência." }] },
      { id: "cl5", name: "Norte Vida Corretora", responsible: "Rafael Braga", document: "44.678.901/0001-44", email: "rafael@nortevida.com", whatsapp: "(85) 99550-5050", type: "team", planId: "broker20", extraAccesses: 2, activeAccesses: 20, legacy: false, saleDate: adminDateOffset(-12), nextDue: adminDateOffset(18), financialStatus: "paid", accountStatus: "active", dueMode: "30days", fixedDay: 5, notes: "Cliente novo com acessos adicionais.", history: [{ date: adminDateOffset(-12), text: "Venda criada no Plano Corretora 20." }, { date: adminDateOffset(-12), text: "Dois acessos extras adicionados." }] }
    ];
    const receivables = clients.map((client, index) => ({ id: `rec${index + 1}`, clientId: client.id, competence: new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }), dueDate: client.nextDue, expected: calculateSubscriptionTotal(client.planId, client.extraAccesses), paid: client.financialStatus === "paid" ? calculateSubscriptionTotal(client.planId, client.extraAccesses) : 0, paymentDate: client.financialStatus === "paid" ? adminDateOffset(-2) : "", status: client.financialStatus === "paid" ? "paid" : client.financialStatus === "late" ? "late" : "pending", method: client.financialStatus === "paid" ? "Pix" : "—", note: client.financialStatus === "late" ? "Cobrança em acompanhamento." : "" }));
    const accesses = [
      { id: "ac1", clientId: "cl1", user: "Pedro Martins", profile: "Corretor", token: "PEDRO-LUNGO", status: "active", createdAt: adminDateOffset(-40), lastAccess: "Hoje, 09:42", validUntil: adminDateOffset(325) },
      { id: "ac2", clientId: "cl2", user: "Marina Lopes", profile: "Supervisor", token: "MARINA-SUP", status: "active", createdAt: adminDateOffset(-32), lastAccess: "Hoje, 08:20", validUntil: adminDateOffset(333) },
      { id: "ac3", clientId: "cl2", user: "Carlos Reis", profile: "Corretor", token: "CARLOS-EQ", status: "active", createdAt: adminDateOffset(-31), lastAccess: "Ontem, 17:10", validUntil: adminDateOffset(334) },
      { id: "ac4", clientId: "cl2", user: "Bianca Luz", profile: "Corretor", token: "BIANCA-EQ", status: "active", createdAt: adminDateOffset(-30), lastAccess: "Hoje, 10:01", validUntil: adminDateOffset(335) },
      { id: "ac5", clientId: "cl4", user: "Lívia Ramos", profile: "Supervisor", token: "LIVIA-HOR", status: "blocked", createdAt: adminDateOffset(-90), lastAccess: "Há 8 dias", validUntil: adminDateOffset(275) }
    ];
    return { version: ADMIN_DATA_VERSION, clients, receivables, accesses, settings: {}, sequence: 100 };
  }

  function saveAdminData() {
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(adminData));
  }

  function loadAdminData() {
    try { adminData = JSON.parse(localStorage.getItem(ADMIN_DATA_KEY) || "null"); } catch (_) { adminData = null; }
    if (!adminData || adminData.version !== ADMIN_DATA_VERSION) { adminData = seedAdminData(); saveAdminData(); }
    return adminData;
  }

  function adminClient(id) { return adminData?.clients.find((client) => client.id === id); }
  function adminPlanCapacity(client) { const plan = getPlanDefinition(client.planId); return plan.brokerLimit + plan.managerLimit + Number(client.extraAccesses || 0); }
  function adminFinanceLabel(status) { return { paid: "Em dia", due: "Próximo do vencimento", pending: "Pendente", late: "Atrasado", cancelled: "Cancelado" }[status] || status; }
  function adminAccountLabel(status) { return { active: "Ativo", attention: "Atenção", suspended: "Suspenso", inactive: "Inativo" }[status] || status; }
  function adminPaymentLabel(status) { return { paid: "Pago", pending: "Pendente", late: "Atrasado", cancelled: "Cancelado", reversed: "Estornado" }[status] || status; }
  function adminStatusClass(status) { return ({ paid: "active", due: "attention", pending: "attention", late: "inactive", cancelled: "inactive", invalid: "inactive", suspended: "attention", blocked: "attention", reversed: "attention" }[status] || status); }

  function adminRemotePlanId(subscription = {}) {
    const code = String(subscription.plan_code || subscription.planCode || "").toLowerCase();
    const name = String(subscription.plan_name || subscription.planName || "").toLowerCase();
    if (code === "free" || name.includes("free")) return "free";
    if (code === "equipe" || name.includes("equipe")) return "team";
    if (code === "corretora10" || name.includes("10")) return "broker10";
    if (code === "corretora16" || name.includes("16")) return "broker16";
    if (code === "corretora20" || name.includes("20")) return "broker20";
    return "individual";
  }

  function adminRemoteStatus(status, fallback = "active") {
    const value = String(status || fallback).toLowerCase();
    return ({ ativa: "active", ativo: "active", active: "active", suspended: "suspended", suspensa: "suspended", inactive: "inactive", inativa: "inactive", cancelled: "cancelled", canceled: "cancelled", paid: "paid", pago: "paid", pending: "pending", pendente: "pending", overdue: "late", late: "late", atrasado: "late" })[value] || value;
  }

  async function loadAdminRemoteData() {
    const [organizationsResult, archivedOrganizationsResult, accessesResult, financialResult, supervisorsResult, dashboardResult] = await Promise.all([
      window.LungoAdminApi.getOrganizations(adminMasterKey),
      window.LungoAdminApi.getArchivedOrganizations(adminMasterKey),
      window.LungoAdminApi.getAccesses(adminMasterKey),
      window.LungoAdminApi.getFinancial(adminMasterKey),
      window.LungoAdminApi.getSupervisors(adminMasterKey).catch(() => ({ summary: {}, ranking: [] })),
      window.LungoAdminApi.getDashboard(adminMasterKey).catch(() => ({ salesTimeline: [] }))
    ]);
    const allOrganizations = Array.isArray(organizationsResult) ? organizationsResult : organizationsResult?.organizations || [];
    const archivedOrganizations = Array.isArray(archivedOrganizationsResult) ? archivedOrganizationsResult : archivedOrganizationsResult?.organizations || [];
    const organizations = allOrganizations.filter((organization) => adminRemoteStatus(organization.status) !== "inactive");
    const visibleOrganizationIds = new Set(organizations.map((organization) => String(organization.id)));
    const accesses = (Array.isArray(accessesResult) ? accessesResult : accessesResult?.accesses || []).filter((access) => visibleOrganizationIds.has(String(access.organization_id || access.organizationId || "")));
    const payments = financialResult?.payments || [];
    const clients = organizations.map((organization) => {
      const subscription = organization.subscription || {};
      const organizationAccesses = accesses.filter((access) => String(access.organization_id || access.organizationId) === String(organization.id));
      const supervisor = organizationAccesses.find((access) => (access.role || access.profile) === "supervisor") || organizationAccesses.find((access) => (access.role || access.profile) === "broker") || organizationAccesses[0];
      return {
        id: String(organization.id), name: organization.name || "Organização", responsible: supervisor?.name || "—",
        document: organization.document_number || "—", email: supervisor?.email || "—", whatsapp: supervisor?.phone || "—",
        type: organization.organization_type === "individual" ? "individual" : "team", planId: adminRemotePlanId(subscription),
        extraAccesses: Number(subscription.extra_accesses || subscription.extraAccesses || 0), activeAccesses: organizationAccesses.filter((access) => adminRemoteStatus(access.status) === "active").length,
        legacy: Boolean(subscription.legacy), saleDate: String(organization.created_at || "").slice(0, 10), nextDue: String(subscription.next_due_date || subscription.nextDueDate || organization.latest_payment?.due_date || "").slice(0, 10),
        financialStatus: adminRemoteStatus(organization.latest_payment?.status || subscription.status, "pending"), accountStatus: adminRemoteStatus(organization.status),
        dueMode: subscription.due_mode === "fixed_day" ? "fixed" : "30days", fixedDay: Number(subscription.fixed_due_day || 1), notes: "", history: []
      };
    });
    const clientByName = (name) => clients.find((client) => client.name === name);
    adminData = {
      version: ADMIN_DATA_VERSION, remote: true, clients,
      archivedClients: archivedOrganizations.map((organization) => ({ id: String(organization.id), name: organization.name || "Organização", type: organization.organization_type === "individual" ? "Individual" : "Corretora / equipe", plan: organization.subscription?.plan_name || "—", createdAt: String(organization.created_at || "").slice(0, 10), status: "Excluído" })),
      accesses: accesses.map((access) => { const userStatus = adminRemoteStatus(access.status); const status = !access.active_token ? "invalid" : userStatus === "blocked" || userStatus === "suspended" ? userStatus : "active"; return { id: String(access.user_id || access.userId || access.id), clientId: String(access.organization_id || access.organizationId || ""), user: access.name || "—", profile: ({ admin_master: "Admin Master", supervisor: "Supervisor", broker: "Corretor" })[access.role || access.profile] || access.role || "—", token: access.token || (access.active_token ? "Token legado — redefina para visualizar" : "Sem token ativo"), status, createdAt: String(access.created_at || "").slice(0, 10), lastAccess: formatLastAccess(access.last_login_at || access.token_last_used_at), validUntil: String(access.token_expires_at || "").slice(0, 10), raw: access }; }),
      receivables: payments.map((payment) => ({ id: String(payment.payment_id || payment.id), clientId: String(clientByName(payment.organization_name)?.id || ""), competence: payment.competence || "—", dueDate: String(payment.due_date || "").slice(0, 10), expected: Number(payment.expected_amount || 0), paid: Number(payment.paid_amount || 0), paymentDate: String(payment.paid_at || "").slice(0, 10), status: adminRemoteStatus(payment.status, "pending"), method: payment.payment_method || "—", note: payment.notes || "", raw: payment })).filter((payment) => payment.clientId),
      supervisors: supervisorsResult?.ranking || [], financialSummary: financialResult?.summary || {}, salesTimeline: dashboardResult?.salesTimeline || [], settings: {}, sequence: 0
    };
  }

  function renderAdminDashboard() {
    const today = adminIsoDate(new Date());
    const month = today.slice(0, 7);
    const currentReceivables = adminData.receivables.filter((item) => item.dueDate.startsWith(month));
    const activeClients = adminData.clients.filter((item) => item.accountStatus === "active").length;
    const late = adminData.receivables.filter((item) => item.status === "late");
    const received = adminData.receivables.filter((item) => item.status === "paid" && item.paymentDate.startsWith(month)).reduce((sum, item) => sum + item.paid, 0);
    const pending = currentReceivables.filter((item) => item.status !== "paid").reduce((sum, item) => sum + item.expected, 0);
    const recurring = adminData.clients.filter((item) => item.accountStatus !== "inactive").reduce((sum, item) => sum + calculateSubscriptionTotal(item.planId, item.extraAccesses), 0);
    const upcoming = adminData.receivables.filter((item) => item.status !== "paid" && item.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const sales = [...adminData.clients].sort((a, b) => b.saleDate.localeCompare(a.saleDate));
    const metrics = [["Total de clientes ativos", activeClients], ["Clientes inadimplentes", late.length], ["Total de acessos ativos", adminData.accesses.filter((item) => item.status === "active").length], ["Receita mensal recorrente", formatCurrency(recurring)], ["Valores recebidos no mês", formatCurrency(received)], ["Valores pendentes", formatCurrency(pending)], ["Próximos vencimentos", upcoming.length], ["Pagamentos atrasados", late.length], ["Novas vendas realizadas", sales.filter((item) => item.saleDate.startsWith(month)).length]];
    if (!$("#adminMobileHero")) $("#adminMasterKpis").insertAdjacentHTML("beforebegin", `<section id="adminMobileHero" class="admin-mobile-hero"><div><span>Receita mensal recorrente</span><b></b><small></small></div><i aria-hidden="true">↗</i><footer><span>Recebido <b></b></span><span>Pendente <b></b></span></footer></section>`);
    const mobileHero = $("#adminMobileHero");
    mobileHero.querySelector(":scope > div > b").textContent = formatCurrency(recurring);
    mobileHero.querySelector(":scope > div > small").textContent = `${activeClients} clientes ativos · ${adminData.accesses.filter((item) => item.status === "active").length} acessos`;
    const heroTotals = mobileHero.querySelectorAll("footer b"); heroTotals[0].textContent = formatCurrency(received); heroTotals[1].textContent = formatCurrency(pending);
    $("#adminMasterKpis").innerHTML = metrics.map(([label, value]) => `<article><span>${label}</span><b>${value}</b></article>`).join("");
    if (!$("#adminMobileQuickActions")) { $("#adminMasterKpis").insertAdjacentHTML("afterend", `<section id="adminMobileQuickActions" class="admin-mobile-quick-actions" aria-label="Ações rápidas"><header><h2>Ações rápidas</h2><span>Acessos frequentes</span></header><div>${[["new-sale","+","Nova venda"],["clients","◎","Clientes"],["tokens","⌁","Acessos"],["receivables","R$","Receber"]].map(([view,icon,label])=>`<button type="button" data-admin-quick-view="${view}"><span>${icon}</span><b>${label}</b></button>`).join("")}</div></section>`); $$("[data-admin-quick-view]").forEach(button=>button.addEventListener("click",()=>setAdminMasterView(button.dataset.adminQuickView))); }
    const listRow = (item, extra, action = "") => `<article><div><b>${escapeHtml(item.name)}</b><span>${extra}</span></div>${action}</article>`;
    $("#adminUpcomingDue").innerHTML = upcoming.slice(0, 5).map((item) => { const client = adminClient(item.clientId); if (!client) return ""; return listRow(client, `${getPlanDefinition(client.planId).name} · ${formatCurrency(item.expected)} · ${formatDate(item.dueDate)}`, adminMasterStatus(adminStatusClass(item.status), adminFinanceLabel(item.status))); }).join("") || "<p>Sem vencimentos próximos.</p>";
    $("#adminLatePayments").innerHTML = late.slice(0, 5).map((item) => { const client = adminClient(item.clientId); if (!client) return ""; const days = Math.max(0, Math.floor((new Date() - new Date(`${item.dueDate}T12:00:00`)) / 86400000)); return listRow(client, `${days} dias · ${formatCurrency(item.expected)} · ${getPlanDefinition(client.planId).name}`, `<button class="tiny-btn" data-admin-client-view="${client.id}">Ver</button>`); }).join("") || "<p>Sem pagamentos atrasados.</p>";
    $("#adminRecentSales").innerHTML = sales.slice(0, 5).map((client) => listRow(client, `${getPlanDefinition(client.planId).name} · ${formatCurrency(calculateSubscriptionTotal(client.planId, client.extraAccesses))} · ${formatDate(client.saleDate)} · ${escapeHtml(client.responsible)}`)).join("");
    renderAdminSalesTrend();
  }

  function adminClientActions(client) {
    const reactivate = client.accountStatus === "suspended" || client.accountStatus === "inactive";
    return `<div class="admin-master-actions"><button class="tiny-btn icon-action-btn" data-admin-client-action="edit" data-id="${client.id}" title="Ver e editar cliente" aria-label="Ver e editar cliente">${actionIcon('edit')}</button><button class="tiny-btn ${reactivate ? "success" : "warning"}" data-admin-client-action="${reactivate ? "reactivate" : "suspend"}" data-id="${client.id}">${reactivate ? "Reativar" : "Suspender"}</button><button class="tiny-btn icon-action-btn danger" data-admin-client-action="remove" data-id="${client.id}" title="Excluir cliente" aria-label="Excluir cliente">${actionIcon('archive')}</button></div>`;
  }

  function renderAdminClients() {
    const rows = $("#adminClientRows"); if (!rows) return;
    rows.innerHTML = adminData.clients.map((client) => { const plan = getPlanDefinition(client.planId); const included = plan.brokerLimit + plan.managerLimit; const total = adminPlanCapacity(client); return `<tr data-mobile-client-card="${client.id}"><td><b>${escapeHtml(client.name)}</b></td><td>${escapeHtml(client.responsible)}</td><td>${client.type === "individual" ? "Individual" : "Corretora / equipe"}</td><td>${plan.name}</td><td>${included}</td><td>${client.extraAccesses}</td><td>${total}</td><td>${client.activeAccesses}</td><td>${formatCurrency(calculateSubscriptionTotal(client.planId, client.extraAccesses))}</td><td>${formatDate(client.nextDue)}</td><td>${adminMasterStatus(adminStatusClass(client.financialStatus), adminFinanceLabel(client.financialStatus))}</td><td>${adminMasterStatus(adminStatusClass(client.accountStatus), adminAccountLabel(client.accountStatus))}</td><td>${adminClientActions(client)}</td></tr>`; }).join("");
  }

  function renderAccessTokens() {
    const rows = $("#adminTokenRows"); if (!rows) return;
    const accessActions=access=>{const invalid=access.status==="invalid",suspended=access.status==="blocked"||access.status==="suspended",canEmail=access.token?.startsWith("LNG-")&&access.raw?.email;return `<div class="admin-master-actions"><button class="tiny-btn icon-action-btn" data-token-action="renew" data-id="${access.id}" title="Renovar token" aria-label="Renovar token">${actionIcon('renew')}</button>${canEmail?`<button class="tiny-btn icon-action-btn" data-token-action="email" data-id="${access.id}" title="Reenviar acesso por e-mail" aria-label="Reenviar acesso por e-mail"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3zM3 7l9 7 9-7"/></svg></button>`:''}${!invalid?`<button class="tiny-btn icon-action-btn ${suspended?'success':'warning'}" data-token-action="${suspended?'reactivate':'block'}" data-id="${access.id}" title="${suspended?'Reativar':'Bloquear'} acesso" aria-label="${suspended?'Reativar':'Bloquear'} acesso">${actionIcon(suspended?'reactivate':'block')}</button>`:''}<button class="tiny-btn icon-action-btn" data-token-action="edit" data-id="${access.id}" title="Editar acesso" aria-label="Editar acesso">${actionIcon('edit')}</button><button class="tiny-btn icon-action-btn danger" data-token-action="archive" data-id="${access.id}" title="Excluir acesso" aria-label="Excluir acesso">${actionIcon('archive')}</button></div>`};
    const accessRow=(access,principal=false)=>{const canCopy=access.token?.startsWith("LNG-"),suspended=access.status==="blocked"||access.status==="suspended",statusLabel=access.status==="active"?"Ativo":suspended?"Suspenso":"Inválido";return `<div class="admin-access-person ${principal?'principal':''}"><div><b>${escapeHtml(access.user)}</b><small>${escapeHtml(access.profile)} · ${escapeHtml(access.raw?.email||'Sem e-mail')}</small></div><div class="admin-access-token"><code>${escapeHtml(access.token)}</code>${canCopy?`<button class="tiny-btn icon-action-btn" data-token-action="copy" data-id="${access.id}" title="Copiar token" aria-label="Copiar token">${actionIcon('copy')}</button>`:""}</div><span>${adminMasterStatus(adminStatusClass(access.status),statusLabel)}</span><small>${access.lastAccess||"Sem acesso"}</small>${accessActions(access)}</div>`};
    const groups=adminData.clients.map(client=>{const accesses=adminData.accesses.filter(access=>String(access.clientId)===String(client.id)).sort((a,b)=>{const priority=item=>item.profile==="Admin Master"?0:item.profile==="Supervisor"?1:2;return priority(a)-priority(b)});return {client,principal:accesses[0],children:accesses.slice(1),accesses}}).filter(group=>group.accesses.length);
    rows.innerHTML=groups.map(group=>`<article class="admin-access-group"><button class="admin-access-toggle" type="button" aria-expanded="true"><span aria-hidden="true">›</span><div><b>${escapeHtml(group.client.name)}</b><small>${getPlanDefinition(group.client.planId).name} · ${group.principal.profile==="Supervisor"?"Supervisor e equipe":"Acesso individual"} · ${group.accesses.length} ${group.accesses.length===1?'acesso':'acessos'}</small></div><em title="Corretores vinculados">${group.children.length}</em></button><div class="admin-access-principal"><label>${group.principal.profile==="Supervisor"?"Supervisor / acesso principal":"Acesso principal"}</label>${accessRow(group.principal,true)}</div><div class="admin-access-children">${group.children.length?`<label>Equipe / corretores vinculados</label>${group.children.map(access=>accessRow(access)).join("")}`:'<p>Nenhum corretor vinculado a este supervisor.</p>'}</div></article>`).join("")||'<p class="empty-admin-row">Nenhum acesso cadastrado.</p>';
    rows.querySelectorAll('.admin-access-toggle').forEach(button=>{button.onclick=()=>{const children=button.parentElement.querySelector('.admin-access-children');const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));children.hidden=expanded;};});
    const allowed = adminData.clients.reduce((sum, client) => sum + adminPlanCapacity(client), 0); const used = adminData.accesses.filter((item) => item.status !== "invalid").length;
    $("#adminAccessCapacity").textContent = `Incluídos e extras: ${allowed} · Utilizados: ${used} · Disponíveis: ${Math.max(0, allowed - used)}`;
    $("#adminTokenLimitStatus").textContent = used >= allowed ? "Limite de acessos atingido. Adicione um acesso extra ou faça upgrade do plano." : "Os limites são verificados por assinatura ao gerar um acesso.";
  }

  function renderReceivables() {
    const status = $("#adminReceivableStatus")?.value || "all", plan = $("#adminReceivablePlan")?.value || "all", query = ($("#adminReceivableClient")?.value || "").toLowerCase(), period = $("#adminReceivablePeriod")?.value || "all", month = adminIsoDate(new Date()).slice(0, 7);
    const filtered = adminData.receivables.filter((item) => { const client = adminClient(item.clientId); return (status === "all" || item.status === status) && (plan === "all" || client.planId === plan) && (!query || client.name.toLowerCase().includes(query)) && (period === "all" || item.dueDate.startsWith(month)); });
    const totals = { expected: filtered.reduce((s, i) => s + i.expected, 0), paid: filtered.reduce((s, i) => s + i.paid, 0), pending: filtered.filter((i) => i.status === "pending").reduce((s, i) => s + i.expected, 0), late: filtered.filter((i) => i.status === "late").reduce((s, i) => s + i.expected, 0) };
    $("#adminReceivableKpis").innerHTML = [["Previsto", totals.expected], ["Recebido", totals.paid], ["Pendente", totals.pending], ["Atrasado", totals.late]].map(([label, value]) => `<article><span>${label}</span><b>${formatCurrency(value)}</b></article>`).join("");
    $("#adminReceivableRows").innerHTML = filtered.map((item) => { const client = adminClient(item.clientId); if (!client) return ""; return `<tr><td><b>${escapeHtml(client.name)}</b></td><td>${getPlanDefinition(client.planId).name}</td><td>${item.competence}</td><td>${formatDate(item.dueDate)}</td><td>${formatCurrency(item.expected)}</td><td>${formatCurrency(item.paid)}</td><td>${formatDate(item.paymentDate)}</td><td>${adminMasterStatus(adminStatusClass(item.status), adminPaymentLabel(item.status))}</td><td>${item.method}</td><td title="${escapeHtml(item.note)}">${escapeHtml(item.note || "—")}</td><td><div class="admin-master-actions">${item.status !== "paid" ? `<button class="tiny-btn" data-receivable-action="pay" data-id="${item.id}">Confirmar pagamento</button>` : `<button class="tiny-btn" data-receivable-action="edit-date" data-id="${item.id}">Editar data</button>`}<button class="tiny-btn" data-receivable-action="history" data-id="${item.id}">Histórico</button></div></td></tr>`; }).join("");
  }

  function renderFinancialCalendar() {
    const year = adminCalendarDate.getFullYear(), monthIndex = adminCalendarDate.getMonth(), prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const entries = adminData.receivables.filter((item) => item.dueDate.startsWith(prefix));
    $("#adminCalendarTitle").textContent = new Date(year, monthIndex, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const sums = { expected: entries.reduce((s, i) => s + i.expected, 0), paid: adminData.receivables.filter((item) => item.status === "paid" && item.paymentDate.startsWith(prefix)).reduce((s, i) => s + i.paid, 0), pending: entries.filter((i) => i.status === "pending").reduce((s, i) => s + i.expected, 0), late: entries.filter((i) => i.status === "late").reduce((s, i) => s + i.expected, 0) };
    $("#adminCalendarSummary").innerHTML = [["Previsto no mês", sums.expected], ["Recebido", sums.paid], ["Pendente", sums.pending], ["Atrasado", sums.late]].map(([label, value]) => `<article><span>${label}</span><b>${formatCurrency(value)}</b></article>`).join("");
    const firstDay = new Date(year, monthIndex, 1).getDay(), days = new Date(year, monthIndex + 1, 0).getDate(); let html = "";
    for (let blank = 0; blank < firstDay; blank++) html += `<div class="admin-calendar-day empty"></div>`;
    for (let day = 1; day <= days; day++) { const date = `${prefix}-${String(day).padStart(2, "0")}`, dayEntries = entries.filter((item) => item.dueDate === date), total = dayEntries.reduce((s, i) => s + i.expected, 0), status = dayEntries.some((i) => i.status === "late") ? "late" : dayEntries.some((i) => i.status === "pending") ? "pending" : dayEntries.length && dayEntries.every((i) => i.status === "paid") ? "paid" : "future"; html += `<button class="admin-calendar-day ${status}" type="button" data-calendar-date="${date}"><b>${day}</b>${dayEntries.length ? `<span>${dayEntries.length} venc.</span><strong>${formatCurrency(total)}</strong>` : ""}</button>`; }
    $("#adminFinancialCalendar").innerHTML = html;
  }

  function renderArchivedAdminClients() {
    const rows = $("#adminArchivedClientRows"); if (!rows) return;
    rows.innerHTML = (adminData.archivedClients || []).map((client) => `<tr><td><b>${escapeHtml(client.name)}</b></td><td>${escapeHtml(client.type)}</td><td>${escapeHtml(client.plan)}</td><td>${formatDate(client.createdAt)}</td><td>${adminMasterStatus("inactive", client.status)}</td></tr>`).join("") || '<tr><td colspan="5">Nenhum cliente excluído.</td></tr>';
  }

  function renderAdminV2() { renderAdminDashboard(); renderAdminClients(); renderAccessTokens(); renderReceivables(); renderFinancialCalendar(); renderArchivedAdminClients(); }

  function openAdminClientModal(client) {
    const plan = getPlanDefinition(client.planId), financial = adminData.receivables.filter((item) => item.clientId === client.id), tokens = adminData.accesses.filter((item) => item.clientId === client.id);
    $("#adminMasterModalTitle").textContent = client.name; $("#adminMasterModalSubtitle").textContent = `${plan.name} · ${adminAccountLabel(client.accountStatus)}`;
    $("#adminMasterModalBody").innerHTML = `<article><span>Responsável</span><b>${escapeHtml(client.responsible)}</b></article><article><span>CPF/CNPJ</span><b>${escapeHtml(client.document)}</b></article><article><span>Contato</span><b>${escapeHtml(client.email)} · ${escapeHtml(client.whatsapp)}</b></article><article><span>Assinatura</span><b>${plan.name} · ${formatCurrency(calculateSubscriptionTotal(client.planId, client.extraAccesses))}</b></article><article><span>Acessos</span><b>${client.activeAccesses} ativos de ${adminPlanCapacity(client)}</b></article><article><span>Tokens</span><b>${tokens.map((item) => item.token).join(", ") || "Nenhum"}</b></article><article class="full"><span>Observações internas</span><b>${escapeHtml(client.notes || "—")}</b></article><section class="admin-modal-history full"><h3>Histórico financeiro</h3>${financial.map((item) => `<p><b>${item.competence}</b> · venc. ${formatDate(item.dueDate)} · ${formatCurrency(item.expected)} · ${adminPaymentLabel(item.status)} · ${escapeHtml(item.note || "Sem observação")}</p>`).join("")}</section><section class="admin-modal-history full"><h3>Histórico de alterações</h3>${client.history.map((item) => `<p><b>${formatDate(item.date)}</b> · ${escapeHtml(item.text)}</p>`).join("")}</section>`;
    $("#adminMasterModal").showModal();
  }

  function openAdminFormModal(title, subtitle, html) { $("#adminMasterModalTitle").textContent = title; $("#adminMasterModalSubtitle").textContent = subtitle; $("#adminMasterModalBody").innerHTML = html; $("#adminMasterModal").showModal(); }

  function openAdminClientNameEdit(client) {
    const plan = getPlanDefinition(client.planId), financial = adminData.receivables.filter((item) => item.clientId === client.id), accesses = adminData.accesses.filter((item) => item.clientId === client.id);
    const principal = accesses.find((access) => access.profile === "Supervisor") || accesses.find((access) => access.profile === "Corretor") || accesses[0];
    const pending = financial.filter((item) => item.status !== "paid").reduce((sum, item) => sum + Number(item.expected || 0), 0);
    const paid = financial.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.paid || 0), 0);
    openAdminFormModal("Editar cliente", "Dados do cliente, contato, acessos e vencimento da assinatura.", `<form id="adminClientNameEditForm" class="admin-modal-form full" data-id="${client.id}" data-access-id="${principal?.id||""}"><label class="full">Nome do cliente ou corretora<input id="adminClientEditName" value="${escapeHtml(client.name)}" maxlength="160" required></label><label>Responsável<input id="adminClientEditResponsible" value="${escapeHtml(principal?.user||client.responsible||"")}" maxlength="160" ${principal?"required":"disabled"}></label><label>E-mail<input id="adminClientEditEmail" type="email" value="${escapeHtml(principal?.raw?.email||client.email||"")}" ${principal?"required":"disabled"}></label><label>WhatsApp / telefone<input id="adminClientEditPhone" value="${escapeHtml(principal?.raw?.phone||client.whatsapp||"")}" ${principal?"":"disabled"}></label><label>Acessos adicionais do supervisor<input id="adminClientEditExtraAccesses" type="number" min="0" step="1" value="${Math.max(0, Number(client.extraAccesses)||0)}" required><small>Quantidade além dos acessos incluídos no plano.</small></label><label>Regra de vencimento<select id="adminClientEditDueMode"><option value="thirty_days" ${client.dueMode==="30days"?"selected":""}>30 dias após pagamento</option><option value="fixed_day" ${client.dueMode==="fixed"?"selected":""}>Dia fixo do mês</option></select></label><label>Próximo vencimento<input id="adminClientEditNextDue" type="date" value="${escapeHtml(client.nextDue||"")}" required></label><label id="adminClientEditFixedDayField" ${client.dueMode==="fixed"?"":"hidden"}>Dia fixo<select id="adminClientEditFixedDay">${[1,5,10,15,20,25].map(day=>`<option value="${day}" ${Number(client.fixedDay)===day?"selected":""}>${day}</option>`).join("")}</select></label>${principal?"":'<div class="auth-status full">Este cliente ainda não possui um acesso principal; crie um acesso para editar responsável e contato.</div>'}<section class="admin-modal-history full"><h3>Resumo da assinatura</h3><p><b>Plano:</b> ${escapeHtml(plan.name)} · <b>Mensalidade atual:</b> ${formatCurrency(calculateSubscriptionTotal(client.planId, client.extraAccesses))}</p><p><b>Recebido:</b> ${formatCurrency(paid)} · <b>Pendente:</b> ${formatCurrency(pending)} · <b>Acessos em uso:</b> ${client.activeAccesses} de ${adminPlanCapacity(client)}</p></section><button class="btn primary" type="submit">Salvar alterações</button></form>`);
    $("#adminClientEditDueMode")?.addEventListener("change",event=>{$("#adminClientEditFixedDayField").hidden=event.target.value!=="fixed_day"});
    $("#adminClientEditName")?.focus();
  }

  async function submitAdminClientNameEdit(event) {
    event.preventDefault();
    const form = event.target.closest("form"), client = adminClient(form?.dataset.id), name = $("#adminClientEditName")?.value.trim(),dueMode=$("#adminClientEditDueMode")?.value,nextDueDate=$("#adminClientEditNextDue")?.value;
    if (!client || !name) return;
    const extraAccesses = Number($("#adminClientEditExtraAccesses")?.value);
    if (!Number.isInteger(extraAccesses) || extraAccesses < 0) { toast("Informe uma quantidade válida de acessos adicionais.", "error"); return; }
    const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
    try { const updates=[window.LungoAdminApi.updateOrganization(client.id, { name,nextDueDate,dueMode,fixedDueDay:dueMode==="fixed_day"?Number($("#adminClientEditFixedDay")?.value):null,extraAccesses }, adminMasterKey)];if(form.dataset.accessId)updates.push(window.LungoAdminApi.updateAccess(form.dataset.accessId,{name:$("#adminClientEditResponsible")?.value.trim(),email:$("#adminClientEditEmail")?.value.trim(),phone:$("#adminClientEditPhone")?.value.trim()||null},adminMasterKey));await Promise.all(updates); await loadAdminRemoteData(); renderAdminV2(); $("#adminMasterModal")?.close(); toast("Cliente e limite de acessos atualizados com sucesso.", "success"); }
    catch (error) { toast(error.message, "error"); }
    finally{if(submit?.isConnected)submit.disabled=false}
  }

  function openPaymentModal(receivable) {
    const client = adminClient(receivable.clientId);
    openAdminFormModal("Confirmar pagamento", client.name, `<form id="adminPaymentForm" class="admin-modal-form full" data-id="${receivable.id}"><label>Competência<input value="${receivable.competence}" readonly></label><label>Valor previsto<input value="${receivable.expected.toFixed(2)}" readonly></label><label>Valor recebido<input id="adminPaymentReceived" type="number" step="0.01" value="${receivable.expected.toFixed(2)}" required></label><label>Data do pagamento<input id="adminPaymentDate" type="date" value="${adminIsoDate(new Date())}" required></label><label>Forma de pagamento<select id="adminPaymentMethod"><option>Pix</option><option>Boleto</option><option>Cartão</option><option>Transferência</option></select></label><label>Próximo vencimento<select id="adminPaymentDueRule"><option value="keep">Manter regra atual</option><option value="30days">Mudar para 30 dias</option><option value="fixed">Mudar para dia fixo</option></select></label><label>Dia fixo<select id="adminPaymentFixedDay"><option>1</option><option>5</option><option>10</option><option>15</option><option>20</option><option>25</option></select></label><label class="full">Observação<textarea id="adminPaymentNote" rows="3"></textarea></label><button class="btn primary" type="submit">Confirmar pagamento</button></form>`);
  }

  async function confirmAdminPayment(event) {
    event.preventDefault();
    const form = event.target.closest("form");
    const receivable = adminData.receivables.find((item) => item.id === form?.dataset.id);
    const submit = form?.querySelector('button[type="submit"]');
    if (!receivable) { toast("Recebimento não encontrado. Atualize a tela e tente novamente."); return; }
    if (submit) submit.disabled = true;
    try {
      await window.LungoAdminApi.confirmPayment(receivable.id, { paidAmount: Number($("#adminPaymentReceived").value), paidAt: $("#adminPaymentDate").value, paymentMethod: $("#adminPaymentMethod").value, notes: $("#adminPaymentNote").value.trim() }, adminMasterKey);
      await loadAdminRemoteData();
      $("#adminMasterModal").close(); renderAdminV2(); toast("Pagamento confirmado.");
    } catch (error) { toast(error.message); }
    finally { if (submit?.isConnected) submit.disabled = false; }
  }

  function openPlanModal(client) {
    openAdminFormModal("Upgrade ou downgrade", client.name, `<form id="adminPlanChangeForm" class="admin-modal-form full" data-id="${client.id}"><p>Plano atual: <b>${getPlanDefinition(client.planId).name}</b> · ${formatCurrency(calculateSubscriptionTotal(client.planId, client.extraAccesses))}</p><label>Novo plano<select id="adminNewPlan">${ADMIN_PLAN_DEFINITIONS.map((plan) => `<option value="${plan.id}" ${plan.id === client.planId ? "selected" : ""}>${plan.name} — ${formatCurrency(plan.price)}</option>`).join("")}</select></label><label>Acessos extras<input id="adminNewPlanExtras" type="number" min="0" value="${client.extraAccesses}"></label><div id="adminPlanChangePreview" class="auth-status"></div><button class="btn primary" type="submit">Salvar mudança</button></form>`); updatePlanChangePreview(client);
  }

  function updatePlanChangePreview(client) { const plan = getPlanDefinition($("#adminNewPlan")?.value || client.planId), extras = Number($("#adminNewPlanExtras")?.value || 0), limit = plan.brokerLimit + plan.managerLimit + extras, warning = client.activeAccesses > limit ? ` Atenção: existem ${client.activeAccesses - limit} acessos excedentes; bloqueie-os manualmente.` : ""; $("#adminPlanChangePreview").textContent = `Novo limite: ${limit} · Nova mensalidade: ${formatCurrency(calculateSubscriptionTotal(plan.id, extras))}.${warning}`; }

  async function savePlanChange(event) { event.preventDefault(); const form = event.target.closest("form"), client = adminClient(form?.dataset.id), planId = $("#adminNewPlan").value, extras = planId==="free"?0:Number($("#adminNewPlanExtras").value); if (!client) { toast("Organização não encontrada. Atualize a tela e tente novamente."); return; } try { await window.LungoAdminApi.updateOrganization(client.id, { name: client.name, organizationType: client.type === "individual" ? "individual" : "brokerage", planCode: ({ free:"free",team: "equipe", broker10: "corretora10", broker16: "corretora16", broker20: "corretora20" })[planId] || "individual", extraAccesses: extras, dueMode: client.dueMode === "fixed" ? "fixed_day" : "thirty_days", fixedDueDay: client.dueMode === "fixed" ? client.fixedDay : null }, adminMasterKey); await loadAdminRemoteData(); $("#adminMasterModal").close(); renderAdminV2(); toast("Assinatura atualizada."); } catch (error) { toast(error.message); } }

  function adminMasterStatusLabel(status) {
    return { active: "Ativo", attention: "Atenção", inactive: "Inativo" }[status] || status;
  }

  function adminMasterStatus(status, label) {
    return `<span class="admin-master-status ${escapeHtml(status)}">${escapeHtml(label || adminMasterStatusLabel(status))}</span>`;
  }

  function adminMasterActionButtons(account) {
    const enableAction = account.status === "inactive" ? "reactivate" : "disable";
    const enableLabel = account.status === "inactive" ? "Reativar" : "Desativar";
    return `<div class="admin-master-actions">
      <button class="tiny-btn" type="button" data-admin-master-action="view" data-admin-master-id="${account.id}" title="Ver conta">Ver</button>
      <button class="tiny-btn" type="button" data-admin-master-action="edit" data-admin-master-id="${account.id}" title="Editar conta">Editar</button>
      <button class="tiny-btn" type="button" data-admin-master-action="copy" data-admin-master-id="${account.id}" title="Copiar acesso">Copiar</button>
      <button class="tiny-btn" type="button" data-admin-master-action="${enableAction}" data-admin-master-id="${account.id}" title="${enableLabel} conta">${enableLabel}</button>
      <button class="tiny-btn danger" type="button" data-admin-master-action="remove" data-admin-master-id="${account.id}" title="Remover conta">Remover</button>
    </div>`;
  }

  function renderAdminMasterDashboard() {
    const supervisors = ADMIN_MASTER_ACCOUNTS.filter((item) => item.type === "Supervisor");
    const individuals = ADMIN_MASTER_ACCOUNTS.filter((item) => item.type === "Individual");
    const active = ADMIN_MASTER_ACCOUNTS.filter((item) => item.status === "active").length;
    const attention = ADMIN_MASTER_ACCOUNTS.filter((item) => item.status === "attention").length;
    const inactive = ADMIN_MASTER_ACCOUNTS.filter((item) => item.status === "inactive").length;
    const contracted = ADMIN_MASTER_ACCOUNTS.reduce((total, item) => total + item.limit, 0);
    const used = ADMIN_MASTER_ACCOUNTS.reduce((total, item) => total + item.used, 0);
    const revenue = ADMIN_MASTER_ACCOUNTS.reduce((total, item) => total + item.revenue, 0);
    const metrics = [
      ["Total de contas", ADMIN_MASTER_ACCOUNTS.length], ["Supervisores ativos", supervisors.filter((item) => item.status === "active").length],
      ["Corretores individuais", individuals.length], ["Corretores de equipes", supervisors.reduce((total, item) => total + item.used, 0)],
      ["Acessos ativos", active], ["Acessos em atenção", attention], ["Acessos inativos", inactive],
      ["Vagas contratadas", contracted], ["Vagas utilizadas", used], ["Receita mensal estimada", formatMoney(revenue)]
    ];
    const kpis = $("#adminMasterKpis");
    if (kpis) kpis.innerHTML = metrics.map(([label, value]) => `<article><span>${label}</span><b>${value}</b></article>`).join("");
    const recent = $("#adminMasterRecentRows");
    if (recent) recent.innerHTML = ADMIN_MASTER_ACCOUNTS.slice(0, 5).map((item) => `<tr><td><b>${escapeHtml(item.name)}</b></td><td>${item.type}</td><td>${adminMasterStatus(item.status)}</td><td>${item.plan}</td><td>${item.limit}</td><td>${item.used}</td><td>${item.last}</td></tr>`).join("");
  }

  function renderAdminMasterTables() {
    const accessRows = $("#adminMasterAccessRows");
    if (accessRows) accessRows.innerHTML = ADMIN_MASTER_ACCOUNTS.map((item) => `<tr><td><b>${escapeHtml(item.name)}</b></td><td>${item.type}</td><td>${escapeHtml(item.responsible)}</td><td>${adminMasterStatus(item.status)}</td><td>${item.plan}</td><td>${item.limit}</td><td>${item.used}</td><td>${item.due}</td><td>${item.last}</td><td>${adminMasterActionButtons(item)}</td></tr>`).join("");
    const supervisorRows = $("#adminMasterSupervisorRows");
    if (supervisorRows) supervisorRows.innerHTML = ADMIN_MASTER_ACCOUNTS.filter((item) => item.type === "Supervisor").map((item) => `<tr class="admin-master-clickable-row" data-admin-master-open="${item.id}" title="Ver detalhes da corretora"><td><b>${escapeHtml(item.name)}</b></td><td>${escapeHtml(item.responsible)}</td><td>${escapeHtml(item.login)}</td><td>${item.limit}</td><td>${item.used}</td><td>${Math.max(0, item.limit - item.used)}</td><td>${adminMasterStatus(item.status)}</td><td>${item.last}</td><td>${formatMoney(item.revenue)}</td><td><button class="tiny-btn" type="button" data-admin-master-action="view" data-admin-master-id="${item.id}">Ver</button></td></tr>`).join("");
    const individualRows = $("#adminMasterIndividualRows");
    if (individualRows) individualRows.innerHTML = ADMIN_MASTER_ACCOUNTS.filter((item) => item.type === "Individual").map((item) => `<tr><td><b>${escapeHtml(item.name)}</b></td><td><code>${escapeHtml(item.credential)}</code></td><td>${adminMasterStatus(item.status)}</td><td>${escapeHtml(item.contact)}</td><td>${item.last}</td><td>${item.plan}</td><td>${item.legacy}</td><td>${formatMoney(item.revenue)}</td><td>${adminMasterActionButtons(item)}</td></tr>`).join("");
    const financeRows = $("#adminMasterFinanceRows");
    const paymentClass = { "Em dia": "paid", "Vence em breve": "due", "Atrasado": "late", "Cancelado": "cancelled" };
    if (financeRows) financeRows.innerHTML = ADMIN_MASTER_ACCOUNTS.map((item) => `<tr><td><b>${escapeHtml(item.name)}</b></td><td>${item.type}</td><td>${item.plan}</td><td>${formatMoney(item.revenue)}</td><td>${item.due}</td><td>${adminMasterStatus(paymentClass[item.payment] || "", item.payment)}</td><td>${item.legacy}</td><td>${item.lastPayment}</td><td><button class="tiny-btn" type="button" data-admin-master-finance="${item.id}">Ver cobrança</button></td></tr>`).join("");
  }

  function renderAdminMasterPlans() {
    const target = $("#adminMasterPlanCards");
    if (!target) return;
    target.innerHTML = ADMIN_MASTER_PLANS.map((plan, index) => `<article><h2>${plan.name}</h2><b>${plan.limit}</b><span>${plan.value}</span>${adminMasterStatus("active", plan.status)}<button class="tiny-btn" type="button" data-admin-master-plan="${index}">Editar</button></article>`).join("");
  }

  function renderAdminMasterAccessFields() {
    const individual = $("#adminIndividualFields");
    const supervisor = $("#adminSupervisorFields");
    if (!individual || !supervisor) return;
    individual.innerHTML = `<label><span>Nome</span><input id="adminNewIndividualName" required></label><label><span>WhatsApp</span><input id="adminNewIndividualWhatsapp" required></label><label><span>E-mail</span><input id="adminNewIndividualEmail" type="email" required></label><label><span>Token personalizado</span><input id="adminNewIndividualToken" required></label><label><span>Plano</span><select id="adminNewIndividualPlan"><option>Individual</option></select></label><label><span>Valor mensal</span><input id="adminNewIndividualValue" value="R$ 249,00"></label><label><span>Legacy</span><select id="adminNewIndividualLegacy"><option>Não</option><option>Sim</option></select></label><label><span>Status</span><select id="adminNewIndividualStatus"><option value="active">Ativo</option><option value="attention">Atenção</option><option value="inactive">Inativo</option></select></label><label class="full"><span>Observação interna</span><textarea id="adminNewIndividualNotes" rows="3"></textarea></label>`;
    supervisor.innerHTML = `<label><span>Nome da corretora</span><input id="adminNewCompanyName" required></label><label><span>Nome do supervisor</span><input id="adminNewSupervisorName" required></label><label><span>WhatsApp</span><input id="adminNewSupervisorWhatsapp" required></label><label><span>E-mail</span><input id="adminNewSupervisorEmail" type="email" required></label><label><span>Login</span><input id="adminNewSupervisorLogin" required></label><label><span>Senha ou token provisório</span><input id="adminNewSupervisorPassword" required></label><label><span>Limite de corretores</span><select id="adminNewSupervisorLimit"><option value="4">4</option><option value="6">6</option><option value="10">10</option><option value="personalizado">Personalizado</option></select></label><label><span>Plano</span><select id="adminNewSupervisorPlan"><option>Equipe 4</option><option>Equipe 6</option><option>Equipe 10</option><option>Personalizado</option></select></label><label><span>Valor mensal</span><input id="adminNewSupervisorValue" value="R$ 1.190,00"></label><label><span>Legacy</span><select id="adminNewSupervisorLegacy"><option>Não</option><option>Sim</option></select></label><label><span>Status</span><select id="adminNewSupervisorStatus"><option value="active">Ativo</option><option value="attention">Atenção</option><option value="inactive">Inativo</option></select></label><label class="full"><span>Observação interna</span><textarea id="adminNewSupervisorNotes" rows="3"></textarea></label>`;
  }

  function setAdminMasterAccessType(type) {
    adminMasterAccessType = type;
    $("#adminAccessIndividualTab")?.classList.toggle("active", type === "individual");
    $("#adminAccessSupervisorTab")?.classList.toggle("active", type === "supervisor");
    if ($("#adminIndividualFields")) $("#adminIndividualFields").hidden = type !== "individual";
    if ($("#adminSupervisorFields")) $("#adminSupervisorFields").hidden = type !== "supervisor";
    $$("#adminIndividualFields input, #adminIndividualFields select, #adminIndividualFields textarea").forEach((field) => { field.disabled = type !== "individual"; });
    $$("#adminSupervisorFields input, #adminSupervisorFields select, #adminSupervisorFields textarea").forEach((field) => { field.disabled = type !== "supervisor"; });
  }

  function generateAdminMasterAccess(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (adminMasterAccessType === "individual") {
      const name = $("#adminNewIndividualName").value.trim();
      const token = $("#adminNewIndividualToken").value.trim();
      adminMasterGeneratedMessage = `Olá, ${name}. Seu acesso à Lungo Corretores foi liberado.\n\nLink: https://crm.lungocorretores.com.br\nToken: ${token}\n\nAcesse, aceite os termos e conecte seu WhatsApp pelo QR Code.`;
    } else {
      const supervisor = $("#adminNewSupervisorName").value.trim();
      const login = $("#adminNewSupervisorLogin").value.trim();
      const password = $("#adminNewSupervisorPassword").value.trim();
      const limit = $("#adminNewSupervisorLimit").value;
      adminMasterGeneratedMessage = `Olá, ${supervisor}. Seu acesso de supervisão da Lungo Corretores foi liberado.\n\nLink: https://crm.lungocorretores.com.br\nTipo de acesso: Supervisor\nLogin: ${login}\nSenha provisória: ${password}\n\nVocê poderá cadastrar até ${limit} corretores na sua equipe.`;
    }
    const box = $("#adminGeneratedAccess");
    box.hidden = false;
    box.querySelector("pre").textContent = adminMasterGeneratedMessage;
    const status = $("#adminAccessStatus");
    status.textContent = "Acesso gerado visualmente. Nenhum dado foi enviado.";
    status.classList.add("ok");
  }

  async function copyAdminMasterText(text, success = "Mensagem copiada.", button = null) {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); copied = true; }
    } catch (_) { /* Usa a alternativa abaixo. */ }
    if (!copied) {
      const helper = document.createElement("textarea");
      helper.value = text; helper.setAttribute("readonly", ""); helper.style.position = "fixed"; helper.style.opacity = "0";
      document.body.appendChild(helper); helper.select();
      try { copied = document.execCommand("copy"); } catch (_) { copied = false; }
      helper.remove();
    }
    if (copied) {
      toast(success);
      if (button) { const original = button.innerHTML, originalTitle = button.title; if (!button.classList.contains('icon-action-btn')) button.textContent = "Copiado ✓"; else button.title = 'Token copiado'; button.classList.add("ok"); setTimeout(() => { if (button.isConnected) { button.innerHTML = original; button.title = originalTitle; button.classList.remove("ok"); } }, 1800); }
    } else {
      window.prompt("Copie o token abaixo:", text);
      toast("Selecione e copie o token exibido.");
    }
    return copied;
  }

  function openAdminMasterModal(account) {
    if (!account) return;
    $("#adminMasterModalTitle").textContent = account.name;
    $("#adminMasterModalSubtitle").textContent = `${account.type} · ${adminMasterStatusLabel(account.status)}`;
    const fields = [["Responsável", account.responsible], ["Login / token", account.login], ["WhatsApp", account.contact], ["Plano", account.plan], ["Limite contratado", account.limit], ["Vagas utilizadas", account.used], ["Vagas disponíveis", Math.max(0, account.limit - account.used)], ["Vencimento", account.due], ["Último acesso", account.last], ["Valor mensal", formatMoney(account.revenue)], ["Legacy", account.legacy], ["Vendedores vinculados", account.sellers || "Conta individual"], ["Métricas resumidas", `${account.used} de ${account.limit} acessos em uso`], ["Observações", account.notes]];
    $("#adminMasterModalBody").innerHTML = fields.map(([label, value]) => `<article><span>${label}</span><b>${escapeHtml(String(value))}</b></article>`).join("");
    $("#adminMasterModal")?.showModal();
  }

  function renderAdminMasterSettings() {
    let settings = {};
    try { settings = JSON.parse(localStorage.getItem(ADMIN_MASTER_SETTINGS_KEY) || "{}"); } catch (_) { settings = {}; }
    const values = { adminPlatformName: settings.platformName || "Lungo Corretores", adminBrokerDomain: settings.brokerDomain || "https://crm.lungocorretores.com.br", adminMasterDomain: settings.adminDomain || "https://admin.lungocorretores.com.br", adminCommercialWhatsapp: settings.commercialWhatsapp || "5555992102864", adminDueWarningDays: settings.dueWarningDays || 5, adminDefaultMessage: settings.defaultMessage || "Olá! Seu acesso à Lungo Corretores foi liberado.", adminChargeText: settings.chargeText || "Olá! Identificamos uma mensalidade pendente. Podemos ajudar?", adminInternalNotice: settings.internalNotice || "" };
    Object.entries(values).forEach(([id, value]) => { const field = document.getElementById(id); if (field) field.value = value; });
  }

  function resetAdminTrainingForm() {
    $('#adminTrainingForm')?.reset();
    if ($('#adminTrainingId')) $('#adminTrainingId').value = '';
    if ($('#adminTrainingOrder')) $('#adminTrainingOrder').value = '0';
    if ($('#adminTrainingActive')) $('#adminTrainingActive').value = 'true';
    if ($('#adminTrainingFormTitle')) $('#adminTrainingFormTitle').textContent = 'Novo treinamento';
  }

  function renderAdminTrainings() {
    const list = $('#adminTrainingList'); if (!list) return;
    if (!$('#adminTrainingNew')) list.insertAdjacentHTML('beforebegin', '<div class="training-admin-toolbar"><button id="adminTrainingNew" class="btn primary" type="button">Cadastrar novo</button></div>');
    const tracks = [...new Set(adminTrainings.map((item) => item.track || 'Geral'))];
    if ($('#adminTrainingTrackList')) $('#adminTrainingTrackList').innerHTML = tracks.map((track) => `<option value="${escapeHtml(track)}"></option>`).join('');
    list.innerHTML = adminTrainings.length ? adminTrainings.slice().sort((a, b) => (a.track || '').localeCompare(b.track || '') || a.order - b.order).map((item) => `<article class="training-admin-item"><img src="https://i.ytimg.com/vi/${escapeHtml(item.youtubeId)}/mqdefault.jpg" alt=""><div><span>${escapeHtml(item.track || 'Geral')} · Ordem ${Number(item.order || 0)}</span><b>${escapeHtml(item.title)}</b>${trainingStars(item.stars)}<small>${item.active === false ? 'Oculto' : 'Publicado'}</small></div><div class="admin-master-actions"><button class="tiny-btn" type="button" data-training-action="edit" data-id="${item.id}">Editar</button><button class="tiny-btn" type="button" data-training-action="toggle" data-id="${item.id}">${item.active === false ? 'Publicar' : 'Ocultar'}</button><button class="tiny-btn" type="button" data-training-action="delete" data-id="${item.id}">Excluir</button></div></article>`).join('') : '<div class="empty-state">Nenhum treinamento cadastrado.</div>';
  }

  async function loadAdminTrainings() {
    const status = $('#adminTrainingStatus');
    try { const result = await window.LungoAdminApi.getTrainings(adminMasterKey); adminTrainings = result.trainings || []; renderAdminTrainings(); if (status) status.textContent = `${adminTrainings.length} treinamento(s) cadastrado(s).`; }
    catch (error) { if (status) { status.textContent = error.message; status.classList.add('error'); } }
  }

  async function saveAdminTraining(event) {
    event.preventDefault(); const id = $('#adminTrainingId').value;
    const payload = { title: $('#adminTrainingTitle').value.trim(), url: $('#adminTrainingUrl').value.trim(), track: $('#adminTrainingTrack').value.trim(), description: $('#adminTrainingDescription').value.trim(), stars: Number($('#adminTrainingStars').value), order: Number($('#adminTrainingOrder').value), active: $('#adminTrainingActive').value === 'true' };
    const status = $('#adminTrainingStatus');
    try { if (id) await window.LungoAdminApi.updateTraining(id, payload, adminMasterKey); else await window.LungoAdminApi.createTraining(payload, adminMasterKey); resetAdminTrainingForm(); await loadAdminTrainings(); status.textContent = id ? 'Treinamento atualizado.' : 'Treinamento publicado.'; status.classList.add('ok'); toast(status.textContent); }
    catch (error) { status.textContent = error.message; status.classList.add('error'); }
  }

  async function adminTrainingAction(event) {
    const button = event.target.closest('[data-training-action]'); if (!button) return;
    const item = adminTrainings.find((training) => training.id === button.dataset.id); if (!item) return;
    if (button.dataset.trainingAction === 'edit') { $('#adminTrainingId').value = item.id; $('#adminTrainingTitle').value = item.title; $('#adminTrainingUrl').value = item.url; $('#adminTrainingTrack').value = item.track; $('#adminTrainingDescription').value = item.description || ''; $('#adminTrainingStars').value = String(item.stars || 0); $('#adminTrainingOrder').value = String(item.order || 0); $('#adminTrainingActive').value = String(item.active !== false); $('#adminTrainingFormTitle').textContent = 'Editar treinamento'; $('#adminTrainingTitle').focus(); return; }
    try { if (button.dataset.trainingAction === 'toggle') await window.LungoAdminApi.updateTraining(item.id, { active: item.active === false }, adminMasterKey); if (button.dataset.trainingAction === 'delete') { if (!await popupConfirm(`Deseja excluir “${item.title}”?`, 'Excluir treinamento')) return; await window.LungoAdminApi.deleteTraining(item.id, adminMasterKey); } await loadAdminTrainings(); }
    catch (error) { toast(error.message); }
  }

  async function loadAdminLeadMarketplace() { const status = $('#adminLeadMarketStatus'); try { const result = await window.LungoAdminApi.getLeadMarketplace(adminMasterKey); leadMarketplaceAdminData = result; renderAdminLeadMarketplace(); if (status) { status.textContent = 'Marketplace atualizado.'; status.className = 'auth-status ok'; } } catch (error) { if (status) { status.textContent = error.message; status.className = 'auth-status error'; } } }
  function renderAdminLeadMarketplace() {
    const data = leadMarketplaceAdminData; if (!data) return; const leads = data.leads || [], users = data.users || [], purchases = data.purchases || [];
    if ($('#adminLeadMarketKpis')) $('#adminLeadMarketKpis').innerHTML = [['Créditos em carteira', formatCurrency(users.reduce((sum, user) => sum + Number(user.balance || 0), 0))], ['Leads disponíveis', leads.filter((lead) => lead.status === 'available').length], ['Em compra', leads.filter((lead) => lead.status === 'reserved').length], ['Compras realizadas', purchases.length]].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></article>`).join('');
    $$('[data-lead-admin-tab]').forEach((button) => button.classList.toggle('active', button.dataset.leadAdminTab === leadMarketplaceAdminTab)); const content = $('#adminLeadMarketContent'); if (!content) return;
    if (leadMarketplaceAdminTab === 'users') content.innerHTML = `<div class="lead-wallet-grid">${users.map((user) => `<article class="lead-wallet-card"><header><div><b>${escapeHtml(user.name)}</b><small>${escapeHtml(user.email || 'Sem e-mail')}</small></div><span>${user.role === 'supervisor' ? 'Supervisor' : 'Corretor'}</span></header><p>${escapeHtml(user.organizations?.name || 'Sem organização')} · ${escapeHtml(user.status)}</p><div class="lead-wallet-balance"><span>Saldo disponível</span><b>${formatCurrency(user.balance)}</b></div><footer><button class="btn primary" data-admin-lead-credit-user="${user.id}" type="button">Ajustar créditos</button><button class="btn" data-admin-lead-statement="${user.id}" type="button">Ver extrato</button></footer></article>`).join('') || '<div class="empty-state">Nenhum usuário encontrado.</div>'}</div>`;
    if (leadMarketplaceAdminTab === 'stock') content.innerHTML = `<table class="admin-master-table wide"><thead><tr><th>Lead</th><th>Contato</th><th>Perfil</th><th>Vidas</th><th>Interesse</th><th>Campanha</th><th>Preço</th><th>Status interno</th><th>Ações</th></tr></thead><tbody>${leads.map((lead) => `<tr><td><b>${escapeHtml(lead.name)}</b><small>${calendarDateTime(lead.created_at)}</small></td><td>${escapeHtml(lead.phone)}<small>${escapeHtml(lead.email || '')}</small></td><td>${escapeHtml(lead.profile)}</td><td>${Number(lead.lives_count || 0)}</td><td>${escapeHtml(lead.product_interest || '—')}</td><td>${escapeHtml(lead.campaign_name || 'Manual')}</td><td><b>${formatCurrency(lead.price)}</b></td><td>${({available:'Disponível',reserved:'Em compra',sold:'Vendido',invalid:'Inválido',duplicate:'Duplicado'})[lead.status] || lead.status}</td><td><button class="tiny-btn" data-admin-lead-status="available" data-id="${lead.id}" type="button">Disponibilizar</button><button class="tiny-btn danger" data-admin-lead-status="invalid" data-id="${lead.id}" type="button">Invalidar</button></td></tr>`).join('')}</tbody></table>`;
    if (leadMarketplaceAdminTab === 'purchases') content.innerHTML = `<table class="admin-master-table wide"><thead><tr><th>Data</th><th>Comprador</th><th>Lead</th><th>Perfil</th><th>Vidas</th><th>Valor</th></tr></thead><tbody>${purchases.map((item) => `<tr><td>${calendarDateTime(item.purchased_at)}</td><td>${escapeHtml(item.users?.name || 'Usuário')}</td><td>${escapeHtml(item.marketplace_leads?.name || 'Lead')}<small>${escapeHtml(item.marketplace_leads?.phone || '')}</small></td><td>${escapeHtml(item.marketplace_leads?.profile || '')}</td><td>${Number(item.marketplace_leads?.lives_count || 0)}</td><td><b>${formatCurrency(item.price)}</b></td></tr>`).join('') || '<tr><td colspan="6">Nenhuma compra realizada.</td></tr>'}</tbody></table>`;
  }
  function openAdminLeadCredit(userId = '') { const users = leadMarketplaceAdminData?.users || []; openAdminFormModal('Adicionar ou ajustar créditos', 'Movimentação registrada no extrato do usuário.', `<form id="adminLeadCreditForm" class="admin-modal-form full"><label>Usuário<select name="userId">${users.map((user) => `<option value="${user.id}" ${user.id === userId ? 'selected' : ''}>${escapeHtml(user.name)} · ${formatCurrency(user.balance)}</option>`).join('')}</select></label><label>Valor da movimentação<input name="amount" type="number" step="0.01" placeholder="50,00" required></label><label class="full">Descrição<input name="description" value="Crédito adquirido via atendimento" required></label><small class="full">Use valor negativo apenas para correções ou estornos.</small><button class="btn primary" type="submit">Confirmar movimentação</button></form>`); $('#adminLeadCreditForm').onsubmit = async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); try { await window.LungoAdminApi.adjustLeadCredits({ userId: data.get('userId'), amount: Number(data.get('amount')), description: data.get('description') }, adminMasterKey); $('#adminMasterModal').close(); await loadAdminLeadMarketplace(); toast('Créditos atualizados.'); } catch (error) { toast(error.message); } }; }
  function openAdminLeadStatement(userId) { const user = (leadMarketplaceAdminData?.users || []).find((item) => item.id === userId); const entries = (leadMarketplaceAdminData?.transactions || []).filter((item) => item.user_id === userId); openAdminFormModal('Extrato de créditos', `${user?.name || 'Usuário'} · Saldo ${formatCurrency(user?.balance || 0)}`, `<section class="lead-purchase-history full">${entries.map((item) => `<article><div><b>${escapeHtml(item.description || 'Movimentação')}</b><span>${calendarDateTime(item.created_at)} · ${escapeHtml(item.transaction_type)}</span></div><div><b class="${Number(item.amount) < 0 ? 'danger-text' : 'ok-text'}">${Number(item.amount) > 0 ? '+' : ''}${formatCurrency(item.amount)}</b><small>Saldo: ${formatCurrency(item.balance_after)}</small></div></article>`).join('') || '<div class="empty-state">Nenhuma movimentação.</div>'}</section>`); }
  function addLivesFieldToAdminLeadForm() { const form = $('#adminLeadNewForm'); if (!form || form.elements.livesCount) return; const label = document.createElement('label'); label.innerHTML = 'Qtd. de vidas<input name="livesCount" type="number" min="0" value="1" required>'; const profile = form.elements.profile?.closest('label'); profile?.after(label); }
  function openAdminNewLead() { openAdminFormModal('Cadastrar lead no estoque', 'O preço pode ser automático conforme a faixa configurada.', `<form id="adminLeadNewForm" class="admin-modal-form full"><label>Nome<input name="name" required></label><label>Telefone<input name="phone" required></label><label>E-mail<input name="email" type="email"></label><label>Perfil<select name="profile"><option>PF</option><option>PJ</option><option value="Adesao">Adesão</option></select></label><label>Plano de interesse<input name="productInterest"></label><label>Cidade<input name="city"></label><label>UF<input name="state" maxlength="2"></label><label>Campanha<input name="campaignName" value="Cadastro manual"></label><label>Preço personalizado<input name="price" type="number" step="0.01" placeholder="Automático"></label><button class="btn primary" type="submit">Adicionar ao estoque</button></form>`); $('#adminLeadNewForm').onsubmit = async (event) => { event.preventDefault(); const payload = Object.fromEntries(new FormData(event.currentTarget)); try { await window.LungoAdminApi.createMarketplaceLead(payload, adminMasterKey); $('#adminMasterModal').close(); leadMarketplaceAdminTab = 'stock'; await loadAdminLeadMarketplace(); toast('Lead adicionado ao marketplace.'); } catch (error) { toast(error.message); } }; }
  function openAdminLeadSettings() { const settings = leadMarketplaceAdminData?.settings || {}; openAdminFormModal('Configurações do marketplace', 'Regras gerais para cadastro manual e solicitação de créditos.', `<form id="adminLeadSettingsForm" class="admin-modal-form full"><label>Preço mínimo<input name="minPrice" type="number" step="0.01" value="${Number(settings.min_price || 10)}" required></label><label>Preço máximo<input name="maxPrice" type="number" step="0.01" value="${Number(settings.max_price || 20)}" required></label><label>WhatsApp para créditos<input name="supportWhatsapp" value="${escapeHtml(settings.support_whatsapp || '5555992102864')}" required></label><label>Reserva em minutos<input name="reservationMinutes" type="number" min="1" max="30" value="${Number(settings.reservation_minutes || 2)}"></label><button class="btn primary" type="submit">Salvar configurações</button></form>`); $('#adminLeadSettingsForm').onsubmit = async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); try { await window.LungoAdminApi.updateLeadMarketplaceSettings(data, adminMasterKey); $('#adminMasterModal').close(); await loadAdminLeadMarketplace(); toast('Configurações salvas.'); } catch (error) { toast(error.message); } }; }

  async function renderAdminMaster() {
    await loadAdminRemoteData();
    renderAdminV2();
    renderAdminMasterSettings();
  }

  function ensureAdminMobileHeader() {
    const topbar = $(".admin-master-topbar"); if (!topbar || $("#adminMobileBackBtn")) return;
    topbar.insertAdjacentHTML("afterbegin", `<button id="adminMobileBackBtn" class="admin-mobile-back" type="button" aria-label="Voltar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><img class="admin-mobile-logo" src="https://imagensconrato.pagecor.com.br/logo-lungo.png" alt="Lungo">`);
    $("#adminMobileBackBtn").addEventListener("click", () => {
      const saleForm = $("#adminNewSaleForm"), saleStep = Number(saleForm?.dataset.mobileSaleStep || 1);
      if (adminMasterCurrentView === "new-sale" && saleStep > 1) { showAdminMobileSaleStep(saleStep - 1); return; }
      const previous = adminMasterViewHistory.pop() || "dashboard";
      setAdminMasterView(previous, { remember: false });
    });
  }

  function openPaymentDateModal(receivable) {
    const client = adminClient(receivable.clientId);
    openAdminFormModal("Editar data de recebimento", client.name, `<form id="adminPaymentDateForm" class="admin-modal-form full" data-id="${receivable.id}"><label>Competência<input value="${escapeHtml(receivable.competence)}" readonly></label><label>Valor recebido<input value="${formatCurrency(receivable.paid)}" readonly></label><label class="full">Data de recebimento<input id="adminPaymentEditDate" type="date" value="${escapeHtml(receivable.paymentDate || adminIsoDate(new Date()))}" required></label><div class="auth-status full">A alteração atualizará os indicadores de recebimento e o histórico financeiro.</div><button class="btn primary" type="submit">Salvar nova data</button></form>`);
  }

  async function updateAdminPaymentDate(event) {
    event.preventDefault();
    const form = event.target.closest("form"), receivable = adminData.receivables.find((item) => item.id === form?.dataset.id), submit = form?.querySelector('button[type="submit"]');
    if (!receivable) return toast("Recebimento não encontrado.");
    if (submit) submit.disabled = true;
    try { await window.LungoAdminApi.updatePayment(receivable.id, { paidAt: $("#adminPaymentEditDate").value }, adminMasterKey); await loadAdminRemoteData(); renderAdminV2(); $("#adminMasterModal").close(); toast("Data de recebimento atualizada."); }
    catch (error) { toast(error.message); }
    finally { if (submit?.isConnected) submit.disabled = false; }
  }

  function ensureAdminMobileMoreSheet() {
    const screen = $("#adminMasterScreen"); if (!screen || $("#adminMobileMoreSheet")) return;
    const views = ["calendar", "receivables", "archived", "trainings", "lead-marketplace", "settings"];
    const labels = { calendar:"Calendário financeiro", receivables:"Recebimentos", archived:"Excluídos", trainings:"Treinamentos", "lead-marketplace":"Marketplace de Leads", settings:"Configurações" };
    const items = views.map((view) => { const source = $(`[data-admin-master-view="${view}"]`); return `<button type="button" data-mobile-more-view="${view}"><span>${source?.querySelector("svg")?.outerHTML || ""}</span><b>${labels[view]}</b><svg class="admin-mobile-more-next" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`; }).join("");
    screen.insertAdjacentHTML("beforeend", `<section id="adminMobileMoreSheet" class="admin-mobile-more-sheet" hidden><header><div><span>Menu</span><h2>Mais funcionalidades</h2></div><button type="button" data-mobile-more-close aria-label="Fechar">×</button></header><nav>${items}</nav><button class="admin-mobile-more-logout" type="button" data-mobile-more-logout>Sair do Admin</button></section>`);
    const sheet = $("#adminMobileMoreSheet");
    sheet.addEventListener("click", (event) => { const item = event.target.closest("[data-mobile-more-view]"); if (item) setAdminMasterView(item.dataset.mobileMoreView); if (event.target.closest("[data-mobile-more-close]")) closeAdminMobileMore(); if (event.target.closest("[data-mobile-more-logout]")) logoutAdminMaster(); });
  }

  function closeAdminMobileMore() {
    $("#adminMasterScreen")?.classList.remove("mobile-more-open");
    $("#adminMasterMoreBtn")?.setAttribute("aria-expanded", "false");
    if ($("#adminMobileMoreSheet")) $("#adminMobileMoreSheet").hidden = true;
  }

  function setAdminMasterView(view, options = {}) {
    ensureAdminMobileHeader();
    if (window.matchMedia("(max-width: 600px)").matches && options.remember !== false && view !== adminMasterCurrentView) adminMasterViewHistory.push(adminMasterCurrentView);
    adminMasterCurrentView = view;
    const titles = { dashboard: "Dashboard", clients: "Clientes e assinaturas", "new-sale": "Nova venda", tokens: "Acessos e tokens", calendar: "Calendário financeiro", receivables: "Recebimentos", archived: "Excluídos", trainings: "Treinamentos", "lead-marketplace": "Marketplace de Leads", settings: "Configurações" };
    $$(".admin-master-nav-item").forEach((button) => button.classList.toggle("active", button.dataset.adminMasterView === view));
    $("#adminMasterMoreBtn")?.classList.toggle("active", !["dashboard", "clients", "new-sale", "tokens"].includes(view));
    $$(".admin-master-view").forEach((section) => section.classList.toggle("active", section.id === `admin-master-view-${view}`));
    if ($("#adminMasterViewTitle")) $("#adminMasterViewTitle").textContent = titles[view] || "Admin Master";
    closeAdminMobileMore();
    $("#adminMobileBackBtn")?.classList.toggle("visible", view !== "dashboard");
    if (view === 'trainings') loadAdminTrainings();
    if (view === 'lead-marketplace') loadAdminLeadMarketplace();
  }

  async function renderAdminMasterSession() {
    const screen = $("#adminMasterScreen");
    if (!screen) return;
    screen.classList.toggle("admin-master-auth", !adminMasterLogged);
    $("#adminMasterLoginPanel").hidden = adminMasterLogged;
    $("#adminMasterWorkspace").hidden = !adminMasterLogged;
    if (adminMasterLogged) { adminMasterViewHistory.length = 0; adminMasterCurrentView = "dashboard"; await renderAdminMaster(); setAdminMasterView("dashboard", { remember: false }); }
  }

  function syncAdminMasterHash() {
    const screen = $("#adminMasterScreen");
    if (!screen) return;
    const open = window.location.hash.toLowerCase() === "#admin";
    el.body.classList.toggle("admin-master-mode", open);
    screen.hidden = !open;
    if (open) { stopCrmRealtime(); renderAdminMasterSession(); }
  }

  async function loginAdminMaster(event) {
    event.preventDefault();
    const input = $("#adminMasterKeyInput");
    const status = $("#adminMasterLoginStatus");
    const key = input.value.trim();
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    if (!key) return;
    status.textContent = "Validando chave administrativa...";
    status.classList.remove("ok");
    if (submit) submit.disabled = true;
    try {
      await window.LungoAdminApi.verifyAdminKey(key);
      adminMasterKey = key;
      adminMasterLogged = true;
      input.value = "";
      status.textContent = "Acesso liberado.";
      status.classList.add("ok");
      await renderAdminMasterSession();
    } catch (error) {
      adminMasterKey = "";
      adminMasterLogged = false;
      status.textContent = error.message || "Chave administrativa inválida.";
      $("#adminMasterScreen")?.classList.add("admin-master-auth");
      $("#adminMasterLoginPanel").hidden = false;
      $("#adminMasterWorkspace").hidden = true;
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  function logoutAdminMaster() {
    adminMasterLogged = false;
    adminMasterKey = "";
    renderAdminMasterSession();
    toast("Logout do Admin Master realizado.");
  }

  function prepareAdminSaleForm() {
    const planSelect = $("#adminSalePlan");
    if (!planSelect) return;
    planSelect.innerHTML = ADMIN_PLAN_DEFINITIONS.map((plan) => `<option value="${plan.id}">${plan.name} — ${formatCurrency(plan.price)}</option>`).join("");
    const today = adminIsoDate(new Date());
    $("#adminSaleDate").value = today; $("#adminSalePaymentDate").value = today;
    updateAdminSaleCalculation();
    prepareAdminMobileSaleFlow(1);
    const filter = $("#adminReceivablePlan");
    if (filter && filter.options.length === 1) ADMIN_PLAN_DEFINITIONS.forEach((plan) => filter.insertAdjacentHTML("beforeend", `<option value="${plan.id}">${plan.name}</option>`));
  }

  function prepareAdminMobileSaleFlow(activeStep = 1) {
    const form = $("#adminNewSaleForm"), grids = form?.querySelectorAll(":scope > .admin-master-form-grid");
    if (!form || grids?.length < 2) return;
    grids[0].classList.add("admin-sale-step", "admin-sale-step-client");
    grids[1].classList.add("admin-sale-step", "admin-sale-step-plan");
    const headings = form.querySelectorAll(":scope > h3");
    headings[0]?.classList.add("admin-sale-step-heading", "admin-sale-step-client");
    headings[1]?.classList.add("admin-sale-step-heading", "admin-sale-step-plan");
    if (!$("#adminMobileSaleFlow")) {
      form.querySelector(":scope > header").insertAdjacentHTML("afterend", `<nav id="adminMobileSaleFlow" class="admin-mobile-sale-flow" aria-label="Etapas da venda"><button type="button" data-sale-step="1"><span>1</span><b>Cliente</b></button><button type="button" data-sale-step="2"><span>2</span><b>Plano</b></button><button type="button" data-sale-step="3"><span>3</span><b>Revisar</b></button></nav><section id="adminMobileSaleReview" class="admin-mobile-sale-review"></section><div class="admin-mobile-sale-navigation"><button class="btn ghost" type="button" data-sale-step-back>Voltar</button><button class="btn primary" type="button" data-sale-step-next>Continuar</button></div>`);
      $("#adminMobileSaleFlow").addEventListener("click", (event) => { const button = event.target.closest("[data-sale-step]"); if (button) showAdminMobileSaleStep(Number(button.dataset.saleStep)); });
      form.querySelector("[data-sale-step-back]").addEventListener("click", () => showAdminMobileSaleStep(Math.max(1, Number(form.dataset.mobileSaleStep || 1) - 1)));
      form.querySelector("[data-sale-step-next]").addEventListener("click", () => { const step = Number(form.dataset.mobileSaleStep || 1), scope = step === 1 ? grids[0] : grids[1], invalid = [...scope.querySelectorAll("input,select")].find((field) => !field.checkValidity()); if (invalid) return invalid.reportValidity(); showAdminMobileSaleStep(Math.min(3, step + 1)); });
      grids[1].insertAdjacentElement("afterend", form.querySelector(".admin-mobile-sale-navigation"));
    }
    showAdminMobileSaleStep(activeStep);
  }

  function showAdminMobileSaleStep(step) {
    const form = $("#adminNewSaleForm"); if (!form) return;
    form.dataset.mobileSaleStep = String(step);
    form.querySelectorAll("[data-sale-step]").forEach((button) => button.classList.toggle("active", Number(button.dataset.saleStep) === step));
    if (step === 3) $("#adminMobileSaleReview").innerHTML = `<h3>Confira antes de registrar</h3><article><span>Cliente</span><b>${escapeHtml($("#adminSaleClientName").value || "—")}</b></article><article><span>Responsável</span><b>${escapeHtml($("#adminSaleResponsible").value || "—")}</b></article><article><span>Plano</span><b>${escapeHtml($("#adminSalePlan").selectedOptions[0]?.textContent || "—")}</b></article><article><span>Mensalidade</span><b>${escapeHtml($("#adminSaleTotalValue").value || "—")}</b></article><article><span>Próximo vencimento</span><b>${escapeHtml($("#adminSaleNextDue").value ? formatDate($("#adminSaleNextDue").value) : "—")}</b></article>`;
  }

  function updateAdminSaleCalculation() {
    const plan = getPlanDefinition($("#adminSalePlan")?.value), extras = Math.max(0, Number($("#adminSaleExtras")?.value) || 0), paymentDate = $("#adminSalePaymentDate")?.value, dueMode = $("#adminSaleDueMode")?.value || "30days", fixedDay = $("#adminSaleFixedDay")?.value;
    const isFree=plan.id==="free",extrasField=$("#adminSaleExtras"),paymentStatus=$("#adminSalePaymentStatus");if(extrasField){extrasField.disabled=isFree;if(isFree)extrasField.value="0"}if(paymentStatus){paymentStatus.disabled=isFree;if(isFree)paymentStatus.value="paid"}
    if ($("#adminSaleBaseValue")) $("#adminSaleBaseValue").value = formatCurrency(plan.price);
    if ($("#adminSaleExtraValue")) $("#adminSaleExtraValue").value = formatCurrency(isFree?0:extras*ADMIN_EXTRA_ACCESS_PRICE);
    if ($("#adminSaleTotalValue")) $("#adminSaleTotalValue").value = formatCurrency(calculateSubscriptionTotal(plan.id,isFree?0:extras));
    if ($("#adminSaleFixedDayField")) $("#adminSaleFixedDayField").hidden = dueMode !== "fixed";
    if ($("#adminSaleNextDue")) $("#adminSaleNextDue").value = paymentDate ? calculateNextDueDate(paymentDate, dueMode, fixedDay) : "";
  }

  async function registerAdminSale(event) {
    event.preventDefault(); if (!event.currentTarget.reportValidity()) return;
    const form = event.currentTarget, submit = event.submitter, planId = $("#adminSalePlan").value, dueMode = $("#adminSaleDueMode").value, fixedDay = Number($("#adminSaleFixedDay").value);
    const payload = { organizationName: $("#adminSaleClientName").value.trim(), responsibleName: $("#adminSaleResponsible").value.trim(), documentNumber: $("#adminSaleDocument").value.trim()||null, email: $("#adminSaleEmail").value.trim(), phone: $("#adminSaleWhatsapp").value.trim(), organizationType: $("#adminSaleType").value === "individual" ? "individual" : "brokerage", planCode: ({ free:"free",team: "equipe", broker10: "corretora10", broker16: "corretora16", broker20: "corretora20" })[planId] || "individual", extraAccesses: planId==="free"?0:Math.max(0, Number($("#adminSaleExtras").value) || 0), legacy: $("#adminSaleLegacy").value === "Sim", saleDate: $("#adminSaleDate").value, firstPaymentDate: $("#adminSalePaymentDate").value, firstPaymentStatus: planId==="free"?"paid":$("#adminSalePaymentStatus").value, dueMode: dueMode === "fixed" ? "fixed_day" : "thirty_days", fixedDueDay: dueMode === "fixed" ? fixedDay : null, generateAccess:true, accessRole:$("#adminSaleType").value==="individual"?"broker":"supervisor" };
    if (submit) submit.disabled = true;
    $("#adminSaleStatus").textContent = "Registrando venda no staging...";
    try {
      const result = await window.LungoAdminApi.createSubscription(payload, adminMasterKey);
      await loadAdminRemoteData(); renderAdminV2(); form.reset(); prepareAdminSaleForm();
      const emailSent=result?.emailDelivery?.sent===true;$("#adminSaleStatus").textContent=emailSent?"Venda, acesso e e-mail registrados com sucesso.":"Venda e acesso registrados; o e-mail não pôde ser enviado.";$("#adminSaleStatus").classList.toggle("ok",emailSent);toast(emailSent?"Acesso criado e enviado por e-mail.":"Acesso criado, mas o e-mail falhou.");
      const token=result?.token||result?.plainToken||result?.plain_token;if(token){setAdminMasterView("tokens");openAdminFormModal("Token criado",emailSent?"Acesso enviado automaticamente por e-mail":"E-mail não enviado; copie o token abaixo",`<section class="admin-modal-history full"><div class="auth-status ${emailSent?'ok':'error'}">${emailSent?'E-mail enviado para o cliente.':'Não foi possível enviar o e-mail. O acesso continua válido.'}</div><code>${escapeHtml(token)}</code><button class="btn primary" type="button" data-copy-new-token="${escapeHtml(token)}">Copiar token</button></section>`)}
    } catch (error) { $("#adminSaleStatus").textContent = error.message; $("#adminSaleStatus").classList.remove("ok"); }
    finally { if (submit?.isConnected) submit.disabled = false; }
  }

  function openCalendarDay(date) {
    const entries = adminData.receivables.filter((item) => item.dueDate === date);
    openAdminFormModal("Vencimentos do dia", formatDate(date), `<section class="admin-calendar-detail full">${entries.map((item) => { const client = adminClient(item.clientId); return `<article><div><b>${escapeHtml(client.name)}</b><span>${getPlanDefinition(client.planId).name} · ${formatCurrency(item.expected)} · ${adminPaymentLabel(item.status)}</span></div><div><button class="tiny-btn" data-receivable-action="pay" data-id="${item.id}">Confirmar pagamento</button><button class="tiny-btn" data-receivable-action="pending" data-id="${item.id}">Registrar pendência</button><button class="tiny-btn" data-admin-client-view="${client.id}">Ver assinatura</button></div></article>`; }).join("") || "<p>Nenhum vencimento neste dia.</p>"}</section>`);
  }

  async function handleAdminClientAction(button) {
    const client = adminClient(button.dataset.id), action = button.dataset.adminClientAction; if (!client) return;
    if (action === "view") openAdminClientModal(client);
    if (action === "edit") openAdminClientNameEdit(client);
    if (action === "pay") { const item = adminData.receivables.find((entry) => entry.clientId === client.id && entry.status !== "paid"); if (item) openPaymentModal(item); else toast("Não há lançamento pendente para esta conta."); }
    if (action === "pending") toast("Registre a pendência no lançamento financeiro correspondente.");
    if (action === "suspend" || action === "reactivate") { try { await window.LungoAdminApi.changeOrganizationStatus(client.id, action, adminMasterKey); await loadAdminRemoteData(); renderAdminV2(); toast(action === "suspend" ? "Conta suspensa." : "Conta reativada."); } catch (error) { toast(error.message); } }
    if (action === "plan") openPlanModal(client);
    if (action === "tokens") { setAdminMasterView("tokens"); toast(`Acessos de ${client.name} disponíveis na tabela.`); }
    if (action === "remove") {
      if (!await popupConfirm(`Excluir o cliente ${client.name}? A ação irá excluir permanentemente e não poderá ser desfeita.`, "Excluir cliente", "Excluir")) return;
      try { await window.LungoAdminApi.changeOrganizationStatus(client.id, "cancel", adminMasterKey); await loadAdminRemoteData(); renderAdminV2(); toast("Cliente excluído das áreas ativas."); }
      catch (error) { toast(error.message); }
    }
  }

  async function handleTokenAction(button) {
    const access = adminData.accesses.find((item) => item.id === button.dataset.id); if (!access) return; const client = adminClient(access.clientId), action = button.dataset.tokenAction;
    if (action === "copy") {
      await copyAdminMasterText(access.token, "Token copiado para a área de transferência.", button);
      return;
    }
    if (action === "email") {
      button.disabled=true;try{await window.LungoAdminApi.resendAccessEmail(access.id,adminMasterKey);openAdminFormModal("E-mail enviado!",`O acesso de ${access.user} foi entregue com sucesso.`,`<section class="admin-email-success full"><span aria-hidden="true">✓</span><h3>Envio concluído</h3><p>O token de acesso foi enviado para <b>${escapeHtml(access.raw?.email)}</b>.</p></section>`)}catch(error){toast(error.message)}finally{if(button.isConnected)button.disabled=false}return;
    }
    if (action === "edit") {
      openAdminFormModal("Editar acesso", access.user, `<form id="adminEditAccessForm" class="admin-modal-form full" data-id="${access.id}"><label>Nome do usuário<input id="adminEditAccessName" value="${escapeHtml(access.user)}" required></label><label>Perfil<select id="adminEditAccessRole"><option value="broker" ${access.profile === 'Corretor' ? 'selected' : ''}>Corretor</option><option value="supervisor" ${access.profile === 'Supervisor' ? 'selected' : ''}>Supervisor</option><option value="admin_master" ${access.profile === 'Admin Master' ? 'selected' : ''}>Admin Master</option></select></label><button class="btn primary" type="submit">Salvar alterações</button></form>`);
      return;
    }
    if (action === "archive") {
      if (!await popupConfirm(`Arquivar o acesso de ${access.user}? O token será revogado, a vaga e o e-mail serão liberados para um novo cadastro.`, 'Arquivar acesso', 'Arquivar')) return;
      try { await window.LungoAdminApi.archiveAccess(access.id, adminMasterKey); await loadAdminRemoteData(); renderAdminV2(); toast('Acesso arquivado; vaga e e-mail liberados.'); }
      catch (error) { toast(error.message); }
      return;
    }
    try {
      let result;
      if (action === "renew" || action === "validate") result = await window.LungoAdminApi.renewAccess(access.id, {}, adminMasterKey);
      if (action === "invalidate") result = await window.LungoAdminApi.invalidateAccess(access.id, adminMasterKey);
      if (action === "block" || action === "reactivate") result = await window.LungoAdminApi.changeAccess(access.id, action, adminMasterKey);
      if (action === "delete") return toast("Exclusão não é permitida; bloqueie ou invalide o acesso.");
      const token = result?.token || result?.plainToken || result?.plain_token || result?.accessToken;
      await loadAdminRemoteData(); renderAdminV2();
      if (token) { openAdminFormModal("Novo token", access.user, `<section class="admin-modal-history full"><div class="auth-status ok">✓ Salvo automaticamente no Admin Master</div><p>Você poderá consultar e copiar este token novamente em Acessos e tokens.</p><code>${escapeHtml(token)}</code><button class="btn primary" type="button" data-copy-new-token="${escapeHtml(token)}">Copiar token</button></section>`); }
      else toast("Acesso atualizado.");
    } catch (error) { toast(error.message); }
  }

  function generateAdminToken(selectedClientId = "") {
    openAdminFormModal("Gerar token", "Novo acesso da assinatura", `<form id="adminGenerateTokenForm" class="admin-modal-form full"><label>Cliente<select id="adminTokenClient">${adminData.clients.map((client) => `<option value="${client.id}" ${String(client.id) === String(selectedClientId) ? "selected" : ""}>${escapeHtml(client.name)} — ${client.activeAccesses}/${adminPlanCapacity(client)}</option>`).join("")}</select></label><label>Usuário<input id="adminTokenUser" required></label><label>E-mail<input id="adminTokenEmail" type="email" required></label><label>Telefone<input id="adminTokenPhone" required></label><label>Perfil<select id="adminTokenProfile"><option value="broker">Corretor</option><option value="supervisor">Supervisor</option><option value="admin_master">Admin Master</option></select></label><label>Validade<input id="adminTokenExpiry" type="datetime-local"></label><button class="btn primary" type="submit">Gerar token</button></form>`);
  }

  async function submitAdminToken(event) {
    event.preventDefault(); const submit = event.currentTarget.querySelector('button[type="submit"]'); if (submit) submit.disabled = true;
    try { const client = adminClient($("#adminTokenClient").value); if (client && client.activeAccesses >= adminPlanCapacity(client)) { showAccessLimitModal(); return; } const result = await window.LungoAdminApi.createAccess({ organizationId: $("#adminTokenClient").value, name: $("#adminTokenUser").value.trim(), email: $("#adminTokenEmail").value.trim(), phone: $("#adminTokenPhone").value.trim(), role: $("#adminTokenProfile").value, expiresAt: $("#adminTokenExpiry").value || null }, adminMasterKey); const token = result?.token || result?.plainToken || result?.plain_token || result?.accessToken || result?.access?.token; await loadAdminRemoteData(); renderAdminV2(); if (token) { $("#adminMasterModalTitle").textContent = "Token criado e salvo"; $("#adminMasterModalBody").innerHTML = `<section class="admin-modal-history full"><div class="auth-status ok">✓ Salvo automaticamente no Admin Master</div><p>Não é necessário clicar em Salvar. O token permanecerá disponível na tabela Acessos e tokens.</p><code>${escapeHtml(token)}</code><button class="btn primary" type="button" data-copy-new-token="${escapeHtml(token)}">Copiar token</button></section>`; toast("Acesso criado e token salvo."); } else { $("#adminMasterModal").close(); toast("Acesso criado."); } } catch (error) { toast(error.message); if (isAccessLimitError(error)) showAccessLimitModal(); } finally { if (submit?.isConnected) submit.disabled = false; }
  }

  async function submitAdminAccessEdit(event) {
    event.preventDefault();
    const form = event.target, access = adminData.accesses.find((item) => item.id === form.dataset.id);
    if (!access) return;
    const submit = form.querySelector('button[type="submit"]'); if (submit) submit.disabled = true;
    try { await window.LungoAdminApi.updateAccess(access.id, { name: $('#adminEditAccessName').value.trim(), role: $('#adminEditAccessRole').value }, adminMasterKey); await loadAdminRemoteData(); renderAdminV2(); $('#adminMasterModal')?.close(); toast('Acesso atualizado.'); }
    catch (error) { toast(error.message); }
    finally { if (submit?.isConnected) submit.disabled = false; }
  }

  function bindAdminMasterEvents() {
    $("#adminMasterLoginForm")?.addEventListener("submit", loginAdminMaster);
    $("#adminMasterLogoutBtn")?.addEventListener("click", logoutAdminMaster);
    $("#adminMasterSidebarToggle")?.addEventListener("click", () => {
      const screen = $("#adminMasterScreen");
      const collapsed = !screen.classList.contains("sidebar-collapsed");
      screen.classList.toggle("sidebar-collapsed", collapsed);
      localStorage.setItem(ADMIN_MASTER_SIDEBAR_KEY, collapsed ? "1" : "0");
    });
    $("#adminMasterMoreBtn")?.addEventListener("click", () => {
      ensureAdminMobileMoreSheet();
      const screen = $("#adminMasterScreen"), open = !screen?.classList.contains("mobile-more-open");
      screen?.classList.toggle("mobile-more-open", open);
      if ($("#adminMobileMoreSheet")) $("#adminMobileMoreSheet").hidden = !open;
      $("#adminMasterMoreBtn")?.setAttribute("aria-expanded", String(open));
    });
    $("#adminMasterThemeBtn")?.addEventListener("click", () => {
      const next = el.root.dataset.theme === "dark" ? "light" : "dark";
      el.root.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
    });
    $$(".admin-master-nav-item").forEach((button) => button.addEventListener("click", () => setAdminMasterView(button.dataset.adminMasterView)));
    $('#adminTrainingForm')?.addEventListener('submit', saveAdminTraining);
    $('#adminTrainingCancel')?.addEventListener('click', resetAdminTrainingForm);
    $('#adminTrainingList')?.parentElement?.addEventListener('click', (event) => { if (event.target.closest('#adminTrainingNew')) { resetAdminTrainingForm(); $('#adminTrainingForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => $('#adminTrainingTitle')?.focus(), 250); } });
    $('#adminTrainingRefresh')?.addEventListener('click', loadAdminTrainings);
    $('#adminTrainingList')?.addEventListener('click', adminTrainingAction);
    $('#adminLeadCreditBtn')?.addEventListener('click', () => openAdminLeadCredit());
    $('#adminLeadNewBtn')?.addEventListener('click', () => { openAdminNewLead(); addLivesFieldToAdminLeadForm(); });
    $('#adminLeadSettingsBtn')?.addEventListener('click', openAdminLeadSettings);
    $$('.lead-admin-tabs [data-lead-admin-tab]').forEach((button) => button.addEventListener('click', () => { leadMarketplaceAdminTab = button.dataset.leadAdminTab; renderAdminLeadMarketplace(); }));
    $('#adminLeadMarketContent')?.addEventListener('click', async (event) => { const credit = event.target.closest('[data-admin-lead-credit-user]'); if (credit) return openAdminLeadCredit(credit.dataset.adminLeadCreditUser); const statement = event.target.closest('[data-admin-lead-statement]'); if (statement) return openAdminLeadStatement(statement.dataset.adminLeadStatement); const status = event.target.closest('[data-admin-lead-status]'); if (!status) return; try { await window.LungoAdminApi.updateMarketplaceLead(status.dataset.id, { status: status.dataset.adminLeadStatus }, adminMasterKey); await loadAdminLeadMarketplace(); toast('Status do lead atualizado.'); } catch (error) { toast(error.message); } });
    $("#adminAccessIndividualTab")?.addEventListener("click", () => setAdminMasterAccessType("individual"));
    $("#adminAccessSupervisorTab")?.addEventListener("click", () => setAdminMasterAccessType("supervisor"));
    $("#adminMasterAccessForm")?.addEventListener("submit", generateAdminMasterAccess);
    $("#adminCopyAccessBtn")?.addEventListener("click", () => adminMasterGeneratedMessage && copyAdminMasterText(adminMasterGeneratedMessage));
    $("#adminMasterSettingsForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const settings = { platformName: $("#adminPlatformName").value.trim(), brokerDomain: $("#adminBrokerDomain").value.trim(), adminDomain: $("#adminMasterDomain").value.trim(), commercialWhatsapp: $("#adminCommercialWhatsapp").value.trim(), dueWarningDays: Number($("#adminDueWarningDays").value), defaultMessage: $("#adminDefaultMessage").value.trim(), chargeText: $("#adminChargeText").value.trim(), internalNotice: $("#adminInternalNotice").value.trim() };
      localStorage.setItem(ADMIN_MASTER_SETTINGS_KEY, JSON.stringify(settings));
      $("#adminSettingsStatus").textContent = "Configurações salvas localmente.";
      $("#adminSettingsStatus").classList.add("ok");
    });
    $("#adminNewSaleForm")?.addEventListener("submit", registerAdminSale);
    [$("#adminSalePlan"), $("#adminSaleExtras"), $("#adminSalePaymentDate"), $("#adminSaleDueMode"), $("#adminSaleFixedDay")].forEach((field) => field?.addEventListener("input", updateAdminSaleCalculation));
    [$("#adminTrendMetric"), $("#adminTrendRange")].forEach((field)=>field?.addEventListener("change",renderAdminSalesTrend));
    $("#adminCancelSale")?.addEventListener("click", () => { $("#adminNewSaleForm").reset(); prepareAdminSaleForm(); });
    $("#adminCalendarPrev")?.addEventListener("click", () => { adminCalendarDate.setMonth(adminCalendarDate.getMonth() - 1); renderFinancialCalendar(); });
    $("#adminCalendarNext")?.addEventListener("click", () => { adminCalendarDate.setMonth(adminCalendarDate.getMonth() + 1); renderFinancialCalendar(); });
    $("#adminCalendarToday")?.addEventListener("click", () => { adminCalendarDate = new Date(); renderFinancialCalendar(); });
    [$("#adminReceivablePeriod"), $("#adminReceivableStatus"), $("#adminReceivablePlan")].forEach((field) => field?.addEventListener("change", renderReceivables));
    $("#adminReceivableClient")?.addEventListener("input", renderReceivables);
    $("#adminGenerateTokenBtn")?.addEventListener("click", generateAdminToken);
    $("#adminMasterScreen")?.addEventListener("click", async (event) => {
      if (event.target === $("#adminMasterScreen") && $("#adminMasterScreen").classList.contains("mobile-more-open")) { closeAdminMobileMore(); return; }
      const copyNewToken = event.target.closest("[data-copy-new-token]");
      if (copyNewToken) { await copyAdminMasterText(copyNewToken.dataset.copyNewToken, "Token copiado para a área de transferência.", copyNewToken); return; }
      const clientView = event.target.closest("[data-admin-client-view]");
      if (clientView) { openAdminClientModal(adminClient(clientView.dataset.adminClientView)); return; }
      const clientAction = event.target.closest("[data-admin-client-action]");
      if (clientAction) { handleAdminClientAction(clientAction); return; }
      const mobileClientCard = event.target.closest("[data-mobile-client-card]");
      if (mobileClientCard && window.matchMedia("(max-width: 600px)").matches) { openAdminClientModal(adminClient(mobileClientCard.dataset.mobileClientCard)); return; }
      const tokenAction = event.target.closest("[data-token-action]");
      if (tokenAction) { handleTokenAction(tokenAction); return; }
      const receivableAction = event.target.closest("[data-receivable-action]");
      if (receivableAction) {
        const item = adminData.receivables.find((entry) => entry.id === receivableAction.dataset.id), action = receivableAction.dataset.receivableAction;
        if (!item) return;
        if (action === "pay") openPaymentModal(item);
        if (action === "edit-date") openPaymentDateModal(item);
        if (action === "history") openAdminClientModal(adminClient(item.clientId));
        return;
      }
      const calendarDay = event.target.closest("[data-calendar-date]");
      if (calendarDay) { openCalendarDay(calendarDay.dataset.calendarDate); return; }
      const actionButton = event.target.closest("[data-admin-master-action]");
      if (actionButton) {
        event.stopPropagation();
        const account = ADMIN_MASTER_ACCOUNTS.find((item) => item.id === actionButton.dataset.adminMasterId);
        if (!account) return;
        const action = actionButton.dataset.adminMasterAction;
        if (action === "view") openAdminMasterModal(account);
        if (action === "edit") toast(`Edição visual de ${account.name}.`);
        if (action === "copy") copyAdminMasterText(`${account.type}: ${account.login}\nCredencial provisória: ${account.credential}`, "Acesso copiado.");
        if (action === "disable" || action === "reactivate") { account.status = action === "disable" ? "inactive" : "active"; renderAdminMaster(); toast(`${account.name} ${action === "disable" ? "desativado" : "reativado"} visualmente.`); }
        if (action === "remove") { const index = ADMIN_MASTER_ACCOUNTS.indexOf(account); ADMIN_MASTER_ACCOUNTS.splice(index, 1); renderAdminMaster(); toast(`${account.name} removido visualmente.`); }
        return;
      }
      const row = event.target.closest("[data-admin-master-open]");
      if (row) openAdminMasterModal(ADMIN_MASTER_ACCOUNTS.find((item) => item.id === row.dataset.adminMasterOpen));
      const plan = event.target.closest("[data-admin-master-plan]");
      if (plan) toast(`Edição visual do plano ${ADMIN_MASTER_PLANS[Number(plan.dataset.adminMasterPlan)]?.name}.`);
      const finance = event.target.closest("[data-admin-master-finance]");
      if (finance) toast("Detalhe financeiro mock aberto visualmente.");
    });
    $("#adminMasterModalBody")?.addEventListener("submit", (event) => { if (event.target.id === "adminPaymentForm") confirmAdminPayment(event); if (event.target.id === "adminPaymentDateForm") updateAdminPaymentDate(event); if (event.target.id === "adminPlanChangeForm") savePlanChange(event); if (event.target.id === "adminGenerateTokenForm") submitAdminToken(event); if (event.target.id === "adminEditAccessForm") submitAdminAccessEdit(event); if (event.target.id === "adminClientNameEditForm") submitAdminClientNameEdit(event); });
    $("#adminMasterModalBody")?.addEventListener("input", (event) => { if (["adminNewPlan", "adminNewPlanExtras"].includes(event.target.id)) updatePlanChangePreview(adminClient($("#adminPlanChangeForm")?.dataset.id)); });
    $("#adminMasterModalBody")?.addEventListener("click", (event) => {
      const clientView = event.target.closest("[data-admin-client-view]"); if (clientView) { openAdminClientModal(adminClient(clientView.dataset.adminClientView)); return; }
      const button = event.target.closest("[data-receivable-action]"); if (!button) return; const item = adminData.receivables.find((entry) => entry.id === button.dataset.id); if (!item) return;
      if (button.dataset.receivableAction === "pay") openPaymentModal(item);
      if (button.dataset.receivableAction === "pending") { item.status = "pending"; adminClient(item.clientId).financialStatus = "pending"; saveAdminData(); renderAdminV2(); $("#adminMasterModal").close(); toast("Pendência registrada."); }
    });
    [$("#adminMasterModalClose"), $("#adminMasterModalFooterClose")].forEach((button) => button?.addEventListener("click", () => $("#adminMasterModal")?.close()));
    window.addEventListener("hashchange", syncAdminMasterHash);
  }

  function bindEvents() {
    if ($('#publicApplicationForm')) { $('#publicApplicationForm').noValidate = true; $('#publicApplicationForm').addEventListener('submit', submitPublicApplication); }
    document.addEventListener('click', (event) => { const play = event.target.closest('[data-training-play]'); if (play) openTrainingPlayer(play); });
    el.navItems.forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.view)));
    el.sidebarToggleBtn?.addEventListener("click", () => {
      const collapsed = !el.appShell.classList.contains("sidebar-collapsed");
      el.appShell.classList.toggle("sidebar-collapsed", collapsed);
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    });
    el.themeBtn.addEventListener("click", () => {
      const current = el.root.dataset.theme || localStorage.getItem(THEME_KEY) || "dark";
      const next = current === "dark" ? "light" : "dark";
      el.root.dataset.theme = next;
      if (state.token && !document.body.classList.contains("supervisor-mode")) {
        const preferences = loadBrokerPersonalization(); preferences.theme = next;
        try { localStorage.setItem(brokerPreferenceKey(), JSON.stringify(preferences)); } catch {}
        if (el.brokerThemeSelect) el.brokerThemeSelect.value = next;
      }
    });
    el.brokerProfilePhotoButton?.addEventListener("click", () => el.brokerProfilePhotoInput?.click());
    el.brokerProfilePhotoInput?.addEventListener("change", () => {
      const file = el.brokerProfilePhotoInput.files?.[0];
      if (!file || !String(file.type).startsWith("image/")) return toast("Selecione uma imagem válida.");
      if (file.size > 8000000) return toast("Use uma foto de até 8 MB.");
      const reader = new FileReader(); reader.onload = () => openBrokerPhotoEditor(String(reader.result || "")); reader.readAsDataURL(file);
    });
    $("#brokerPhotoZoom")?.addEventListener("input", (event) => { brokerPhotoCrop.zoom = Number(event.target.value) || 1; drawBrokerPhotoCrop(); });
    const cropCanvas = $("#brokerPhotoCropCanvas");
    cropCanvas?.addEventListener("pointerdown", (event) => { brokerPhotoCrop.dragging = true; brokerPhotoCrop.lastX = event.clientX; brokerPhotoCrop.lastY = event.clientY; cropCanvas.setPointerCapture(event.pointerId); });
    cropCanvas?.addEventListener("pointermove", (event) => { if (!brokerPhotoCrop.dragging) return; const ratio = cropCanvas.width / Math.max(1, cropCanvas.getBoundingClientRect().width); brokerPhotoCrop.offsetX += (event.clientX - brokerPhotoCrop.lastX) * ratio; brokerPhotoCrop.offsetY += (event.clientY - brokerPhotoCrop.lastY) * ratio; brokerPhotoCrop.lastX = event.clientX; brokerPhotoCrop.lastY = event.clientY; drawBrokerPhotoCrop(); });
    ["pointerup", "pointercancel"].forEach((name) => cropCanvas?.addEventListener(name, () => { brokerPhotoCrop.dragging = false; }));
    [$("#brokerPhotoEditorClose"), $("#brokerPhotoEditorCancel")].forEach((button) => button?.addEventListener("click", () => $("#brokerPhotoEditorModal")?.close()));
    $("#brokerPhotoEditorApply")?.addEventListener("click", applyBrokerPhotoCrop);
    el.brokerSidebarColor?.addEventListener("input", () => applyCompanySidebarColor(el.brokerSidebarColor.value));
    el.brokerThemeSelect?.addEventListener("change", () => { el.root.dataset.theme = el.brokerThemeSelect.value; });
    el.brokerBackgroundPicker?.addEventListener("change", (event) => { if (event.target.matches('input[name="brokerBackground"]')) applyCompanyBackground(event.target.value); });
    el.brokerPersonalizationForm?.addEventListener("submit", saveBrokerPersonalization);
    el.toggleTokenBtn?.addEventListener("click", () => {
      el.globalToken.type = el.globalToken.type === "password" ? "text" : "password";
    });
    $("#connectTokenEye")?.addEventListener("click", () => { const input = el.tokenInput; if (!input) return; input.type = input.type === "password" ? "text" : "password"; $("#connectTokenEye").classList.toggle("revealed", input.type === "text"); });

    el.saveTokenBtn.addEventListener("click", () => enterWithToken({ fromTopbar: true }));
    el.accessLoginBtn?.addEventListener("click", () => enterWithToken());
    el.accessTokenInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") enterWithToken();
    });
    el.contactLungoTeamPlanBtn?.addEventListener("click", () => {
      const message = encodeURIComponent("Olá! Uso o sistema Lungo como corretor e gostaria de solicitar o upgrade para o Plano Gestão de Equipes. Pode me passar mais informações?");
      window.open(`https://wa.me/5555992102864?text=${message}`, "_blank", "noopener,noreferrer");
    });
    el.corretorTabBtn?.addEventListener("click", () => setAuthRole("corretor"));
    el.supervisorTabBtn?.addEventListener("click", () => setAuthRole("supervisor"));
    el.supervisorLoginBtn?.addEventListener("click", supervisorLogin);
    [el.supervisorEmailInput].forEach((input) => {
      input?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") supervisorLogin();
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
    el.companySidebarColor?.addEventListener("input", () => applyCompanySidebarColor(el.companySidebarColor.value));
    el.companyBackgroundPicker?.addEventListener("change", (event) => {
      if (event.target.matches('input[name="companyBackground"]')) applyCompanyBackground(event.target.value);
    });
    el.companyBannerInput?.addEventListener("change", () => readCompanyImage(el.companyBannerInput.files?.[0], "banner"));
    el.companySettingsForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const identity = saveCompanyIdentity();
      if (!identity) return;
      renderSupervisorGoalsAndReport();
      try {
        const logo = await compactRecruitmentLogo(identity.logo || '');
        const result = await window.LungoSupervisorApi.updateVacancy({ companyName: identity.name, logo }, supervisorAccessToken);
        recruitmentData.vacancy = result.vacancy;
      } catch (error) { toast(`Identidade salva, mas a landing page não foi atualizada: ${error.message}`); }
    });
    el.supervisorGenerateMessageBtn?.addEventListener("click", generateSupervisorAccessMessage);
    el.supervisorCopyMessageBtn?.addEventListener("click", copySupervisorMessage);
    $("#supervisorOpenAccessModalBtn")?.addEventListener("click", () => {
      if (SUPERVISOR_BROKERS.length >= supervisorBrokerCapacity()) { showAccessLimitModal(); return; }
      if (el.supervisorGeneratedMessage) el.supervisorGeneratedMessage.hidden = true;
      if (el.supervisorAccessStatus) { el.supervisorAccessStatus.textContent = "Preencha os dados para gerar o acesso."; el.supervisorAccessStatus.classList.remove("error", "ok"); }
      $("#supervisorAccessModal")?.showModal();
    });
    $('#accessLimitModalClose')?.addEventListener('click', () => $('#accessLimitModal')?.close());
    $('#accessLimitModalCancel')?.addEventListener('click', () => $('#accessLimitModal')?.close());
    $('#supervisorBrokerEditForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const id = $('#supervisorEditBrokerId')?.value;
      const name = $('#supervisorEditBrokerName')?.value.trim();
      const email = $('#supervisorEditBrokerEmail')?.value.trim();
      const phone = $('#supervisorEditBrokerPhone')?.value.trim();
      if (!id || !name || !email) return;
      const submit = event.currentTarget.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      try { await window.LungoSupervisorApi.updateBroker(id, { name, email, phone: phone || null }, supervisorAccessToken); await loadSupervisorRemoteData(); renderSupervisorMocks(); $('#supervisorBrokerEditModal')?.close(); toast('Dados do corretor atualizados.'); }
      catch (error) { toast(error.message); }
      finally { if (submit?.isConnected) submit.disabled = false; }
    });
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
    const openGoalModal = () => {
      const modal = $('#supervisorGoalModal');
      const input = $('#supervisorTeamGoalInput');
      if (!modal || !input) return;
      input.value = supervisorTeamGoal() || '';
      const split = Number(input.value || 0) / Math.max(1, SUPERVISOR_BROKERS.length);
      if ($('#supervisorGoalModalSplit')) $('#supervisorGoalModalSplit').textContent = `${formatCurrency(split)} por corretor`;
      modal.showModal();
      input.focus();
    };
    $('#supervisorOpenGoalModalBtn')?.addEventListener('click', openGoalModal);
    $('[data-open-goal-modal]')?.addEventListener('click', openGoalModal);
    $('#supervisorGoalModalClose')?.addEventListener('click', () => $('#supervisorGoalModal')?.close());
    $('#supervisorGoalModalCancel')?.addEventListener('click', () => $('#supervisorGoalModal')?.close());
    $('#supervisorTeamGoalInput')?.addEventListener('input', (event) => {
      const split = Math.max(0, Number(event.target.value || 0)) / Math.max(1, SUPERVISOR_BROKERS.length);
      if ($('#supervisorGoalModalSplit')) $('#supervisorGoalModalSplit').textContent = `${formatCurrency(split)} por corretor`;
    });
    $('#supervisorTeamGoalForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const value = Math.max(0, Number($('#supervisorTeamGoalInput')?.value || 0));
      try { await window.LungoSupervisorApi.updateTeamGoal(value, supervisorAccessToken); localStorage.setItem(supervisorTeamGoalKey(), String(value)); renderSupervisorMocks(); $('#supervisorTeamGoalStatus').textContent = 'Meta da equipe salva e compartilhada.'; $('#supervisorTeamGoalStatus').classList.add('ok'); setTimeout(() => $('#supervisorGoalModal')?.close(), 350); }
      catch (error) { $('#supervisorTeamGoalStatus').textContent = error.message; $('#supervisorTeamGoalStatus').classList.add('error'); }
    });
    el.supervisorGenerateReportBtn?.addEventListener("click", () => {
      renderSupervisorGoalsAndReport();
      el.supervisorReportStatus.textContent = "Relatório atualizado com sucesso.";
      el.supervisorReportStatus.classList.add("ok");
    });
    el.supervisorSendMessageBtn?.addEventListener("click", sendSupervisorMessage);
    $('#rhVacancyForm')?.addEventListener('submit', saveRecruitmentVacancy);
    $('#rhVacancyForm')?.addEventListener('input', () => { rhFormDirty = true; });
    $('#rhRefreshBtn')?.addEventListener('click', () => loadRecruitment(false));
    $('#rhCopyLinkBtn')?.addEventListener('click', async () => { const link = recruitmentLink(); if (!link) return toast('Salve a vaga primeiro.'); await navigator.clipboard.writeText(link); toast('Link público da vaga copiado.'); });
    $('#rhCandidateKanban')?.addEventListener('change', async (event) => { const select = event.target.closest('[data-rh-stage]'); if (!select) return; try { await updateRecruitmentStage(select.dataset.rhStage, select.value); } catch (error) { toast(error.message); } });
    $('#rhCandidateKanban')?.addEventListener('click', (event) => { const button = event.target.closest('[data-rh-details]'); if (!button) return; const candidate = recruitmentData.candidates.find((item) => item.id === button.dataset.rhDetails); if (!candidate) return; openSupervisorModal(candidate.name, 'Candidato à vaga', [['WhatsApp', candidate.phone], ['E-mail', candidate.email || '—'], ['Cidade', candidate.city || '—'], ['Experiência', candidate.experience || '—'], ['Currículo', candidate.resumeUrl || '—'], ['Apresentação', candidate.message || '—']]); });
    $('#rhCandidateKanban')?.addEventListener('click', async (event) => {
      const hire = event.target.closest('[data-rh-hire]'); const remove = event.target.closest('[data-rh-delete]');
      if (hire) { const candidate = recruitmentData.candidates.find((item) => item.id === hire.dataset.rhHire); if (!candidate || !await popupConfirm(`${candidate.name} ficará na aba Corretores aguardando a geração do token. Continuar?`, 'Cadastrar novo corretor')) return; await window.LungoSupervisorApi.updateCandidate(candidate.id, { hirePending: true, seen: true }, supervisorAccessToken); await loadRecruitment(false, true); renderSupervisorMocks(); setSupervisorView('brokers'); toast('Candidato enviado para a aba Corretores.'); }
      if (remove) { const candidate = recruitmentData.candidates.find((item) => item.id === remove.dataset.rhDelete); if (!candidate || !await popupConfirm(`Excluir o card de ${candidate.name}? A ação irá excluir permanentemente e não poderá ser desfeita.`, 'Excluir candidato', 'Excluir')) return; try { await window.LungoSupervisorApi.deleteCandidate(candidate.id, supervisorAccessToken); await loadRecruitment(false, true); toast('Candidato excluído.'); } catch (error) { toast(error.message); } }
    });
    $('#rhCandidateKanban')?.addEventListener('dragstart', (event) => { const card = event.target.closest('[data-rh-candidate]'); if (!card) return; event.dataTransfer.setData('text/rh-candidate', card.dataset.rhCandidate); event.dataTransfer.effectAllowed = 'move'; });
    $('#rhCandidateKanban')?.addEventListener('dragover', (event) => { const lane = event.target.closest('[data-rh-lane]'); if (!lane) return; event.preventDefault(); lane.classList.add('drag-over'); });
    $('#rhCandidateKanban')?.addEventListener('dragleave', (event) => event.target.closest('[data-rh-lane]')?.classList.remove('drag-over'));
    $('#rhCandidateKanban')?.addEventListener('drop', async (event) => { const lane = event.target.closest('[data-rh-lane]'); if (!lane) return; event.preventDefault(); lane.classList.remove('drag-over'); const id = event.dataTransfer.getData('text/rh-candidate'); if (!id) return; try { await updateRecruitmentStage(id, lane.dataset.rhLane); } catch (error) { toast(error.message); } });
    el.supervisorImportBtn?.addEventListener("click", () => el.supervisorImportFile?.click());
    el.supervisorImportFile?.addEventListener("change", () => importSupervisorClients(el.supervisorImportFile.files?.[0]));
    el.supervisorExportBtn?.addEventListener("click", exportSupervisorClients);
    el.supervisorArchiveBtn?.addEventListener("click", () => {
      if (!supervisorSelectedClientIds.size) { toast("Selecione ao menos um cliente."); return; }
      toast(`${supervisorSelectedClientIds.size} cliente(s) arquivado(s) visualmente.`);
      supervisorSelectedClientIds.clear();
      renderSupervisorCustomers();
    });
    [el.supervisorModalCloseBtn, el.supervisorModalFooterCloseBtn].forEach((button) => button?.addEventListener("click", () => el.supervisorDetailModal?.close()));
    el.supervisorScreen?.addEventListener("click", async (event) => {
      const dealButton = event.target.closest("[data-supervisor-deal]");
      if (dealButton) {
        const deal = SUPERVISOR_DEALS.find((item) => item.id === dealButton.dataset.supervisorDeal);
        const stageLabels = { novos: "Novos", em_atendimento: "Em atendimento", cotacao: "Cotação Enviada", documentacao: "Documentação recebida", venda: "Venda cadastrada", boleto: "Boleto Gerado", fechamento: "Fechamento", perdida: "Venda Perdida" };
        if (deal) openSupervisorModal(deal.client, "Ficha completa do lead", [["Nome", deal.client], ["Telefone", deal.phone || "—"], ["E-mail", deal.email || "—"], ["CNPJ ou PF", deal.personType || "PF"], ["Número CNPJ/CPF", deal.document || "—"], ["Qtd. de vidas", String(deal.lives || 1)], ["Valor do negócio", deal.value || "—"], ["Produto de interesse", deal.product || "—"], ["Cidade", deal.city || "—"], ["Vendedor responsável", deal.seller], ["Etapa atual", stageLabels[deal.stage] || deal.stage], ["Observações", deal.notes || "Sem observações."]]);
        return;
      }
      const brokerButton = event.target.closest("[data-supervisor-broker-action]");
      const candidateTokenButton = event.target.closest('[data-rh-generate-token]');
      if (candidateTokenButton) {
        const candidate = recruitmentData.candidates.find((item) => item.id === candidateTokenButton.dataset.rhGenerateToken); if (!candidate) return;
        try { const result = await window.LungoSupervisorApi.createBroker({ name: candidate.name, email: candidate.email || `${candidate.phone}@candidato.lungo`, phone: candidate.phone || null, expiresAt: null }, supervisorAccessToken); await window.LungoSupervisorApi.updateCandidate(candidate.id, { hiredUserId: result.broker?.id || result.user?.id || '', hirePending: false, seen: true }, supervisorAccessToken); await loadSupervisorRemoteData(); await loadRecruitment(false, true); renderSupervisorMocks(); if (result.token) { el.supervisorGeneratedMessage.hidden = false; el.supervisorGeneratedMessage.querySelector('p').textContent = supervisorAccessMessage(candidate.name, result.token); toast(result.emailDelivery?.sent ? 'Corretor cadastrado e acesso enviado por e-mail.' : 'Corretor cadastrado, mas o e-mail não pôde ser enviado.'); } }
        catch (error) { toast(error.message); }
        return;
      }
      if (brokerButton) {
        const broker = SUPERVISOR_BROKERS.find((item) => item.id === brokerButton.dataset.brokerId);
        if (!broker) return;
        const action = brokerButton.dataset.supervisorBrokerAction;
        if (action === "copy") { await copySupervisorText(broker.token, "Token copiado para a área de transferência."); return; }
        if (action === "email") {
          brokerButton.disabled = true;
          try { await window.LungoSupervisorApi.resendBrokerAccessEmail(broker.id, supervisorAccessToken); toast(`Token reenviado para ${broker.email}.`, "success"); }
          catch (error) { toast(error.message, "error"); }
          finally { if (brokerButton.isConnected) brokerButton.disabled = false; }
          return;
        }
        if (action === "edit") {
          $('#supervisorEditBrokerId').value = broker.id;
          $('#supervisorEditBrokerName').value = broker.name || '';
          $('#supervisorEditBrokerEmail').value = broker.email === '—' ? '' : broker.email || '';
          $('#supervisorEditBrokerPhone').value = broker.phone || '';
          $('#supervisorBrokerEditModal')?.showModal();
          return;
        }
        if (action === "archive") {
          if (!await popupConfirm(`Excluir o corretor ${broker.name}? A ação irá excluir permanentemente e não poderá ser desfeita.`, 'Excluir corretor', 'Excluir')) return;
          try { await window.LungoSupervisorApi.archiveBroker(broker.id, supervisorAccessToken); await loadSupervisorRemoteData(); renderSupervisorMocks(); toast('Corretor excluído e vaga liberada.'); }
          catch (error) { toast(error.message); }
          return;
        }
        try {
          let result;
          if (action === "renew") result = await window.LungoSupervisorApi.renewBrokerToken(broker.id, {}, supervisorAccessToken);
          if (action === "disable") result = await window.LungoSupervisorApi.changeBroker(broker.id, "block", supervisorAccessToken);
          if (action === "reactivate") result = await window.LungoSupervisorApi.changeBroker(broker.id, "reactivate", supervisorAccessToken);
          if (result?.token) { el.supervisorGeneratedMessage.hidden = false; el.supervisorGeneratedMessage.querySelector("p").textContent = supervisorAccessMessage(broker.name, result.token); setSupervisorView("brokers"); toast("Novo token gerado e salvo no painel do Supervisor."); }
          await loadSupervisorRemoteData(); renderSupervisorMocks();
        } catch (error) { toast(error.message); }
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
    el.configureAutoBtn.addEventListener("click", () => configureAuto(false));
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
    el.brokerRefreshReportBtn?.addEventListener("click", refreshBrokerReport);
    el.brokerPrintReportBtn?.addEventListener("click", () => window.print());
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
      if (button.dataset.action === "assign-team") openLeadAssignmentModal(getLead(id));
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
          const data = await api(`/api/clientes/${encodeURIComponent(button.dataset.clientId)}/base-sale/${encodeURIComponent(button.dataset.saleId)}/documentacao?token=${clientTokenQuery(button.dataset.clientId)}`);
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
    const isAdminMasterRoute = window.location.hash.toLowerCase() === "#admin";
    const publicVacancySlug = new URLSearchParams(window.location.search).get('vaga');
    let authSession = null;
    try { authSession = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null"); } catch {}
    const legacySupervisorToken = localStorage.getItem(SUPERVISOR_SESSION_KEY) || "";
    const legacyProfile = localStorage.getItem(ACTIVE_PROFILE_KEY) || (legacySupervisorToken ? "supervisor" : "broker");
    if (!authSession?.token && legacyProfile === "supervisor" && legacySupervisorToken) authSession = { role: "supervisor", token: legacySupervisorToken };
    const tabProfile = sessionStorage.getItem(TAB_PROFILE_KEY) || "";
    const hasBrokerSession = Boolean(localStorage.getItem(STORAGE_KEY));
    const activeProfile = tabProfile === "supervisor" && legacySupervisorToken ? "supervisor" : tabProfile === "broker" && hasBrokerSession ? "broker" : authSession?.role === "supervisor" && legacySupervisorToken ? "supervisor" : "broker";
    const savedSupervisorToken = activeProfile === "supervisor" ? legacySupervisorToken : "";
    const theme = localStorage.getItem(THEME_KEY) || "dark";
    el.root.dataset.theme = theme;
    el.appShell.classList.toggle("sidebar-collapsed", localStorage.getItem(SIDEBAR_KEY) === "1");
    const supervisorSidebarCollapsed = localStorage.getItem(SUPERVISOR_SIDEBAR_KEY) === "1";
    el.supervisorScreen?.classList.toggle("sidebar-collapsed", supervisorSidebarCollapsed);
    el.supervisorSidebarToggle?.setAttribute("aria-expanded", String(!supervisorSidebarCollapsed));
    el.supervisorSidebarToggle?.setAttribute("aria-label", supervisorSidebarCollapsed ? "Expandir menu" : "Recolher menu");
    if (el.supervisorSidebarToggle) el.supervisorSidebarToggle.title = supervisorSidebarCollapsed ? "Expandir menu" : "Recolher menu";
    const adminMasterScreen = $("#adminMasterScreen");
    adminMasterScreen?.classList.toggle("sidebar-collapsed", localStorage.getItem(ADMIN_MASTER_SIDEBAR_KEY) === "1");
    renderAdminMasterAccessFields();
    setAdminMasterAccessType("individual");
    loadAdminData();
    prepareAdminSaleForm();
    fillStatusOptions();
    bindMoneyField(el.leadValorNegocio);
    bindMoneyField(el.clientValorFechado);
    bindMoneyField(el.baseSaleValor);
    updateTodayLabel();
    setInterval(updateTodayLabel, 60000);
    hardenAutocomplete();
    bindBrazilPhoneMasks();
    renderCompanyIdentity();
    toggleCustomPeriodFields();
    toggleClientCustomPeriodFields();
    // Perfis usam sessões distintas. Se houver uma sessão de Supervisor,
    // não carregue um token legado de Corretor antes de restaurá-la.
    if (activeProfile === "supervisor" && savedSupervisorToken) renderAccess();
    else loadAccess();
    bindEvents();
    bindAdminMasterEvents();
    setMode("list");
    renderCrm();
    if (publicVacancySlug) loadPublicVacancy(publicVacancySlug);
    else if (!isAdminMasterRoute && activeProfile === "supervisor" && savedSupervisorToken) {
      setAuthRole("supervisor");
      supervisorLogin({ token: savedSupervisorToken, silent: true });
    } else if (!isAdminMasterRoute) bootAccess();
    if (!publicVacancySlug) syncAdminMasterHash();
  }

  init();
})();
