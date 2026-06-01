import { create } from "zustand";
import { generateId } from "../lib/utils";
import { loadFromStorage, saveToStorage } from "../services/persistService";
import * as leadApi from "../api/leads";

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
      try { await leadApi.createLead(newLead); } catch (e) { console.error("addLead API error:", e); }
    }
    set((state) => ({ leads: [newLead, ...state.leads] }));
    return newLead;
  },

  editLead: async (id, data) => {
    if (IS_SERVER) {
      try { await leadApi.updateLead(id, data); } catch (e) { console.error("editLead API error:", e); }
    }
    set((state) => ({ leads: state.leads.map((l) => (l.id === id ? { ...l, ...data } : l)) }));
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
    return { leadId, assignedTo: salesName };
  },

  checkDuplicate: (name, phone, excludeId) => {
    return get().leads.some((l) => l.id !== excludeId && (l.phone === phone || l.name === name));
  },
}));

export default useLeadStore;
