import { create } from "zustand";
import { generateId } from "../lib/utils";
import { loadFromStorage, saveToStorage } from "../services/persistService";
import * as leadApi from "../api/leads";
import { toSnakeLead } from "../api/adapters";
import { executeSync } from "../services/syncService";

const IS_SERVER = true;

const useLeadStore = create((set, get) => ({
  leads: loadFromStorage("leads", []),
  loading: false,

  setLeads: (leads) => {
    set({ leads });
    if (!IS_SERVER) saveToStorage("leads", leads);
  },

  fetchLeads: async () => {
    if (!IS_SERVER) return null;
    set({ loading: true });
    try {
      const leads = await leadApi.fetchLeads();
      set({ leads, loading: false });
      return leads;
    } catch { set({ loading: false }); return null; }
  },

  addLead: async (lead) => {
    const newLead = { ...lead, id: generateId(), createdAt: new Date().toISOString() };
    if (IS_SERVER) {
      try {
        await leadApi.createLead(toSnakeLead(newLead));
      } catch (e) { console.error("addLead API error:", e); }
    }
    set((state) => ({ leads: [newLead, ...state.leads] }));
    return newLead;
  },

  editLead: async (id, data) => {
    if (IS_SERVER) {
      try {
        const adapted = {};
        if (data.name !== undefined) adapted.name = data.name;
        if (data.shopName !== undefined) adapted.shop_name = data.shopName;
        if (data.contact !== undefined) adapted.contact = data.contact;
        if (data.phone !== undefined) adapted.phone = data.phone;
        if (data.industry !== undefined) adapted.industry = data.industry;
        if (data.clientType !== undefined) adapted.client_type = data.clientType;
        if (data.source !== undefined) adapted.source = data.source;
        if (data.tier !== undefined) adapted.tier = data.tier;
        if (data.stage !== undefined) adapted.stage = data.stage;
        if (data.status !== undefined) adapted.status = data.status;
        if (data.budgetRange !== undefined) adapted.budget_range = data.budgetRange;
        if (data.dailyBudget !== undefined) adapted.daily_budget = data.dailyBudget === "" ? 0 : Number(data.dailyBudget);
        if (data.currentConsumption !== undefined) adapted.current_consumption = data.currentConsumption === "" ? 0 : Number(data.currentConsumption);
        if (data.assignedTo !== undefined) adapted.assigned_to = data.assignedTo;
        if (data.remark !== undefined) adapted.remark = data.remark;
        if (data.riskLevel !== undefined) adapted.risk_level = data.riskLevel;
        if (data.lastContactAt !== undefined) adapted.last_contact_at = data.lastContactAt;
        if (data.nextContactAt !== undefined) adapted.next_contact_at = data.nextContactAt;
        await leadApi.updateLead(id, adapted);
      } catch (e) { console.error("editLead API error:", e); }
    }
    set((state) => ({ leads: state.leads.map((l) => (l.id === id ? { ...l, ...data } : l)) }));
    if (data.assignedTo !== undefined) {
      executeSync("lead", id, "assignedTo", data.assignedTo);
    }
    return { ...data, id };
  },

  deleteLead: async (id) => {
    if (IS_SERVER) {
      try { await leadApi.deleteLead(id); } catch (e) { console.error("deleteLead API error:", e); }
    }
    set((state) => ({ leads: state.leads.filter((l) => l.id !== id) }));
    return id;
  },

  assignLead: async (leadId, salesName) => {
    if (IS_SERVER) {
      try { await leadApi.updateLead(leadId, { assigned_to: salesName }); } catch (e) { console.error("assignLead API error:", e); }
    }
    set((state) => ({ leads: state.leads.map((l) => (l.id === leadId ? { ...l, assignedTo: salesName } : l)) }));
    executeSync("lead", leadId, "assignedTo", salesName);
    return { leadId, assignedTo: salesName };
  },

  checkDuplicate: (name, phone, excludeId) => {
    return get().leads.some((l) => l.id !== excludeId && (l.phone === phone || l.name === name));
  },
}));

export default useLeadStore;
