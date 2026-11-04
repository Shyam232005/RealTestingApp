"use client";
import React, { useState } from "react";
import { X, ShieldAlert, ShieldCheck, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function ExecutiveWriteOffModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  selectedItem = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    action: "APPROVE_INSURANCE_WRITEOFF",
    insuranceClaimNumber: `INS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
    surveyorReportRef: "SRV-HDFC-ERGO-8841",
    managerNotes: "Physical cargo inspection confirmed transit crushing damage. Loss exceeds ₹50,000 supervisor threshold. Executive write-down authorized and claim lodged with underwriters.",
  });

  if (!isOpen) return null;

  const estimatedLoss = selectedItem?.estimatedLossAmount || 75000;
  const isAboveThreshold = estimatedLoss >= 50000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.insuranceClaimNumber) {
      toast.error("Insurance Claim Number is mandatory for executive write-offs.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/inventory/executive-writeoff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: selectedItem?.id || selectedItem?._id || "6724fa091bbcc2001e4590aa",
          recordType: selectedItem?.recordType || "TRANSIT_DAMAGE_MEMO",
          action: formData.action,
          insuranceClaimNumber: formData.insuranceClaimNumber,
          managerNotes: `${formData.managerNotes} [Surveyor Ref: ${formData.surveyorReportRef}]`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to authorize executive write-off");
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      toast.success(data.message || "Executive write-off authorized successfully!");
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to authorize write-off.");
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
            <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  Tier 5 Manager Authorization
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Threshold: &gt; ₹50,000
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 mt-0.5">
                Executive Major Inventory Write-Off Desk
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

        {/* Selected Item Summary Card */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="font-mono font-black text-xs text-rose-900">
                  {selectedItem?.referenceCode || "MEMO-DM-2026-901"}
                </span>
              </div>
              <span className="text-xs font-mono font-black text-rose-700 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200">
                ₹{estimatedLoss.toLocaleString("en-IN")} Loss
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900">
              {selectedItem?.itemDescription || "Precision Hydraulic Seals (Grade 304 Casing)"}
            </p>
            <div className="text-[11px] text-slate-600 flex items-center justify-between">
              <span>SKU: <strong className="font-mono text-slate-800">{selectedItem?.skuCode || "RAW-SEAL-HYD-04"}</strong></span>
              <span>Qty: <strong className="font-mono text-slate-800">{selectedItem?.quantity || 120} {selectedItem?.uom || "Units"}</strong></span>
              <span>Vendor: <strong className="text-slate-800">{selectedItem?.vendorName || "Godrej Precision Ltd"}</strong></span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Resolution Action
              </label>
              <select
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="APPROVE_INSURANCE_WRITEOFF">
                  Approve Transit Damage & Lodge Insurance Underwriter Claim
                </option>
                <option value="APPROVE_SCRAP">
                  Approve Total Scrap & Post General Ledger Inventory Write-Down
                </option>
                <option value="HOLD_FOR_INVESTIGATION">
                  Hold in Quarantine & Require Secondary Forensic Survey
                </option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Insurance Claim Policy / Docket Ref
                </label>
                <input
                  type="text"
                  value={formData.insuranceClaimNumber}
                  onChange={(e) => setFormData({ ...formData, insuranceClaimNumber: e.target.value })}
                  placeholder="e.g. INS-2026-90421"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Surveyor Inspection Report Ref
                </label>
                <input
                  type="text"
                  value={formData.surveyorReportRef}
                  onChange={(e) => setFormData({ ...formData, surveyorReportRef: e.target.value })}
                  placeholder="e.g. SRV-HDFC-882"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Authorization Justification
              </label>
              <textarea
                rows={3}
                value={formData.managerNotes}
                onChange={(e) => setFormData({ ...formData, managerNotes: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? "Authorizing Write-Off..." : "Sign Off & Execute Write-Off"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
