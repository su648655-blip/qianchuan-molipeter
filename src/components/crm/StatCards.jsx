import { useMemo } from "react";
import { useApp } from "../../store/AppContext";

export default function StatCards({ onFilter }) {
  const { leads, currentUser, isAdmin } = useApp();

  const myLeads = useMemo(() => {
    if (isAdmin) return leads;
    return leads.filter(l => l.assignedTo === currentUser?.name);
  }, [leads, currentUser, isAdmin]);

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;

  const cards = [
    { key: "total", label: "客户总数", value: myLeads.length, icon: "👥", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", filter: { reset: true } },
    { key: "sTier", label: "S级客户", value: myLeads.filter(l => l.tier === "S").length, icon: "👑", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", filter: { tier: "S" } },
    { key: "active", label: "活跃投放", value: myLeads.filter(l => l.status === "活跃投放").length, icon: "📈", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", filter: { status: "活跃投放" } },
    { key: "risk", label: "流失风险", value: myLeads.filter(l => l.riskLevel === "高").length, icon: "⚠️", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", filter: { risk: "高" } },
    { key: "noContact", label: "7天未联系", value: myLeads.filter(l => !l.lastContactAt || new Date(l.lastContactAt).getTime() < sevenDaysAgo).length, icon: "⏰", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", filter: { noContact: true } },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mb-5">
      {cards.map((card) => (
        <div
          key={card.key}
          onClick={() => card.filter && onFilter?.(card.filter)}
          className={`bg-white rounded-xl p-4 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-between ${
            card.filter ? "cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:border-slate-300 transition-all" : ""
          }`}
        >
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
  );
}
