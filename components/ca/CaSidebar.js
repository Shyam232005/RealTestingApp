"use client";
import React from "react";
import { useCa } from "./CaContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  Stamp,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Shield,
  KeyRound,
} from "lucide-react";

export default function CaSidebar() {
  const { activeTab, setActiveTab, user } = useCa();

  const clientCount = user?.clients?.length ?? 0;
  const staffCount = user?.staff?.length ?? 0;

  // CA PARTNER TABS
  const partnerTabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
      desc: "Practice metrics & queue",
    },
    {
      id: "data-requests",
      label: "Data Access Requests",
      icon: KeyRound,
      badge: "Owner Sync",
      badgeColor: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      desc: "Founder approvals & unlocked books",
    },
    {
      id: "clients",
      label: "Client Firms",
      icon: Building2,
      badge: clientCount > 0 ? `${clientCount} MSMEs` : "0",
      desc: "Connected MSME companies",
    },
    {
      id: "team",
      label: "Team & Work Assign",
      icon: Users,
      badge: staffCount > 0 ? `${staffCount} Staff` : "0",
      desc: "Staff work delegation & live status",
    },
    {
      id: "audit-signoffs",
      label: "Audit & Sign-offs",
      icon: Stamp,
      badge: "Sign-offs",
      badgeColor: "bg-amber-100 text-amber-900 border border-amber-300",
      desc: "Finalized ledger approvals",
    },
    {
      id: "escalations",
      label: "Query Escalations",
      icon: AlertTriangle,
      badge: null,
      desc: "Discrepancy alerts",
    },
    {
      id: "reports",
      label: "Final Reports",
      icon: FileSpreadsheet,
      badge: null,
      desc: "3CD, P&L, Balance Sheets",
    },
    {
      id: "settings",
      label: "Firm Settings",
      icon: Settings,
      badge: null,
      desc: "ICAI compliance & stamp",
    },
  ];

  return (
    <aside className="w-64 bg-white/95 border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto">
      <div className="space-y-6">
        {/* Practice Console Indicator */}
        <div className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
            Active Workspace
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900">
              CA Partner Console
            </span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
              FCA Access
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Menu Items */}
        <nav className="space-y-1.5">
          {partnerTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{tab.label}</span>
                </div>

                {tab.badge && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                      tab.badgeColor
                        ? tab.badgeColor
                        : isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Practice Security Footer Card */}
      <div className="pt-4 border-t border-slate-100">
        <div className="p-3.5 rounded-2xl bg-[#FAF9FD] border border-purple-100/70">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-purple-700" />
            <span className="text-[11px] font-black text-slate-900">
              Statutory UDIN Vault
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            All audit certificates and rubber stamp endorsements comply with ICAI Standards on Auditing (SA 700).
          </p>
        </div>
      </div>
    </aside>
  );
}
