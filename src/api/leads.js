import { api } from "./client";

export async function fetchLeads() {
  const res = await api("/api/leads");
  return res.data || [];
}

export async function createLead(lead) {
  return api("/api/leads", { method: "POST", body: JSON.stringify(lead) });
}

export async function updateLead(id, data) {
  return api(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteLead(id) {
  return api(`/api/leads/${id}`, { method: "DELETE" });
}
