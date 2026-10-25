"use client";
import React from "react";
import {
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  PieChart as PieChartIcon,
  Receipt,
  Building2,
  RotateCcw,
} from "lucide-react";

export default function OverviewTab({
  owner,
  organization,
  selectedBranch = "all",
  setSelectedBranch,
  totalCalculatedBalance,
  setActiveTab,
}) {
  const branchCount = Math.max(1, Number(organization?.branches || 1));
  const embeddedBranches = organization?.branchList || [];
  const activeBranches = embeddedBranches.filter((b) => b.status === "active");
  const activeCount = Math.max(1, activeBranches.length);
  const totalEmployees =
    activeBranches.reduce((sum, b) => sum + (Number(b.staffCount) || 0), 0) ||
    Number(organization?.employeeCount || 0);

  const isAllBranches = selectedBranch === "all";

  // Derive branch title for current filter
  let currentBranchName = "All Branches";
  let currentBranchLocation = "Consolidated View";
  if (!isAllBranches) {
    const branchNum = parseInt(selectedBranch.replace("branch-", "")) || 1;
    const existing = embeddedBranches.find(
      (b) => b.branchId === selectedBranch || b.branchNumber === branchNum
    );
    if (branchNum === 1) {
      currentBranchName = `${organization?.RegisterName || "Branch 1"} - Main (HQ)`;
      currentBranchLocation = `${organization?.location || "Headquarters"} • ${
        Number(existing?.staffCount) || Number(organization?.employeeCount) || 0
      } Staff`;
    } else {
      currentBranchName = existing?.name || `Branch ${branchNum}`;
      currentBranchLocation = `${existing?.location || "Setup Required"} • ${
        existing?.staffCount || 0
      } Staff`;
    }
  }

  return (
    <div className="space-y-6">
      {/* Branch Indicator Banner */}
      <div className="rounded-2xl p-3.5 bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900">
                {isAllBranches ? "All Branches (Combined View)" : currentBranchName}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                {isAllBranches
                  ? `${activeCount} of ${branchCount} Units Active • ${totalEmployees} Total Staff`
                  : currentBranchLocation}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isAllBranches
                ? `Showing combined numbers across ${activeCount} active ${
                    activeCount === 1 ? "unit" : "units"
                  } (${totalEmployees} connected staff).`
                : `Showing numbers, orders, and money for this specific branch.`}
            </p>
          </div>
        </div>

        {!isAllBranches && (
          <button
            onClick={() => setSelectedBranch && setSelectedBranch("all")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Show All Branches
          </button>
        )}
      </div>

      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Good day, {owner?.name || "Business Owner"}! 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Here is your daily business overview for{" "}
          <span className="font-bold text-slate-700">{organization.RegisterName}</span>.
        </p>
      </div>

      {/* 4 Top Simple Business Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Money Available */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Money Available</span>
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹{totalCalculatedBalance.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>Bank + Cash</span>
            <span className="text-slate-400 font-normal">ready to use</span>
          </p>
        </div>

        {/* Card 2: Monthly Sales Goal */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Monthly Sales Goal</span>
            <span className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹{Number(organization.monthlyRevenueTarget || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] font-bold text-purple-600 flex items-center gap-1">
            <span>Target Items:</span>
            <span className="text-slate-500 font-medium">
              {Number(organization.monthlyProductionTarget || 0).toLocaleString("en-IN")} Units
            </span>
          </p>
        </div>

        {/* Card 3: Founder Order Approval Cap */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Order Approval Limit</span>
            <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹{Number(organization.poApprovalLimit || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
            <span>Founder Rule:</span>
            <span className="text-slate-400 font-normal">orders above this need your OK</span>
          </p>
        </div>

        {/* Card 4: Supplier Payment Rule */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Supplier Payment Time</span>
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {organization.defaultCreditDays} Days
          </p>
          <p className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
            <span>Govt Rule:</span>
            <span className="text-slate-400 font-normal">pay MSME suppliers on time</span>
          </p>
        </div>
      </div>

      {/* Middle Row: Money In/Out & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Money In & Money Out (Zero State) */}
        <div className="lg:col-span-7 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Money In & Money Out</h3>
            <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
              {isAllBranches ? "All Branches" : currentBranchName}
            </span>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 sm:p-12 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Money Movement Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              When your staff makes customer bills or records supplier payments, daily money flow will appear here automatically.
            </p>
          </div>
        </div>

        {/* Where Money is Spent (Zero State) */}
        <div className="lg:col-span-5 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Where Money is Spent</h3>
            <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
              This Month
            </span>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 sm:p-12 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto">
              <PieChartIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Expenses Recorded Yet</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Factory costs, materials, transport, and office bills will be grouped here once payments are made.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Transactions & Business Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions (Zero State) */}
        <div className="lg:col-span-7 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Recent Payments & Receipts</h3>
            <span className="text-xs font-bold text-slate-400">
              {isAllBranches ? "All Branches" : currentBranchName}
            </span>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 sm:p-10 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Transactions Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your books are clean and ready. Any customer payment received or supplier purchase entered by your staff will show up here.
            </p>
          </div>
        </div>

        {/* Real Setup Goals & Parameters */}
        <div className="lg:col-span-5 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Your Business Rules</h3>
            <button
              onClick={() => setActiveTab("settings")}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              Update Rules
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-medium text-slate-600">Main Godown / Factory:</span>
              <span className="font-bold text-slate-900">{organization.primaryWarehouse}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-medium text-slate-600">Low Stock Alert:</span>
              <span className="font-bold text-amber-600">Alert below {organization.lowStockThresholdPercent}%</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-medium text-slate-600">Max Customer Discount:</span>
              <span className="font-bold text-purple-600">{organization.maxDiscountPercent}% max</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-medium text-slate-600">Govt Audit Trail:</span>
              <span className="font-bold text-emerald-600">
                {organization.mcaAuditLog ? "Active (Tamper-proof)" : "Standard"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
