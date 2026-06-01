import { api } from "./client";
import { fromSnakeAdvertiser } from "./adapters";

export async function fetchAdvertisers() {
  const res = await api("/api/advertisers");
  return (res.data || []).map(fromSnakeAdvertiser);
}

export async function createAdvertiser(ad) {
  return api("/api/advertisers", { method: "POST", body: JSON.stringify(ad) });
}

export async function updateAdvertiser(id, data) {
  return api(`/api/advertisers/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteAdvertiser(id) {
  return api(`/api/advertisers/${id}`, { method: "DELETE" });
}
