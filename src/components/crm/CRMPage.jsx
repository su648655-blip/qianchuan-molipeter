import { useState, useMemo, useRef, useEffect } from "react";
import { useApp } from "../../store/AppContext";
import { INDUSTRIES, LEAD_TIERS, LEAD_STAGES, TIER_META, STAGE_META } from "../../data/constants";
import { formatCurrency, formatDate } from "../../lib/utils";
import StatCards from "./StatCards";
import LeadModal from "./LeadModal";
import LeadDetail from "./LeadDetail";
import FollowupModal from "./FollowupModal";
import * as XLSX from "xlsx";

const PAGE_SIZE = 15;

export default function CRMPage({ externalFilter }) {
  const { leads, addLead, editLead, deleteLead, assignLead, addFollowup, checkDuplicate, currentUser, isAdmin, salesNames } = useApp();

  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("全部");
  const [filterStage, setFilterStage] = useState("全部");
  const [filterIndustry, setFilterIndustry] = useState("全部");
  const [filterOwner, setFilterOwner] = useState("全部");
  const [filterStatus, setFilterStatus] = useState("全部");
  const [filterRisk, setFilterRisk] = useState("全部");
  const [filterNoContact, setFilterNoContact] = useState(false);

  // Apply external filter from stat cards
  useEffect(() => {
    if (externalFilter) {
      setFilterTier("全部");
      setFilterStage("全部");
      setFilterIndustry("全部");
      setFilterOwner("全部");
      setFilterStatus("全部");
      setFilterRisk("全部");
      setFilterNoContact(false);
      if (externalFilter.tier) setFilterTier(externalFilter.tier);
      else if (externalFilter.status) setFilterStatus(externalFilter.status);
      else if (externalFilter.risk) setFilterRisk(externalFilter.risk);
      else if (externalFilter.noContact) setFilterNoContact(true);
    }
  }, [externalFilter]);

  const [showModal, setShowModal] = useState(false);
  const [editLeadData, setEditLeadData] = useState(null);
  const [detailLead, setDetailLead] = useState(null);
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupLeadId, setFollowupLeadId] = useState(null);
  const [assignLeadId, setAssignLeadId] = useState(null);
  const [page, setPage] = useState(0);
  const fileRef = useRef(null);

  const myLeads = useMemo(() => {
    let list = isAdmin ? leads : leads.filter(l => l.assignedTo === currentUser?.name);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(l => l.name.toLowerCase().includes(s) || l.phone.includes(s) || (l.contact || "").toLowerCase().includes(s));
    }
    if (filterTier !== "全部") list = list.filter(l => l.tier === filterTier);
    if (filterStage !== "全部") list = list.filter(l => l.stage === filterStage);
    if (filterIndustry !== "全部") list = list.filter(l => l.industry === filterIndustry);
    if (filterOwner !== "全部") list = list.filter(l => l.assignedTo === filterOwner);
    if (filterStatus !== "全部") list = list.filter(l => l.status === filterStatus);
    if (filterRisk !== "全部") list = list.filter(l => l.riskLevel === filterRisk);
    if (filterNoContact) {
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      list = list.filter(l => !l.lastContactAt || new Date(l.lastContactAt).getTime() < sevenDaysAgo);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leads, currentUser, isAdmin, search, filterTier, filterStage, filterIndustry, filterOwner, filterStatus, filterRisk, filterNoContact]);

  const totalPages = Math.ceil(myLeads.length / PAGE_SIZE);
  const pagedLeads = myLeads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleStatFilter = (f) => {
    setFilterTier("全部");
    setFilterStage("全部");
    setFilterIndustry("全部");
    setFilterOwner("全部");
    setFilterStatus("全部");
    setFilterRisk("全部");
    setFilterNoContact(false);
    if (f.reset) { /* show all - already reset above */ }
    else if (f.tier) setFilterTier(f.tier);
    else if (f.status) setFilterStatus(f.status);
    else if (f.risk) setFilterRisk(f.risk);
    else if (f.noContact) setFilterNoContact(true);
    setPage(0);
  };

  const handleExport = () => {
    const data = myLeads.map(l => ({
      "客户名称": l.name, "店铺名称": l.shopName, "联系人": l.contact, "手机号": l.phone,
      "行业": l.industry, "客户类型": l.clientType, "来源": l.source,
      "等级": l.tier + "级", "阶段": l.stage, "投放状态": l.status,
      "预算范围": l.budgetRange, "日消耗": l.dailyBudget, "当月消耗": l.currentConsumption,
      "负责人": l.assignedTo, "风险": l.riskLevel, "创建时间": formatDate(l.createdAt),
      "最近跟进": formatDate(l.lastContactAt), "下次跟进": formatDate(l.nextContactAt),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "客户列表");
    XLSX.writeFile(wb, `千川客户列表_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      let count = 0;
      const salesArr = salesNames;
      rows.forEach((row) => {
        const name = row["客户名称"] || row["name"] || "";
        const phone = String(row["手机号"] || row["phone"] || "");
        if (!name) return;
        if (checkDuplicate(name, phone)) return;
        addLead({
          name, shopName: row["店铺名称"] || row["shopName"] || "",
          contact: row["联系人"] || row["contact"] || "", phone,
          industry: row["行业"] || row["industry"] || "",
          clientType: row["客户类型"] || row["clientType"] || "",
          source: row["来源"] || row["source"] || "",
          tier: row["等级"]?.replace("级", "") || "D",
          stage: row["阶段"] || "待联系", status: row["投放状态"] || "新开发",
          budgetRange: row["预算范围"] || "", dailyBudget: row["日消耗"] || "",
          currentConsumption: row["当月消耗"] || "",
          assignedTo: row["负责人"] || salesArr[0] || "张伟",
          remark: row["备注"] || "", riskLevel: row["风险"] || "中",
        });
        count++;
      });
      alert(`成功导入 ${count} 条客户记录`);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleAssign = (leadId, name) => {
    assignLead(leadId, name);
    setAssignLeadId(null);
  };

  return (
    <div className="animate-fadeUp">
      <StatCards onFilter={handleStatFilter} />

      {/* Filter Bar */}
      <div className="bg-white rounded-t-xl p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-xs">🔍</span>
            <input
              className="pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-[220px] bg-slate-50 outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10"
              placeholder="搜索客户名称/手机号"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <div className="flex border border-slate-300 rounded-lg overflow-hidden">
            {["全部", ...LEAD_TIERS].map((t) => (
              <button
                key={t}
                onClick={() => { setFilterTier(t); setPage(0); }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterTier === t ? "bg-[#1d4ed8] text-white" : "bg-slate-50 text-[#6b7280] hover:bg-slate-100"
                }`}
              >
                {t === "全部" ? "全部" : t + "级"}
              </button>
            ))}
          </div>
          <select className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none focus:border-[#1d4ed8]" value={filterStage} onChange={e => { setFilterStage(e.target.value); setPage(0); }}>
            <option value="全部">全部阶段</option>
            {LEAD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none focus:border-[#1d4ed8]" value={filterIndustry} onChange={e => { setFilterIndustry(e.target.value); setPage(0); }}>
            <option value="全部">全部行业</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          {isAdmin && (
            <select className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none focus:border-[#1d4ed8]" value={filterOwner} onChange={e => { setFilterOwner(e.target.value); setPage(0); }}>
              <option value="全部">全部归属</option>
              {salesNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-[#6b7280] hover:bg-slate-50">📥 导入</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          <button onClick={handleExport} className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-[#6b7280] hover:bg-slate-50">📤 导出</button>
          <button onClick={() => { setEditLeadData(null); setShowModal(true); }} className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm">
            <span>+</span> 新增客户
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f1f5f9] text-[#475569] font-semibold text-xs">
            <tr>
              <th className="text-left px-4 py-3">客户名称</th>
              <th className="text-left px-3 py-3">等级</th>
              <th className="text-left px-3 py-3">阶段</th>
              <th className="text-left px-3 py-3">行业</th>
              <th className="text-left px-3 py-3">联系人</th>
              <th className="text-left px-3 py-3">手机号</th>
              <th className="text-left px-3 py-3">月预算</th>
              <th className="text-left px-3 py-3">日消耗</th>
              <th className="text-left px-3 py-3">负责人</th>
              <th className="text-left px-3 py-3">最近跟进</th>
              <th className="text-left px-3 py-3">下次跟进</th>
              <th className="text-center px-3 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedLeads.map((l) => {
              const tm = TIER_META[l.tier] || TIER_META.D;
              const sm = STAGE_META[l.stage] || {};
              return (
                <tr key={l.id} className="border-t border-slate-100 hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => setDetailLead(l)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#111827]">{l.name}</div>
                    <div className="text-[11px] text-[#6b7280]">{l.shopName || "-"}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ color: tm.color, background: tm.bg, border: `1px solid ${tm.border}` }}>{tm.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px]" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.border}` }}>{l.stage}</span>
                  </td>
                  <td className="px-3 py-3 text-[#374151]">{l.industry || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{l.contact || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{l.phone || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{l.budgetRange || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{l.dailyBudget ? "¥" + formatCurrency(l.dailyBudget) : "-"}</td>
                  <td className="px-3 py-3">
                    {isAdmin && assignLeadId === l.id ? (
                      <select className="px-2 py-1 border border-slate-300 rounded text-[11px] outline-none" value={l.assignedTo} onChange={e => handleAssign(l.id, e.target.value)} onBlur={() => setAssignLeadId(null)} onClick={e => e.stopPropagation()} autoFocus>
                        {salesNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <span className="text-[#374151] cursor-pointer hover:text-[#1d4ed8]" onClick={e => { e.stopPropagation(); if (isAdmin) setAssignLeadId(l.id); }}>{l.assignedTo}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[#6b7280] text-xs">{l.lastContactAt ? formatDate(l.lastContactAt) : "未跟进"}</td>
                  <td className="px-3 py-3 text-[#6b7280] text-xs">{l.nextContactAt ? formatDate(l.nextContactAt) : "-"}</td>
                  <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => { setFollowupLeadId(l.id); setShowFollowup(true); }} className="px-2 py-1 bg-[#dbeafe] text-[#1d4ed8] rounded text-[11px] hover:bg-[#bfdbfe]">跟进</button>
                      <button onClick={() => { setEditLeadData(l); setShowModal(true); }} className="px-2 py-1 bg-slate-100 text-[#475569] rounded text-[11px] hover:bg-slate-200">编辑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pagedLeads.length === 0 && (
              <tr><td colSpan={12} className="text-center py-12 text-[#6b7280] text-sm">暂无客户数据</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">共 {myLeads.length} 条，每页 {PAGE_SIZE} 条</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2.5 py-1 text-xs border border-slate-300 rounded disabled:opacity-30 hover:bg-slate-50">上一页</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) pageNum = i;
                else if (page < 4) pageNum = i;
                else if (page > totalPages - 4) pageNum = totalPages - 7 + i;
                else pageNum = page - 3 + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={`px-2.5 py-1 text-xs rounded ${page === pageNum ? "bg-[#1d4ed8] text-white" : "border border-slate-300 hover:bg-slate-50"}`}>{pageNum + 1}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-2.5 py-1 text-xs border border-slate-300 rounded disabled:opacity-30 hover:bg-slate-50">下一页</button>
            </div>
          </div>
        )}
      </div>

      {showModal && <LeadModal lead={editLeadData} onClose={() => { setShowModal(false); setEditLeadData(null); }} onSave={(data) => { if (editLeadData) editLead(editLeadData.id, data); else addLead(data); }} />}
      {detailLead && <LeadDetail lead={detailLead} onClose={() => setDetailLead(null)} />}
      {showFollowup && <FollowupModal leadId={followupLeadId} onClose={() => { setShowFollowup(false); setFollowupLeadId(null); }} onSave={addFollowup} />}
    </div>
  );
}
