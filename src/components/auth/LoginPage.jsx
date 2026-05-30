import { useState } from "react";
import { useApp } from "../../store/AppContext";

export default function LoginPage() {
  const { login } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("请输入用户名和密码"); return; }
    const ok = login(username, password);
    if (!ok) setError("用户名或密码错误");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
      <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] p-10 w-full max-w-md animate-fadeUp border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1d4ed8] to-[#1e40af] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-xl font-bold text-[#111827]">千川销售管理系统</h1>
          <p className="text-xs text-[#6b7280] mt-1">抖音电商 · 收量业务</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">密码</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/10 outline-none text-sm"
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
          {error && <p className="text-[#dc2626] text-xs">{error}</p>}
          <button type="submit" className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-500/20">登 录</button>
        </form>
        <div className="mt-6 p-3 bg-[#f8fafc] rounded-lg border border-slate-200">
          <p className="text-xs text-[#6b7280] text-center">演示账号</p>
          <p className="text-xs text-[#374151] text-center mt-1">管理员: admin / admin123<br />销售员: zhangwei / qw123</p>
        </div>
      </div>
    </div>
  );
}
