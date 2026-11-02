"use client";
import React from "react";
import { useCa } from "./CaContext";
import { LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CaPageBanner() {
  const router = useRouter();
  const { user, activeTab } = useCa();

  const handleSignOut = () => {
    document.cookie = "crown_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "fineops_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "fineops_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const partnerName = user?.partnerName || user?.name || "CA Partner";
  const firmName = user?.firmName || "Singhal & Associates, Chartered Accountants";

  // Dynamic Page Title based on active tab
  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "CA Partner Dashboard";
      case "data-requests":
        return "Data Access & Owner Approvals";
      case "clients":
        return "Connected Client MSMEs";
      case "team":
        return "Team Management & Delegation";
      case "audit-signoffs":
        return "Audit Review & Digital Sign-offs";
      case "escalations":
        return "Query Escalations & Discrepancies";
      case "reports":
        return "Final Financial Reports & Schedules";
      case "settings":
        return "Firm Settings & ICAI Compliance";
      default:
        return "CA Partner Dashboard";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 font-sans">
      {/* Title & Welcome Context matching reference screenshot DNA */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {getTabTitle()}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
          Welcome back, <span className="text-slate-800 font-bold">{partnerName}</span> · {firmName}
        </p>
      </div>

      {/* Sign Out Pill Button matching reference screenshot DNA */}
      <button
        type="button"
        onClick={handleSignOut}
        className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
      >
        <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
