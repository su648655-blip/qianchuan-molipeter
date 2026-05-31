import { TABS } from "../../data/constants";

export default function MobileBottomBar({ activeTab, onTabChange, isAdmin }) {
  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-0 px-1 h-full transition-colors ${
              activeTab === t.id
                ? "text-[#1d4ed8]"
                : "text-[#6b7280]"
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            <span className={`text-[10px] font-medium whitespace-nowrap ${activeTab === t.id ? "font-semibold" : ""}`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
