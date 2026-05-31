import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { DEFAULT_USERS } from "../data/constants";
import { generateSeedLeads, generateSeedAdvertisers } from "../data/seed";
import { generateId } from "../lib/utils";

const AppContext = createContext(null);

// Server mode: API calls via Cloudflare Functions
const IS_SERVER = true;

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "请求失败");
  return data;
}




// Convert numeric/string-numeric timestamp to ISO string. Returns null for falsy.
function normTime(v) {
  if (v === null || v === undefined || v === "") return null;
  // numeric strings like "1769820417000"
  if (typeof v === "string" && /^\d+$/.test(v)) {
    const n = Number(v);
    if (!isNaN(n)) return new Date(n).toISOString();
    return null;
  }
  if (typeof v === "number") return new Date(v).toISOString();
  // assume already ISO-like or date string
  const t = Date.parse(v);
  return isNaN(t) ? null : new Date(t).toISOString();
}

// ─── snake_case → camelCase adapters for data coming from API ───
function fromSnakeLead(r) {
  if (!r) return r;
  return {
    id: r.id,
    name: r.name,
    shopName: r.shop_name || "",
    contact: r.contact || "",
    phone: r.phone || "",
    industry: r.industry || "",
    clientType: r.client_type || "",
    source: r.source || "",
    tier: r.tier || "D",
    stage: r.stage || "待联系",
    status: r.status || "新开发",
    budgetRange: r.budget_range || "",
    dailyBudget: Number(r.daily_budget || 0),
    currentConsumption: Number(r.current_consumption || 0),
    assignedTo: r.assigned_to || "",
    remark: r.remark || "",
    riskLevel: r.risk_level || "中",
    lastContactAt: normTime(r.last_contact_at),
    nextContactAt: normTime(r.next_contact_at),
    createdAt: normTime(r.created_at),
  };
}
function fromSnakeFollowup(r) {
  if (!r) return r;
  return {
    id: r.id,
    leadId: r.lead_id,
    type: r.type,
    content: r.content || "",
    contactAt: normTime(r.contact_at),
    nextContactAt: normTime(r.next_contact_at),
    attachment: r.attachment || "",
    createdAt: normTime(r.created_at),
  };
}
function fromSnakeAdvertiser(r) {
  if (!r) return r;
  return {
    id: r.id,
    leadId: r.lead_id || "",
    name: r.name,
    shopName: r.shop_name || "",
    industry: r.industry || "",
    contact: r.contact || "",
    phone: r.phone || "",
    assignedTo: r.assigned_to || "",
    startDate: r.start_date || "",
    mainProduct: r.main_product || "",
    unitPrice: Number(r.unit_price || 0),
    rebate: Number(r.rebate || 0),
    riskLevel: r.risk_level || "低",
    metrics: r.metrics || [],
  };
}

