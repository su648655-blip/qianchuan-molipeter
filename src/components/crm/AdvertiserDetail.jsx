import { useState, useMemo } from "react";
import { useApp } from "../../store/AppContext";
import { formatCurrency } from "../../lib/utils";
import { RISK_META } from "../../data/constants";

export default function AdvertiserDetail({ ad, onClose }) {
  const { addMetric, deleteMetric, leads, followups } = useApp();
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [metricForm, setMetricForm] = useState({
    date: new Date().toISOString().slice(0, 10), dailyConsumption: "", cpm: "", ctr: "", cvr: "", roi: "",
  });

  const rm = RISK_META[ad.riskLevel] || {};
  const linkedLead = leads.find(l => l.id === ad.leadId);
  const leadFollowups = useMemo(() => linkedLead ? followups.filter(f => f.leadId === linkedLead.id) : [], [followups, linkedLead]);
  const metrics = (ad.metrics || []).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleAddMetric = (e) => {
    e.preventDefault();
    addMetric(ad.id, {
      date: metricForm.date, dailyConsumption: Number(metricForm.dailyConsumption) || 0,
      cpm: Number(metricForm.cpm) || 0, ctr: Number(metricForm.ctr) || 0,
      cvr: Number(metricForm.cvr) || 0, roi: Number(metricForm.roi) || 0,
    });
    setMetricForm({ date: new Date().toISOString().slice(0, 10), dailyConsumption: "", cpm: "", ctr: "", cvr: "", roi: "" });
    setShowMetricForm(false);
  };

  const inputCls = "w-full px-2 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-[#1d4ed8]";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] w-[95vw] sm:w-full max-w-6xl max-h-[90vh] overflow-hidden animate-slideDown" onClick={e => e.stopPropagation()}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#111827]">{ad.name}</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ color: rm.color, background: rm.bg }}>风险: {ad.riskLevel}</span>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#111827] text-xl">&times;</button>
        </div>
        <div className="flex flex-col md:flex-row h-auto max-h-[calc(90vh-70px)]">
          <div className="w-full md:w-[350px] shrink-0 border-b md:border-r md:border-b-0 border-slate-200 p-4 md:p-6 overflow-y-auto max-h-[40vh] md:max-h-none">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">投放档案 · 基础信息</h3>
            <div className="space-y-2.5">
              <InfoRow label="客户名称" value={ad.name} /><InfoRow label="店铺名称" value={ad.shopName} />
              <InfoRow label="行业" value={ad.industry} /><InfoRow label="联系人" value={ad.contact} />
              <InfoRow label="手机号" value={ad.phone} isPhone /><InfoRow label="负责人" value={ad.assignedTo} />
              <InfoRow label="开始合作" value={ad.startDate} /><InfoRow label="主推产品" value={ad.mainProduct} />
              <InfoRow label="客单价" value={ad.unitPrice ? "¥" + ad.unitPrice : "-"} />
              <InfoRow label="当前返点" value={ad.rebate ? ad.rebate + "%" : "-"} />
            </div>
            {linkedLead && (<>
              <h3 className="text-sm font-semibold text-[#111827] mt-6 mb-3">关联CRM客户</h3>
              <div className="p-3 bg-[#f8fafc] rounded-lg text-xs space-y-1 border border-slate-200">
                <p><span className="text-[#6b7280]">阶段:</span> {linkedLead.stage}</p>
                <p><span className="text-[#6b7280]">等级:</span> {linkedLead.tier}级</p>
                <p><span className="text-[#6b7280]">最近跟进:</span> {leadFollowups.length > 0 ? leadFollowups[0].content?.slice(0, 50) + "…" : "无"}</p>
              </div>
            </>)}
          </div>
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-slate-200 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#111827]">投放数据</h3>
                <button onClick={() => setShowMetricForm(!showMetricForm)} className="px-3 py-1.5 bg-[#1d4ed8] text-white rounded-lg text-xs font-medium">+ 录入数据</button>
              </div>
              {showMetricForm && (
                <form onSubmit={handleAddMetric} className="mb-4 p-3 bg-[#f8fafc] rounded-lg grid grid-cols-2 sm:grid-cols-7 gap-2 border border-slate-200">
                  <input type="date" className={inputCls} value={metricForm.date} onChange={e => setMetricForm(p => ({ ...p, date: e.target.value }))} />
                  <input type="number" className={inputCls} placeholder="日消耗" value={metricForm.dailyConsumption} onChange={e => setMetricForm(p => ({ ...p, dailyConsumption: e.target.value }))} />
                  <input type="number" step="0.1" className={inputCls} placeholder="CPM" value={metricForm.cpm} onChange={e => setMetricForm(p => ({ ...p, cpm: e.target.value }))} />
                  <input type="number" step="0.01" className={inputCls} placeholder="CTR %" value={metricForm.ctr} onChange={e => setMetricForm(p => ({ ...p, ctr: e.target.value }))} />
                  <input type="number" step="0.01" className={inputCls} placeholder="CVR %" value={metricForm.cvr} onChange={e => setMetricForm(p => ({ ...p, cvr: e.target.value }))} />
                  <input type="number" step="0.01" className={inputCls} placeholder="ROI" value={metricForm.roi} onChange={e => setMetricForm(p => ({ ...p, roi: e.target.value }))} />
                  <button type="submit" className="px-3 py-1.5 bg-[#15803d] text-white rounded text-xs font-medium">保存</button>
                </form>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#f1f5f9] text-[#475569]"><tr><th className="text-left px-3 py-2">日期</th><th className="text-left px-3 py-2">日消耗</th><th className="text-left px-3 py-2">CPM</th><th className="text-left px-3 py-2">CTR</th><th className="text-left px-3 py-2">CVR</th><th className="text-left px-3 py-2">ROI</th><th className="text-center px-3 py-2">操作</th></tr></thead>
                  <tbody>
                    {metrics.slice(0, 30).map((m, i) => (
                      <tr key={i} className="border-t border-slate-100"><td className="px-3 py-2 text-[#374151]">{m.date}</td><td className="px-3 py-2 text-[#374151]">¥{formatCurrency(m.dailyConsumption)}</td><td className="px-3 py-2 text-[#374151]">{m.cpm}</td><td className="px-3 py-2 text-[#374151]">{m.ctr}%</td><td className="px-3 py-2 text-[#374151]">{m.cvr}%</td><td className="px-3 py-2 font-medium text-[#1d4ed8]">{m.roi}</td><td className="px-3 py-2"><button onClick={() => deleteMetric(ad.id, m.id)} className="text-[#dc2626] hover:text-[#b91c1c] text-[11px] cursor-pointer">删除</button></td></tr>
                    ))}
                    {metrics.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-[#6b7280]">暂无投放数据</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, isPhone }) {
  return <div className="flex justify-between items-start py-1 border-b border-slate-100"><span className="text-xs text-[#6b7280] shrink-0">{label}</span><span className="text-xs text-[#111827] text-right ml-4">{isPhone && value ? <a href={"tel:" + value} className="text-[#1d4ed8] hover:underline flex items-center gap-1 justify-end"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>{value}</a> : value || "-"}</span></div>;
}
