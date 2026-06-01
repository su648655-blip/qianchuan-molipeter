# 千川CRM 架构重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 God Context（516 行 AppContext.jsx）拆分为独立 Store + API 层 + Service 层，实现单向数据流和自动数据一致性同步。

**Architecture:** 分层架构：API 层（统一 fetch + 数据转换）→ Store 层（Zustand 拆分 5 个独立 Store）→ Service 层（声明式同步规则 + 校验）→ UI 层（不变）。分 4 个阶段渐进式迁移，每阶段可独立验证。

**Tech Stack:** Zustand（状态管理）、现有 React/Cloudflare Pages 不变

---

## 阶段 1：基础设施（API 层）

### Task 1.1: 安装 Zustand

**Files:**
- Modify: `package.json`

- [ ] **安装 zustand**

```bash
cd /Users/peter/Documents/千川CRM && npm install zustand
```

- [ ] **验证安装成功**

Run: `node -e "require('zustand'); console.log('ok')"`
Expected: `ok`

- [ ] **提交**

```bash
git add package.json package-lock.json
git commit -m "chore: install zustand for state management"
```

---

### Task 1.2: 创建统一 API 客户端

**Files:**
- Create: `src/api/client.js`

- [ ] **创建 src/api/client.js**

```js
const IS_SERVER = true;

export async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "请求失败");
  return data;
}
```

- [ ] **验证文件存在且语法正确**

Run: `node -e "require('./src/api/client.js')" 2>&1 | head -3`

- [ ] **提交**

```bash
git add src/api/client.js
git commit -m "feat: create unified API client"
```

---

### Task 1.3: 创建数据适配器

**Files:**
- Create: `src/api/adapters.js`

- [ ] **创建 src/api/adapters.js**

包含 `fromSnakeLead`, `fromSnakeFollowup`, `fromSnakeAdvertiser`, `normTime` 函数以及对应的 toSnake 转换函数。

```js
// Convert numeric/string-numeric timestamp to ISO string. Returns null for falsy.
export function normTime(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string" && /^\d+$/.test(v)) {
    const n = Number(v);
    if (!isNaN(n)) return new Date(n).toISOString();
    return null;
  }
  if (typeof v === "number") return new Date(v).toISOString();
  const t = Date.parse(v);
  return isNaN(t) ? null : new Date(t).toISOString();
}

export function fromSnakeLead(r) {
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

export function toSnakeLead(l) {
  return {
    id: l.id, name: l.name, shop_name: l.shopName, contact: l.contact,
    phone: l.phone, industry: l.industry, client_type: l.clientType,
    source: l.source, tier: l.tier, stage: l.stage, status: l.status,
    budget_range: l.budgetRange, daily_budget: l.dailyBudget,
    current_consumption: l.currentConsumption, assigned_to: l.assignedTo,
    remark: l.remark, risk_level: l.riskLevel, created_at: l.createdAt,
    last_contact_at: l.lastContactAt, next_contact_at: l.nextContactAt,
  };
}

export function fromSnakeFollowup(r) {
  if (!r) return r;
  return {
    id: r.id, leadId: r.lead_id, type: r.type, content: r.content || "",
    contactAt: normTime(r.contact_at), nextContactAt: normTime(r.next_contact_at),
    attachment: r.attachment || "", createdAt: normTime(r.created_at),
  };
}

export function toSnakeFollowup(f) {
  return {
    id: f.id, lead_id: f.leadId, type: f.type, content: f.content,
    contact_at: f.contactAt, next_contact_at: f.nextContactAt,
    attachment: f.attachment, created_at: f.createdAt,
  };
}

export function fromSnakeAdvertiser(r) {
  if (!r) return r;
  return {
    id: r.id, leadId: r.lead_id || "", name: r.name, shopName: r.shop_name || "",
    industry: r.industry || "", contact: r.contact || "", phone: r.phone || "",
    assignedTo: r.assigned_to || "", startDate: r.start_date || "",
    mainProduct: r.main_product || "", unitPrice: Number(r.unit_price || 0),
    rebate: Number(r.rebate || 0), riskLevel: r.risk_level || "低", metrics: r.metrics || [],
  };
}

export function toSnakeAdvertiser(a) {
  return {
    id: a.id, lead_id: a.leadId, name: a.name, shop_name: a.shopName,
    industry: a.industry, contact: a.contact, phone: a.phone,
    assigned_to: a.assignedTo, start_date: a.startDate,
    main_product: a.mainProduct, unit_price: a.unitPrice,
    rebate: a.rebate, risk_level: a.riskLevel,
  };
}
```

