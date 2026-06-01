import { create } from "zustand";
import { generateId } from "../lib/utils";
import { loadFromStorage, saveToStorage } from "../services/persistService";
import * as adApi from "../api/advertisers";
import * as metricApi from "../api/metrics";

const IS_SERVER = true;

const useAdvertiserStore = create((set, get) => ({
  advertisers: loadFromStorage("advertisers", []),
  loading: false,

  setAdvertisers: (ads) => {
    set({ advertisers: ads });
    if (!IS_SERVER) saveToStorage("advertisers", ads);
  },

  fetchAdvertisers: async () => {
    if (!IS_SERVER) return null;
    set({ loading: true });
    try {
      const advertisers = await adApi.fetchAdvertisers();
      for (const a of advertisers) {
        try { a.metrics = await metricApi.fetchMetrics(a.id); } catch { a.metrics = []; }
      }
      set({ advertisers, loading: false });
      return advertisers;
    } catch { set({ loading: false }); return null; }
  },

  addAdvertiser: async (a) => {
    const newA = { ...a, id: generateId(), metrics: a.metrics || [] };
    if (IS_SERVER) {
      try { await adApi.createAdvertiser(newA); } catch (e) { console.error("addAdvertiser API error:", e); }
    }
    set((state) => ({ advertisers: [newA, ...state.advertisers] }));
    return newA;
  },

  editAdvertiser: async (id, data) => {
    if (IS_SERVER) {
      try { await adApi.updateAdvertiser(id, data); } catch (e) { console.error("editAdvertiser API error:", e); }
    }
    set((state) => ({ advertisers: state.advertisers.map((a) => (a.id === id ? { ...a, ...data } : a)) }));
    return { ...data, id };
  },

  deleteAdvertiser: async (id) => {
    if (IS_SERVER) {
      try { await adApi.deleteAdvertiser(id); } catch (e) { console.error("deleteAdvertiser API error:", e); }
    }
    set((state) => ({ advertisers: state.advertisers.filter((a) => a.id !== id) }));
    return id;
  },

  addMetric: async (advertiserId, metric) => {
    const metricId = generateId();
    const newMetric = { id: metricId, ...metric };
    if (IS_SERVER) {
      try { await metricApi.createMetric({ ...metric, id: metricId, advertiserId }); } catch (e) { console.error("addMetric API error:", e); }
    }
    set((state) => ({
      advertisers: state.advertisers.map((a) =>
        a.id === advertiserId ? { ...a, metrics: [newMetric, ...(a.metrics || [])] } : a
      ),
    }));
  },

  deleteMetric: async (advertiserId, metricId) => {
    if (IS_SERVER) {
      try { await metricApi.deleteMetric(metricId); } catch {}
    }
    set((state) => ({
      advertisers: state.advertisers.map((a) =>
        a.id === advertiserId ? { ...a, metrics: (a.metrics || []).filter((m) => m.id !== metricId) } : a
      ),
    }));
  },
}));

export default useAdvertiserStore;
