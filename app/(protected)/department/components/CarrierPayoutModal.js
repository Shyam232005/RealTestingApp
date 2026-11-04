"use client";
import React, { useState } from "react";
import { X, CreditCard, CheckCircle2, AlertCircle, FileCheck, DollarSign } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function CarrierPayoutModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  selectedBatch = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    carrier: selectedBatch?.carrier || "BlueDart Express",
    disputeResolutionMode: "SETTLE_NET_AFTER_PENALTY",
    disbursementBatchRef: `DISB-CRW-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    managerNotes: "Carrier monthly invoice batch reconciled against weighbridge tare weights and 5% SLA tolerance gate. Net payable approved for AP disbursement.",
  });

  if (!isOpen) return null;

  const grossBilled = selectedBatch?.grossBilledAmount || 260000;
  const penalties = selectedBatch?.penaltyDeductions || 8400;
  const netPayable = selectedBatch?.netPayableAmount || (grossBilled - penalties);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/logistics/freight/payout-auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatch?.batchId || "BATCH-2026-OCT-1",
          carrier: formData.carrier,
          authorizedAmount: netPayable,
          disputeResolutionMode: formData.disputeResolutionMode,
          managerNotes: formData.managerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to authorize carrier payout batch");
      }

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      toast.success(data.message || "Carrier monthly payout authorized successfully!");
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to authorize payout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                  Tier 5 Manager Sign-Off
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Monthly Freight Batch
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 mt-0.5">
                Executive Carrier Payout & Dispute Resolution
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch Breakdown Card */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono font-black text-xs text-indigo-900">
                  {selectedBatch?.batchId || "BATCH-2026-OCT-1"}
                </span>
                <h4 className="text-sm font-black text-slate-900">{formData.carrier}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Net Payable</span>
                <span className="text-base font-mono font-black text-indigo-700">
                  ₹{netPayable.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100 text-xs">
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-slate-400 font-bold block">Gross Billed</span>
                <span className="font-mono font-bold text-slate-800">₹{grossBilled.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-rose-100">
                <span className="text-[10px] text-rose-500 font-bold block">SLA Penalties</span>
                <span className="font-mono font-bold text-rose-700">-₹{penalties.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-slate-400 font-bold block">Invoices Count</span>
                <span className="font-mono font-bold text-slate-800">{selectedBatch?.totalInvoices || 10} Invoices</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dispute Settlement & Deductions Protocol
              </label>
              <select
                value={formData.disputeResolutionMode}
                onChange={(e) => setFormData({ ...formData, disputeResolutionMode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="SETTLE_NET_AFTER_PENALTY">
                  Settle Net Payable (Automatically deduct 5% tolerance variance penalties)
                </option>
                <option value="APPROVE_FULL_INVOICE">
                  Special Commercial Override: Approve Full Gross Invoiced Amount
                </option>
                <option value="HOLD_FOR_CARRIER_MEET">
                  Hold Payment Tranche Pending Bi-Monthly Carrier SLA Review Meeting
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ERP Accounts Payable Disbursement Docket Ref
              </label>
              <input
                type="text"
                value={formData.disbursementBatchRef}
                onChange={(e) => setFormData({ ...formData, disbursementBatchRef: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Manager Executive Approval Remarks
              </label>
              <textarea
                rows={3}
                value={formData.managerNotes}
                onChange={(e) => setFormData({ ...formData, managerNotes: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <FileCheck className="w-4 h-4" />
                <span>{loading ? "Authorizing Payout..." : "Sign Off Monthly Carrier Payout"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
