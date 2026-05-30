import { useState, useEffect } from "react";
import { useApp } from "../../store/AppContext";
import { INDUSTRIES, CLIENT_TYPES, LEAD_STAGES, LEAD_TIERS, SOURCE_CHANNELS, RISK_LEVELS } from "../../data/constants";

export default function LeadModal({ lead, onClose, onSave }) {
  const { salesNames, checkDuplicate } = useApp();
  const isEdit = !!lead;
  const [form, setForm] = useState({
    name: "", shopName: "", contact: "", phone: "", industry: "", clientType: "",
    source: "", tier: "D", stage: "待联系", status: "新开发",
    budgetRange: "", dailyBudget: "", currentConsumption: "",
    assignedTo: "", remark: "", riskLevel: "中",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "", shopName: lead.shopName || "", contact: lead.contact || "",
        phone: lead.phone || "", industry: lead.industry || "", clientType: lead.clientType || "",
        source: lead.source || "", tier: lead.tier || "D", stage: lead.stage || "待联系",
        status: lead.status || "新开发", budgetRange: lead.budgetRange || "",
        dailyBudget: lead.dailyBudget || "", currentConsumption: lead.currentConsumption || "",
        assignedTo: lead.assignedTo || "", remark: lead.remark || "", riskLevel: lead.riskLevel || "中",
      });
    }
  }, [lead]);

  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name) { setError("请输入客户名称"); return; }
    if (!form.phone) { setError("请输入手机号"); return; }
    if (!/^1[3-9]\d{9}$/.test(form.phone)) { setError("手机号格式不正确，请输入11位手机号码"); return; }
    if (!form.assignedTo) { setError("请选择负责人"); return; }
    if (checkDuplicate(form.name, form.phone, lead?.id)) {
      setError("客户名称或手机号已存在"); return;
    }
    onSave(form);
    onClose();
  };

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10";
  const labelCls = "block text-xs font-medium text-[#475569] mb-1";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slideDown" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111827]">{isEdit ? "编辑客户" : "新增客户"}</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#111827] text-lg">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-70px)]">
          {error && <div className="mb-3 p-2 bg-[#fee2e2] text-[#dc2626] rounded-lg text-xs">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>客户名称 <span className="text-red-500">*</span></label><input className={inputCls} value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="客户公司名称" /></div>
            <div><label className={labelCls}>店铺名称</label><input className={inputCls} value={form.shopName} onChange={e => handleChange("shopName", e.target.value)} placeholder="抖音店铺名称" /></div>
            <div><label className={labelCls}>联系人</label><input className={inputCls} value={form.contact} onChange={e => handleChange("contact", e.target.value)} placeholder="联系人姓名" /></div>
            <div><label className={labelCls}>手机号 <span className="text-red-500">*</span></label><input className={inputCls} value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="手机号码" maxLength={11} /></div>
            <div><label className={labelCls}>行业</label><select className={inputCls} value={form.industry} onChange={e => handleChange("industry", e.target.value)}><option value="">请选择行业</option>{INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
            <div><label className={labelCls}>客户类型</label><select className={inputCls} value={form.clientType} onChange={e => handleChange("clientType", e.target.value)}><option value="">请选择类型</option>{CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className={labelCls}>来源渠道</label><select className={inputCls} value={form.source} onChange={e => handleChange("source", e.target.value)}><option value="">请选择来源</option>{SOURCE_CHANNELS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className={labelCls}>客户等级</label><select className={inputCls} value={form.tier} onChange={e => handleChange("tier", e.target.value)}>{LEAD_TIERS.map(t => <option key={t} value={t}>{t}级</option>)}</select></div>
            <div><label className={labelCls}>客户阶段</label><select className={inputCls} value={form.stage} onChange={e => handleChange("stage", e.target.value)}>{LEAD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className={labelCls}>投放状态</label><select className={inputCls} value={form.status} onChange={e => handleChange("status", e.target.value)}>{["新开发","跟进中","活跃投放","观望评估","暂停投放","已流失"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className={labelCls}>月预算范围</label><select className={inputCls} value={form.budgetRange} onChange={e => handleChange("budgetRange", e.target.value)}><option value="">请选择</option>{["0-30万","30-50万","50-100万","100-500万","500万以上"].map(b => <option key={b} value={b}>{b}</option>)}</select></div>
            <div><label className={labelCls}>日消耗预估</label><input className={inputCls} type="number" value={form.dailyBudget} onChange={e => handleChange("dailyBudget", e.target.value)} placeholder="元/天" /></div>
            <div><label className={labelCls}>当月消耗</label><input className={inputCls} type="number" value={form.currentConsumption} onChange={e => handleChange("currentConsumption", e.target.value)} placeholder="当月消耗金额" /></div>
            <div><label className={labelCls}>负责人 <span className="text-red-500">*</span></label><select className={inputCls} value={form.assignedTo} onChange={e => handleChange("assignedTo", e.target.value)}><option value="">请选择负责人</option>{salesNames.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className={labelCls}>风险等级</label><select className={inputCls} value={form.riskLevel} onChange={e => handleChange("riskLevel", e.target.value)}>{RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div className="mt-4"><label className={labelCls}>备注</label><textarea className={inputCls} rows={2} value={form.remark} onChange={e => handleChange("remark", e.target.value)} placeholder="备注信息" /></div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-[#475569] hover:bg-slate-50">取消</button>
            <button type="submit" className="px-6 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-sm font-medium shadow-sm">{isEdit ? "保存修改" : "确认新增"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
