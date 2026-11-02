"use client";

import React from "react";
import { ClipboardCheck, TrendingUp, Boxes, CheckCircle2 } from "lucide-react";

/**
 * CoordinatorDealsZeroState - Strict Tier 2 Coordinator Empty State
 * Rendered when pendingApprovals.length === 0 to enforce real-world estimate vetting duties.
 */
export default function CoordinatorDealsZeroState({
  onReviewPipeline,
  className = "",
}) {
  return (
    <div
      className={`p-10 sm:p-14 text-center rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-5 ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100 shadow-inner">
        <ClipboardCheck className="w-8 h-8 text-purple-600" />
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          Zero Pending Approvals. All Tier 1 drafted estimates have been reviewed and either rejected or converted to Confirmed Orders.
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          New quotes drafted by Sales Assistants exceeding discount limits or requiring stock reservation will queue here automatically.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onReviewPipeline}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
        >
          <TrendingUp className="w-4 h-4" />
          <span>+ Review Deal Pipeline</span>
        </button>
      </div>

      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
          <Boxes className="w-3.5 h-3.5 text-purple-600" />
          <span>Automated Inventory Reservation &bull; 18% HQ Margin Floor Compliance</span>
        </div>
      </div>
    </div>
  );
}