export function AppProvider({ children }) {
  // Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("qc_users");
    if (saved) return JSON.parse(saved);
    if (IS_SERVER) return [];
    return DEFAULT_USERS;
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
    const saved = localStorage.getItem("qc_leads");
    if (saved) return JSON.parse(saved);
    if (IS_SERVER) return [];
    const salesNames = (JSON.parse(localStorage.getItem("qc_users")) || DEFAULT_USERS)
      .filter(u => u.role === "sales").map(u => u.name);
    return generateSeedLeads(salesNames);
  });

  const [advertisers, setAdvertisers] = useState(() => {
    const saved = localStorage.getItem("qc_advertisers");
    if (saved) return JSON.parse(saved);
    if (IS_SERVER) return [];
    const savedLeads = JSON.parse(localStorage.getItem("qc_leads"));
    const leadsArr = savedLeads || generateSeedLeads([]);
    return generateSeedAdvertisers(leadsArr);
  });

  const [followups, setFollowups] = useState(() => {
    const saved = localStorage.getItem("qc_followups");
    return saved ? JSON.parse(saved) : [];
  });

  // Loading state for server mode
  const [loading, setLoading] = useState(IS_SERVER);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("qc_currentUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

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
        setLeads((leadsRes.data || []).map(fromSnakeLead));
        setFollowups((followupsRes.data || []).map(fromSnakeFollowup));
        const advs = (advertisersRes.data || []).map(fromSnakeAdvertiser);
        // load metrics for each (lightweight, best-effort)
        try {
          const metricsArr = await Promise.all(advs.map(a => api(`/api/metrics/${a.id}`).catch(() => ({ data: [] }))));
          advs.forEach((a, i) => {
            a.metrics = (metricsArr[i].data || []).map(m => ({
              id: m.id,
              date: m.date,
              dailyConsumption: Number(m.daily_consumption || 0),
              cpm: Number(m.cpm || 0),
              ctr: Number(m.ctr || 0),
              cvr: Number(m.cvr || 0),
              roi: Number(m.roi || 0),
            }));
          });
        } catch {}
        setAdvertisers(advs);
      } catch (e) {
        console.error("Failed to load data from API:", e);
        // Fall back to localStorage data, or generate seed data
        const savedLeads = localStorage.getItem("qc_leads");
        if (savedLeads) {
          setLeads(JSON.parse(savedLeads).map(fromSnakeLead));
          const savedFollowups = localStorage.getItem("qc_followups");
          if (savedFollowups) setFollowups(JSON.parse(savedFollowups).map(fromSnakeFollowup));
          const savedAdvertisers = localStorage.getItem("qc_advertisers");
          if (savedAdvertisers) setAdvertisers(JSON.parse(savedAdvertisers).map(fromSnakeAdvertiser));
        } else {
          // First visit - generate seed data
          const salesNames = DEFAULT_USERS.filter(u => u.role === "sales").map(u => u.name);
          const seedLeads = generateSeedLeads(salesNames);
          const seedAdvs = generateSeedAdvertisers(seedLeads);
          setLeads(seedLeads);
          setAdvertisers(seedAdvs);
          setFollowups([]);
          localStorage.setItem("qc_leads", JSON.stringify(seedLeads));
          localStorage.setItem("qc_advertisers", JSON.stringify(seedAdvs));
          localStorage.setItem("qc_followups", "[]");
        }
        const savedUsers = localStorage.getItem("qc_users");
        if (savedUsers) setUsers(JSON.parse(savedUsers));
        else { setUsers(DEFAULT_USERS); localStorage.setItem("qc_users", JSON.stringify(DEFAULT_USERS)); }
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
        localStorage.setItem("qc_currentUser", JSON.stringify(res.user));
        // Load user's API key
        try {
          const keyRes = await api(`/api/apikey/${username}`);
          setApiKeys({ [username]: keyRes.apiKey || "" });
        } catch {}
        return true;
      } catch {
        // API login failed - fall back to local default users
        const localUsers = users.length > 0 ? users : DEFAULT_USERS;
        const u = localUsers.find(x => x.username === username && x.password === password);
        if (u) { setCurrentUser(u); localStorage.setItem("qc_currentUser", JSON.stringify(u)); return true; }
        return false;
      }
    }
    const u = users.find(x => x.username === username && x.password === password);
    if (u) { setCurrentUser(u); localStorage.setItem("qc_currentUser", JSON.stringify(u)); return true; }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    localStorage.removeItem("qc_currentUser");
    setCurrentUser(null);
  }, []);

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
      try { await api("/api/leads", { method: "POST", body: JSON.stringify(adapted) }); } catch (e) { console.error("addLead API error:", e); }
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
      try { await api(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify(adapted) }); } catch (e) { console.error("editLead API error:", e); }
    }
    setLeads(p => p.map(l => l.id === id ? { ...l, ...data } : l));
    // If assignedTo changed, sync to linked advertisers
    if (data.assignedTo !== undefined) {
      setAdvertisers(p => p.map(a => a.leadId === id ? { ...a, assignedTo: data.assignedTo } : a));
    }
  }, []);

  const deleteLead = useCallback(async (id) => {
    if (IS_SERVER) {
      try { await api(`/api/leads/${id}`, { method: "DELETE" }); } catch (e) { console.error("deleteLead API error:", e); }
    }
    setLeads(p => p.filter(l => l.id !== id));
    setFollowups(p => p.filter(f => f.leadId !== id));
    setAdvertisers(p => p.filter(a => a.leadId !== id));
  }, []);

  const assignLead = useCallback(async (leadId, salesName) => {
    if (IS_SERVER) {
      try { await api(`/api/leads/${leadId}`, { method: "PUT", body: JSON.stringify({ assigned_to: salesName }) }); } catch (e) { console.error("assignLead API error:", e); }
    }
    setLeads(p => p.map(l => l.id === leadId ? { ...l, assignedTo: salesName } : l));
    // Sync assignedTo to linked advertisers
    setAdvertisers(p => p.map(a => a.leadId === leadId ? { ...a, assignedTo: salesName } : a));
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
      try { await api("/api/followups", { method: "POST", body: JSON.stringify(adapted) }); } catch (e) { console.error("addFollowup API error:", e); }
      // Also sync lead's last_contact_at and next_contact_at to DB
      const leadUpdate = { last_contact_at: f.contactAt || newF.createdAt };
      if (f.nextContactAt) leadUpdate.next_contact_at = f.nextContactAt;
      try { await api(`/api/leads/${f.leadId}`, { method: "PUT", body: JSON.stringify(leadUpdate) }); } catch (e) { console.error("addFollowup lead sync error:", e); }
    }
    setFollowups(p => [newF, ...p]);
    // Always update lastContactAt; conditionally update nextContactAt
    setLeads(p => p.map(l => l.id === f.leadId ? {
      ...l, lastContactAt: f.contactAt || newF.createdAt,
      ...(f.nextContactAt ? { nextContactAt: f.nextContactAt } : {}),
    } : l));
    return newF;
  }, []);

  // Advertisers
  const addAdvertiser = useCallback(async (a) => {
    const newA = { ...a, id: generateId(), metrics: a.metrics || [] };
    if (IS_SERVER) {
      try {
        const adapted = {
          id: newA.id, lead_id: newA.leadId, name: newA.name, shop_name: newA.shopName,
          industry: newA.industry, contact: newA.contact, phone: newA.phone,
          assigned_to: newA.assignedTo, start_date: newA.startDate,
          main_product: newA.mainProduct, unit_price: newA.unitPrice,
          rebate: newA.rebate, risk_level: newA.riskLevel,
        };
        await api("/api/advertisers", { method: "POST", body: JSON.stringify(adapted) });
      } catch (e) { console.error("addAdvertiser API error:", e); }
    }
    setAdvertisers(p => [newA, ...p]);
    return newA;
  }, []);

  const editAdvertiser = useCallback(async (id, data) => {
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
        await api(`/api/advertisers/${id}`, { method: "PUT", body: JSON.stringify(adapted) });
      } catch (e) { console.error("editAdvertiser API error:", e); }
    }
    setAdvertisers(p => p.map(a => a.id === id ? { ...a, ...data } : a));
    // If assignedTo changed, sync back to linked lead
    if (data.assignedTo !== undefined && data.leadId) {
      setLeads(p => p.map(l => l.id === data.leadId ? { ...l, assignedTo: data.assignedTo } : l));
    }
  }, []);

  const deleteAdvertiser = useCallback(async (id) => {
    if (IS_SERVER) {
      try { await api(`/api/advertisers/${id}`, { method: "DELETE" }); } catch (e) { console.error("deleteAdvertiser API error:", e); }
    }
    setAdvertisers(p => p.filter(a => a.id !== id));
  }, []);

  const addMetric = useCallback(async (advertiserId, metric) => {
    const metricId = generateId();
    const newMetric = { id: metricId, ...metric };
    if (IS_SERVER) {
      try {
        const adapted = {
          id: metricId, advertiser_id: advertiserId, date: metric.date,
          daily_consumption: metric.dailyConsumption, cpm: metric.cpm,
          ctr: metric.ctr, cvr: metric.cvr, roi: metric.roi,
        };
        await api("/api/metrics", { method: "POST", body: JSON.stringify(adapted) });
      } catch (e) { console.error("addMetric API error:", e); }
    }
    setAdvertisers(p => p.map(a =>
      a.id === advertiserId ? { ...a, metrics: [newMetric, ...(a.metrics || [])] } : a
    ));
  }, []);

  const deleteMetric = useCallback(async (advertiserId, metricId) => {
    if (IS_SERVER) {
      try {
        await api(`/api/metrics/${metricId}`, { method: "DELETE" });
      } catch {}
    }
    setAdvertisers(p => p.map(a =>
      a.id === advertiserId ? { ...a, metrics: (a.metrics || []).filter(m => m.id !== metricId) } : a
    ));
  }, []);

  // Users
  const addUser = useCallback(async (user) => {
    const newUser = { ...user, id: generateId() };
    if (IS_SERVER) {
      try { await api("/api/users", { method: "POST", body: JSON.stringify(newUser) }); } catch (e) { console.error("addUser API error:", e); }
    }
    setUsers(p => [...p, newUser]);
    return newUser;
  }, []);

  const editUser = useCallback(async (id, data) => {
    if (IS_SERVER) {
      try { await api(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }); } catch (e) { console.error("editUser API error:", e); }
    }
    setUsers(p => p.map(u => u.id === id ? { ...u, ...data } : u));
  }, []);

  const deleteUser = useCallback(async (id) => {
    if (IS_SERVER) {
      try { await api(`/api/users/${id}`, { method: "DELETE" }); } catch (e) { console.error("deleteUser API error:", e); }
    }
    setUsers(p => p.filter(u => u.id !== id));
  }, []);

  // API Key
  const saveApiKey = useCallback(async (key) => {
    if (!currentUser) return;
    if (IS_SERVER) {
      try {
        await api("/api/apikey", {
          method: "POST",
          body: JSON.stringify({ username: currentUser.username, apiKey: key }),
        });
      } catch (e) { console.error("saveApiKey API error:", e); }
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
    advertisers, addAdvertiser, editAdvertiser, deleteAdvertiser, addMetric, deleteMetric,
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
