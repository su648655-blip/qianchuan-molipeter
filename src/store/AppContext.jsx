import { createContext, useContext, useEffect, useMemo } from "react";
import useAuthStore from "../stores/authStore";
import useLeadStore from "../stores/leadStore";
import useAdvertiserStore from "../stores/advertiserStore";
import useFollowupStore from "../stores/followupStore";
import useUserStore from "../stores/userStore";
import { fromSnakeLead, fromSnakeAdvertiser } from "../api/adapters";
import { generateSeedLeads, generateSeedAdvertisers } from "../data/seed";
import { DEFAULT_USERS } from "../data/constants";

const AppContext = createContext(null);

const IS_SERVER = true;

export function AppProvider({ children }) {
  const auth = useAuthStore();
  const leadStore = useLeadStore();
  const adStore = useAdvertiserStore();
  const followStore = useFollowupStore();
  const userStore = useUserStore();

  // Data loading on mount (server mode)
  useEffect(() => {
    if (!IS_SERVER) return;
    let cancelled = false;
    async function loadAll() {
      try {
        const [usersData, leadsData, followupsData, adsData] = await Promise.all([
          userStore.fetchUsers(),
          leadStore.fetchLeads(),
          followStore.fetchFollowups(),
          adStore.fetchAdvertisers(),
        ]);
        if (cancelled) return;
        // If API returned null (error), fall back to localStorage
        if (!leadsData) {
          const saved = localStorage.getItem("qc_leads");
          if (saved) {
            
            leadStore.setLeads(JSON.parse(saved).map(fromSnakeLead));
          } else {
            const salesNames = DEFAULT_USERS.filter(u => u.role === "sales").map(u => u.name);
            const seedLeads = generateSeedLeads(salesNames);
            leadStore.setLeads(seedLeads);
            localStorage.setItem("qc_leads", JSON.stringify(seedLeads));
          }
        }
        if (!adsData) {
          const saved = localStorage.getItem("qc_advertisers");
          if (saved) {
            
            adStore.setAdvertisers(JSON.parse(saved).map(fromSnakeAdvertiser));
          } else {
            const savedLeads = JSON.parse(localStorage.getItem("qc_leads"));
            const seedAdvs = generateSeedAdvertisers(savedLeads || []);
            adStore.setAdvertisers(seedAdvs);
            localStorage.setItem("qc_advertisers", JSON.stringify(seedAdvs));
          }
        }
        if (!usersData) {
          const saved = localStorage.getItem("qc_users");
          if (saved) userStore.setUsers(JSON.parse(saved));
          else { userStore.setUsers(DEFAULT_USERS); localStorage.setItem("qc_users", JSON.stringify(DEFAULT_USERS)); }
        }
      } catch (e) {
        console.error("Failed to load data from API:", e);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Restore session
  useEffect(() => { auth.restoreSession(); }, []);

  const salesNames = useMemo(
    () => userStore.users.filter(u => u.role === "sales").map(u => u.name),
    [userStore.users]
  );

  const value = {
    currentUser: auth.currentUser,
    users: userStore.users,
    isAdmin: auth.isAdmin,
    loading: leadStore.loading || adStore.loading || followStore.loading,
    login: (username, password) => auth.login(username, password, userStore.users),
    logout: auth.logout,
    leads: leadStore.leads,
    addLead: leadStore.addLead,
    editLead: leadStore.editLead,
    deleteLead: leadStore.deleteLead,
    assignLead: leadStore.assignLead,
    checkDuplicate: leadStore.checkDuplicate,
    followups: followStore.followups,
    addFollowup: followStore.addFollowup,
    advertisers: adStore.advertisers,
    addAdvertiser: adStore.addAdvertiser,
    editAdvertiser: adStore.editAdvertiser,
    deleteAdvertiser: adStore.deleteAdvertiser,
    addMetric: adStore.addMetric,
    deleteMetric: adStore.deleteMetric,
    addUser: userStore.addUser,
    editUser: userStore.editUser,
    deleteUser: userStore.deleteUser,
    apiKey: auth.apiKey,
    editingKey: auth.editingKey,
    setEditingKey: auth.setEditingKey,
    saveApiKey: auth.setApiKey,
    salesNames,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be within AppProvider");
  return ctx;
}