- [ ] **提交**

```bash
git add src/api/adapters.js
git commit -m "feat: create API data adapters (snake_case/camelCase)"
```

---

### Task 1.4: 创建各实体 API 模块

**Files:**
- Create: `src/api/leads.js`
- Create: `src/api/advertisers.js`
- Create: `src/api/followups.js`
- Create: `src/api/users.js`
- Create: `src/api/auth.js`
- Create: `src/api/metrics.js`

- [ ] **创建 src/api/leads.js**

```js
import { api } from "./client";
import { fromSnakeLead, toSnakeLead } from "./adapters";

export async function fetchLeads() {
  const res = await api("/api/leads");
  return (res.data || []).map(fromSnakeLead);
}

export async function createLead(lead) {
  const adapted = toSnakeLead(lead);
  return api("/api/leads", { method: "POST", body: JSON.stringify(adapted) });
}

export async function updateLead(id, data) {
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
  return api(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify(adapted) });
}

export async function deleteLead(id) {
  return api(`/api/leads/${id}`, { method: "DELETE" });
}
```

- [ ] **创建 src/api/advertisers.js**

```js
import { api } from "./client";
import { fromSnakeAdvertiser, toSnakeAdvertiser } from "./adapters";

export async function fetchAdvertisers() {
  const res = await api("/api/advertisers");
  return (res.data || []).map(fromSnakeAdvertiser);
}

export async function createAdvertiser(ad) {
  const adapted = toSnakeAdvertiser(ad);
  return api("/api/advertisers", { method: "POST", body: JSON.stringify(adapted) });
}

export async function updateAdvertiser(id, data) {
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
  return api(`/api/advertisers/${id}`, { method: "PUT", body: JSON.stringify(adapted) });
}

export async function deleteAdvertiser(id) {
  return api(`/api/advertisers/${id}`, { method: "DELETE" });
}
```

- [ ] **创建 src/api/followups.js**

```js
import { api } from "./client";
import { fromSnakeFollowup, toSnakeFollowup } from "./adapters";

export async function fetchFollowups() {
  const res = await api("/api/followups");
  return (res.data || []).map(fromSnakeFollowup);
}

export async function createFollowup(f) {
  const adapted = toSnakeFollowup(f);
  return api("/api/followups", { method: "POST", body: JSON.stringify(adapted) });
}
```

- [ ] **创建 src/api/users.js**

```js
import { api } from "./client";

export async function fetchUsers() {
  const res = await api("/api/users");
  return res.data || [];
}

export async function createUser(user) {
  return api("/api/users", { method: "POST", body: JSON.stringify(user) });
}

export async function updateUser(id, data) {
  return api(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteUser(id) {
  return api(`/api/users/${id}`, { method: "DELETE" });
}
```

- [ ] **创建 src/api/auth.js**

```js
import { api } from "./client";

export async function login(username, password) {
  const res = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return res.user;
}

export async function fetchApiKey(username) {
  const res = await api(`/api/apikey/${username}`);
  return res.apiKey || "";
}

export async function saveApiKey(username, key) {
  return api("/api/apikey", {
    method: "POST",
    body: JSON.stringify({ username, apiKey: key }),
  });
}
```

- [ ] **创建 src/api/metrics.js**

```js
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
    id: metric.id, advertiser_id: metric.advertiserId, date: metric.date,
    daily_consumption: metric.dailyConsumption, cpm: metric.cpm,
    ctr: metric.ctr, cvr: metric.cvr, roi: metric.roi,
  };
  return api("/api/metrics", { method: "POST", body: JSON.stringify(adapted) });
}

export async function deleteMetric(id) {
  return api(`/api/metrics/${id}`, { method: "DELETE" });
}
```

- [ ] **提交**

```bash
git add src/api/
git commit -m "feat: create API modules for all entities"
```

---

### Task 1.5: 验证阶段 1 构建通过

- [ ] **构建验证**

```bash
cd /Users/peter/Documents/千川CRM && npm run build 2>&1 | tail -10
```

Expected: `✓ built in ...` 无报错

---

## 阶段 2：拆分 Store（核心重构）

### Task 2.1: 创建持久化服务

**Files:**
- Create: `src/services/persistService.js`

- [ ] **创建 src/services/persistService.js**

