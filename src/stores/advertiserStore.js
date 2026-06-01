import { create } from "zustand";
import { generateId } from "../lib/utils";
import { loadFromStorage, saveToStorage } from "../services/persistService";
import * as adApi from "../api/advertisers";
import * as metricApi from "../api/metrics";
import { executeSync } from "../services/syncService";

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
      try {
        const { toSnakeAdvertiser } = await import("../api/adapters");
        await adApi.createAdvertiser(toSnakeAdvertiser(newA));
      } catch (e) { console.error("addAdvertiser API error:", e); }
    }
    set((state) => ({ advertisers: [newA, ...state.advertisers] }));
    return newA;
  },

  editAdvertiser: async (id, data) => {
    if (IS_SERVER) {
      try {
        const adapted = {};
        if (data.name !== undefined) adapted.name = data.name;
        if (data.shopName !== undefined) adapted.shop_name = data.shopName;
        if (data.industry !== undefined) adapted.industry = data.industry;
        if (data.contact !== undefined) adapted.contact = data.contact;
        if (data.phone !== undefined) adapted.phone = data.phone;
        if (data.leadId !== undefined) adapted.lead_id = data.leadId;
        if (data.assignedTo !== undefined) adapted.assigned_to = data.assignedTo;
        if (data.startDate !== undefined) adapted.start_date = data.startDate;
        if (data.mainProduct !== undefined) adapted.main_product = data.mainProduct;
        if (data.unitPrice !== undefined) adapted.unit_price = data.unitPrice;
        if (data.rebate !== undefined) adapted.rebate = data.rebate;
        if (data.riskLevel !== undefined) adapted.risk_level = data.riskLevel;
        if (data.status !== undefined) adapted.status = data.status;
        await adApi.updateAdvertiser(id, adapted);
      } catch (e) { console.error("editAdvertiser API error:", e); }
    }
    set((state) => ({ advertisers: state.advertisers.map((a) => (a.id === id ? { ...a, ...data } : a)) }));
    if (data.assignedTo !== undefined) {
      const currentAd = get().advertisers.find((a) => a.id === id);
      const leadId = data.leadId || currentAd?.leadId;
      if (leadId) {
        executeSync("advertiser", id, "assignedTo", data.assignedTo, { leadId });
      }
    }
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
