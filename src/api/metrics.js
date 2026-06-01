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
  const adapted = {
    id: metric.id,
    advertiser_id: metric.advertiserId,
    date: metric.date,
    daily_consumption: metric.dailyConsumption,
    cpm: metric.cpm,
    ctr: metric.ctr,
    cvr: metric.cvr,
    roi: metric.roi,
  };
  return api("/api/metrics", { method: "POST", body: JSON.stringify(adapted) });
}

export async function deleteMetric(id) {
  return api(`/api/metrics/${id}`, { method: "DELETE" });
}
