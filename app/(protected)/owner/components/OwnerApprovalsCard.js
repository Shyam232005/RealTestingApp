"use client";
import React from "react";
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function OwnerApprovalsCard({
  organization,
  selectedBranch,
  setActiveTab,
  pendingApprovals = [],
}) {
  const poLimit = Number(organization?.poApprovalLimit || 25000);

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-purple-600" />
            Orders Needing Your OK
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Purchase orders & bills waiting for your approval
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          {pendingApprovals.length} Waiting
        </span>
      </div>

      {/* Approval Rule Banner (in simple business words) */}
      <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 text-xs space-y-1">
        <p className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          Your Business Rule
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Any purchase or order over{" "}
          <span className="font-bold text-slate-900 font-mono">
            ₹{poLimit.toLocaleString("en-IN")}
          </span>{" "}
          needs your direct OK before payment is released.
        </p>
      </div>

      {/* List or Empty State */}
      {pendingApprovals.length > 0 ? (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {pendingApprovals.map((item, idx) => {
            const isCa = item.type === "CA_DATA_ACCESS";
            return (
              <div
                key={item._id || item.id || idx}
                className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-950 text-[11px]">
                    {isCa ? "CA Data Access" : (item.poNumber || `PO-#100${idx + 1}`)}
                  </span>
                  {!isCa && (
                    <span className="font-mono font-black text-slate-900">
                      ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 truncate">
                  Requester: <span className="font-semibold text-slate-800">{isCa ? item.caName : (item.employeeName || "Staff Member")}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("approval")}
                  className="w-full mt-1 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold text-center transition-all cursor-pointer"
                >
                  Review & Sign Off
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-center space-y-2">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-900">
            All Clear — 0 Pending Approvals
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            No bills or purchase orders are waiting for your signature right now. Whenever a purchase above ₹{poLimit.toLocaleString("en-IN")} is raised, it will appear here instantly.
          </p>
        </div>
      )}

      {/* Footer link to full approval desk */}
      <button
        onClick={() => setActiveTab("approval")}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
      >
        <span>Open Approvals Desk</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
