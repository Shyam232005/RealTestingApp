"use client";
import React, { useState } from "react";
import { X, ShieldAlert, FileText, CheckCircle2, Lock, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function DiscrepancyMemoModal({
  isOpen,
  onClose,
  onSuccess,
  item = null,
  employee,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quarantineLogId: item?.id || item?._id || "",
    cartonId: item?.cartonId || "",
    skuCode: item?.skuCode || "SKU-DEFECT",
    itemDescription: item?.itemDescription || "",
    batchLotNumber: item?.batchLotNumber || "BATCH-DOCK",
    quantity: item?.quantity ? String(item.quantity) : "1",
    uom: "Units",
    vendorName: item?.vendorName || "Direct Supplier Ltd",
    vendorGstin: item?.vendorGstin || "27AABCV1234Q1Z2",
    referencePoNumber: item?.referencePoNumber || "PO-INWARD",
    discrepancyType: item?.discrepancyType || "CRUSHED_CARTON",
    severity: item?.severity || "HIGH",
    quarantineCageLocation: "Quarantine Cage Q-Locked-01 (High Security)",
    vendorDebitNoteRequested: true,
    estimatedLossAmount: "12500",
    damageAssessmentNotes: item?.notes
      ? `Damaged packaging confirmed on supervisor floor audit. ${item.notes}`
      : "Outer casing severely damaged. Internal product seal compromised during transit. Full vendor debit note requested.",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cartonId || !formData.itemDescription) {
      toast.error("Carton ID and Item Description are mandatory.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/inventory/discrepancy-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity) || 1,
          estimatedLossAmount: Number(formData.estimatedLossAmount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate Discrepancy Memo.");
      }

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {}

      toast.success("Discrepancy Memo Generated!", {
        description: `Memo #${data.memo?.memoNumber} created. Stock locked in ${formData.quarantineCageLocation} for vendor debit note.`,
      });

      if (onSuccess) {
        onSuccess(data.memo);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to issue Discrepancy Memo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">
                Quarantine Adjudication & Vendor Debit Memo
              </h3>
              <p className="text-[11px] text-slate-400">
                Tier 4 Supervisor Authority • Locks Stock into High-Security Cage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Carton & SKU Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Carton / Barcode ID *
              </label>
              <input
                type="text"
                required
                value={formData.cartonId}
                onChange={(e) => setFormData({ ...formData, cartonId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-rose-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Batch / Lot Number
              </label>
              <input
                type="text"
                value={formData.batchLotNumber}
                onChange={(e) => setFormData({ ...formData, batchLotNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Material Description *
            </label>
            <input
              type="text"
              required
              value={formData.itemDescription}
              onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
            />
          </div>

          {/* Vendor Details & Claim Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Damaged Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Claim Value (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.estimatedLossAmount}
                onChange={(e) => setFormData({ ...formData, estimatedLossAmount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-black text-rose-700 bg-white"
              />
            </div>
          </div>

          {/* Cage Location & Defect Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>Quarantine Cage Location *</span>
              </label>
              <select
                value={formData.quarantineCageLocation}
                onChange={(e) => setFormData({ ...formData, quarantineCageLocation: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
              >
                <option value="Quarantine Cage Q-Locked-01 (High Security)">
                  Quarantine Cage Q-Locked-01 (High Security)
                </option>
                <option value="Quarantine Cage Q-Locked-02 (Cold Chain Breach Hold)">
                  Quarantine Cage Q-Locked-02 (Cold Chain Hold)
                </option>
                <option value="Quarantine Heavy Staging Bay Q-3">
                  Quarantine Heavy Staging Bay Q-3
                </option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Defect Discrepancy Type
              </label>
              <select
                value={formData.discrepancyType}
                onChange={(e) => setFormData({ ...formData, discrepancyType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden bg-white"
              >
                <option value="CRUSHED_CARTON">Crushed Carton</option>
                <option value="BROKEN_INNER_PACK">Broken Inner Pack</option>
                <option value="LEAKAGE">Liquid Leakage</option>
                <option value="SEAL_TAMPERED">Seal Tampered</option>
                <option value="TEMPERATURE_BREACH">Cold-Chain Breach</option>
                <option value="MOISTURE_DAMAGE">Moisture Damage</option>
                <option value="OTHER">Other Defect</option>
              </select>
            </div>
          </div>

          {/* Debit Note Checkbox */}
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.vendorDebitNoteRequested}
                onChange={(e) =>
                  setFormData({ ...formData, vendorDebitNoteRequested: e.target.checked })
                }
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-rose-950">
                Generate Vendor Debit Note Claim (Statutory Recovery)
              </span>
            </label>
            <span className="text-[10px] font-mono text-rose-800 bg-rose-200/60 px-2 py-0.5 rounded font-black">
              ₹{Number(formData.estimatedLossAmount).toLocaleString("en-IN")}
            </span>
          </div>

          {/* Assessment Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Supervisor Damage Assessment & Evidence Notes
            </label>
            <textarea
              rows="2"
              value={formData.damageAssessmentNotes}
              onChange={(e) => setFormData({ ...formData, damageAssessmentNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? "Locking..." : "Issue Discrepancy Memo & Lock Cage"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
