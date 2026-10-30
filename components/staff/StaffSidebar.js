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
      badge: assignedCount > 0 ? `${assignedCount} MSMEs` : "0",
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
      badge: "Sign-offs",
      badgeColor: "bg-emerald-100 text-emerald-900 border border-emerald-200",
      desc: "Drafts for Partner sign-off",
    },
  ];

  return (
    <aside className="w-64 bg-white/95 border-r border-slate-200/80 p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto">
      <div className="space-y-6">
        {/* Workspace Indicator */}
        <div className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
            Staff Audit Workspace
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900">
              Article Audit Desk
            </span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
              Staff Access
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Menu Items */}
        <nav className="space-y-1.5">
          {staffTabs.map((tab) => {
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
                      isActive ? "text-indigo-400" : "text-slate-400"
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

      {/* Staff Responsibility Card */}
      <div className="pt-4 border-t border-slate-100">
        <div className="p-3.5 rounded-2xl bg-[#FAF9FD] border border-indigo-100/70">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-indigo-700" />
            <span className="text-[11px] font-black text-slate-900">
              Audit Working Papers
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            All vouchers checked and draft schedules prepared here are submitted directly to the Managing Partner (FCA) for statutory UDIN sign-off.
          </p>
        </div>
      </div>
    </aside>
  );
}
