"use strict";
(function exposeLungoSupervisorApi() {
  const baseUrl = String(window.LUNGO_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");
  async function request(path, { method = "GET", token, body } = {}) {
    let response;
    try { response = await fetch(`${baseUrl}${path}`, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { "x-access-token": token } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }); }
    catch { throw new Error("Não foi possível conectar ao servidor."); }
    let data = null; try { data = await response.json(); } catch (_) {}
    if (!response.ok) { const error = new Error(data?.error || data?.message || "Não foi possível concluir a operação."); error.status = response.status; throw error; }
    return data;
  }
  const verify = (token) => request("/api/access/auth/verify", { method: "POST", token, body: {} });
  const getDashboard = (token) => request("/api/supervisor/dashboard", { token });
  const getBrokers = (token) => request("/api/supervisor/brokers", { token });
  const createBroker = (payload, token) => request("/api/supervisor/brokers", { method: "POST", token, body: payload });
  const updateBroker = (id, payload, token) => request(`/api/supervisor/brokers/${encodeURIComponent(id)}`, { method: "PATCH", token, body: payload });
  const changeBroker = (id, action, token) => request(`/api/supervisor/brokers/${encodeURIComponent(id)}/${action}`, { method: "POST", token, body: {} });
  const renewBrokerToken = (id, payload, token) => request(`/api/supervisor/brokers/${encodeURIComponent(id)}/token/renew`, { method: "POST", token, body: payload });
  const getClients = (token) => request("/api/supervisor/clients", { token });
  const getLeads = (token) => request("/api/supervisor/leads", { token });
  const getOperationalClients = (token) => request("/api/supervisor/operational-clients", { token });
  const getTrainings = (token) => request('/api/trainings', { token });
  const getTeamMessages = (token) => request('/api/supervisor/messages', { token });
  const sendTeamMessage = (payload, token) => request('/api/supervisor/messages', { method: 'POST', token, body: payload });
  const getBrokerMessages = (token, unread = false) => request(`/api/team/messages${unread ? '?unread=1' : ''}`, { token });
  const markBrokerMessageRead = (id, token) => request(`/api/team/messages/${encodeURIComponent(id)}/read`, { method: 'POST', token, body: {} });
  const getRecruitment = (token) => request('/api/supervisor/recruitment', { token });
  const updateVacancy = (payload, token) => request('/api/supervisor/recruitment/vacancy', { method: 'PATCH', token, body: payload });
  const updateCandidate = (id, payload, token) => request(`/api/supervisor/recruitment/candidates/${encodeURIComponent(id)}`, { method: 'PATCH', token, body: payload });
  const markCandidatesSeen = (token) => request('/api/supervisor/recruitment/candidates/seen', { method: 'POST', token, body: {} });
  window.LungoSupervisorApi = Object.freeze({ verify, getDashboard, getBrokers, createBroker, updateBroker, changeBroker, renewBrokerToken, getClients, getLeads, getOperationalClients, getTrainings, getTeamMessages, sendTeamMessage, getBrokerMessages, markBrokerMessageRead, getRecruitment, updateVacancy, updateCandidate, markCandidatesSeen });
})();
