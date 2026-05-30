import React from "react";
import { useState, useMemo, useRef } from "react";
import { useApp } from "../../store/AppContext";

const SCENES = ["首次破冰", "二次跟进", "邀约面谈", "返点竞争", "大促邀约", "拒绝挽回"];

function renderAIOutput(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const els = [];
  let inList = false;

  const closeList = () => {
    if (inList) { els.push(React.createElement("ul", { key: "ul-" + els.length, className: "space-y-1 my-1" })); inList = false; }
  };

  const highlight = (s) => {
    return s
      .replace(/(\d+\.?\d*%?)/g, '<span class="text-[#c2410c] font-semibold">$1</span>')
      .replace(/(¥[\d,]+[万]?)/g, '<span class="text-[#15803d] font-semibold">$1</span>')
      .replace(/(消耗|预算|ROI|CTR|CVR|CPM|转化|点击)/g, '<span class="text-[#1d4ed8] font-medium">$1</span>');
  };

  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) { closeList(); return; }

    // ## heading
    const hm = t.match(/^#{2,3}\s+(.+)/);
    if (hm) { closeList(); els.push(React.createElement("h3", { key: i, className: "text-sm font-bold text-[#1d4ed8] mt-4 mb-2 pb-1 border-b border-blue-100" }, hm[1])); return; }

    // **bold**
    const bm = t.match(/^\*\*(.+?)\*\*$/);
    if (bm) { closeList(); els.push(React.createElement("p", { key: i, className: "text-sm font-semibold text-[#111827] mt-2 mb-1" }, bm[1])); return; }

    // list item
    const lm = t.match(/^[-•]\s+(.+)/);
    const nm = t.match(/^\d+[.、]\s+(.+)/);
    if (lm || nm) {
      const c = (lm ? lm[1] : nm[1]) || t;
      const h = highlight(c);
      els.push(React.createElement("li", { key: i, className: "text-sm text-[#374151] pl-4 flex items-start gap-1.5" },
        React.createElement("span", { className: "text-[#1d4ed8] mt-0.5 shrink-0" }, "\u25B8"),
        React.createElement("span", { dangerouslySetInnerHTML: { __html: h } })
      ));
      return;
    }
    closeList();

    // plain
    const ph = t.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#111827]">$1</strong>');
    els.push(React.createElement("p", { key: i, className: "text-sm text-[#374151] leading-relaxed mb-1", dangerouslySetInnerHTML: { __html: highlight(ph) } }));
  });
  closeList();
  return React.createElement("div", null, els);
}

