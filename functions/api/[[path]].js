import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { neon } from "@neondatabase/serverless";

const app = new Hono();

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");
  if (c.req.method === "OPTIONS") return c.body(null, 204);
  await next();
});

app.use("*", async (c, next) => {
  const url = c.env.DATABASE_URL;
  if (!url) return c.json({ error: "Database not configured" }, 500);
  c.set("sql", neon(url));
  await next();
});

// AUTH
app.post("/api/auth/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    const sql = c.get("sql");
    const rows = await sql.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
    if (rows.length === 0) return c.json({ error: "\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef" }, 401);
    const user = rows[0];
    if (user.disabled) return c.json({ error: "\u8d26\u53f7\u5df2\u88ab\u7981\u7528" }, 403);
    const { password: _, ...safeUser } = user;
    return c.json({ user: safeUser });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.get("/api/users", async (c) => {
  try {
    const sql = c.get("sql");
    const rows = await sql.query("SELECT id, username, name, role, disabled FROM users ORDER BY username");
    return c.json({ data: rows });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.post("/api/users", async (c) => {
  try {
    const body = await c.req.json();
    const sql = c.get("sql");
    body.id = body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const cols = Object.keys(body).join(", ");
    const vals = Object.values(body);
    const ph = vals.map((_, i) => "$" + (i + 1)).join(", ");
    await sql.query("INSERT INTO users (" + cols + ") VALUES (" + ph + ")", vals);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: e.message }, 400); }
});

app.put("/api/users/:id", async (c) => {
  try {
    const body = await c.req.json();
    const sql = c.get("sql");
    const keys = Object.keys(body);
    if (keys.length === 0) return c.json({ ok: true });
    const sets = keys.map((k, i) => k + " = $" + (i + 2)).join(", ");
    await sql.query("UPDATE users SET " + sets + " WHERE id = $1", [c.req.param("id"), ...keys.map(k => body[k])]);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.delete("/api/users/:id", async (c) => {
  try {
    const sql = c.get("sql");
    await sql.query("DELETE FROM users WHERE id = $1", [c.req.param("id")]);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

// LEADS
app.get("/api/leads", async (c) => {
  try {
    const sql = c.get("sql");
    const rows = await sql.query("SELECT * FROM leads ORDER BY created_at DESC");
    return c.json({ data: rows });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.post("/api/leads", async (c) => {
  try {
    const body = await c.req.json();
    const sql = c.get("sql");
    body.id = body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    body.created_at = body.created_at || new Date().toISOString();
    const cols = Object.keys(body).join(", ");
    const vals = Object.values(body);
    const ph = vals.map((_, i) => "$" + (i + 1)).join(", ");
    await sql.query("INSERT INTO leads (" + cols + ") VALUES (" + ph + ")", vals);
    return c.json({ data: body });
  } catch (e) { return c.json({ error: e.message }, 400); }
});

app.put("/api/leads/:id", async (c) => {
  try {
    const body = await c.req.json();
    const sql = c.get("sql");
    const keys = Object.keys(body);
    if (keys.length === 0) return c.json({ ok: true });
    const sets = keys.map((k, i) => k + " = $" + (i + 2)).join(", ");
    await sql.query("UPDATE leads SET " + sets + " WHERE id = $1", [c.req.param("id"), ...keys.map(k => body[k])]);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.delete("/api/leads/:id", async (c) => {
  try {
    const sql = c.get("sql");
    await sql.query("DELETE FROM leads WHERE id = $1", [c.req.param("id")]);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

// FOLLOWUPS
app.get("/api/followups", async (c) => {
  try {
    const sql = c.get("sql");
    const rows = await sql.query("SELECT * FROM followups ORDER BY created_at DESC");
    return c.json({ data: rows });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.post("/api/followups", async (c) => {
  try {
    const body = await c.req.json();
    const sql = c.get("sql");
    body.id = body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    body.created_at = body.created_at || new Date().toISOString();
    const cols = Object.keys(body).join(", ");
    const vals = Object.values(body);
    const ph = vals.map((_, i) => "$" + (i + 1)).join(", ");
    await sql.query("INSERT INTO followups (" + cols + ") VALUES (" + ph + ")", vals);
    return c.json({ data: body });
  } catch (e) { return c.json({ error: e.message }, 400); }
});

// ADVERTISERS
app.get("/api/advertisers", async (c) => {
  try {
    const sql = c.get("sql");
    const rows = await sql.query("SELECT * FROM advertisers");
    return c.json({ data: rows });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.post("/api/advertisers", async (c) => {
  try {
    const body = await c.req.json();
    const sql = c.get("sql");
    body.id = body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const cols = Object.keys(body).join(", ");
    const vals = Object.values(body);
    const ph = vals.map((_, i) => "$" + (i + 1)).join(", ");
    await sql.query("INSERT INTO advertisers (" + cols + ") VALUES (" + ph + ")", vals);
    return c.json({ data: body });
  } catch (e) { return c.json({ error: e.message }, 400); }
});

app.put("/api/advertisers/:id", async (c) => {
  try {
    const body = await c.req.json();
    const sql = c.get("sql");
    const keys = Object.keys(body);
    if (keys.length === 0) return c.json({ ok: true });
    const sets = keys.map((k, i) => k + " = $" + (i + 2)).join(", ");
    await sql.query("UPDATE advertisers SET " + sets + " WHERE id = $1", [c.req.param("id"), ...keys.map(k => body[k])]);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.delete("/api/advertisers/:id", async (c) => {
  try {
    const sql = c.get("sql");
    await sql.query("DELETE FROM advertisers WHERE id = $1", [c.req.param("id")]);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

// METRICS
app.get("/api/metrics/:advertiserId", async (c) => {
  try {
    const sql = c.get("sql");
    const rows = await sql.query("SELECT * FROM advertiser_metrics WHERE advertiser_id = $1 ORDER BY date DESC", [c.req.param("advertiserId")]);
    return c.json({ data: rows });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.post("/api/metrics", async (c) => {
  try {
    const body = await c.req.json();
    const sql = c.get("sql");
    body.id = body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const cols = Object.keys(body).join(", ");
    const vals = Object.values(body);
    const ph = vals.map((_, i) => "$" + (i + 1)).join(", ");
    await sql.query("INSERT INTO advertiser_metrics (" + cols + ") VALUES (" + ph + ")", vals);
    return c.json({ data: body });
  } catch (e) { return c.json({ error: e.message }, 400); }
});

// DELETE METRICS
app.delete("/api/metrics/:id", async (c) => {
  try {
    const sql = c.get("sql");
    await sql.query("DELETE FROM advertiser_metrics WHERE id = $1", [c.req.param("id")]);
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

// API KEYS
app.get("/api/apikey/:username", async (c) => {
  try {
    const sql = c.get("sql");
    const rows = await sql.query("SELECT api_key FROM api_keys WHERE username = $1", [c.req.param("username")]);
    return c.json({ apiKey: rows.length > 0 ? rows[0].api_key : "" });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

app.post("/api/apikey", async (c) => {
  try {
    const { username, apiKey } = await c.req.json();
    const sql = c.get("sql");
    await sql.query(
      "INSERT INTO api_keys (username, api_key) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET api_key = $2",
      [username, apiKey || ""]
    );
    return c.json({ ok: true });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

// SEED
app.post("/api/seed", async (c) => {
  try {
    const sql = c.get("sql");
    const now = Date.now();
    const d = (days) => new Date(now - days * 86400000).toISOString();
    const leads = [
      { name: "\u7f8e\u808c\u751f\u7269\u79d1\u6280\u6709\u9650\u516c\u53f8", shop_name: "\u7f8e\u808c\u5b98\u65b9\u65d7\u8230\u5e97", contact: "\u738b\u603b", phone: "13800001001", industry: "\u7f8e\u5986\u62a4\u80a4", tier: "S", stage: "\u63a8\u8fdb\u5408\u4f5c", status: "\u6d3b\u8dc3\u6295\u653e", budget_range: "500\u4e07\u4ee5\u4e0a", daily_budget: 180000, current_consumption: 4500000, assigned_to: "\u5f20\u4f1f", created_at: d(120), last_contact_at: d(1), next_contact_at: d(3), remark: "\u5bf9\u6296\u97f3\u5343\u5ddd\u6295\u653e\u6709\u660e\u786e\u9700\u6c42" },
      { name: "\u6f6e\u6d41\u670d\u9970\u6709\u9650\u516c\u53f8", shop_name: "\u6f6e\u724c\u670d\u9970\u65d7\u8230\u5e97", contact: "\u674e\u7ecf\u7406", phone: "13800001002", industry: "\u670d\u88c5\u670d\u9970", tier: "A", stage: "\u5df2\u52a0\u5fae", status: "\u8ddf\u8fdb\u4e2d", budget_range: "100-500\u4e07", daily_budget: 80000, current_consumption: 1200000, assigned_to: "\u674e\u5a1c", created_at: d(90), last_contact_at: d(3), next_contact_at: d(7) },
      { name: "\u9c9c\u5473\u98df\u54c1\u96c6\u56e2", shop_name: "\u9c9c\u5473\u98df\u54c1\u65d7\u8230\u5e97", contact: "\u8d75\u603b", phone: "13800001003", industry: "\u98df\u54c1\u996e\u6599", tier: "S", stage: "\u5df2\u6210\u4ea4", status: "\u6d3b\u8dc3\u6295\u653e", budget_range: "500\u4e07\u4ee5\u4e0a", daily_budget: 250000, current_consumption: 6800000, assigned_to: "\u5f20\u4f1f", created_at: d(200) },
      { name: "\u6570\u7801\u5148\u950b\u79d1\u6280\u6709\u9650\u516c\u53f8", shop_name: "\u6570\u7801\u5148\u950b\u4e13\u8425\u5e97", contact: "\u9648\u603b", phone: "13800001004", industry: "3C\u6570\u7801", tier: "B", stage: "\u5f85\u8054\u7cfb", status: "\u65b0\u5f00\u53d1", budget_range: "50-100\u4e07", daily_budget: 30000, assigned_to: "\u738b\u82b3", created_at: d(15) },
      { name: "\u4f18\u5bb6\u5bb6\u5c45\u80a1\u4efd\u6709\u9650\u516c\u53f8", shop_name: "\u4f18\u5bb6\u5bb6\u5c45\u65d7\u8230\u5e97", contact: "\u5218\u603b", phone: "13800001005", industry: "\u5bb6\u5c45\u5bb6\u88c5", tier: "A", stage: "\u5f85\u7ea6\u9762", status: "\u8ddf\u8fdb\u4e2d", budget_range: "100-500\u4e07", daily_budget: 100000, current_consumption: 2800000, assigned_to: "\u674e\u5a1c", created_at: d(60) },
      { name: "\u5b9d\u8d1d\u6bcd\u5a74\u7528\u54c1\u6709\u9650\u516c\u53f8", shop_name: "\u5b9d\u8d1d\u6bcd\u5a74\u65d7\u8230\u5e97", contact: "\u5468\u603b", phone: "13800001006", industry: "\u6bcd\u5a74\u4eb2\u5b50", tier: "C", stage: "\u5df2\u6f14\u793a", status: "\u89c2\u671b\u8bc4\u4f30", budget_range: "30-50\u4e07", daily_budget: 15000, current_consumption: 350000, assigned_to: "\u738b\u82b3", created_at: d(80), risk_level: "\u9ad8" },
      { name: "\u74a7\u74a8\u73e0\u5b9d\u6709\u9650\u516c\u53f8", shop_name: "\u74a7\u74a8\u73e0\u5b9d\u65d7\u8230\u5e97", contact: "\u6797\u603b", phone: "13800001007", industry: "\u73e0\u5b9d\u9970\u54c1", tier: "D", stage: "\u5f85\u8054\u7cfb", status: "\u65b0\u5f00\u53d1", budget_range: "0-30\u4e07", daily_budget: 8000, assigned_to: "\u5218\u6d0b", created_at: d(7), risk_level: "\u9ad8" },
      { name: "\u6d3b\u529b\u8fd0\u52a8\u88c5\u5907\u6709\u9650\u516c\u53f8", shop_name: "\u6d3b\u529b\u8fd0\u52a8\u65d7\u8230\u5e97", contact: "\u5434\u603b", phone: "13800001008", industry: "\u8fd0\u52a8\u6237\u5916", tier: "B", stage: "\u63a8\u8fdb\u5408\u4f5c", status: "\u6d3b\u8dc3\u6295\u653e", budget_range: "50-100\u4e07", daily_budget: 50000, current_consumption: 1500000, assigned_to: "\u5218\u6d0b", created_at: d(100) },
      { name: "\u840c\u5ba0\u4e50\u56ed\u5ba0\u7269\u7528\u54c1", shop_name: "\u840c\u5ba0\u4e50\u56ed\u4e13\u8425\u5e97", contact: "\u9a6c\u603b", phone: "13800001009", industry: "\u5ba0\u7269\u7528\u54c1", tier: "C", stage: "\u5df2\u52a0\u5fae", status: "\u8ddf\u8fdb\u4e2d", budget_range: "30-50\u4e07", daily_budget: 12000, current_consumption: 80000, assigned_to: "\u9648\u9759", created_at: d(30) },
      { name: "\u5b89\u5eb7\u533b\u7597\u79d1\u6280\u6709\u9650\u516c\u53f8", shop_name: "\u5b89\u5eb7\u533b\u7597\u65d7\u8230\u5e97", contact: "\u90d1\u603b", phone: "13800001010", industry: "\u533b\u7597\u4fdd\u5065", tier: "A", stage: "\u5df2\u6210\u4ea4", status: "\u6d3b\u8dc3\u6295\u653e", budget_range: "100-500\u4e07", daily_budget: 120000, current_consumption: 3200000, assigned_to: "\u9648\u9759", created_at: d(180) },
    ];
    for (const lead of leads) {
      lead.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const cols = Object.keys(lead).join(", ");
      const vals = Object.values(lead);
      const ph = vals.map((_, i) => "$" + (i + 1)).join(", ");
      try { await sql.query("INSERT INTO leads (" + cols + ") VALUES (" + ph + ") ON CONFLICT DO NOTHING", vals); } catch {}
    }
    return c.json({ ok: true, count: leads.length });
  } catch (e) { return c.json({ error: e.message }, 500); }
});

export const onRequest = handle(app);
