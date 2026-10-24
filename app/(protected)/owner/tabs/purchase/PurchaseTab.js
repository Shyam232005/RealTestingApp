"use client";
import React from "react";
import { PackageOpen, Boxes, Clock, Building } from "lucide-react";

export default function PurchaseTab({ organization, selectedBranch = "all" }) {
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
              Purchases & Godown Stock
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {branchTitle}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your main factory stock, supplier bill payment rules, and inward purchase records.
          </p>
        </div>

        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
          Stock Method: {organization.inventoryValuationMethod === "lot_wise" ? "Lot-Wise" : organization.inventoryValuationMethod.toUpperCase()}
        </span>
      </div>

      {/* 3 Simple Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
            <Building className="w-3.5 h-3.5" />
            Main Godown / Factory
          </div>
          <p className="text-base font-black text-slate-900">{organization.primaryWarehouse}</p>
          <p className="text-slate-500 text-[11px]">
            Warning alert when stock drops below {organization.lowStockThresholdPercent}%
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
            <Clock className="w-3.5 h-3.5" />
            Supplier Credit Time
          </div>
          <p className="text-base font-black text-slate-900">{organization.defaultCreditDays} Days</p>
          <p className="text-slate-500 text-[11px]">Govt MSME rule: Pay suppliers within this time</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
            Starting Stock Value
          </div>
          <p className="text-base font-black text-emerald-700 font-mono">
            ₹{Number(organization.currentStockValue || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-slate-500 text-[11px]">Goods and materials in hand</p>
        </div>
      </div>

      {/* Empty State for Inward Purchase Bills */}
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center space-y-2">
        <PackageOpen className="w-10 h-10 text-slate-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">No Supplier Bills Entered Yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          When your purchase team or godown keeper enters bills from suppliers, they will show up here for tracking and payment.
        </p>
      </div>
    </div>
  );
}