```js
const PREFIX = "qc_";

export function loadFromStorage(key, fallback = null) {
  try {
    const saved = localStorage.getItem(PREFIX + key);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
}

export function saveToStorage(key, data) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(data)); } catch {}
}

export function removeFromStorage(key) {
  try { localStorage.removeItem(PREFIX + key); } catch {}
}
```

- [ ] **提交**

```bash
git add src/services/persistService.js
git commit -m "feat: create persist service"
```

---

### Task 2.2: 创建 Auth Store

**Files:**
- Create: `src/stores/authStore.js`

- [ ] **创建 src/stores/authStore.js**

```js
import { create } from "zustand";
import { loadFromStorage, saveToStorage, removeFromStorage } from "../services/persistService";
import * as authApi from "../api/auth";

const useAuthStore = create((set, get) => ({
  currentUser: loadFromStorage("currentUser", null),
  isAdmin: false,

  // Derived - computed when currentUser changes
  _deriveAdmin: (user) => user?.role === "admin",

  login: async (username, password) => {
    try {
      const user = await authApi.login(username, password);
      saveToStorage("currentUser", user);
      set({ currentUser: user, isAdmin: user?.role === "admin" });
      // Load API key
      try {
        const key = await authApi.fetchApiKey(username);
        useAuthStore.getState().setApiKey(key);
      } catch {}
      return true;
    } catch {
      // API login failed - return false, caller handles fallback
      return false;
    }
  },

  loginLocal: (user) => {
    saveToStorage("currentUser", user);
    set({ currentUser: user, isAdmin: user?.role === "admin" });
  },

  logout: () => {
    removeFromStorage("currentUser");
    set({ currentUser: null, isAdmin: false });
  },

  restoreSession: () => {
    const saved = loadFromStorage("currentUser", null);
    if (saved) {
      set({ currentUser: saved, isAdmin: saved?.role === "admin" });
    }
  },

  // API Key sub-state
  apiKey: "",
  editingKey: false,
  setEditingKey: (v) => set({ editingKey: v }),
  setApiKey: (key) => set({ apiKey: key }),
}));

export default useAuthStore;
```

- [ ] **提交**

```bash
git add src/stores/authStore.js
git commit -m "feat: create auth store"
```

---

### Task 2.3: 创建 Lead Store

**Files:**
- Create: `src/stores/leadStore.js`

- [ ] **创建 src/stores/leadStore.js**

```js
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
    if (!IS_SERVER) return;
    set({ loading: true });
    try {
      const leads = await leadApi.fetchLeads();
      set({ leads, loading: false });
      return leads;
    } catch {
      set({ loading: false });
      return null;
    }
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
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...data } : l)),
    }));
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
    set((state) => ({
      leads: state.leads.map((l) => (l.id === leadId ? { ...l, assignedTo: salesName } : l)),
    }));
    return { leadId, assignedTo: salesName };
  },

  checkDuplicate: (name, phone, excludeId) => {
    return get().leads.some(
      (l) => l.id !== excludeId && (l.phone === phone || l.name === name)
    );
  },
}));

export default useLeadStore;
```

- [ ] **提交**

```bash
git add src/stores/leadStore.js
git commit -m "feat: create lead store"
```

---

### Task 2.4: 创建 Advertiser Store

**Files:**
- Create: `src/stores/advertiserStore.js`

- [ ] **创建 src/stores/advertiserStore.js**

```js
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
    if (!IS_SERVER) return;
    set({ loading: true });
    try {
      const advertisers = await adApi.fetchAdvertisers();
      // Load metrics for each
      for (const a of advertisers) {
        try {
          a.metrics = await metricApi.fetchMetrics(a.id);
        } catch { a.metrics = []; }
      }
      set({ advertisers, loading: false });
      return advertisers;
    } catch {
      set({ loading: false });
      return null;
    }
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
    set((state) => ({
      advertisers: state.advertisers.map((a) => (a.id === id ? { ...a, ...data } : a)),
    }));
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
```

- [ ] **提交**

```bash
git add src/stores/advertiserStore.js
git commit -m "feat: create advertiser store"
```

---

### Task 2.5: 创建 Followup Store

**Files:**
- Create: `src/stores/followupStore.js`

- [ ] **创建 src/stores/followupStore.js**

