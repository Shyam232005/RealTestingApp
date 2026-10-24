"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Bell,
  LogOut,
  Building2,
  ChevronDown,
  Check,
  User,
} from "lucide-react";

export default function OwnerHeader({
  activeTab,
  setActiveTab,
  tabs,
  owner,
  organization,
  selectedBranch = "all",
  setSelectedBranch,
  notificationsOpen,
  setNotificationsOpen,
  onLogout,
}) {
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef(null);

  // Exact number of branches configured at setup or updated in settings
  const branchCount = Math.max(1, Number(organization?.branches || 1));

  // Build exact branch list matching setup count
  const branchOptions = [
    {
      id: "all",
      name: "All Branches",
      subtitle: `Consolidated view (${branchCount} ${branchCount === 1 ? "unit" : "units"})`,
      badge: "All Units",
      isAll: true,
    },
    ...Array.from({ length: branchCount }, (_, i) => ({
      id: `branch-${i + 1}`,
      name: i === 0 ? "Branch 1 - Main (HQ)" : `Branch ${i + 1}`,
      subtitle:
        i === 0
          ? organization?.location
            ? `${organization.location} (Primary)`
            : "Headquarters"
          : `Unit ${i + 1} - ${organization?.location?.split(",")[0] || "Operating Location"}`,
      badge: i === 0 ? "Main HQ" : `Unit ${i + 1}`,
      isAll: false,
      index: i + 1,
    })),
  ];

  const currentBranch =
    branchOptions.find((b) => b.id === selectedBranch) || branchOptions[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(event.target)
      ) {
        setBranchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3 sticky top-0 z-30 shadow-xs">
      <div className="w-full max-w-[1720px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Finora Logo + Branch Selector Element */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Finora Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight">Finora</span>
              <span className="text-[10px] font-bold text-purple-600 ml-1.5 uppercase tracking-widest bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                FinOps
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Branch Dropdown Menu (Exactly matching number of branches from setup) */}
          <div className="relative" ref={branchDropdownRef}>
            <button
              type="button"
              onClick={() => setBranchDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs font-bold text-slate-800 transition-all shadow-xs cursor-pointer group"
              title="Switch Business Branch View"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-left max-w-[130px] sm:max-w-[160px] truncate">
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">
                    Branch
                  </span>
                  <span className="text-[9px] font-bold px-1 rounded-sm bg-purple-50 text-purple-700 font-mono">
                    {branchCount} {branchCount === 1 ? "Unit" : "Units"}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900 truncate leading-tight mt-0.5">
                  {currentBranch.name}
                </p>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                  branchDropdownOpen ? "rotate-180 text-purple-600" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {branchDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      Select Business Branch
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {branchCount} {branchCount === 1 ? "branch" : "branches"} configured in setup
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono">
                    {currentBranch.id === "all" ? "Consolidated" : "Single Branch"}
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                  {branchOptions.map((b) => {
                    const isSelected = (selectedBranch || "all") === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          if (setSelectedBranch) setSelectedBranch(b.id);
                          setBranchDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-purple-50 text-purple-900 border border-purple-200 font-bold"
                            : "hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              b.isAll
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate leading-tight font-bold">{b.name}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {b.subtitle}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-purple-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Need to add/change branches?</span>
                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setBranchDropdownOpen(false);
                    }}
                    className="text-purple-600 font-bold hover:underline cursor-pointer"
                  >
                    Edit in Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Pill Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-xs cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900">System Activity</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Active</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-slate-700 text-xs">
                  <p className="font-bold text-purple-900">Workspace Ready</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Organization initialized for {organization.RegisterName} ({branchCount}{" "}
                    {branchCount === 1 ? "branch" : "branches"}).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill in Header (Covers Owner Profile Display) */}
          <div
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-slate-50 border border-slate-200/80 hover:border-purple-300 transition-all shadow-xs cursor-pointer"
            title="View Profile Settings"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-black shadow-xs">
              {owner?.name?.charAt(0)?.toUpperCase() || "O"}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {owner?.name || "Owner"}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-xs cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
