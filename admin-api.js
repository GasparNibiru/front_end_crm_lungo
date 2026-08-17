"use strict";

(function exposeLungoAdminApi() {
  const baseUrl = String(window.LUNGO_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");

  async function request(path, { method = "GET", adminKey, body } = {}) {
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(adminKey ? { "x-admin-key": adminKey } : {})
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
      });
    } catch {
      const error = new Error("Não foi possível conectar ao servidor.");
      error.code = "NETWORK_ERROR";
      throw error;
    }

    let data = null;
    try { data = await response.json(); } catch (_) { /* Respostas vazias são aceitas. */ }
    if (!response.ok) {
      const messages = { 400: "Confira os dados informados e tente novamente.", 401: "Chave administrativa inválida ou expirada.", 404: "Registro não encontrado.", 409: "A operação conflita com os dados atuais.", 500: "O servidor encontrou um problema. Tente novamente em instantes." };
      const error = new Error(data?.message || data?.error || messages[response.status] || "Não foi possível concluir a operação.");
      error.status = response.status;
      error.details = data;
      throw error;
    }
    return data;
  }

  const verifyAdminKey = (adminKey) => request("/api/admin/auth/verify", { method: "POST", adminKey, body: {} });
  const getDashboard = (adminKey) => request("/api/admin/dashboard", { adminKey });
  const getOrganizations = (adminKey) => request("/api/admin/organizations", { adminKey });
  const getArchivedOrganizations = (adminKey) => request("/api/admin/organizations-archived", { adminKey });
  const createSubscription = (payload, adminKey) => request("/api/admin/subscriptions", { method: "POST", adminKey, body: payload });
  const updateOrganization = (id, payload, adminKey) => request(`/api/admin/organizations/${encodeURIComponent(id)}`, { method: "PATCH", adminKey, body: payload });
  const changeOrganizationStatus = (id, action, adminKey) => request(`/api/admin/organizations/${encodeURIComponent(id)}/${action}`, { method: "POST", adminKey, body: {} });
  const getSupervisors = (adminKey) => request("/api/admin/supervisors", { adminKey });
  const getAccesses = (adminKey) => request("/api/admin/accesses", { adminKey });
  const createAccess = (payload, adminKey) => request("/api/admin/accesses", { method: "POST", adminKey, body: payload });
  const updateAccess = (id, payload, adminKey) => request(`/api/admin/accesses/${encodeURIComponent(id)}`, { method: "PATCH", adminKey, body: payload });
  const archiveAccess = (id, adminKey) => request(`/api/admin/accesses/${encodeURIComponent(id)}`, { method: "DELETE", adminKey });
  const changeAccess = (id, action, adminKey, body = {}) => request(`/api/admin/accesses/${encodeURIComponent(id)}/${action}`, { method: "POST", adminKey, body });
  const renewAccess = (id, payload, adminKey) => request(`/api/admin/accesses/${encodeURIComponent(id)}/token/renew`, { method: "POST", adminKey, body: payload });
  const invalidateAccess = (id, adminKey) => request(`/api/admin/accesses/${encodeURIComponent(id)}/token/invalidate`, { method: "POST", adminKey, body: {} });
  const resendAccessEmail = (id, adminKey) => request(`/api/admin/accesses/${encodeURIComponent(id)}/email/send`, { method: "POST", adminKey, body: {} });
  const getFinancial = (adminKey) => request("/api/admin/financial", { adminKey });
  const getFinancialCalendar = (month, adminKey) => request(`/api/admin/financial/calendar?month=${encodeURIComponent(month)}`, { adminKey });
  const getPayment = (id, adminKey) => request(`/api/admin/payments/${encodeURIComponent(id)}`, { adminKey });
  const updatePayment = (id, payload, adminKey) => request(`/api/admin/payments/${encodeURIComponent(id)}`, { method: "PATCH", adminKey, body: payload });
  const confirmPayment = (id, payload, adminKey) => request(`/api/admin/payments/${encodeURIComponent(id)}/confirm`, { method: "POST", adminKey, body: payload });
  const getPaymentHistory = (organizationId, adminKey) => request(`/api/admin/organizations/${encodeURIComponent(organizationId)}/payment-history`, { adminKey });
  const getTrainings = (adminKey) => request('/api/admin/trainings', { adminKey });
  const createTraining = (payload, adminKey) => request('/api/admin/trainings', { method: 'POST', adminKey, body: payload });
  const updateTraining = (id, payload, adminKey) => request(`/api/admin/trainings/${encodeURIComponent(id)}`, { method: 'PATCH', adminKey, body: payload });
  const deleteTraining = (id, adminKey) => request(`/api/admin/trainings/${encodeURIComponent(id)}`, { method: 'DELETE', adminKey });
  const getLeadMarketplace = (adminKey) => request('/api/admin/lead-marketplace', { adminKey });
  const updateLeadMarketplaceSettings = (payload, adminKey) => request('/api/admin/lead-marketplace/settings', { method: 'PATCH', adminKey, body: payload });
  const adjustLeadCredits = (payload, adminKey) => request('/api/admin/lead-marketplace/credits', { method: 'POST', adminKey, body: payload });
  const createMarketplaceLead = (payload, adminKey) => request('/api/admin/lead-marketplace/leads', { method: 'POST', adminKey, body: payload });
  const updateMarketplaceLead = (id, payload, adminKey) => request(`/api/admin/lead-marketplace/leads/${encodeURIComponent(id)}`, { method: 'PATCH', adminKey, body: payload });

  window.LungoAdminApi = Object.freeze({ verifyAdminKey, getDashboard, getOrganizations, getArchivedOrganizations, createSubscription, updateOrganization, changeOrganizationStatus, getSupervisors, getAccesses, createAccess, updateAccess, archiveAccess, changeAccess, renewAccess, invalidateAccess, resendAccessEmail, getFinancial, getFinancialCalendar, getPayment, updatePayment, confirmPayment, getPaymentHistory, getTrainings, createTraining, updateTraining, deleteTraining, getLeadMarketplace, updateLeadMarketplaceSettings, adjustLeadCredits, createMarketplaceLead, updateMarketplaceLead });
})();
