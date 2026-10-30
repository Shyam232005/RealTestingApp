"use client";
import React from "react";
import { useStaff } from "./StaffContext";
import {
  ShieldCheck,
  Building2,
  LogOut,
  UserCheck2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function StaffTopHeader() {
  const router = useRouter();
  const { user } = useStaff();

  const handleSignOut = () => {
    document.cookie = "crown_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "fineops_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "fineops_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const displayName = user?.name || "Karan Mehta (Article Assistant)";
  const firmName = user?.firmName || "Singhal & Associates, Chartered Accountants";
  const roleTitle = user?.roleInFirm || "Article Assistant";
  const icaiNumber = user?.icaiNumber || "ICAI-FRN-048912";

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Practice Context */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-md shadow-slate-900/10">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900 leading-tight">
              {firmName}
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
              Audit Staff Console
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-400">
            FRN: <span className="font-mono text-slate-600">{icaiNumber}</span> • Allocated Audit Desk AY 2026-27
          </p>
        </div>
      </div>

      {/* Right Controls: Staff Profile + Sign Out */}
      <div className="flex items-center gap-4">
        {/* Active Desk Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-slate-800 font-black">Audit Desk Active</span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs font-mono">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-right hidden md:block">
            <span className="text-xs font-black text-slate-800 block">
              {displayName}
            </span>
            <span className="text-[10px] font-bold text-indigo-700 block">
              {roleTitle}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
