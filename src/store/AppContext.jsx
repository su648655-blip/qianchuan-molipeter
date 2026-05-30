import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { DEFAULT_USERS } from "../data/constants";
import { generateSeedLeads, generateSeedAdvertisers } from "../data/seed";
import { generateId } from "../lib/utils";

const AppContext = createContext(null);

// Whether we're running in server mode (VITE_SUPABASE_URL is set)
const IS_SERVER = !!import.meta.env.VITE_SUPABASE_URL;

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "请求失败");
  return data;
}

export function AppProvider({ children }) {
  // Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(() => {
    if (IS_SERVER) return [];
    const saved = localStorage.getItem("qc_users");
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  // API Keys (per-user map)
  const [apiKeys, setApiKeys] = useState(() => {
    if (IS_SERVER) return {};
    const saved = localStorage.getItem("qc_apikeys");
    return saved ? JSON.parse(saved) : {};
  });
  const [editingKey, setEditingKey] = useState(false);

  const apiKey = useMemo(() => {
    if (!currentUser) return "";
    return apiKeys[currentUser.username] || "";
  }, [apiKeys, currentUser]);

  // Data
  const [leads, setLeads] = useState(() => {
    if (IS_SERVER) return [];
    const saved = localStorage.getItem("qc_leads");
    if (saved) return JSON.parse(saved);
    const salesNames = (JSON.parse(localStorage.getItem("qc_users")) || DEFAULT_USERS)
      .filter(u => u.role === "sales").map(u => u.name);
    return generateSeedLeads(salesNames);
  });

  const [advertisers, setAdvertisers] = useState(() => {
    if (IS_SERVER) return [];
    const saved = localStorage.getItem("qc_advertisers");
    if (saved) return JSON.parse(saved);
    const savedLeads = JSON.parse(localStorage.getItem("qc_leads"));
    const leadsArr = savedLeads || generateSeedLeads([]);
    return generateSeedAdvertisers(leadsArr);
  });

  const [followups, setFollowups] = useState(() => {
    if (IS_SERVER) return [];
    const saved = localStorage.getItem("qc_followups");
    return saved ? JSON.parse(saved) : [];
  });

  // Loading state for server mode
  const [loading, setLoading] = useState(IS_SERVER);

  // ─── Server mode: load all data on mount ───────────────────
  useEffect(() => {
    if (!IS_SERVER) return;
    let cancelled = false;
    async function loadAll() {
      try {
        const [usersRes, leadsRes, followupsRes, advertisersRes] = await Promise.all([
          api("/api/users"),
          api("/api/leads"),
          api("/api/followups"),
          api("/api/advertisers"),
        ]);
        if (cancelled) return;
        setUsers(usersRes.data || []);
        setLeads(leadsRes.data || []);
        setFollowups(followupsRes.data || []);
        setAdvertisers(advertisersRes.data || []);
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Persist (local mode only)
  useEffect(() => {
    if (IS_SERVER) return;
    localStorage.setItem("qc_users", JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    if (IS_SERVER) return;
    localStorage.setItem("qc_leads", JSON.stringify(leads));
  }, [leads]);
  useEffect(() => {
    if (IS_SERVER) return;
    localStorage.setItem("qc_advertisers", JSON.stringify(advertisers));
  }, [advertisers]);
  useEffect(() => {
    if (IS_SERVER) return;
    localStorage.setItem("qc_followups", JSON.stringify(followups));
  }, [followups]);
  useEffect(() => {
    if (IS_SERVER) return;
    localStorage.setItem("qc_apikeys", JSON.stringify(apiKeys));
  }, [apiKeys]);

  const isAdmin = currentUser?.role === "admin";

  // Auth
  const login = useCallback(async (username, password) => {
    if (IS_SERVER) {
      try {
        const res = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        setCurrentUser(res.user);
        // Load user's API key
        try {
          const keyRes = await api(`/api/apikey/${username}`);
          setApiKeys({ [username]: keyRes.apiKey || "" });
        } catch {}
        return true;
      } catch {
        return false;
      }
    }
    const u = users.find(x => x.username === username && x.password === password);
    if (u) { setCurrentUser(u); return true; }
    return false;
  }, [users]);

  const logout = useCallback(() => setCurrentUser(null), []);

  // Leads
  const addLead = useCallback(async (lead) => {
    const newLead = { ...lead, id: generateId(), createdAt: new Date().toISOString() };
    const adapted = {
      id: newLead.id, name: newLead.name, shop_name: newLead.shopName, contact: newLead.contact,
      phone: newLead.phone, industry: newLead.industry, client_type: newLead.clientType,
      source: newLead.source, tier: newLead.tier, stage: newLead.stage, status: newLead.status,
      budget_range: newLead.budgetRange, daily_budget: newLead.dailyBudget,
      current_consumption: newLead.currentConsumption, assigned_to: newLead.assignedTo,
      remark: newLead.remark, risk_level: newLead.riskLevel, created_at: newLead.createdAt,
    };
    if (IS_SERVER) {
      await api("/api/leads", { method: "POST", body: JSON.stringify(adapted) });
    }
    setLeads(p => [newLead, ...p]);
    return newLead;
  }, []);

  const editLead = useCallback(async (id, data) => {
    if (IS_SERVER) {
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
      if (data.dailyBudget !== undefined) adapted.daily_budget = data.dailyBudget;
      if (data.currentConsumption !== undefined) adapted.current_consumption = data.currentConsumption;
      if (data.assignedTo !== undefined) adapted.assigned_to = data.assignedTo;
      if (data.remark !== undefined) adapted.remark = data.remark;
      if (data.riskLevel !== undefined) adapted.risk_level = data.riskLevel;
      if (data.lastContactAt !== undefined) adapted.last_contact_at = data.lastContactAt;
      if (data.nextContactAt !== undefined) adapted.next_contact_at = data.nextContactAt;
      await api(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify(adapted) });
    }
    setLeads(p => p.map(l => l.id === id ? { ...l, ...data } : l));
  }, []);

  const deleteLead = useCallback(async (id) => {
    if (IS_SERVER) {
      await api(`/api/leads/${id}`, { method: "DELETE" });
    }
    setLeads(p => p.filter(l => l.id !== id));
    setFollowups(p => p.filter(f => f.leadId !== id));
    setAdvertisers(p => p.filter(a => a.leadId !== id));
  }, []);

  const assignLead = useCallback(async (leadId, salesName) => {
    if (IS_SERVER) {
      await api(`/api/leads/${leadId}`, { method: "PUT", body: JSON.stringify({ assigned_to: salesName }) });
    }
    setLeads(p => p.map(l => l.id === leadId ? { ...l, assignedTo: salesName } : l));
  }, []);

  // Followups
  const addFollowup = useCallback(async (f) => {
    const newF = { ...f, id: generateId(), createdAt: new Date().toISOString() };
    if (IS_SERVER) {
      const adapted = {
        id: newF.id, lead_id: newF.leadId, type: newF.type, content: newF.content,
        contact_at: newF.contactAt, next_contact_at: newF.nextContactAt,
        attachment: newF.attachment, created_at: newF.createdAt,
      };
      await api("/api/followups", { method: "POST", body: JSON.stringify(adapted) });
    }
    setFollowups(p => [newF, ...p]);
    if (f.nextContactAt) {
      setLeads(p => p.map(l => l.id === f.leadId ? { ...l, lastContactAt: f.contactAt || newF.createdAt, nextContactAt: f.nextContactAt } : l));
    }
    return newF;
  }, []);

  // Advertisers
  const addAdvertiser = useCallback(async (a) => {
    const newA = { ...a, id: generateId(), metrics: a.metrics || [] };
    if (IS_SERVER) {
      const adapted = {
        id: newA.id, lead_id: newA.leadId, name: newA.name, shop_name: newA.shopName,
        industry: newA.industry, contact: newA.contact, phone: newA.phone,
        assigned_to: newA.assignedTo, start_date: newA.startDate,
        main_product: newA.mainProduct, unit_price: newA.unitPrice,
        rebate: newA.rebate, risk_level: newA.riskLevel,
      };
      await api("/api/advertisers", { method: "POST", body: JSON.stringify(adapted) });
    }
    setAdvertisers(p => [newA, ...p]);
    return newA;
  }, []);

  const editAdvertiser = useCallback(async (id, data) => {
    if (IS_SERVER) {
      const adapted = {};
      if (data.name !== undefined) adapted.name = data.name;
      if (data.shopName !== undefined) adapted.shop_name = data.shopName;
      if (data.industry !== undefined) adapted.industry = data.industry;
      if (data.contact !== undefined) adapted.contact = data.contact;
      if (data.phone !== undefined) adapted.phone = data.phone;
      if (data.assignedTo !== undefined) adapted.assigned_to = data.assignedTo;
      if (data.startDate !== undefined) adapted.start_date = data.startDate;
      if (data.mainProduct !== undefined) adapted.main_product = data.mainProduct;
      if (data.unitPrice !== undefined) adapted.unit_price = data.unitPrice;
      if (data.rebate !== undefined) adapted.rebate = data.rebate;
      if (data.riskLevel !== undefined) adapted.risk_level = data.riskLevel;
      await api(`/api/advertisers/${id}`, { method: "PUT", body: JSON.stringify(adapted) });
    }
    setAdvertisers(p => p.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAdvertiser = useCallback(async (id) => {
    if (IS_SERVER) {
      await api(`/api/advertisers/${id}`, { method: "DELETE" });
    }
    setAdvertisers(p => p.filter(a => a.id !== id));
  }, []);

  const addMetric = useCallback(async (advertiserId, metric) => {
    if (IS_SERVER) {
      const adapted = {
        id: generateId(), advertiser_id: advertiserId, date: metric.date,
        daily_consumption: metric.dailyConsumption, cpm: metric.cpm,
        ctr: metric.ctr, cvr: metric.cvr, roi: metric.roi,
      };
      await api("/api/metrics", { method: "POST", body: JSON.stringify(adapted) });
    }
    setAdvertisers(p => p.map(a =>
      a.id === advertiserId ? { ...a, metrics: [metric, ...(a.metrics || [])] } : a
    ));
  }, []);

  // Users
  const addUser = useCallback(async (user) => {
    const newUser = { ...user, id: generateId() };
    if (IS_SERVER) {
      await api("/api/users", { method: "POST", body: JSON.stringify(newUser) });
    }
    setUsers(p => [...p, newUser]);
    return newUser;
  }, []);

  const editUser = useCallback(async (id, data) => {
    if (IS_SERVER) {
      await api(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
    }
    setUsers(p => p.map(u => u.id === id ? { ...u, ...data } : u));
  }, []);

  const deleteUser = useCallback(async (id) => {
    if (IS_SERVER) {
      await api(`/api/users/${id}`, { method: "DELETE" });
    }
    setUsers(p => p.filter(u => u.id !== id));
  }, []);

  // API Key
  const saveApiKey = useCallback(async (key) => {
    if (!currentUser) return;
    if (IS_SERVER) {
      await api("/api/apikey", {
        method: "POST",
        body: JSON.stringify({ username: currentUser.username, apiKey: key }),
      });
    }
    setApiKeys(p => ({ ...p, [currentUser.username]: key }));
    setEditingKey(false);
  }, [currentUser]);

  const checkDuplicate = useCallback((name, phone, excludeId) => {
    return leads.some(l =>
      l.id !== excludeId && (l.phone === phone || l.name === name)
    );
  }, [leads]);

  const salesNames = users.filter(u => u.role === "sales").map(u => u.name);

  const value = {
    currentUser, users, isAdmin, loading,
    login, logout,
    leads, addLead, editLead, deleteLead, assignLead, checkDuplicate,
    followups, addFollowup,
    advertisers, addAdvertiser, editAdvertiser, deleteAdvertiser, addMetric,
    addUser, editUser, deleteUser,
    apiKey, editingKey, setEditingKey, saveApiKey,
    salesNames,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be within AppProvider");
  return ctx;
}