export default function AIScriptTool() {
  const { leads, followups, apiKey, currentUser, isAdmin } = useApp();
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [scene, setScene] = useState("首次破冰");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const resultRef = useRef(null);

  const myLeads = useMemo(() => {
    if (isAdmin) return leads;
    return leads.filter(l => l.assignedTo === currentUser?.name);
  }, [leads, currentUser, isAdmin]);

  const filteredLeads = useMemo(() => {
    if (!searchText) return myLeads.slice(0, 20);
    const s = searchText.toLowerCase();
    return myLeads.filter(l => l.name.toLowerCase().includes(s) || l.assignedTo.toLowerCase().includes(s)).slice(0, 20);
  }, [myLeads, searchText]);

  const selectedLead = myLeads.find(l => l.id === selectedLeadId);
  const leadFollowups = useMemo(
    () => selectedLead ? followups.filter(f => f.leadId === selectedLead.id).slice(0, 5) : [],
    [followups, selectedLead]
  );

  const handleSelect = (lead) => {
    setSelectedLeadId(lead.id);
    setSearchText(lead.name);
    setShowDropdown(false);
    setResult("");
  };

  const handleGenerate = async () => {
    if (!selectedLead) return;
    setLoading(true);
    setResult("");
    const steps = ["正在分析客户画像…", "匹配跟进记录…", "生成话术内容…", "优化表达方式…"];
    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) setLoadingStep(steps[stepIdx]);
    }, 800);

    const prompt = "你是一位资深的抖音千川广告销售专家。请为以下客户生成一段" + scene + "的销售话术。\n\n【客户信息】\n- 客户名称: " + selectedLead.name + "\n- 行业: " + (selectedLead.industry || "未知") + "\n- 客户等级: " + selectedLead.tier + "级\n- 客户阶段: " + selectedLead.stage + "\n- 投放状态: " + selectedLead.status + "\n- 月预算范围: " + (selectedLead.budgetRange || "未知") + "\n- 备注: " + (selectedLead.remark || "无") + "\n\n【近期跟进记录】\n" + (leadFollowups.map((f, i) => (i + 1) + ". [" + f.type + "] " + f.content).join("\n") || "暂无跟进记录") + "\n\n请生成一段自然、专业、有说服力的话术，注意：\n1. 语气要符合场景特点\n2. 结合客户的行业和预算情况\n3. 突出千川投放的价值\n4. 提供具体的行动建议\n5. 控制在300字以内\n6. 使用纯文本，不要使用任何emoji或特殊符号";

    try {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "你是一位专业的抖音千川广告销售话术专家。" },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      });
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        setResult(data.choices[0].message.content);
      } else {
        setResult("生成失败，请检查 API Key 是否有效。");
      }
    } catch (err) {
      setResult("请求失败，请检查网络或 API Key 配置。");
    }
    clearInterval(interval);
    setLoading(false);
    setLoadingStep("");
    setTimeout(function () { if (resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
  };

  const handleCopy = function () {
    var plain = result.replace(/\*\*|##|#/g, "").trim();
    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2000);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <h3 className="text-sm font-semibold text-[#111827]">输入参数</h3>

        <div className="relative">
          <label className="block text-xs font-medium text-[#475569] mb-1.5">选择客户（可搜索）</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10"
            placeholder="输入客户名称搜索…"
            value={searchText}
            onChange={function (e) { setSearchText(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedLeadId(""); }}
            onFocus={function () { setShowDropdown(true); }}
            onBlur={function () { setTimeout(function () { setShowDropdown(false); }, 200); }}
          />
          {showDropdown && filteredLeads.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredLeads.map(function (l) {
                return (
                  <div
                    key={l.id}
                    className={"px-3 py-2 text-sm cursor-pointer hover:bg-[#eff6ff] " + (selectedLeadId === l.id ? "bg-[#eff6ff] text-[#1d4ed8]" : "text-[#374151]")}
                    onMouseDown={function () { handleSelect(l); }}
                  >
                    <div className="font-medium">{l.name}</div>
                    <div className="text-[11px] text-[#6b7280]">{l.assignedTo} · {l.tier}级 · {l.stage}</div>
                  </div>
                );
              })}
            </div>
          )}
          {showDropdown && filteredLeads.length === 0 && searchText && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs text-[#6b7280]">未找到匹配的客户</div>
          )}
        </div>

        {selectedLead && (
          <div className="p-3 bg-[#f8fafc] rounded-lg text-xs space-y-1.5 border border-slate-200">
            <div className="flex justify-between"><span className="text-[#6b7280]">行业</span><span className="text-[#111827]">{selectedLead.industry || "-"}</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">等级</span><span className="text-[#111827]">{selectedLead.tier}级</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">阶段</span><span className="text-[#111827]">{selectedLead.stage}</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">预算</span><span className="text-[#111827]">{selectedLead.budgetRange || "-"}</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">跟进记录</span><span className="text-[#111827]">{leadFollowups.length}条</span></div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5">话术场景</label>
          <div className="flex flex-wrap gap-1.5">
            {SCENES.map(function (s) {
              return (
                <button
                  key={s}
                  onClick={function () { setScene(s); }}
                  className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (scene === s ? "bg-[#1d4ed8] text-white" : "bg-slate-50 text-[#475569] border border-slate-200 hover:border-[#1d4ed8]")}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!selectedLead || !apiKey || loading}
          className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] disabled:bg-[#d1d5db] disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? React.createElement("span", { className: "flex items-center gap-2" }, React.createElement("span", { className: "w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" }), "生成中") : "✨ 生成话术"}
        </button>
      </div>

      <div className="col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" ref={resultRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#111827]">生成结果</h3>
          {result && (
            <button onClick={handleCopy} className="px-3 py-1.5 bg-[#dbeafe] text-[#1d4ed8] rounded-lg text-xs font-medium hover:bg-[#bfdbfe] transition-colors">{copied ? "✓ 已复制" : "📋 一键复制"}</button>
          )}
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 border-3 border-[#dbeafe] rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-3 border-[#1d4ed8] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-[#6b7280] animate-pulse">{loadingStep || "处理中…"}</p>
          </div>
        ) : result ? (
          <div className="p-5 bg-[#f8fafc] rounded-lg border border-slate-200 leading-relaxed max-h-[600px] overflow-y-auto">{renderAIOutput(result)}</div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-[#6b7280] text-sm gap-2">
            {!apiKey ? React.createElement(React.Fragment, null, React.createElement("span", { className: "text-2xl" }, "🔑"), React.createElement("p", null, "请先在顶部导航栏配置 DeepSeek API Key")) : React.createElement(React.Fragment, null, React.createElement("span", { className: "text-2xl" }, "💬"), React.createElement("p", null, "请选择客户和场景后点击生成"))}
          </div>
        )}
      </div>
    </div>
  );
}
