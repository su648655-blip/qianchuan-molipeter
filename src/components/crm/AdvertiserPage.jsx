import { useState, useMemo } from "react";
import { useApp } from "../../store/AppContext";
import { INDUSTRIES, RISK_META } from "../../data/constants";
import { formatCurrency } from "../../lib/utils";
import AdvertiserModal from "./AdvertiserModal";
import AdvertiserDetail from "./AdvertiserDetail";

const PAGE_SIZE = 15;

export default function AdvertiserPage() {
  const { advertisers, currentUser, isAdmin, salesNames } = useApp();
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("全部");
  const [filterOwner, setFilterOwner] = useState("全部");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [page, setPage] = useState(0);
  const detail = useMemo(() => detailId ? advertisers.find(a => a.id === detailId) : null, [detailId, advertisers]);

  const myAds = useMemo(() => {
    let list = isAdmin ? advertisers : advertisers.filter(a => a.assignedTo === currentUser?.name);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(s) || a.shopName.toLowerCase().includes(s) || (a.phone || "").includes(s) || (a.assignedTo || "").toLowerCase().includes(s));
    }
    if (filterIndustry !== "全部") list = list.filter(a => a.industry === filterIndustry);
    if (filterOwner !== "全部") list = list.filter(a => a.assignedTo === filterOwner);
    return list.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [advertisers, currentUser, isAdmin, search, filterIndustry, filterOwner]);

  const totalPages = Math.ceil(myAds.length / PAGE_SIZE);
  const paged = myAds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getLatestMetrics = (ad) => {
    if (!ad.metrics || ad.metrics.length === 0) return null;
    return ad.metrics[0];
  };

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">合作客户管理</h2>
          <p className="text-xs text-[#6b7280] mt-0.5">管理正式合作客户及投放数据</p>
        </div>
        <button onClick={() => { setEditData(null); setShowModal(true); }} className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm shrink-0">
          <span>+</span> 新增在投客户
        </button>
      </div>

      <div className="bg-white rounded-t-xl p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="relative w-full sm:w-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-xs">🔍</span>
          <input className="pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-[220px] bg-slate-50 outline-none focus:border-[#1d4ed8]" placeholder="搜索客户/店铺/手机号" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <select className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none focus:border-[#1d4ed8] w-full sm:w-auto" value={filterIndustry} onChange={e => { setFilterIndustry(e.target.value); setPage(0); }}>
          <option value="全部">全部行业</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        {isAdmin && (
          <select className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none focus:border-[#1d4ed8] w-full sm:w-auto" value={filterOwner} onChange={e => { setFilterOwner(e.target.value); setPage(0); }}>
            <option value="全部">全部负责人</option>
            {salesNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </div>

      <div className="bg-white rounded-b-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-x-auto">
        {/* Desktop: Table view */}
        <div className="hidden md:block min-w-[1100px] sm:min-w-0">
        <table className="w-full text-sm">
          <thead className="bg-[#f1f5f9] text-[#475569] font-semibold text-xs">
            <tr>
              <th className="text-left px-4 py-3">客户名称</th>
              <th className="text-left px-3 py-3">店铺名称</th>
              <th className="text-left px-3 py-3">行业</th>
              <th className="text-left px-3 py-3">联系人</th>
              <th className="text-left px-3 py-3">手机号</th>
              <th className="text-left px-3 py-3">负责人</th>
              <th className="text-left px-3 py-3">月消耗</th>
              <th className="text-left px-3 py-3">CPM</th>
              <th className="text-left px-3 py-3">CTR</th>
              <th className="text-left px-3 py-3">CVR</th>
              <th className="text-left px-3 py-3">ROI</th>
              <th className="text-left px-3 py-3">主投产品</th>
              <th className="text-left px-3 py-3">开始合作</th>
              <th className="text-left px-3 py-3">返点</th>
              <th className="text-left px-3 py-3">风险</th>
              <th className="text-center px-3 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((a) => {
              const m = getLatestMetrics(a);
              const rm = RISK_META[a.riskLevel] || {};
              return (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => setDetailId(a.id)}>
                  <td className="px-4 py-3 font-medium text-[#111827]">{a.name}</td>
                  <td className="px-3 py-3 text-[#374151]">{a.shopName || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{a.industry || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{a.contact || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{a.phone ? <a href={"tel:" + a.phone} className="text-[#1d4ed8] hover:underline flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>{a.phone}</a> : "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{a.assignedTo || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{m ? "¥" + formatCurrency(m.dailyConsumption * 30) : "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{m ? m.cpm : "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{m ? m.ctr + "%" : "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{m ? m.cvr + "%" : "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{m ? m.roi : "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{a.mainProduct || "-"}</td>
                  <td className="px-3 py-3 text-[#6b7280] text-xs">{a.startDate || "-"}</td>
                  <td className="px-3 py-3 text-[#374151]">{a.rebate ? a.rebate + "%" : "-"}</td>
                  <td className="px-3 py-3">
                    <span className="px-1.5 py-0.5 rounded text-[11px]" style={{ color: rm.color, background: rm.bg }}>{a.riskLevel || "-"}</span>
                  </td>
                  <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditData(a); setShowModal(true); }} className="px-2 py-1 bg-slate-100 text-[#475569] rounded text-[11px] hover:bg-slate-200">编辑</button>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr><td colSpan={16} className="text-center py-12 text-[#6b7280] text-sm">暂无合作客户数据</td></tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Mobile: Card view */}
        <div className="md:hidden space-y-3 px-3 py-2">
          {paged.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280] text-sm">暂无合作客户数据</div>
          ) : (
            paged.map((a) => {
              const m = getLatestMetrics(a);
              const rm = RISK_META[a.riskLevel] || {};
              return (
                <div key={a.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] cursor-pointer" onClick={() => setDetailId(a.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-[#111827] truncate">{a.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] shrink-0" style={{ color: rm.color, background: rm.bg }}>{a.riskLevel}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setEditData(a); setShowModal(true); }} className="px-2 py-1 bg-slate-100 text-[#475569] rounded text-[10px] shrink-0 ml-1">编辑</button>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <div><span className="text-[#6b7280]">店铺:</span> <span className="text-[#374151]">{a.shopName || "-"}</span></div>
                    <div><span className="text-[#6b7280]">行业:</span> <span className="text-[#374151]">{a.industry || "-"}</span></div>
                    <div><span className="text-[#6b7280]">负责人:</span> <span className="text-[#374151]">{a.assignedTo || "-"}</span></div>
                    <div><span className="text-[#6b7280]">联系人:</span> <span className="text-[#374151]">{a.contact || "-"}</span></div>
                    <div>{a.phone ? <a href={"tel:" + a.phone} className="text-[#1d4ed8] text-xs flex items-center gap-0.5" onClick={e => e.stopPropagation()}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>{a.phone}</a> : <span className="text-[#6b7280]">-</span>}</div>
                    <div><span className="text-[#6b7280]">月消耗:</span> <span className="text-[#374151]">{m ? "¥" + formatCurrency(m.dailyConsumption * 30) : "-"}</span></div>
                    <div><span className="text-[#6b7280]">ROI:</span> <span className="font-medium text-[#1d4ed8]">{m ? m.roi : "-"}</span></div>
                    <div><span className="text-[#6b7280]">主投:</span> <span className="text-[#374151]">{a.mainProduct || "-"}</span></div>
                    <div><span className="text-[#6b7280]">返点:</span> <span className="text-[#374151]">{a.rebate ? a.rebate + "%" : "-"}</span></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-[#6b7280]">
                    <span>开始合作: {a.startDate || "-"}</span>
                    <span>CPM: {m ? m.cpm : "-"} · CTR: {m ? m.ctr + "%" : "-"} · CVR: {m ? m.cvr + "%" : "-"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">共 {myAds.length} 条，每页 {PAGE_SIZE} 条</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2.5 py-1 text-xs border border-slate-300 rounded disabled:opacity-30 hover:bg-slate-50">上一页</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) pageNum = i;
                else if (page < 4) pageNum = i;
                else if (page > totalPages - 4) pageNum = totalPages - 7 + i;
                else pageNum = page - 3 + i;
                return <button key={pageNum} onClick={() => setPage(pageNum)} className={`px-2.5 py-1 text-xs rounded ${page === pageNum ? "bg-[#1d4ed8] text-white" : "border border-slate-300 hover:bg-slate-50"}`}>{pageNum + 1}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-2.5 py-1 text-xs border border-slate-300 rounded disabled:opacity-30 hover:bg-slate-50">下一页</button>
            </div>
          </div>
        )}
      </div>

      {showModal && <AdvertiserModal ad={editData} onClose={() => { setShowModal(false); setEditData(null); }} />}
      {detail && <AdvertiserDetail ad={detail} onClose={() => setDetailId(null)} />}
    </div>
  );
}
