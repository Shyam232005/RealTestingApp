"use client";
import React, { useState } from "react";
import { X, PackageCheck, ShieldCheck, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function DirectorPoAuthModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  selectedPo = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    action: "DIRECTOR_SIGN_OFF",
    isMultiYearContract: selectedPo?.isMultiYearContract || false,
    contractTenureYears: selectedPo?.contractTenureYears || 2,
    directorNotes: "Supreme executive sign-off granted by Director of Logistics for high-value procurement cycle.",
  });

  if (!isOpen || !selectedPo) return null;

  const totalCost = Number(selectedPo.totalCost) || 0;
  const isHighValue = totalCost >= 500000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/logistics/procurement/purchase-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poId: selectedPo.id || selectedPo._id,
          action: formData.action,
          directorNotes: formData.directorNotes,
          isMultiYearContract: formData.isMultiYearContract,
          contractTenureYears: formData.contractTenureYears,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to authorize purchase order.");
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      toast.success(data.message || "Purchase order successfully authorized!");
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      toast.error(err.message || "PO authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 border border-sky-200 text-sky-700">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-200/80 text-sky-800">
                  Tier 6 Supreme Authority
                </span>
                {isHighValue && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    High-Value &gt;₹500,000
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Director Executive Purchase Order Sign-Off
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
          {/* Target PO Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 text-sm">{selectedPo.poNumber}</span>
              <span className="font-mono font-black text-sky-700 text-base">
                ₹{totalCost.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800">Vendor: {selectedPo.vendorName}</p>
            {selectedPo.itemsSummary && (
              <p className="text-[11px] text-slate-500 truncate" title={selectedPo.itemsSummary}>
                Items: {selectedPo.itemsSummary}
              </p>
            )}
            {selectedPo.dockAppointmentSlot && (
              <p className="text-[10px] font-mono text-slate-500">
                Dock Window: {selectedPo.dockAppointmentSlot}
              </p>
            )}
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
              <option value="DIRECTOR_SIGN_OFF">
                Grant Supreme Executive Sign-Off (Release PO &amp; Lock Funds)
              </option>
              <option value="APPROVE_MULTI_YEAR">
                Approve as Multi-Year Long-Term Master Supply Contract
              </option>
              <option value="REJECT">Reject PO &amp; Void Procurement Slot</option>
            </select>
          </div>

          {formData.action === "APPROVE_MULTI_YEAR" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-sky-50/50 border border-sky-100">
              <div>
                <label className="block text-[11px] font-bold text-sky-900 mb-1">
                  Multi-Year Contract Agreement
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="multiYearCheck"
                    checked={formData.isMultiYearContract}
                    onChange={(e) =>
                      setFormData({ ...formData, isMultiYearContract: e.target.checked })
                    }
                    className="rounded text-sky-600 w-4 h-4"
                  />
                  <label htmlFor="multiYearCheck" className="text-xs font-medium text-slate-700">
                    Lock Vendor Rates
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-900 mb-1">
                  Tenure (Years)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={formData.contractTenureYears}
                  onChange={(e) =>
                    setFormData({ ...formData, contractTenureYears: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-sky-200 bg-white font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Executive Justification &amp; Notes
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
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md shadow-sky-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "Authorizing..." : "Grant Supreme Executive Sign-Off"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
