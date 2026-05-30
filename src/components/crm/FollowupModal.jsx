import { useState } from "react";
import { FOLLOWUP_TYPES } from "../../data/constants";

export default function FollowupModal({ leadId, onClose, onSave }) {
  const [form, setForm] = useState({
    type: "电话", content: "", contactAt: new Date().toISOString().slice(0, 16), nextContactAt: "", attachment: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.content) { setError("请输入跟进内容"); return; }
    onSave({ ...form, leadId });
    onClose();
  };

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] w-full max-w-lg animate-slideDown" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111827]">新增跟进记录</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#111827] text-lg">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && <div className="p-2 bg-[#fee2e2] text-[#dc2626] rounded-lg text-xs">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">跟进类型</label>
            <div className="flex flex-wrap gap-2">
              {FOLLOWUP_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.type === t ? "bg-[#1d4ed8] text-white border-[#1d4ed8]" : "bg-slate-50 text-[#475569] border-slate-200 hover:border-[#1d4ed8]"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div><label className="block text-xs font-medium text-[#475569] mb-1">跟进内容 <span className="text-red-500">*</span></label><textarea className={inputCls} rows={4} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="记录跟进内容…" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#475569] mb-1">跟进时间</label><input type="datetime-local" className={inputCls} value={form.contactAt} onChange={e => setForm(p => ({ ...p, contactAt: e.target.value }))} /></div>
            <div><label className="block text-xs font-medium text-[#475569] mb-1">下次跟进时间</label><input type="datetime-local" className={inputCls} value={form.nextContactAt} onChange={e => setForm(p => ({ ...p, nextContactAt: e.target.value }))} /></div>
          </div>
          <div><label className="block text-xs font-medium text-[#475569] mb-1">附件链接</label><input className={inputCls} value={form.attachment} onChange={e => setForm(p => ({ ...p, attachment: e.target.value }))} placeholder="截图/文件链接（可选）" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-[#475569]">取消</button>
            <button type="submit" className="px-6 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-sm font-medium">确认添加</button>
          </div>
        </form>
      </div>
    </div>
  );
}
