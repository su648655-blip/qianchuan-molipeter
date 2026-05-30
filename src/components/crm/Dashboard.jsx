import { useMemo } from "react";
import { useApp } from "../../store/AppContext";
import { TIER_META, STAGE_META, RISK_META } from "../../data/constants";
import { formatCurrency, formatDate } from "../../lib/utils";

export default function Dashboard() {
  const { leads, advertisers, followups, currentUser, isAdmin, salesNames } = useApp();

  const myLeads = useMemo(() => {
    if (isAdmin) return leads;
    return leads.filter(l => l.assignedTo === currentUser?.name);
  }, [leads, currentUser, isAdmin]);

  const myAds = useMemo(() => {
    if (isAdmin) return advertisers;
    return advertisers.filter(a => a.assignedTo === currentUser?.name);
  }, [advertisers, currentUser, isAdmin]);

  // Stats
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;

  const totalLeads = myLeads.length;
  const sTierCount = myLeads.filter(l => l.tier === "S").length;
  const aTierCount = myLeads.filter(l => l.tier === "A").length;
  const activeCount = myLeads.filter(l => l.status === "活跃投放").length;
  const riskCount = myLeads.filter(l => l.riskLevel === "高").length;
  const noContactCount = myLeads.filter(l => !l.lastContactAt || new Date(l.lastContactAt).getTime() < sevenDaysAgo).length;
  const dealCount = myLeads.filter(l => l.stage === "已成交").length;
  const lostCount = myLeads.filter(l => l.stage === "已流失").length;

  // Stage distribution
  const stageDist = useMemo(() => {
    const dist = {};
    ["待联系","已加微","已演示","待约面","推进合作","已成交","已流失"].forEach(s => {
      dist[s] = myLeads.filter(l => l.stage === s).length;
    });
    return dist;
  }, [myLeads]);

  // Tier distribution
  const tierDist = useMemo(() => {
    const dist = {};
    ["S","A","B","C","D"].forEach(t => {
      dist[t] = myLeads.filter(l => l.tier === t).length;
    });
    return dist;
  }, [myLeads]);

  // Recent followups
  const recentFollowups = useMemo(() => {
    const leadIds = new Set(myLeads.map(l => l.id));
    return followups
      .filter(f => leadIds.has(f.leadId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  }, [followups, myLeads]);

  // Top advertisers by consumption
  const topAds = useMemo(() => {
    return myAds
      .map(a => {
        const total = (a.metrics || []).reduce((s, m) => s + m.dailyConsumption, 0);
        return { ...a, totalConsumption: total };
      })
      .sort((a, b) => b.totalConsumption - a.totalConsumption)
      .slice(0, 5);
  }, [myAds]);

  // Per-sales stats (admin only)
  const salesStats = useMemo(() => {
    if (!isAdmin) return [];
    return salesNames.map(name => {
      const sl = leads.filter(l => l.assignedTo === name);
      return {
        name,
        total: sl.length,
        active: sl.filter(l => l.status === "活跃投放").length,
        deal: sl.filter(l => l.stage === "已成交").length,
        risk: sl.filter(l => l.riskLevel === "高").length,
        noContact: sl.filter(l => !l.lastContactAt || new Date(l.lastContactAt).getTime() < sevenDaysAgo).length,
      };
    });
  }, [isAdmin, leads, salesNames]);

  const statCards = [
    { label: "客户总数", value: totalLeads, icon: "👥", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    { label: "S级客户", value: sTierCount, icon: "👑", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    { label: "A级客户", value: aTierCount, icon: "⭐", bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    { label: "活跃投放", value: activeCount, icon: "📈", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    { label: "已成交", value: dealCount, icon: "✅", bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    { label: "流失风险", value: riskCount, icon: "⚠️", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    { label: "已流失", value: lostCount, icon: "❌", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
    { label: "7天未联系", value: noContactCount, icon: "⏰", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  ];

  const maxStage = Math.max(...Object.values(stageDist), 1);
  const maxTier = Math.max(...Object.values(tierDist), 1);

  return (
    <div className="animate-fadeUp space-y-5">
      <h2 className="text-lg font-bold text-[#111827]">
        {isAdmin ? "CRM 工作台 · 全局数据面板" : `${currentUser?.name} · 我的工作台`}
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-between">
            <div className={`${card.bg} ${card.text} ${card.border} rounded-full p-2.5 border flex items-center justify-center`}>
              <span className="text-lg">{card.icon}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#6b7280]">{card.label}</div>
              <div className={`text-2xl font-bold ${card.text}`}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Stage Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">客户阶段分布</h3>
          <div className="space-y-2.5">
            {Object.entries(stageDist).map(([stage, count]) => {
              const sm = STAGE_META[stage] || {};
              const pct = maxStage > 0 ? (count / maxStage) * 100 : 0;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs text-[#6b7280] w-16 shrink-0">{stage}</span>
                  <div className="flex-1 bg-[#f3f4f6] rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: sm.color || "#9ca3af" }} />
                  </div>
                  <span className="text-xs font-semibold text-[#374151] w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">客户等级分布</h3>
          <div className="space-y-2.5">
            {Object.entries(tierDist).map(([tier, count]) => {
              const tm = TIER_META[tier] || TIER_META.D;
              const pct = maxTier > 0 ? (count / maxTier) * 100 : 0;
              return (
                <div key={tier} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-12 shrink-0" style={{ color: tm.color }}>{tm.label}</span>
                  <div className="flex-1 bg-[#f3f4f6] rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tm.color }} />
                  </div>
                  <span className="text-xs font-semibold text-[#374151] w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Followups */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">最近跟进动态</h3>
          {recentFollowups.length === 0 ? (
            <div className="text-center py-8 text-[#9ca3af] text-sm">暂无跟进记录</div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentFollowups.map((f) => {
                const lead = myLeads.find(l => l.id === f.leadId);
                return (
                  <div key={f.id} className="flex gap-3 p-2.5 bg-[#f9fafb] rounded-lg">
                    <span className="px-1.5 py-0.5 bg-[#dbeafe] text-[#1d4ed8] rounded text-[10px] font-medium h-fit">{f.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#374151] truncate">{lead?.name || "未知客户"}</p>
                      <p className="text-xs text-[#6b7280] truncate mt-0.5">{f.content}</p>
                      <p className="text-[10px] text-[#9ca3af] mt-1">{formatDate(f.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Advertisers or Sales Stats */}
        {isAdmin ? (
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">员工业绩概览</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#f9fafb] text-[#6b7280]">
                  <tr>
                    <th className="text-left px-3 py-2">员工</th>
                    <th className="text-center px-2 py-2">客户</th>
                    <th className="text-center px-2 py-2">活跃</th>
                    <th className="text-center px-2 py-2">成交</th>
                    <th className="text-center px-2 py-2">风险</th>
                    <th className="text-center px-2 py-2">未联系</th>
                  </tr>
                </thead>
                <tbody>
                  {salesStats.map((s) => (
                    <tr key={s.name} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-[#374151]">{s.name}</td>
                      <td className="px-2 py-2 text-center text-[#374151]">{s.total}</td>
                      <td className="px-2 py-2 text-center text-[#15803d] font-medium">{s.active}</td>
                      <td className="px-2 py-2 text-center text-[#1d4ed8] font-medium">{s.deal}</td>
                      <td className="px-2 py-2 text-center text-[#dc2626] font-medium">{s.risk}</td>
                      <td className="px-2 py-2 text-center text-[#6d28d9] font-medium">{s.noContact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">TOP5 合作客户消费</h3>
            {topAds.length === 0 ? (
              <div className="text-center py-8 text-[#9ca3af] text-sm">暂无合作客户</div>
            ) : (
              <div className="space-y-3">
                {topAds.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 bg-[#f9fafb] rounded-lg">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#374151] truncate">{a.name}</p>
                      <p className="text-[10px] text-[#9ca3af]">{a.shopName}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#1d4ed8]">¥{formatCurrency(a.totalConsumption)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
