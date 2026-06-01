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
    id: r.id, name: r.name, shopName: r.shop_name || "", contact: r.contact || "",
    phone: r.phone || "", industry: r.industry || "", clientType: r.client_type || "",
    source: r.source || "", tier: r.tier || "D", stage: r.stage || "待联系",
    status: r.status || "新开发", budgetRange: r.budget_range || "",
    dailyBudget: Number(r.daily_budget || 0), currentConsumption: Number(r.current_consumption || 0),
    assignedTo: r.assigned_to || "", remark: r.remark || "", riskLevel: r.risk_level || "中",
    lastContactAt: normTime(r.last_contact_at), nextContactAt: normTime(r.next_contact_at),
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
