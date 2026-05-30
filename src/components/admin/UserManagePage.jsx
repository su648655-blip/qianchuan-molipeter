import { useState } from "react";
import { useApp } from "../../store/AppContext";

export default function UserManagePage() {
  const { users, addUser, editUser, deleteUser, currentUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (id) => { deleteUser(id); setConfirmDelete(null); };

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-lg font-bold text-[#111827]">员工管理</h2><p className="text-xs text-[#6b7280] mt-0.5">创建和管理员工账号</p></div>
        <button onClick={() => { setEditData(null); setShowModal(true); }} className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"><span>+</span> 新增员工</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f1f5f9] text-[#475569] font-semibold text-xs">
            <tr><th className="text-left px-4 py-3">姓名</th><th className="text-left px-3 py-3">用户名</th><th className="text-left px-3 py-3">角色</th><th className="text-left px-3 py-3">状态</th><th className="text-center px-3 py-3">操作</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${u.role === "admin" ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#dbeafe] text-[#1d4ed8]"}`}>{u.name[0]}</div><span className="font-medium text-[#111827]">{u.name}</span></div></td>
                <td className="px-3 py-3 text-[#374151]">{u.username}</td>
                <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded text-[11px] font-medium ${u.role === "admin" ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#dbeafe] text-[#1d4ed8]"}`}>{u.role === "admin" ? "管理员" : "销售员"}</span></td>
                <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded text-[11px] ${u.disabled ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#dcfce7] text-[#15803d]"}`}>{u.disabled ? "已禁用" : "正常"}</span></td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => { setEditData(u); setShowModal(true); }} className="px-2 py-1 bg-slate-100 text-[#475569] rounded text-[11px] hover:bg-slate-200">编辑</button>
                    <button onClick={() => editUser(u.id, { disabled: !u.disabled })} className={`px-2 py-1 rounded text-[11px] ${u.disabled ? "bg-[#dcfce7] text-[#15803d] hover:bg-[#bbf7d0]" : "bg-[#fef3c7] text-[#b45309] hover:bg-[#fde68a]"}`}>{u.disabled ? "启用" : "禁用"}</button>
                    <button onClick={() => editUser(u.id, { password: "qw123" })} className="px-2 py-1 bg-[#dbeafe] text-[#1d4ed8] rounded text-[11px] hover:bg-[#bfdbfe]">重置密码</button>
                    {u.id !== currentUser?.id && (confirmDelete === u.id ? (
                      <div className="flex items-center gap-1"><span className="text-[10px] text-[#dc2626]">确认？</span><button onClick={() => handleDelete(u.id)} className="px-1.5 py-0.5 bg-[#dc2626] text-white rounded text-[10px]">是</button><button onClick={() => setConfirmDelete(null)} className="px-1.5 py-0.5 border rounded text-[10px]">否</button></div>
                    ) : (
                      <button onClick={() => setConfirmDelete(u.id)} className="px-2 py-1 bg-[#fee2e2] text-[#dc2626] rounded text-[11px] hover:bg-[#fecaca]">删除</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <UserModal user={editData} onClose={() => { setShowModal(false); setEditData(null); }} onSave={(data) => { if (editData) editUser(editData.id, data); else addUser(data); }} />}
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const { users } = useApp();
  const isEdit = !!user;
  const [form, setForm] = useState({ name: user?.name || "", username: user?.username || "", password: "", role: user?.role || "sales" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); setError("");
    if (!form.name || !form.username) { setError("请填写姓名和用户名"); return; }
    if (!isEdit && !form.password) { setError("请设置密码"); return; }
    if (!isEdit && users.some(u => u.username === form.username)) { setError("用户名已存在"); return; }
    const data = { ...form }; if (isEdit && !data.password) delete data.password;
    onSave(data); onClose();
  };

  const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] w-full max-w-md animate-slideDown" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-base font-bold text-[#111827]">{isEdit ? "编辑员工" : "新增员工"}</h2><button onClick={onClose} className="text-[#6b7280] hover:text-[#111827] text-lg">&times;</button></div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && <div className="p-2 bg-[#fee2e2] text-[#dc2626] rounded-lg text-xs">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">姓名 <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="员工姓名" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">用户名 <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="登录用户名" disabled={isEdit} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">
              {isEdit ? "新密码（留空不修改）" : "密码"}
              {!isEdit && <span className="text-red-500"> *</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`${inputCls} pr-10`}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder={isEdit ? "留空则不修改密码" : "设置登录密码"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#374151] text-sm cursor-pointer select-none"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">角色</label>
            <select className={inputCls} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="sales">销售员</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-[#475569]">取消</button>
            <button type="submit" className="px-6 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-sm font-medium">{isEdit ? "保存" : "确认创建"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
