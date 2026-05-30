import React from "react";
import { useState, useMemo, useRef } from "react";
import { useApp } from "../../store/AppContext";

function renderAIOutput(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const els = [];

  const highlight = (s) => {
    return s
      .replace(/(\d+\.?\d*%?)/g, '<span class="text-[#c2410c] font-semibold">$1</span>')
      .replace(/(¥[\d,]+[万]?)/g, '<span class="text-[#15803d] font-semibold">$1</span>')
      .replace(/(消耗|预算|ROI|CTR|CVR|CPM|转化|点击)/g, '<span class="text-[#1d4ed8] font-medium">$1</span>');
  };

  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;

    const hm = t.match(/^#{2,3}\s+(.+)/);
    if (hm) { els.push(React.createElement("h3", { key: i, className: "text-sm font-bold text-[#1d4ed8] mt-4 mb-2 pb-1 border-b border-blue-100" }, hm[1])); return; }

    const bm = t.match(/^\*\*(.+?)\*\*$/);
    if (bm) { els.push(React.createElement("p", { key: i, className: "text-sm font-semibold text-[#111827] mt-2 mb-1" }, bm[1])); return; }

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

    const ph = t.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#111827]">$1</strong>');
    els.push(React.createElement("p", { key: i, className: "text-sm text-[#374151] leading-relaxed mb-1", dangerouslySetInnerHTML: { __html: highlight(ph) } }));
  });
  return React.createElement("div", null, els);
}

