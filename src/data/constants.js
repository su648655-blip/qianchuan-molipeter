export const INDUSTRIES = [
  "美妆护肤","服装服饰","食品饮料","3C数码","家居家装",
  "母婴亲子","珠宝饰品","运动户外","宠物用品","医疗保健",
  "教育培训","汽车配件","其他"
];

export const CLIENT_TYPES = ["品牌旗舰店","中小卖家","代理运营商","白牌商家","KA大客户"];

export const LEAD_STAGES = [
  "待联系","已加微","已演示","待约面","推进合作","已成交","已流失"
];

export const LEAD_TIERS = ["S","A","B","C","D"];

export const FOLLOWUP_TYPES = ["电话","微信","面谈","演示","报价","测试户"];

export const SOURCE_CHANNELS = ["电销","转介绍","公司派单","陌拜","渠道合作","其他"];

export const RISK_LEVELS = ["高","中","低"];

export const AD_TYPES = ["短视频","直播","图文"];

export const TIER_META = {
  S: { color: "#b45309", bg: "#fef3c7", border: "#fcd34d", label: "S级", text: "text-amber-700" },
  A: { color: "#c2410c", bg: "#ffedd5", border: "#fdba74", label: "A级", text: "text-orange-700" },
  B: { color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", label: "B级", text: "text-blue-700" },
  C: { color: "#6d28d9", bg: "#ede9fe", border: "#c4b5fd", label: "C级", text: "text-purple-700" },
  D: { color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", label: "D级", text: "text-slate-600" },
};

export const STAGE_META = {
  "待联系": { color: "#6d28d9", bg: "#ede9fe", border: "#c4b5fd" },
  "已加微": { color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
  "已演示": { color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
  "待约面": { color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  "推进合作": { color: "#c2410c", bg: "#ffedd5", border: "#fdba74" },
  "已成交": { color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  "已流失": { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
};

export const RISK_META = {
  "高": { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  "中": { color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  "低": { color: "#15803d", bg: "#dcfce7", border: "#86efac" },
};

export const DEFAULT_USERS = [
  { id: "admin", username: "admin", password: "admin123", name: "管理员", role: "admin" },
  { id: "zhangwei", username: "zhangwei", password: "qw123", name: "张伟", role: "sales" },
  { id: "lina", username: "lina", password: "qw123", name: "李娜", role: "sales" },
  { id: "wangfang", username: "wangfang", password: "qw123", name: "王芳", role: "sales" },
  { id: "liuyang", username: "liuyang", password: "qw123", name: "刘洋", role: "sales" },
  { id: "chenjing", username: "chenjing", password: "qw123", name: "陈静", role: "sales" },
  { id: "zhaolei", username: "zhaolei", password: "qw123", name: "赵磊", role: "sales" },
  { id: "huangmin", username: "huangmin", password: "qw123", name: "黄敏", role: "sales" },
  { id: "zhoujie", username: "zhoujie", password: "qw123", name: "周杰", role: "sales" },
];

export const TABS = [
  { id: "dashboard", icon: "📊", label: "工作台", subtitle: "数据仪表盘" },
  { id: "crm", icon: "🗂️", label: "客户管理", subtitle: "增删改查 · 分级分类" },
  { id: "advertiser", icon: "🤝", label: "合作客户", subtitle: "投放数据 · 档案管理" },
  { id: "ai", icon: "🤖", label: "AI分析中心", subtitle: "话术 · 诊断 · 素材" },
  { id: "users", icon: "👥", label: "员工管理", subtitle: "账号增删改查", adminOnly: true },
];

export const AI_SUB_TABS = [
  { id: "script", label: "话术生成", desc: "AI专属销售话术" },
  { id: "diagnosis", label: "客户诊断", desc: "全面分析报告" },
  { id: "material", label: "素材诊断", desc: "投放优化方案" },
];