```js
import { create } from "zustand";
import { generateId } from "../lib/utils";
import { loadFromStorage, saveToStorage } from "../services/persistService";
import * as followupApi from "../api/followups";

const IS_SERVER = true;

const useFollowupStore = create((set) => ({
  followups: loadFromStorage("followups", []),
  loading: false,

  fetchFollowups: async () => {
    if (!IS_SERVER) return;
    set({ loading: true });
    try {
      const followups = await followupApi.fetchFollowups();
      set({ followups, loading: false });
      return followups;
    } catch {
      set({ loading: false });
      return null;
    }
  },

  addFollowup: async (f) => {
    const newF = { ...f, id: generateId(), createdAt: new Date().toISOString() };
    if (IS_SERVER) {
      try {
        await followupApi.createFollowup(newF);
        // Also sync lead's last_contact_at and next_contact_at to DB
        const leadUpdate = { last_contact_at: f.contactAt || newF.createdAt };
        if (f.nextContactAt) leadUpdate.next_contact_at = f.nextContactAt;
        const { updateLead } = await import("../api/leads");
        try { await updateLead(f.leadId, leadUpdate); } catch (e) { console.error("addFollowup lead sync error:", e); }
      } catch (e) { console.error("addFollowup API error:", e); }
    }
    set((state) => ({ followups: [newF, ...state.followups] }));
    return newF;
  },
}));

export default useFollowupStore;
```

- [ ] **提交**

```bash
git add src/stores/followupStore.js
git commit -m "feat: create followup store"
```

---

### Task 2.6: 创建 User Store

**Files:**
- Create: `src/stores/userStore.js`

- [ ] **创建 src/stores/userStore.js**

```js
import { create } from "zustand";
import { generateId } from "../lib/utils";
import { loadFromStorage, saveToStorage } from "../services/persistService";
import * as userApi from "../api/users";
import { DEFAULT_USERS } from "../data/constants";

const IS_SERVER = true;

const useUserStore = create((set, get) => ({
  users: loadFromStorage("users", IS_SERVER ? [] : DEFAULT_USERS),

  setUsers: (users) => {
    set({ users });
    if (!IS_SERVER) saveToStorage("users", users);
  },

  fetchUsers: async () => {
    if (!IS_SERVER) return;
    try {
      const users = await userApi.fetchUsers();
      set({ users });
      return users;
    } catch { return null; }
  },

  addUser: async (user) => {
    const newUser = { ...user, id: generateId() };
    if (IS_SERVER) {
      try { await userApi.createUser(newUser); } catch (e) { console.error("addUser API error:", e); }
    }
    set((state) => ({ users: [...state.users, newUser] }));
    return newUser;
  },

  editUser: async (id, data) => {
    if (IS_SERVER) {
      try { await userApi.updateUser(id, data); } catch (e) { console.error("editUser API error:", e); }
    }
    set((state) => ({ users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)) }));
  },

  deleteUser: async (id) => {
    if (IS_SERVER) {
      try { await userApi.deleteUser(id); } catch (e) { console.error("deleteUser API error:", e); }
    }
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },

  getSalesNames: () => get().users.filter((u) => u.role === "sales").map((u) => u.name),
}));

export default useUserStore;
```

- [ ] **提交**

```bash
git add src/stores/userStore.js
git commit -m "feat: create user store"
```

---

### Task 2.7: 重构 AppContext 为组合层

**Files:**
- Modify: `src/store/AppContext.jsx`

- [ ] **重写 AppContext.jsx 为组合层**

AppContext 不再管理任何状态，而是组合各个 Store，保持与现有组件的接口兼容。

```jsx
import { createContext, useContext, useMemo } from "react";
import useAuthStore from "../stores/authStore";
import useLeadStore from "../stores/leadStore";
import useAdvertiserStore from "../stores/advertiserStore";
import useFollowupStore from "../stores/followupStore";
import useUserStore from "../stores/userStore";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const auth = useAuthStore();
  const leads = useLeadStore();
  const advertisers = useAdvertiserStore();
  const followups = useFollowupStore();
  const users = useUserStore();

  const salesNames = useMemo(() => users.users.filter(u => u.role === "sales").map(u => u.name), [users.users]);

  // When IS_SERVER, load data on mount
  // (handled by useEffect in each store's init if needed)

  const value = {
    currentUser: auth.currentUser,
    users: users.users,
    isAdmin: auth.isAdmin,
    loading: leads.loading || advertisers.loading || followups.loading,
    login: auth.login,
    logout: auth.logout,
    leads: leads.leads,
    addLead: leads.addLead,
    editLead: leads.editLead,
    deleteLead: leads.deleteLead,
    assignLead: leads.assignLead,
    checkDuplicate: leads.checkDuplicate,
    followups: followups.followups,
    addFollowup: followups.addFollowup,
    advertisers: advertisers.advertisers,
    addAdvertiser: advertisers.addAdvertiser,
    editAdvertiser: advertisers.editAdvertiser,
    deleteAdvertiser: advertisers.deleteAdvertiser,
    addMetric: advertisers.addMetric,
    deleteMetric: advertisers.deleteMetric,
    addUser: users.addUser,
    editUser: users.editUser,
    deleteUser: users.deleteUser,
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
```

