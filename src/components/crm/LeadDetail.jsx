import { useState, useMemo } from "react";
import { useApp } from "../../store/AppContext";
import { TIER_META, STAGE_META, RISK_META } from "../../data/constants";
import { formatDateTime, formatCurrency } from "../../lib/utils";
import FollowupModal from "./FollowupModal";
import LeadModal from "./LeadModal";

export default function LeadDetail({ lead, onClose }) {
  const { followups, addFollowup, editLead, deleteLead, currentUser, isAdmin } = useApp();
  const [showFollowup, setShowFollowup] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const myFollowups = useMemo(
    () => followups.filter(f => f.leadId === lead.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [followups, lead.id]
  );

  const tierMeta = TIER_META[lead.tier] || TIER_META.D;
  const stageMeta = STAGE_META[lead.stage] || {};
  const riskMeta = RISK_META[lead.riskLevel] || {};

  const canEdit = isAdmin || lead.assignedTo === currentUser?.name;

  const handleDelete = () => { deleteLead(lead.id); onClose(); };

  if (showEdit) {
    return <LeadModal lead={lead} onClose={() => setShowEdit(false)} onSave={(data) => { editLead(lead.id, data); setShowEdit(false); }} />;
  }

  return (
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] w-full max-w-5xl max-h-[90vh] overflow-hidden animate-slideDown" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[#111827]">{lead.name}</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ color: tierMeta.color, background: tierMeta.bg, border: `1px solid ${tierMeta.border}` }}>{tierMeta.label}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ color: stageMeta.color, background: stageMeta.bg, border: `1px solid ${stageMeta.border}` }}>{lead.stage}</span>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (<>
                <button onClick={() => setShowFollowup(true)} className="px-3 py-1.5 bg-[#1d4ed8] text-white rounded-lg text-xs font-medium">+ 跟进</button>
                <button onClick={() => setShowEdit(true)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-[#475569] hover:bg-slate-50">编辑</button>
                {isAdmin && (confirmDelete ? (
                  <div className="flex items-center gap-1"><span className="text-xs text-[#dc2626]">确认删除？</span><button onClick={handleDelete} className="px-2 py-1 bg-[#dc2626] text-white rounded text-[10px]">是</button><button onClick={() => setConfirmDelete(false)} className="px-2 py-1 border rounded text-[10px]">否</button></div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 border border-[#fca5a5] text-[#dc2626] rounded-lg text-xs hover:bg-[#fee2e2]">删除</button>
                ))}
              </>)}
              <button onClick={onClose} className="text-[#6b7280] hover:text-[#111827] text-xl ml-2">&times;</button>
            </div>
          </div>
          <div className="flex h-[calc(90vh-70px)]">
            <div className="w-[380px] shrink-0 border-r border-slate-200 p-6 overflow-y-auto">
              <h3 className="text-sm font-semibold text-[#111827] mb-4">客户基础信息</h3>
              <div className="space-y-3">
                <InfoRow label="客户名称" value={lead.name} /><InfoRow label="店铺名称" value={lead.shopName} />
                <InfoRow label="联系人" value={lead.contact} /><InfoRow label="手机号" value={lead.phone} />
                <InfoRow label="行业" value={lead.industry} /><InfoRow label="客户类型" value={lead.clientType} />
                <InfoRow label="来源渠道" value={lead.source} /><InfoRow label="投放状态" value={lead.status} />
                <InfoRow label="月预算范围" value={lead.budgetRange} />
                <InfoRow label="日消耗预估" value={lead.dailyBudget ? `¥${formatCurrency(lead.dailyBudget)}` : "-"} />
                <InfoRow label="当月消耗" value={lead.currentConsumption ? `¥${formatCurrency(lead.currentConsumption)}` : "-"} />
                <InfoRow label="负责人" value={lead.assignedTo} />
                <InfoRow label="风险等级" value={<span className="px-1.5 py-0.5 rounded text-[11px]" style={{ color: riskMeta.color, background: riskMeta.bg }}>{lead.riskLevel}</span>} />
                <InfoRow label="创建时间" value={formatDateTime(lead.createdAt)} />
                <InfoRow label="最近跟进" value={lead.lastContactAt ? formatDateTime(lead.lastContactAt) : "未跟进"} />
                <InfoRow label="下次跟进" value={lead.nextContactAt ? formatDateTime(lead.nextContactAt) : "未设置"} />
                {lead.remark && <InfoRow label="备注" value={lead.remark} />}
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-sm font-semibold text-[#111827] mb-4">跟进时间轴</h3>
              {myFollowups.length === 0 ? (
                <div className="text-center text-[#6b7280] py-12 text-sm">暂无跟进记录</div>
              ) : (
                <div className="relative pl-6 border-l-2 border-[#cbd5e1] space-y-5">
                  {myFollowups.map((f) => (
                    <div key={f.id} className="relative">
                      <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-[#1d4ed8] border-2 border-white" />
                      <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="px-2 py-0.5 bg-[#dbeafe] text-[#1d4ed8] rounded text-[11px] font-medium">{f.type}</span>
                          <span className="text-[11px] text-[#6b7280]">{formatDateTime(f.contactAt || f.createdAt)}</span>
                        </div>
                        <p className="text-sm text-[#374151] whitespace-pre-wrap">{f.content}</p>
                        {f.nextContactAt && <p className="text-[11px] text-[#6b7280] mt-1.5">下次跟进: {formatDateTime(f.nextContactAt)}</p>}
                        {f.attachment && <a href={f.attachment} target="_blank" rel="noreferrer" className="text-[11px] text-[#1d4ed8] mt-1 inline-block">📎 查看附件</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showFollowup && <FollowupModal leadId={lead.id} onClose={() => setShowFollowup(false)} onSave={addFollowup} />}
    </>
  );
}

function InfoRow({ label, value }) {
  return <div className="flex justify-between items-start py-1.5 border-b border-slate-100"><span className="text-xs text-[#6b7280] shrink-0">{label}</span><span className="text-xs text-[#111827] text-right ml-4">{value || "-"}</span></div>;
}
