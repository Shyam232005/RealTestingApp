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
  Power,
  PlusCircle,
  LayoutDashboard,
  FileCheck2,
  Landmark,
  Briefcase,
  BookOpen,
  ShoppingBag,
  TrendingUp,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
import BranchActivationModal from "./BranchActivationModal";

const TAB_ICONS = {
  dashboard: LayoutDashboard,
  approval: FileCheck2,
  banking: Landmark,
  "ca-hub": Briefcase,
  financial: BookOpen,
  purchase: ShoppingBag,
  sales: TrendingUp,
  "tax-reports": FileSpreadsheet,
  settings: Settings,
};

export default function OwnerHeader({
  activeTab,
  setActiveTab,
  tabs = [],
  owner,
  organization,
  setOrganization,
  selectedBranch = "all",
  setSelectedBranch,
  notificationsOpen,
  setNotificationsOpen,
  onLogout,
}) {
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef(null);

  // Activation modal state
  const [activationTarget, setActivationTarget] = useState(null);

  // Exact number of branches configured at setup or updated in settings
  const branchCount = Math.max(1, Number(organization?.branches || 1));
  const embeddedBranches = organization?.branchList || [];

  const activeBranches = embeddedBranches.filter((b) => b.status === "active");
  const activeCount = Math.max(1, activeBranches.length);
  const totalStaffAcrossBranches =
    activeBranches.reduce((sum, b) => sum + (Number(b.staffCount) || 0), 0) ||
    Number(organization?.employeeCount || 0);

  // Build exact branch list matching setup count with active/inactive statuses
  const branchOptions = [
    {
      id: "all",
      name: "All Branches",
      subtitle: `Consolidated view (${activeCount} of ${branchCount} units active • ${totalStaffAcrossBranches} total staff)`,
      badge: "All Units",
      isAll: true,
      status: "active",
      index: 0,
      staffCount: totalStaffAcrossBranches,
    },
    ...Array.from({ length: branchCount }, (_, i) => {
      const bNum = i + 1;
      const bId = `branch-${bNum}`;
      const existing = embeddedBranches.find(
        (eb) => eb.branchId === bId || eb.branchNumber === bNum
      );

      const isActive =
        bNum === 1 || (existing && existing.status === "active");

      const staff =
        bNum === 1
          ? Number(existing?.staffCount) || Number(organization?.employeeCount) || 0
          : Number(existing?.staffCount) || 0;

      return {
        id: bId,
        name:
          existing?.name ||
          (bNum === 1 ? `${organization?.RegisterName || "Branch 1"} - Main (HQ)` : `Branch ${bNum}`),
        subtitle:
          existing?.location
            ? `${existing.location} • ${staff} Staff`
            : bNum === 1
            ? organization?.location
              ? `${organization.location} • ${staff} Staff (Primary HQ)`
              : `Headquarters • ${staff} Staff`
            : "Inactive - Click Activate to onboard unit",
        badge: bNum === 1 ? "Main HQ" : `Unit ${bNum}`,
        isAll: false,
        index: bNum,
        status: isActive ? "active" : "inactive",
        staffCount: staff,
        allocatedFunds: existing?.allocatedFunds || 0,
      };
    }),
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

  const handleActivationSuccess = (updatedBranch, updatedOrg) => {
    if (setOrganization && updatedOrg) {
      setOrganization(updatedOrg);
    }
    if (setSelectedBranch && updatedBranch?.branchId) {
      setSelectedBranch(updatedBranch.branchId);
    }
    setActivationTarget(null);
    setBranchDropdownOpen(false);
  };

  return (
    <>
      {/* Branch Activation Modal */}
      {activationTarget && (
        <BranchActivationModal
          key={`${activationTarget.id}-${activationTarget.index}`}
          isOpen={!!activationTarget}
          onClose={() => setActivationTarget(null)}
          branchNumber={activationTarget.index}
          branchId={activationTarget.id}
          onSuccess={handleActivationSuccess}
        />
      )}

      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Left & Center: Brand Logo + Branch Selector + Navigation Tabs directly after */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* Finora Brand */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-black text-slate-900 tracking-tight">Finora</span>
                <span className="text-[9px] font-bold text-purple-600 ml-1 uppercase tracking-widest bg-purple-50 px-1 py-0.2 rounded border border-purple-100">
                  FinOps
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200 shrink-0" />

            {/* Branch Selector Dropdown */}
            <div className="relative shrink-0" ref={branchDropdownRef}>
              <button
                type="button"
                onClick={() => setBranchDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs font-bold text-slate-800 transition-all shadow-xs cursor-pointer group"
                title="Switch Business Branch View"
              >
                <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-3 h-3" />
                </div>
                <div className="text-left max-w-[125px] sm:max-w-[160px] truncate">
                  <div className="flex items-center gap-1 leading-none">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">
                      Branch
                    </span>
                    <span className="text-[8px] font-bold px-1 rounded-xs bg-purple-50 text-purple-700 font-mono">
                      {currentBranch.isAll
                        ? `${activeCount}/${branchCount} Active • ${totalStaffAcrossBranches} Staff`
                        : `${currentBranch.staffCount} Staff`}
                    </span>
                  </div>
                  <p className="text-[11px] font-black text-slate-900 truncate leading-tight mt-0.5">
                    {currentBranch.name}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                    branchDropdownOpen ? "rotate-180 text-purple-600" : ""
                  }`}
                />
              </button>

              {/* Branch Dropdown Popup */}
              {branchDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        Select Business Branch
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {branchCount} {branchCount === 1 ? "branch" : "branches"} registered in organization
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono">
                      {currentBranch.id === "all" ? "Consolidated" : "Single Branch"}
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto py-1.5 space-y-1">
                    {branchOptions.map((b) => {
                      const isSelected = (selectedBranch || "all") === b.id;
                      const isInactive = b.status === "inactive";

                      return (
                        <div
                          key={b.id}
                          className={`w-full p-2.5 rounded-2xl text-xs transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-purple-50 text-purple-900 border border-purple-200"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <button
                            type="button"
                            disabled={isInactive}
                            onClick={() => {
                              if (!isInactive && setSelectedBranch) {
                                setSelectedBranch(b.id);
                                setBranchDropdownOpen(false);
                              }
                            }}
                            className={`flex items-center gap-2.5 min-w-0 flex-1 text-left ${
                              isInactive ? "opacity-75 cursor-default" : "cursor-pointer"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                b.isAll
                                  ? "bg-purple-100 text-purple-700"
                                  : isInactive
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate leading-tight font-bold text-slate-900">
                                  {b.name}
                                </p>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                                    b.isAll
                                      ? "bg-purple-100 text-purple-700"
                                      : isInactive
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {b.isAll ? "All" : isInactive ? "Inactive" : "Active"}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {b.subtitle}
                              </p>
                            </div>
                          </button>

                          {isSelected && !isInactive && (
                            <Check className="w-4 h-4 text-purple-600 shrink-0 mr-1" />
                          )}

                          {isInactive && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivationTarget(b);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-extrabold shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                              title="Activate this branch now"
                            >
                              <Power className="w-3 h-3" />
                              <span>Activate</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Manage organization branches?</span>
                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setBranchDropdownOpen(false);
                      }}
                      className="text-purple-600 font-bold hover:underline cursor-pointer"
                    >
                      Profile Settings
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200 shrink-0" />

            {/* Navigation Tabs - Placed DIRECTLY after the Branch dropdown */}
            {tabs && tabs.length > 0 && (
              <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1 min-w-0">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const IconComponent = TAB_ICONS[tab.id] || LayoutDashboard;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                        isActive
                          ? "bg-purple-600 text-white shadow-xs shadow-purple-600/30 font-black"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80"
                      }`}
                    >
                      <IconComponent
                        className={`w-3.5 h-3.5 ${
                          isActive ? "text-white" : "text-purple-600"
                        }`}
                      />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right: Statutory Pill + Notifications + Profile Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Status Pill */}
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MCA Live</span>
            </div>

            {/* Notifications Button */}
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Owner User Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {owner?.name?.charAt(0)?.toUpperCase() || "O"}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-900 leading-none">
                  {owner?.name || "Owner"}
                </p>
                <p className="text-[9px] text-purple-600 font-bold tracking-wider uppercase mt-0.5">
                  Owner
                </p>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
