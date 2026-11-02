"use client";

import React from "react";
import { ListTodo, Plus, Sparkles, ShieldCheck } from "lucide-react";

/**
 * CoordinatorLeadPoolZeroState - Strict Tier 2 Coordinator Empty State
 * Rendered when tasks.length === 0 to enforce real-world CRM hygiene duties.
 */
export default function CoordinatorLeadPoolZeroState({
  onDelegateTask,
  className = "",
}) {
  return (
    <div
      className={`p-10 sm:p-14 text-center rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-5 ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-inner">
        <ListTodo className="w-8 h-8 text-blue-600" />
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          No pending tasks or delegations. Assign follow-up calls or client visits to Tier 1 Assistants to maintain CRM hygiene.
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          As Tier 2 Coordinator, ensure inbound inquiries are promptly distributed to telecallers and outside sales officers.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onDelegateTask}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Delegate New Task</span>
        </button>
      </div>

      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>CRM Delegation &bull; Real-time Dexie.js live sync with Tier 1 Desk</span>
        </div>
      </div>
    </div>
  );
}
