"use client";
import React from "react";
import { Receipt, TrendingUp, ShieldAlert } from "lucide-react";

export default function SalesTab({ organization, selectedBranch = "all" }) {
  const isAll = selectedBranch === "all";
  const branchTitle = isAll
    ? "All Branches (Consolidated)"
    : selectedBranch === "branch-1"
    ? "Branch 1 - Main (HQ)"
    : selectedBranch.replace("branch-", "Branch ");

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Sales & Customer Billing
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {branchTitle}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your monthly sales targets and maximum customer discount rules for staff.
          </p>
        </div>

        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 self-start sm:self-auto">
          Max Discount Cap: {organization.maxDiscountPercent || 0}%
        </span>
      </div>

      {/* Target & Discount Rule Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Monthly Sales Target
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹{Number(organization.monthlyRevenueTarget || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-500">
            Production Goal: {Number(organization.monthlyProductionTarget || 0).toLocaleString("en-IN")} Units
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            Customer Discount Rule
          </div>
          <p className="text-2xl font-black text-purple-700">
            {organization.maxDiscountPercent || 0}% Maximum Limit
          </p>
          <p className="text-[11px] text-slate-500">
            Billing counter and salesmen cannot give more than this discount without your direct OK.
          </p>
        </div>
      </div>

      {/* Empty State for Invoices */}
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center space-y-2">
        <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">No Customer Bills Created Yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Customer invoices created at the billing counter or by your sales reps will appear here automatically.
        </p>
      </div>
    </div>
  );
}
