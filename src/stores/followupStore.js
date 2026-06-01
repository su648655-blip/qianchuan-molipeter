import { create } from "zustand";
import { generateId } from "../lib/utils";
import { loadFromStorage, saveToStorage } from "../services/persistService";
import * as followupApi from "../api/followups";
import * as leadApi from "../api/leads";
import useLeadStore from "../stores/leadStore";

const IS_SERVER = true;

const useFollowupStore = create((set) => ({
  followups: loadFromStorage("followups", []),
  loading: false,

  fetchFollowups: async () => {
    if (!IS_SERVER) return null;
    set({ loading: true });
    try {
      const followups = await followupApi.fetchFollowups();
      set({ followups, loading: false });
      return followups;
    } catch { set({ loading: false }); return null; }
  },

  addFollowup: async (f) => {
    const newF = { ...f, id: generateId(), createdAt: new Date().toISOString() };
    if (IS_SERVER) {
      try {
        await followupApi.createFollowup(newF);
        const leadUpdate = { last_contact_at: f.contactAt || newF.createdAt };
        if (f.nextContactAt) leadUpdate.next_contact_at = f.nextContactAt;
        try { await leadApi.updateLead(f.leadId, leadUpdate); } catch (e) { console.error("addFollowup lead sync error:", e); }
      } catch (e) { console.error("addFollowup API error:", e); }
    }
    set((state) => ({ followups: [newF, ...state.followups] }));
    // Sync lead's lastContactAt / nextContactAt in local state
    const leads = useLeadStore.getState().leads.map((l) =>
      l.id === f.leadId
        ? {
            ...l,
            lastContactAt: f.contactAt || newF.createdAt,
            ...(f.nextContactAt ? { nextContactAt: f.nextContactAt } : {}),
          }
        : l
    );
    useLeadStore.getState().setLeads(leads);
    return newF;
  },
}));

export default useFollowupStore;
