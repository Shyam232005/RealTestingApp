"use client";

import React from "react";
import { Truck, Plus, PackageCheck } from "lucide-react";

/**
 * DispatchZeroState - Strict Tier 2 Coordinator Empty State for Counter Desk
 * Visual: Lucide Truck icon, styled in a centered container with a light gray background.
 * Copy: "Fulfillment queue is clear. No confirmed orders are pending dispatch routing or payment collection."
 * Action: A primary button "+ Create Dispatch Log".
 */
export default function DispatchZeroState({ onCreateDispatchLog, className = "" }) {
  return (
    <div
      className={`p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-5 ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-white text-slate-700 flex items-center justify-center mx-auto border border-slate-200 shadow-xs">
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

      <div className="pt-2 flex items-center justify-center">
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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 shadow-2xs">
          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Freight Logistics &bull; Fast-Track Bilty Synchronization</span>
        </div>
      </div>
    </div>
  );
}