- [ ] **验证构建**

```bash
cd /Users/peter/Documents/千川CRM && npm run build 2>&1 | tail -10
```

Expected: `✓ built in ...` 无报错

- [ ] **提交**

```bash
git add src/store/AppContext.jsx src/stores/ src/services/
git commit -m "refactor: split AppContext into Zustand stores, keep compatibility layer"
```

---

### Task 2.8: 验证阶段 2 功能完整

- [ ] **验证构建通过**

```bash
cd /Users/peter/Documents/千川CRM && npm run build 2>&1 | tail -10
```

Expected: 无报错，构建成功

---

## 阶段 3：数据一致性 Service

### Task 3.1: 创建同步规则 Service

**Files:**
- Create: `src/services/syncService.js`

- [ ] **创建 src/services/syncService.js**

```js
import useLeadStore from "../stores/leadStore";
import useAdvertiserStore from "../stores/advertiserStore";

/**
 * 声明式同步规则
 * 每条规则定义：当 source 实体的某个字段变更时，自动更新 target 实体的对应字段
 */
const SYNC_RULES = [
  // 规则1: Lead.assignedTo 变更 → 同步到关联的 Advertiser
  {
    source: "lead",
    field: "assignedTo",
    target: "advertiser",
    matchBy: (leadId, advertiser) => advertiser.leadId === leadId,
    apply: (newValue) => ({ assignedTo: newValue }),
  },
  // 规则2: Advertiser.assignedTo 变更 → 同步回关联的 Lead
  {
    source: "advertiser",
    field: "assignedTo",
    target: "lead",
    matchBy: (advertiserId, lead, data) => lead.id === data.leadId,
    apply: (newValue) => ({ assignedTo: newValue }),
  },
];

/**
 * 执行所有匹配的同步规则
 * @param {string} sourceType - 'lead' | 'advertiser'
 * @param {string} sourceId - 变更实体的 ID
 * @param {string} field - 变更的字段名
 * @param {*} newValue - 变更后的值
 * @param {object} extraData - 额外数据（如 leadId 用于 advertiser→lead 同步）
 */
export function executeSync(sourceType, sourceId, field, newValue, extraData = {}) {
  const rules = SYNC_RULES.filter(
    (r) => r.source === sourceType && r.field === field
  );

  for (const rule of rules) {
    const leadStore = useLeadStore.getState();
    const adStore = useAdvertiserStore.getState();

    if (rule.target === "advertiser") {
      // 更新关联的 advertiser
      const advertisers = adStore.advertisers.map((a) =>
        rule.matchBy(sourceId, a) ? { ...a, ...rule.apply(newValue) } : a
      );
      adStore.setAdvertisers(advertisers);
    } else if (rule.target === "lead") {
      // 更新关联的 lead
      const leads = leadStore.leads.map((l) =>
        rule.matchBy(sourceId, l, extraData) ? { ...l, ...rule.apply(newValue) } : l
      );
      leadStore.setLeads(leads);
    }
  }
}
```

- [ ] **提交**

```bash
git add src/services/syncService.js
git commit -m "feat: create declarative sync service for cross-entity consistency"
```

---

### Task 3.2: 创建校验 Service

**Files:**
- Create: `src/services/validationService.js`

- [ ] **创建 src/services/validationService.js**

```js
export function validatePhone(phone) {
  if (!phone) return "请输入手机号";
  if (!/^1[3-9]\d{9}$/.test(phone)) return "手机号格式不正确，请输入11位手机号码";
  return null;
}

export function validateLeadForm(form, checkDuplicate, excludeId) {
  if (!form.name) return "请输入客户名称";
  const phoneErr = validatePhone(form.phone);
  if (phoneErr) return phoneErr;
  if (!form.assignedTo) return "请选择负责人";
  if (checkDuplicate && checkDuplicate(form.name, form.phone, excludeId)) {
    return "客户名称或手机号已存在";
  }
  return null;
}

export function validateAdvertiserForm(form) {
  if (!form.name) return "请输入客户名称";
  if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone)) {
    return "手机号格式不正确，请输入11位手机号码";
  }
  return null;
}

export function validateFollowupForm(form) {
  if (!form.content) return "请输入跟进内容";
  return null;
}

export function normalizeNumeric(value) {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  return isNaN(num) ? value : num;
}
```

