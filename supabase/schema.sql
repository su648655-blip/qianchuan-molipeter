-- ============================================================
-- 千川CRM 数据库建表脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales',
  disabled BOOLEAN DEFAULT FALSE
);

-- 客户表 (leads)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  shop_name TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  client_type TEXT DEFAULT '',
  source TEXT DEFAULT '',
  tier TEXT DEFAULT 'D',
  stage TEXT DEFAULT '待联系',
  status TEXT DEFAULT '新开发',
  budget_range TEXT DEFAULT '',
  daily_budget NUMERIC DEFAULT 0,
  current_consumption NUMERIC DEFAULT 0,
  assigned_to TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  risk_level TEXT DEFAULT '中',
  last_contact_at TEXT,
  next_contact_at TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_tier ON leads(tier);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);

-- 跟进记录表
CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT DEFAULT '',
  contact_at TEXT,
  next_contact_at TEXT,
  attachment TEXT DEFAULT '',
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_followups_lead_id ON followups(lead_id);

-- 合作客户表 (advertisers)
CREATE TABLE IF NOT EXISTS advertisers (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  name TEXT NOT NULL,
  shop_name TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  assigned_to TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  main_product TEXT DEFAULT '',
  unit_price NUMERIC DEFAULT 0,
  rebate NUMERIC DEFAULT 0,
  risk_level TEXT DEFAULT '低'
);

-- 投放指标表
CREATE TABLE IF NOT EXISTS advertiser_metrics (
  id TEXT PRIMARY KEY,
  advertiser_id TEXT REFERENCES advertisers(id) ON DELETE CASCADE,
  date TEXT,
  daily_consumption NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cvr NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_metrics_advertiser_id ON advertiser_metrics(advertiser_id);

-- API Key 表 (每个用户独立)
CREATE TABLE IF NOT EXISTS api_keys (
  username TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
  api_key TEXT DEFAULT ''
);

-- ============================================================
-- 启用行级安全 (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertiser_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS 策略: 通过 service_role key 访问，无需行级过滤
-- 实际权限由后端 API 控制
-- ============================================================
CREATE POLICY "Allow all for service" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for service" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all for service" ON followups FOR ALL USING (true);
CREATE POLICY "Allow all for service" ON advertisers FOR ALL USING (true);
CREATE POLICY "Allow all for service" ON advertiser_metrics FOR ALL USING (true);
CREATE POLICY "Allow all for service" ON api_keys FOR ALL USING (true);

-- ============================================================
-- 插入默认用户 (密码为明文，生产环境建议用 Supabase Auth)
-- ============================================================
INSERT INTO users (id, username, password, name, role, disabled) VALUES
  ('admin', 'admin', 'admin123', '管理员', 'admin', false),
  ('zhangwei', 'zhangwei', 'qw123', '张伟', 'sales', false),
  ('lina', 'lina', 'qw123', '李娜', 'sales', false),
  ('wangfang', 'wangfang', 'qw123', '王芳', 'sales', false),
  ('liuyang', 'liuyang', 'qw123', '刘洋', 'sales', false),
  ('chenjing', 'chenjing', 'qw123', '陈静', 'sales', false),
  ('zhaolei', 'zhaolei', 'qw123', '赵磊', 'sales', false),
  ('huangmin', 'huangmin', 'qw123', '黄敏', 'sales', false),
  ('zhoujie', 'zhoujie', 'qw123', '周杰', 'sales', false);