export default function AIDiagnosisTool() {
  const { advertisers, leads, followups, apiKey, currentUser, isAdmin } = useApp();
  const [selectedAdId, setSelectedAdId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [loadingStep, setLoadingStep] = useState("");
  const resultRef = useRef(null);

  const myAdvertisers = useMemo(function () {
    if (isAdmin) return advertisers;
    return advertisers.filter(function (a) { return a.assignedTo === currentUser.name; });
  }, [advertisers, currentUser, isAdmin]);

  const filteredAds = useMemo(function () {
    if (!searchText) return myAdvertisers.slice(0, 20);
    var s = searchText.toLowerCase();
    return myAdvertisers.filter(function (a) {
      return a.name.toLowerCase().includes(s) || a.shopName.toLowerCase().includes(s);
    }).slice(0, 20);
  }, [myAdvertisers, searchText]);

  const selectedAd = myAdvertisers.find(function (a) { return a.id === selectedAdId; });
  const linkedLead = selectedAd ? leads.find(function (l) { return l.id === selectedAd.leadId; }) : null;
  const leadFollowups = useMemo(function () {
    return linkedLead ? followups.filter(function (f) { return f.leadId === linkedLead.id; }).slice(0, 5) : [];
  }, [followups, linkedLead]);
  var metrics = selectedAd && selectedAd.metrics ? selectedAd.metrics.slice(0, 10) : [];

  function handleSelect(ad) {
    setSelectedAdId(ad.id);
    setSearchText(ad.name + " - " + ad.shopName);
    setShowDropdown(false);
    setResult("");
  }

  async function handleGenerate() {
    if (!selectedAd) return;
    setLoading(true);
    setResult("");
    var steps = ["读取店铺投放数据…", "分析指标趋势…", "结合跟进记录诊断…", "生成诊断报告…"];
    var stepIdx = 0;
    setLoadingStep(steps[0]);
    var interval = setInterval(function () {
      stepIdx++;
      if (stepIdx < steps.length) setLoadingStep(steps[stepIdx]);
    }, 1000);

    var latestMetrics = metrics[0];
    var avgCtr = metrics.length > 0 ? (metrics.reduce(function (s, m) { return s + m.ctr; }, 0) / metrics.length).toFixed(2) : "N/A";
    var avgCvr = metrics.length > 0 ? (metrics.reduce(function (s, m) { return s + m.cvr; }, 0) / metrics.length).toFixed(2) : "N/A";
    var avgRoi = metrics.length > 0 ? (metrics.reduce(function (s, m) { return s + m.roi; }, 0) / metrics.length).toFixed(2) : "N/A";

    var prompt = "你是一位抖音千川广告投放诊断专家。请对以下客户进行全面的诊断分析。\n\n【客户信息】\n- 客户名称: " + selectedAd.name + "\n- 店铺名称: " + selectedAd.shopName + "\n- 行业: " + (selectedAd.industry || "未知") + "\n- 主推产品: " + (selectedAd.mainProduct || "未知") + "\n- 客单价: " + (selectedAd.unitPrice ? "¥" + selectedAd.unitPrice : "未知") + "\n- 返点: " + (selectedAd.rebate ? selectedAd.rebate + "%" : "未知") + "\n\n【投放数据（最近）】\n" + (latestMetrics ? "- 日消耗: ¥" + latestMetrics.dailyConsumption + "\n- CPM: " + latestMetrics.cpm + "\n- CTR: " + latestMetrics.ctr + "%\n- CVR: " + latestMetrics.cvr + "%\n- ROI: " + latestMetrics.roi : "暂无投放数据") + "\n\n【30天平均数据】\n- 平均CTR: " + avgCtr + "%\n- 平均CVR: " + avgCvr + "%\n- 平均ROI: " + avgRoi + "\n\n【CRM阶段】\n" + (linkedLead ? "- 客户阶段: " + linkedLead.stage + "\n- 客户等级: " + linkedLead.tier + "级\n- 投放状态: " + linkedLead.status : "未关联CRM客户") + "\n\n【近期跟进记录】\n" + (leadFollowups.map(function (f, i) { return (i + 1) + ". [" + f.type + "] " + f.content; }).join("\n") || "暂无跟进记录") + "\n\n请输出以下诊断内容，使用纯文本，不要使用任何emoji或特殊符号：\n\n## 客户真实需求\n## 当前阶段分析\n## 成交阻碍\n## 推荐推进策略\n## 推荐跟进节奏";

    try {
      var response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "你是一位专业的抖音千川广告投放诊断专家。" },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });
      var data = await response.json();
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
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <h3 className="text-sm font-semibold text-[#111827]">选择店铺</h3>
        <div className="relative">
          <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10" placeholder="输入店铺名称搜索…" value={searchText}
            onChange={function (e) { setSearchText(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedAdId(""); }}
            onFocus={function () { setShowDropdown(true); }}
            onBlur={function () { setTimeout(function () { setShowDropdown(false); }, 200); }}
          />
          {showDropdown && filteredAds.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredAds.map(function (a) {
                return (
                  <div key={a.id} className={"px-3 py-2 text-sm cursor-pointer hover:bg-[#eff6ff] " + (selectedAdId === a.id ? "bg-[#eff6ff] text-[#1d4ed8]" : "text-[#374151]")}
                    onMouseDown={function () { handleSelect(a); }}>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-[11px] text-[#6b7280]">{a.shopName} · {a.industry || "-"}</div>
                  </div>
                );
              })}
            </div>
          )}
          {showDropdown && filteredAds.length === 0 && searchText && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs text-[#6b7280]">未找到匹配的店铺</div>
          )}
        </div>
        {selectedAd && (
          <div className="p-3 bg-[#f8fafc] rounded-lg text-xs space-y-1.5 border border-slate-200">
            <div className="flex justify-between"><span className="text-[#6b7280]">店铺</span><span className="text-[#111827]">{selectedAd.shopName}</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">行业</span><span className="text-[#111827]">{selectedAd.industry || "-"}</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">主推产品</span><span className="text-[#111827]">{selectedAd.mainProduct || "-"}</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">返点</span><span className="text-[#111827]">{selectedAd.rebate ? selectedAd.rebate + "%" : "-"}</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">投放数据</span><span className="text-[#111827]">{metrics.length}条记录</span></div>
            <div className="flex justify-between"><span className="text-[#6b7280]">跟进记录</span><span className="text-[#111827]">{leadFollowups.length}条</span></div>
          </div>
        )}
        <button onClick={handleGenerate} disabled={!selectedAd || !apiKey || loading}
          className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] disabled:bg-[#d1d5db] disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          {loading ? React.createElement("span", { className: "flex items-center gap-2" }, React.createElement("span", { className: "w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" }), "诊断中") : "🔍 开始诊断"}
        </button>
      </div>
      <div className="col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" ref={resultRef}>
        <h3 className="text-sm font-semibold text-[#111827] mb-4">诊断报告</h3>
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
            {!apiKey ? React.createElement(React.Fragment, null, React.createElement("span", { className: "text-2xl" }, "🔑"), React.createElement("p", null, "请先在顶部导航栏配置 DeepSeek API Key")) : React.createElement(React.Fragment, null, React.createElement("span", { className: "text-2xl" }, "📊"), React.createElement("p", null, "请选择店铺后点击开始诊断"))}
          </div>
        )}
      </div>
    </div>
  );
}