- [ ] **提交**

```bash
git add src/services/validationService.js
git commit -m "feat: create validation service"
```

---

### Task 3.3: 在 Lead Store 中接入同步 Service

**Files:**
- Modify: `src/stores/leadStore.js`

- [ ] **在 editLead 和 assignLead 中调用 executeSync**

找到 `editLead` 中的 `set((state) => ({ leads: ... }))` 之后添加：

```js
    // 如果 assignedTo 变更，触发同步
    if (data.assignedTo !== undefined) {
      const { executeSync } = await import("../services/syncService");
      executeSync("lead", id, "assignedTo", data.assignedTo);
    }
```

找到 `assignLead` 中的 `set((state) => ({ leads: ... }))` 之后添加：

```js
    const { executeSync } = await import("../services/syncService");
    executeSync("lead", leadId, "assignedTo", salesName);
```

找到 `deleteLead` 中的 `set((state) => ({ leads: ... }))` 之后添加：

```js
    // Delete linked advertisers
    const { executeSync } = await import("../services/syncService");
    // Note: advertisers are already filtered in the existing logic; sync not needed here
    // because deleteLead in AppContext already filters advertisers by leadId
    // This will be handled by the component layer calling deleteAdvertiser
```

- [ ] **提交**

```bash
git add src/stores/leadStore.js
git commit -m "feat: wire sync service into lead store"
```

---

### Task 3.4: 在 Advertiser Store 中接入同步 Service

**Files:**
- Modify: `src/stores/advertiserStore.js`

- [ ] **在 editAdvertiser 中调用 executeSync**

找到 `editAdvertiser` 中的 `set((state) => ({ advertisers: ... }))` 之后添加：

```js
    // 如果 assignedTo 变更，触发同步回 lead
    if (data.assignedTo !== undefined && (data.leadId || get().advertisers.find(a => a.id === id)?.leadId)) {
      const { executeSync } = await import("../services/syncService");
      const leadId = data.leadId || get().advertisers.find(a => a.id === id)?.leadId;
      executeSync("advertiser", id, "assignedTo", data.assignedTo, { leadId });
    }
```

- [ ] **提交**

```bash
git add src/stores/advertiserStore.js
git commit -m "feat: wire sync service into advertiser store"
```

---

### Task 3.5: 在 Followup Store 中接入 Lead 时间同步

**Files:**
- Modify: `src/stores/followupStore.js`

- [ ] **在 addFollowup 中同步 lead 的 lastContactAt/nextContactAt**

找到 `set((state) => ({ followups: [newF, ...state.followups] }))` 之后添加：

```js
    // 同步 lead 的 lastContactAt / nextContactAt
    const leadStore = (await import("../stores/leadStore")).default;
    const leads = leadStore.getState().leads.map((l) =>
      l.id === f.leadId
        ? {
            ...l,
            lastContactAt: f.contactAt || newF.createdAt,
            ...(f.nextContactAt ? { nextContactAt: f.nextContactAt } : {}),
          }
        : l
    );
    leadStore.getState().setLeads(leads);
```

- [ ] **提交**

```bash
git add src/stores/followupStore.js
git commit -m "feat: wire followup sync into lead store"
```

---

### Task 3.6: 验证阶段 3 构建通过

- [ ] **构建验证**

```bash
cd /Users/peter/Documents/千川CRM && npm run build 2>&1 | tail -10
```

Expected: `✓ built in ...` 无报错

---

## 阶段 4：清理与收尾（可选优化）

### Task 4.1: 移除 AppContext 中的冗余同步代码

**Files:**
- Modify: `src/store/AppContext.jsx`

- [ ] **移除手动同步逻辑**

AppContext 中 `assignLead`、`editLead`、`editAdvertiser` 的手动 `setAdvertisers`/`setLeads` 同步代码可以移除，因为 syncService 已经接管。但为了安全，可以保留作为冗余备份，或者直接移除。

### Task 4.2: 最终构建验证

- [ ] **最终构建**

```bash
cd /Users/peter/Documents/千川CRM && npm run build 2>&1 | tail -10
```

Expected: `✓ built in ...` 无报错

- [ ] **提交全部改动**

```bash
git add -A
git commit -m "refactor: complete architecture refactor - split God Context into stores + services"
git push
```
