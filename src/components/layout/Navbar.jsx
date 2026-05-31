import { useState } from "react";
import { useApp } from "../../store/AppContext";
import { TABS } from "../../data/constants";

export default function Navbar({ activeTab, onTabChange }) {
  const { currentUser, isAdmin, apiKey, editingKey, setEditingKey, saveApiKey, logout } = useApp();
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sticky top-0 z-[200]">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 flex items-center min-h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-8 shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-[#1d4ed8] to-[#1e40af] rounded-lg flex items-center justify-center text-sm">
            🎯
          </div>
          <div>
            <div className="hidden sm:block text-sm font-bold text-[#111827] leading-tight">千川销售管理系统</div>
            <div className="hidden sm:block text-[10px] text-[#6b7280]">抖音电商 · 收量业务</div>
          </div>
        </div>

        {/* Tabs - hidden on mobile, shown on md+ */}
        <div className="hidden md:flex gap-0.5 overflow-x-auto scrollbar-none">
          {TABS.filter(t => !t.adminOnly || isAdmin).map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`relative px-4 h-14 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                activeTab === t.id
                  ? "text-[#1d4ed8]"
                  : "text-[#6b7280] hover:text-[#1d4ed8]"
              }`}
            >
              <span className="text-sm">{t.icon}</span>
              <span className={`hidden sm:inline text-[11px] font-medium whitespace-nowrap ${activeTab === t.id ? "font-semibold" : ""}`}>{t.label}</span>
              {activeTab === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1d4ed8] rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-3">
          {/* API Key — available to all users */}
          {editingKey ? (
            <div className="relative flex items-center gap-1">
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  onBlur={() => { if (keyInput) saveApiKey(keyInput); else setEditingKey(false); }}
                  onKeyDown={e => { if (e.key === "Enter" && keyInput) saveApiKey(keyInput); }}
                  placeholder="输入您的 DeepSeek API Key…"
                  autoFocus
                  className="w-[140px] sm:w-[220px] px-2.5 py-1 pr-8 text-[11px] border border-slate-300 rounded-md bg-slate-50 h-7 outline-none focus:border-[#1d4ed8]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-[#6b7280] hover:text-[#374151] cursor-pointer select-none"
                  tabIndex={-1}
                >
                  {showKey ? "🙈" : "👁️"}
                </button>
              </div>
              <button
                onClick={() => { saveApiKey(""); setKeyInput(""); setEditingKey(false); }}
                className="text-[#dc2626] text-[11px] whitespace-nowrap hover:underline cursor-pointer"
              >
                清除
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] cursor-default">
              <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? "bg-[#15803d]" : "bg-[#d1d5db]"}`} />
              <span className={apiKey ? "text-[#15803d]" : "text-[#6b7280]"}>
                {apiKey ? "DeepSeek API 已配置" : "配置 DeepSeek API"}
              </span>
              <button
                onClick={() => { setEditingKey(true); setKeyInput(""); setShowKey(false); }}
                className="text-[#1d4ed8] underline cursor-pointer text-[11px]"
              >
                {apiKey ? "更换" : "去配置"}
              </button>
              {apiKey && (
                <button
                  onClick={() => { saveApiKey(""); }}
                  className="text-[#dc2626] text-[11px] ml-1 hover:underline cursor-pointer"
                >
                  清除
                </button>
              )}
            </div>
          )}

          <span className="hidden sm:inline text-[11px] text-[#6b7280]">当前：</span>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
            isAdmin
              ? "bg-[#fef3c7] border-[#fcd34d] text-[#b45309]"
              : "bg-[#dbeafe] border-[#93c5fd] text-[#1d4ed8]"
          }`}>
            {(currentUser?.name || "?")[0]}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-[#111827]">{currentUser?.name}</span>

          {isAdmin && (
            <span className="bg-[#c2410c] text-white px-1.5 py-0.5 rounded text-[10px] font-medium">管理员</span>
          )}

          <button onClick={logout} className="text-[11px] text-[#6b7280] hover:text-[#111827] transition-colors ml-1"><span className="hidden sm:inline">退出</span><span className="sm:hidden">🚪</span></button>
        </div>
      </div>
    </div>
  );
}
