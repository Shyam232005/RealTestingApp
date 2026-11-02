"use client";

import React from "react";
import { Truck, Plus, PackageCheck, Receipt } from "lucide-react";

/**
 * CoordinatorCounterDeskZeroState - Strict Tier 2 Coordinator Empty State
 * Rendered when pendingDispatch.length === 0 (or fulfillment queue is empty).
 */
export default function CoordinatorCounterDeskZeroState({
  onCreateDispatchLog,
  className = "",
}) {
  return (
    <div
      className={`p-10 sm:p-14 text-center rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-5 ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
        <Truck className="w-8 h-8 text-emerald-600" />
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          Fulfillment queue is clear. No confirmed orders are pending dispatch routing or payment collection.
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          When confirmed sales orders clear commercial approval and require carrier transport, docket tracking details can be scheduled here.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onCreateDispatchLog}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Dispatch Log</span>
        </button>
      </div>

      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
          <span>Freight Docket Logging &bull; NET_30 MSME Receivables Tracking</span>
        </div>
      </div>
    </div>
  );
}
