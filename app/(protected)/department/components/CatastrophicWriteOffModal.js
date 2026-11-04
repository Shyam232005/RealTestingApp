"use client";
import React, { useState } from "react";
import { X, ShieldAlert, FileText, CheckCircle2, AlertOctagon } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function CatastrophicWriteOffModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  selectedItem = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    action: "APPROVE_CATASTROPHIC_SETTLEMENT",
    insuranceClaimNumber: `INS-CATA-${Math.floor(100000 + Math.random() * 900000)}`,
    legalSettlementRef: `LEG-DISP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    directorNotes: "Catastrophic loss and insurance write-off authorized under Director supreme signing authority following forensic cargo review.",
  });

  if (!isOpen) return null;

  const estimatedLoss = selectedItem?.estimatedLossAmount || 650000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.insuranceClaimNumber) {
      toast.error("Insurance Claim Number is mandatory for catastrophic write-offs.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/director/catastrophic-writeoff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: selectedItem?.id || selectedItem?._id,
          recordType: selectedItem?.recordType || "TRANSIT_DAMAGE_MEMO",
          action: formData.action,
          insuranceClaimNumber: formData.insuranceClaimNumber,
          legalSettlementRef: formData.legalSettlementRef,
          directorNotes: formData.directorNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to authorize catastrophic write-off.");
      }

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      toast.success(data.message || "Catastrophic write-off successfully authorized!");
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      toast.error(err.message || "Authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-200/80 text-rose-800">
                  Tier 6 Executive Authority
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Limit: &gt;₹500,000
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Enterprise Catastrophic Loss Authorization
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Record Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Record Reference</span>
              <p className="font-mono font-black text-slate-900 text-sm">
                {selectedItem?.referenceCode || selectedItem?.memoNumber || "MEMO-CAT-9921"}
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                {selectedItem?.itemDescription || "High-Tensile Rolled Steel Coils (Transit Derailment)"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Catastrophic Loss</span>
              <p className="font-mono font-black text-rose-700 text-base">
                ₹{estimatedLoss.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Director Authorization Action
            </label>
            <select
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="APPROVE_CATASTROPHIC_SETTLEMENT">
                Approve Catastrophic Loss (Lodge Full Underwriter Claim)
              </option>
              <option value="APPROVE_LEGAL_WRITE_OFF">
                Approve Legal Settlement & Corporate Write-Down
              </option>
              <option value="REJECT_FOR_FORENSIC_AUDIT">
                Reject & Hold for External Forensic Insurance Audit
              </option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cargo Underwriter Claim Number
              </label>
              <input
                type="text"
                required
                value={formData.insuranceClaimNumber}
                onChange={(e) => setFormData({ ...formData, insuranceClaimNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Legal / Arbitration Settlement Ref
              </label>
              <input
                type="text"
                required
                value={formData.legalSettlementRef}
                onChange={(e) => setFormData({ ...formData, legalSettlementRef: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Director Executive Finding & Settlement Notes
            </label>
            <textarea
              rows={3}
              value={formData.directorNotes}
              onChange={(e) => setFormData({ ...formData, directorNotes: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{loading ? "Authorizing..." : "Sign & Authorize Catastrophic Write-Off"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
