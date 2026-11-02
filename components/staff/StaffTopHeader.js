"use client";
import React from "react";
import { useStaff } from "./StaffContext";
import {
  ShieldCheck,
  Shield,
  Moon,
} from "lucide-react";

export default function StaffTopHeader() {
  const { user, activeTab, setActiveTab } = useStaff();

  const navLinks = [
    { id: "my-workspace", label: "My Workspace" },
    { id: "assigned-clients", label: "Assigned Clients" },
    { id: "ledger-audit", label: "Ledger Audit" },
    { id: "discrepancies", label: "Discrepancies" },
    { id: "reconciliation", label: "Reconciliation" },
    { id: "draft-reports", label: "Draft Reports" },
  ];

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 font-sans">
      {/* Brand Context matching reference screenshot DNA */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-xs">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 tracking-tight">
              Crown Ecosystems
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200 hidden sm:inline-block">
              Audit Staff Desk
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 tracking-wide">
            Article Assistant &amp; Staff Console
          </p>
        </div>
      </div>

      {/* Centered Horizontal Navigation Menu matching reference screenshot */}
      <nav className="hidden xl:flex items-center gap-1.5 text-xs font-bold text-slate-600">
        {navLinks.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-slate-950 font-black bg-slate-100"
                  : "hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Theme Moon Icon + Purple/Indigo Pill Staff Badge matching reference screenshot */}
      <div className="flex items-center gap-3">
        {/* Live Socket Feed Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-800">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>Desk Active</span>
        </div>

        {/* Moon Icon matching reference screenshot */}
        <button
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* Green/Indigo Pill Badge matching reference screenshot */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer">
          <Shield className="w-3.5 h-3.5 fill-white text-transparent" />
          <span>CA Staff</span>
        </div>
      </div>
    </header>
  );
}
