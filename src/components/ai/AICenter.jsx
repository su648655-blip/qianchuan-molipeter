import { useState } from "react";
import { AI_SUB_TABS } from "../../data/constants";
import AIScriptTool from "./AIScriptTool";
import AIDiagnosisTool from "./AIDiagnosisTool";
import AIMaterialTool from "./AIMaterialTool";

export default function AICenter() {
  const [subTab, setSubTab] = useState("script");

  return (
    <div className="animate-fadeUp">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#111827]">AI 智能分析中心</h2>
        <p className="text-xs text-[#6b7280] mt-0.5">AI辅助销售 · 提升话术输出 · 客户诊断 · 素材优化</p>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-slate-200">
        {AI_SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              subTab === t.id
                ? "bg-[#1d4ed8] text-white shadow-sm"
                : "text-[#475569] hover:bg-slate-50 hover:text-[#1d4ed8]"
            }`}
          >
            <div>{t.label}</div>
            <div className={`text-[11px] font-normal mt-0.5 ${subTab === t.id ? "text-blue-100" : "text-[#6b7280]"}`}>{t.desc}</div>
          </button>
        ))}
      </div>

      {subTab === "script" && <AIScriptTool />}
      {subTab === "diagnosis" && <AIDiagnosisTool />}
      {subTab === "material" && <AIMaterialTool />}
    </div>
  );
}
