"use client";
import React from "react";
import { useStaff } from "./StaffContext";
import {
  Briefcase,
  Building2,
  BookOpenCheck,
  AlertCircle,
  Scale,
  FileText,
  Shield,
} from "lucide-react";

export default function StaffSidebar() {
  const { activeTab, setActiveTab, user } = useStaff();

  const assignedCount = user?.assignedClients?.length ?? 0;

  // CA STAFF TABS
  const staffTabs = [
    {
      id: "my-workspace",
      label: "My Workspace",
      icon: Briefcase,
      badge: null,
      desc: "Assigned tasks & daily queue",
    },
    {
      id: "assigned-clients",
      label: "Assigned Clients",
      icon: Building2,
      badge: assignedCount > 0 ? `${assignedCount}` : null,
      desc: "Allocated audit files",
    },
    {
      id: "ledger-audit",
      label: "Ledger Audit",
      icon: BookOpenCheck,
      badge: "Vouchers",
      badgeColor: "bg-indigo-100 text-indigo-900 border border-indigo-200",
      desc: "Voucher & receipt checking",
    },
    {
      id: "discrepancies",
      label: "Discrepancies",
      icon: AlertCircle,
      badge: null,
      desc: "Client queries & issues",
    },
    {
      id: "reconciliation",
      label: "Reconciliation",
      icon: Scale,
      badge: null,
      desc: "Bank & cash matching",
    },
    {
      id: "draft-reports",
      label: "Draft Reports",
      icon: FileText,
      badge: "Draft",
      badgeColor: "bg-emerald-100 text-emerald-900 border border-emerald-200",
      desc: "Drafts for Partner sign-off",
    },
  ];

  return (
    <aside className="w-64 bg-white rounded-3xl border border-slate-200/80 p-3 shadow-2xs shrink-0 self-start space-y-4 font-sans">
      {/* Navigation Pill Menu matching reference screenshot */}
      <nav className="space-y-1">
        {staffTabs.map((tab) => {
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

      {/* Staff Delegation Context Card */}
      <div className="pt-3 border-t border-slate-100 px-1">
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] font-black text-slate-900">
              Delegated Authority
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            Work completed here is submitted directly to the Managing Partner for final sign-off.
          </p>
        </div>
      </div>
    </aside>
  );
}
