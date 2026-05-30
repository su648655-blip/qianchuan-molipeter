const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// Supabase admin client (uses service_role key)
function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── AUTH ───────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();
    if (error || !data) return res.status(401).json({ error: "用户名或密码错误" });
    if (data.disabled) return res.status(403).json({ error: "账号已被禁用" });
    const { password: _, ...safeUser } = data;
    res.json({ user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── USERS ──────────────────────────────────────────────────────
app.get("/api/users", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("users").select("*");
    res.json({ data: (data || []).map(u => { const { password: _, ...safe } = u; return safe; }) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/users", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("users").insert(req.body).select().single();
    if (error) return res.status(400).json({ error: error.message });
    const { password: _, ...safe } = data;
    res.json({ data: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("users").update(req.body).eq("id", req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    const { password: _, ...safe } = data;
    res.json({ data: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    await supabase.from("users").delete().eq("id", req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── LEADS ──────────────────────────────────────────────────────
app.get("/api/leads", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    res.json({ data: data || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/leads", async (req, res) => {
  try {
    const supabase = getSupabase();
    const lead = { ...req.body, id: req.body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8), created_at: new Date().toISOString() };
    const { data, error } = await supabase.from("leads").insert(lead).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/leads/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("leads").update(req.body).eq("id", req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/leads/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    await supabase.from("leads").delete().eq("id", req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── FOLLOWUPS ──────────────────────────────────────────────────
app.get("/api/followups", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("followups").select("*").order("created_at", { ascending: false });
    res.json({ data: data || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/followups", async (req, res) => {
  try {
    const supabase = getSupabase();
    const f = { ...req.body, id: req.body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8), created_at: new Date().toISOString() };
    const { data, error } = await supabase.from("followups").insert(f).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ADVERTISERS ────────────────────────────────────────────────
app.get("/api/advertisers", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("advertisers").select("*");
    res.json({ data: data || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/advertisers", async (req, res) => {
  try {
    const supabase = getSupabase();
    const a = { ...req.body, id: req.body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8) };
    const { data, error } = await supabase.from("advertisers").insert(a).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/advertisers/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("advertisers").update(req.body).eq("id", req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/advertisers/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    await supabase.from("advertisers").delete().eq("id", req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── METRICS ────────────────────────────────────────────────────
app.get("/api/metrics/:advertiserId", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("advertiser_metrics").select("*").eq("advertiser_id", req.params.advertiserId).order("date", { ascending: false });
    res.json({ data: data || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/metrics", async (req, res) => {
  try {
    const supabase = getSupabase();
    const m = { ...req.body, id: req.body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8) };
    const { data, error } = await supabase.from("advertiser_metrics").insert(m).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── API KEYS ───────────────────────────────────────────────────
app.get("/api/apikey/:username", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("api_keys").select("api_key").eq("username", req.params.username).single();
    res.json({ apiKey: data?.api_key || "" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/apikey", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { username, apiKey } = req.body;
    const { error } = await supabase.from("api_keys").upsert({ username, api_key: apiKey || "" }, { onConflict: "username" });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SEED DATA ──────────────────────────────────────────────────
app.post("/api/seed", async (req, res) => {
  try {
    const supabase = getSupabase();
    const now = Date.now();
    const d = (days) => new Date(now - days * 86400000).toISOString();
    const salesNames = ["张伟","李娜","王芳","刘洋","陈静","赵磊","黄敏","周杰"];

    const leads = [
      { name: "美肌生物科技有限公司", shop_name: "美肌官方旗舰店", contact: "王总", phone: "13800001001", industry: "美妆护肤", tier: "S", stage: "推进合作", status: "活跃投放", budget_range: "500万以上", daily_budget: 180000, current_consumption: 4500000, assigned_to: "张伟", created_at: d(120), last_contact_at: d(1), next_contact_at: d(3), remark: "对抖音千川投放有明确需求" },
      { name: "潮流服饰有限公司", shop_name: "潮牌服饰旗舰店", contact: "李经理", phone: "13800001002", industry: "服装服饰", tier: "A", stage: "已加微", status: "跟进中", budget_range: "100-500万", daily_budget: 80000, current_consumption: 1200000, assigned_to: "李娜", created_at: d(90), last_contact_at: d(3), next_contact_at: d(7) },
      { name: "鲜味食品集团", shop_name: "鲜味食品旗舰店", contact: "赵总", phone: "13800001003", industry: "食品饮料", tier: "S", stage: "已成交", status: "活跃投放", budget_range: "500万以上", daily_budget: 250000, current_consumption: 6800000, assigned_to: "张伟", created_at: d(200) },
      { name: "数码先锋科技有限公司", shop_name: "数码先锋专营店", contact: "陈总", phone: "13800001004", industry: "3C数码", tier: "B", stage: "待联系", status: "新开发", budget_range: "50-100万", daily_budget: 30000, assigned_to: "王芳", created_at: d(15) },
      { name: "优家家居股份有限公司", shop_name: "优家家居旗舰店", contact: "刘总", phone: "13800001005", industry: "家居家装", tier: "A", stage: "待约面", status: "跟进中", budget_range: "100-500万", daily_budget: 100000, current_consumption: 2800000, assigned_to: "李娜", created_at: d(60) },
      { name: "宝贝母婴用品有限公司", shop_name: "宝贝母婴旗舰店", contact: "周总", phone: "13800001006", industry: "母婴亲子", tier: "C", stage: "已演示", status: "观望评估", budget_range: "30-50万", daily_budget: 15000, current_consumption: 350000, assigned_to: "王芳", created_at: d(80), risk_level: "高" },
      { name: "璀璨珠宝有限公司", shop_name: "璀璨珠宝旗舰店", contact: "林总", phone: "13800001007", industry: "珠宝饰品", tier: "D", stage: "待联系", status: "新开发", budget_range: "0-30万", daily_budget: 8000, assigned_to: "刘洋", created_at: d(7), risk_level: "高" },
      { name: "活力运动装备有限公司", shop_name: "活力运动旗舰店", contact: "吴总", phone: "13800001008", industry: "运动户外", tier: "B", stage: "推进合作", status: "活跃投放", budget_range: "50-100万", daily_budget: 50000, current_consumption: 1500000, assigned_to: "刘洋", created_at: d(100) },
      { name: "萌宠乐园宠物用品", shop_name: "萌宠乐园专营店", contact: "马总", phone: "13800001009", industry: "宠物用品", tier: "C", stage: "已加微", status: "跟进中", budget_range: "30-50万", daily_budget: 12000, current_consumption: 80000, assigned_to: "陈静", created_at: d(30) },
      { name: "安康医疗科技有限公司", shop_name: "安康医疗旗舰店", contact: "郑总", phone: "13800001010", industry: "医疗保健", tier: "A", stage: "已成交", status: "活跃投放", budget_range: "100-500万", daily_budget: 120000, current_consumption: 3200000, assigned_to: "陈静", created_at: d(180) },
    ];

    for (const lead of leads) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      await supabase.from("leads").insert({ ...lead, id });
    }

    res.json({ ok: true, count: leads.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Export for Vercel
module.exports = app;
module.exports.handler = (req, res) => {
  // Vercel serverless
  const urlParts = req.url.split("?");
  req.path = urlParts[0];
  app(req, res);
};
