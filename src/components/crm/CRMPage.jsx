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
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      rows.forEach((row) => {
        const lead = {
          name: row["客户名称"] || "",
          shopName: row["店铺名称"] || "",
          contact: row["联系人"] || "",
          phone: String(row["手机号"] || ""),
          industry: row["行业"] || "",
          clientType: row["客户类型"] || "",
          source: row["来源"] || "",
          tier: (row["等级"] || "D").replace("级", ""),
          stage: row["阶段"] || "待联系",
          status: row["投放状态"] || "新开发",
          budgetRange: row["预算范围"] || "",
          dailyBudget: Number(row["日消耗"] || 0),
          currentConsumption: Number(row["当月消耗"] || 0),
          assignedTo: row["负责人"] || currentUser?.name || "",
          remark: "",
          riskLevel: row["风险"] || "中",
        };
        if (lead.name && lead.phone) {
          addLead(lead);
        }
      });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleAssign = (leadId, newOwner) => {
    assignLead(leadId, newOwner);
    setAssignLeadId(null);
  };

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">客户管理</h2>
          <p className="text-xs text-[#6b7280] mt-0.5">增删改查 · 分级分类管理</p>
        </div>
        <button onClick={() => { setEditLeadData(null); setShowModal(true); }} className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm shrink-0">
          <span>+</span> 新增客户
        </button>
      </div>

      <StatCards onFilter={handleStatFilter} />

      {/* Filter Bar */}
      <div className="bg-white rounded-t-xl p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-xs">🔍</span>
            <input
              className="pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-[220px] bg-slate-50 outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10"
              placeholder="搜索客户名称/手机号"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <div className="flex border border-slate-300 rounded-lg overflow-x-auto scrollbar-none">
            {["全部", ...LEAD_TIERS].map((t) => (
              <button
                key={t}
                onClick={() => { setFilterTier(t); setPage(0); }}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  filterTier === t
                    ? "bg-[#1d4ed8] text-white"
                    : "text-[#475569] hover:bg-slate-50"
                }`}
              >
                {t === "全部" ? "全部" : t + "级"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <select className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none" value={filterStage} onChange={e => { setFilterStage(e.target.value); setPage(0); }}>
              <option value="全部">全部阶段</option>
              {LEAD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none" value={filterIndustry} onChange={e => { setFilterIndustry(e.target.value); setPage(0); }}>
              <option value="全部">全部行业</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            {isAdmin && (
              <select className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none" value={filterOwner} onChange={e => { setFilterOwner(e.target.value); setPage(0); }}>
                <option value="全部">全部负责人</option>
                {salesNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            )}
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <select className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}>
                <option value="全部">全部状态</option>
                {["新开发","跟进中","活跃投放","观望评估","暂停投放","已流失"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none" value={filterRisk} onChange={e => { setFilterRisk(e.target.value); setPage(0); }}>
                <option value="全部">全部风险</option>
                {["高","中","低"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                onClick={() => setFilterNoContact(!filterNoContact)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filterNoContact ? "bg-[#6d28d9] text-white" : "border border-slate-300 text-[#475569]"}`}
              >
                7天未联系
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button onClick={() => fileRef.current?.click()} className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-[#6b7280] hover:bg-slate-50">📥 导入</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          <button onClick={handleExport} className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-[#6b7280] hover:bg-slate-50">📤 导出</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-x-auto">
        <div className="min-w-[900px] sm:min-w-0">
        {/* Desktop: Table view */}
        <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-[#f1f5f9] text-[#475569] font-semibold text-xs">
            <tr>
              <th className="text-left px-4 py-3">客户名称</th>
              <th className="text-left px-3 py-3">等级</th>
              <th className="text-left px-3 py-3">阶段</th>
              <th className="text-left px-3 py-3">行业</th>
              <th className="text-left px-3 py-3">联系人</th>
              <th className="text-left px-3 py-3">手机号</th>
              <th className="text-left px-3 py-3">预算</th>
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
                  <td className="px-4 py-3 font-medium text-[#111827]">{l.name}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px]" style={{ color: tm.color, background: tm.bg, border: `1px solid ${tm.border}` }}>{tm.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px]" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.border}` }}>{l.stage}</span>
                  </td>
                  <td className="px-3 py-3 text-[#374151]">{l.industry || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{l.contact || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{l.phone ? <a href={"tel:" + l.phone} className="text-[#1d4ed8] hover:underline flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>{l.phone}</a> : "-"}</td>
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
        </div>
        </div>

        {/* Mobile: Card view */}
        <div className="md:hidden space-y-3 px-3 py-2">
          {pagedLeads.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280] text-sm">暂无客户数据</div>
          ) : (
            pagedLeads.map((l) => {
              const tm = TIER_META[l.tier] || {};
              const sm = STAGE_META[l.stage] || {};
              return (
                <div key={l.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] cursor-pointer" onClick={() => setDetailLead(l)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-[#111827] truncate">{l.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] shrink-0" style={{ color: tm.color, background: tm.bg }}>{tm.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] shrink-0" style={{ color: sm.color, background: sm.bg }}>{l.stage}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button onClick={(e) => { e.stopPropagation(); setFollowupLeadId(l.id); setShowFollowup(true); }} className="px-2 py-1 bg-[#dbeafe] text-[#1d4ed8] rounded text-[10px] font-medium">跟进</button>
                      <button onClick={(e) => { e.stopPropagation(); setEditLeadData(l); setShowModal(true); }} className="px-2 py-1 bg-slate-100 text-[#475569] rounded text-[10px]">编辑</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <div><span className="text-[#6b7280]">联系人:</span> <span className="text-[#374151]">{l.contact || "-"}</span></div>
                    <div><span className="text-[#6b7280]">手机号:</span> {l.phone ? <a href={"tel:" + l.phone} className="text-[#1d4ed8]" onClick={e => e.stopPropagation()}>{l.phone}</a> : <span className="text-[#374151]">-</span>}</div>
                    <div><span className="text-[#6b7280]">行业:</span> <span className="text-[#374151]">{l.industry || "-"}</span></div>
                    <div><span className="text-[#6b7280]">预算:</span> <span className="text-[#374151]">{l.budgetRange || "-"}</span></div>
                    <div><span className="text-[#6b7280]">负责人:</span> <span className="text-[#374151]">{l.assignedTo}</span></div>
                    <div><span className="text-[#6b7280]">风险:</span> <span className={`font-medium ${l.riskLevel === "高" ? "text-[#dc2626]" : l.riskLevel === "中" ? "text-[#b45309]" : "text-[#15803d]"}`}>{l.riskLevel}</span></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-[#6b7280]">
                    <span>最近跟进: {l.lastContactAt ? formatDate(l.lastContactAt) : "未跟进"}</span>
                    <span>下次: {l.nextContactAt ? formatDate(l.nextContactAt) : "-"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

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
