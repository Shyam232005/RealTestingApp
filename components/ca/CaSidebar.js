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
      badge: "Sync",
      badgeColor: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      desc: "Founder approvals & unlocked books",
    },
    {
      id: "clients",
      label: "Client Firms",
      icon: Building2,
      badge: clientCount > 0 ? `${clientCount}` : null,
      desc: "Connected MSME companies",
    },
    {
      id: "team",
      label: "Team Management",
      icon: Users,
      badge: staffCount > 0 ? `${staffCount}` : null,
      desc: "Staff work delegation & live status",
    },
    {
      id: "audit-signoffs",
      label: "Audit & Sign-offs",
      icon: Stamp,
      badge: "Sign",
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
    <aside className="w-64 bg-white rounded-3xl border border-slate-200/80 p-3 shadow-2xs shrink-0 self-start space-y-4 font-sans">
      {/* Navigation Pill Menu matching reference screenshot */}
      <nav className="space-y-1">
        {partnerTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#1E3A8A] text-white shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-semibold"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{tab.label}</span>
              </div>

              {tab.badge && (
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-md shrink-0 ${
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

      {/* Compliance Indicator Badge */}
      <div className="pt-3 border-t border-slate-100 px-1">
        <div className="p-3 rounded-2xl bg-[#FAF9FD] border border-purple-100/70">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-purple-700" />
            <span className="text-[11px] font-black text-slate-900">
              UDIN Compliant
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            All audits comply with ICAI SA 700 &amp; Section 44AB.
          </p>
        </div>
      </div>
    </aside>
  );
}
