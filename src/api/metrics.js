import { api } from "./client";

export async function fetchMetrics(advertiserId) {
  const res = await api(`/api/metrics/${advertiserId}`);
  return (res.data || []).map(m => ({
    id: m.id, date: m.date,
    dailyConsumption: Number(m.daily_consumption || 0),
    cpm: Number(m.cpm || 0), ctr: Number(m.ctr || 0),
    cvr: Number(m.cvr || 0), roi: Number(m.roi || 0),
  }));
}

export async function createMetric(metric) {
  return api("/api/metrics", { method: "POST", body: JSON.stringify(metric) });
}

export async function deleteMetric(id) {
  return api(`/api/metrics/${id}`, { method: "DELETE" });
}
