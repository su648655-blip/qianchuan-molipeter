import { useState } from "react";
import { AppProvider, useApp } from "./store/AppContext";
import LoginPage from "./components/auth/LoginPage";
import Navbar from "./components/layout/Navbar";
import Dashboard from "./components/crm/Dashboard";
import CRMPage from "./components/crm/CRMPage";
import AdvertiserPage from "./components/crm/AdvertiserPage";
import AICenter from "./components/ai/AICenter";
import UserManagePage from "./components/admin/UserManagePage";

function AppContent() {
  const { currentUser, isAdmin, loading } = useApp();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 border-4 border-[#dbeafe] rounded-full" />
            <div className="absolute top-0 left-0 w-14 h-14 border-4 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-[#6b7280]">正在加载数据…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "crm": return <CRMPage />;
      case "advertiser": return <AdvertiserPage />;
      case "ai": return <AICenter />;
      case "users": return isAdmin ? <UserManagePage /> : null;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-[1280px] mx-auto px-6 py-5">
        {renderTab()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
