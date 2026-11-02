"use client";

import React from "react";
import { ClipboardCheck, TrendingUp, Boxes } from "lucide-react";

/**
 * ApprovalZeroState - Strict Tier 2 Coordinator Empty State for Deals & Quotations
 * Visual: Lucide ClipboardCheck icon, styled in a centered container with a light gray background.
 * Copy: "Zero Pending Approvals. All Tier 1 drafted estimates have been reviewed and either rejected or converted to Confirmed Orders."
 * Action: A primary button "+ Review Deal Pipeline".
 */
export default function ApprovalZeroState({ onReviewPipeline, className = "" }) {
  return (
    <div
      className={`p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-5 ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-white text-slate-700 flex items-center justify-center mx-auto border border-slate-200 shadow-xs">
        <ClipboardCheck className="w-8 h-8 text-purple-600" />
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          Zero Pending Approvals. All Tier 1 drafted estimates have been reviewed and either rejected or converted to Confirmed Orders.
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Quotes requiring gross margin approval or inventory stock reservation will queue here automatically upon submission.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center">
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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 shadow-2xs">
          <Boxes className="w-3.5 h-3.5 text-purple-600" />
          <span>Stock Reservation Safeguard &bull; 18% Gross Margin Floor</span>
        </div>
      </div>
    </div>
  );
}
