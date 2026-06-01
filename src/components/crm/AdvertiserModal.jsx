import { useState, useEffect } from "react";
import { useApp } from "../../store/AppContext";
import { INDUSTRIES, RISK_LEVELS } from "../../data/constants";

export default function AdvertiserModal({ ad, onClose }) {
  const { addAdvertiser, editAdvertiser, leads, salesNames } = useApp();
  const isEdit = !!ad;
  const [form, setForm] = useState({
    leadId: "", name: "", shopName: "", industry: "", contact: "", phone: "",
    assignedTo: "", startDate: new Date().toISOString().slice(0, 10),
    mainProduct: "", unitPrice: "", rebate: "", riskLevel: "低", status: "活跃投放",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (ad) {
      setForm({
        leadId: ad.leadId || "", name: ad.name || "", shopName: ad.shopName || "",
        industry: ad.industry || "", contact: ad.contact || "", phone: ad.phone || "",
        assignedTo: ad.assignedTo || "", startDate: ad.startDate || "",
        mainProduct: ad.mainProduct || "", unitPrice: ad.unitPrice || "",
        rebate: ad.rebate || "", riskLevel: ad.riskLevel || "低", status: ad.status || "活跃投放",
      });
    }
  }, [ad]);

  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLinkLead = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setForm(p => ({ ...p, leadId: lead.id, name: lead.name, shopName: lead.shopName || "", industry: lead.industry || "", contact: lead.contact || "", phone: lead.phone || "", assignedTo: lead.assignedTo || "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault(); setError("");
    if (!form.name) { setError("请输入客户名称"); return; }
    if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone)) { setError("手机号格式不正确，请输入11位手机号码"); return; }
    if (isEdit) editAdvertiser(ad.id, form); else addAdvertiser(form);
    onClose();
  };

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10";
  const labelCls = "block text-xs font-medium text-[#475569] mb-1";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slideDown" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111827]">{isEdit ? "编辑在投客户" : "新增在投客户"}</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#111827] text-lg">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-70px)]">
          {error && <div className="mb-3 p-2 bg-[#fee2e2] text-[#dc2626] rounded-lg text-xs">{error}</div>}
          <div className="mb-4"><label className={labelCls}>关联CRM客户（可选）</label>
              <select className={inputCls} value={form.leadId} onChange={e => handleLinkLead(e.target.value)}>
                <option value="">{isEdit ? "不关联" : "手动输入"}</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name} - {l.assignedTo} {l.stage !== "已成交" && l.stage !== "推进合作" ? `[${l.stage}]` : ""}</option>)}
              </select>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>客户名称 <span className="text-red-500">*</span></label><input className={inputCls} value={form.name} onChange={e => handleChange("name", e.target.value)} /></div>
            <div><label className={labelCls}>店铺名称</label><input className={inputCls} value={form.shopName} onChange={e => handleChange("shopName", e.target.value)} /></div>
            <div><label className={labelCls}>行业</label><select className={inputCls} value={form.industry} onChange={e => handleChange("industry", e.target.value)}><option value="">请选择</option>{INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
            <div><label className={labelCls}>联系人</label><input className={inputCls} value={form.contact} onChange={e => handleChange("contact", e.target.value)} /></div>
            <div><label className={labelCls}>手机号</label><input className={inputCls} value={form.phone} onChange={e => handleChange("phone", e.target.value)} maxLength={11} /></div>
            <div><label className={labelCls}>负责人</label><select className={inputCls} value={form.assignedTo} onChange={e => handleChange("assignedTo", e.target.value)}><option value="">请选择</option>{salesNames.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className={labelCls}>开始合作时间</label><input className={inputCls} type="date" value={form.startDate} onChange={e => handleChange("startDate", e.target.value)} /></div>
            <div><label className={labelCls}>主投产品</label><input className={inputCls} value={form.mainProduct} onChange={e => handleChange("mainProduct", e.target.value)} /></div>
            <div><label className={labelCls}>客单价 (元)</label><input className={inputCls} type="number" value={form.unitPrice} onChange={e => handleChange("unitPrice", e.target.value)} /></div>
            <div><label className={labelCls}>当前返点 (%)</label><input className={inputCls} type="number" value={form.rebate} onChange={e => handleChange("rebate", e.target.value)} /></div>
            <div><label className={labelCls}>投放状态</label><select className={inputCls} value={form.status} onChange={e => handleChange("status", e.target.value)}>{["新开发","跟进中","活跃投放","观望评估","暂停投放","已流失"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className={labelCls}>风险等级</label><select className={inputCls} value={form.riskLevel} onChange={e => handleChange("riskLevel", e.target.value)}>{RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-[#475569]">取消</button>
            <button type="submit" className="px-6 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-sm font-medium">{isEdit ? "保存" : "确认新增"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
