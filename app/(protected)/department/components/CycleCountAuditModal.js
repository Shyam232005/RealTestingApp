"use client";
import React, { useState } from "react";
import { X, Scale, AlertTriangle, CheckCircle2, Warehouse, Percent } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function CycleCountAuditModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    binLocation: "Bin A-01",
    skuCode: "SKU-HDPE-01",
    itemDescription: "HDPE Polymer Granules Grade 5002",
    systemRecordedQty: "100",
    physicalCountedQty: "92",
    uom: "KG",
    unitCost: "85",
    discrepancyReason: "MISPLACED_BIN",
    reconciliationStatus: "ADJUSTMENT_REQUESTED",
    supervisorNotes: "Physical floor count verified by supervisor. Discrepancy noted in aisle bin tare.",
  });

  if (!isOpen) return null;

  const sys = Number(formData.systemRecordedQty) || 0;
  const phys = Number(formData.physicalCountedQty) || 0;
  const diff = phys - sys;
  const cost = Number(formData.unitCost) || 0;
  const varianceValue = Number((diff * cost).toFixed(2));
  const variancePct = sys > 0 ? Number(((diff / sys) * 100).toFixed(2)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.binLocation || !formData.skuCode) {
      toast.error("Bin Location and SKU Code are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/inventory/variance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          systemRecordedQty: sys,
          physicalCountedQty: phys,
          unitCost: cost,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record cycle count audit.");
      }

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {}

      toast.success("Cycle Count Audit Logged!", {
        description: `Audit #${data.variance?.auditCode} recorded. Variance: ${diff} ${formData.uom} (₹${varianceValue}).`,
      });

      if (onSuccess) {
        onSuccess(data.variance);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to submit cycle count audit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">
                Log Cycle Count Audit & Request Stock Adjustment
              </h3>
              <p className="text-[11px] text-slate-400">
                Tier 4 Supervisor Authority • Inventory Variance Reconciliation
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
          {/* Bin & SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-sky-600" />
                <span>Bin Location *</span>
              </label>
              <select
                value={formData.binLocation}
                onChange={(e) => setFormData({ ...formData, binLocation: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden bg-white"
              >
                <option value="Bin A-01">Bin A-01 (Polymer Bay)</option>
                <option value="Bin A-02">Bin A-02 (Steel Coils)</option>
                <option value="Bin A-03">Bin A-03 (Consumables)</option>
                <option value="Bin B-01">Bin B-01 (Cartons / Packs)</option>
                <option value="Bin B-02">Bin B-02 (Direct Staging)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                SKU Code *
              </label>
              <input
                type="text"
                required
                value={formData.skuCode}
                onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
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
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
            />
          </div>

          {/* Counts & Costs */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                System Qty
              </label>
              <input
                type="number"
                required
                value={formData.systemRecordedQty}
                onChange={(e) => setFormData({ ...formData, systemRecordedQty: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Physical Qty
              </label>
              <input
                type="number"
                required
                value={formData.physicalCountedQty}
                onChange={(e) => setFormData({ ...formData, physicalCountedQty: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                UOM
              </label>
              <select
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="KG">KG</option>
                <option value="PCS">PCS</option>
                <option value="BOXES">BOXES</option>
                <option value="MT">MT</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Unit Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
              />
            </div>
          </div>

          {/* Dynamic Variance Evaluation Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              diff === 0
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                : diff > 0
                ? "bg-sky-50/70 border-sky-300 text-sky-950"
                : "bg-rose-50/70 border-rose-300 text-rose-950"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
              <span className="font-black text-xs uppercase flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                Count Discrepancy: {diff > 0 ? `+${diff}` : diff} {formData.uom} ({variancePct > 0 ? `+${variancePct}` : variancePct}%)
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  diff === 0
                    ? "bg-emerald-200 text-emerald-800"
                    : diff > 0
                    ? "bg-sky-200 text-sky-800"
                    : "bg-rose-200 text-rose-800"
                }`}
              >
                {diff === 0 ? "Zero Variance" : diff > 0 ? "Physical Surplus" : "Stock Shortfall"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Net Quantity Variance:</span>
                <strong className="font-mono text-slate-900">{diff} {formData.uom}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Monetary Valuation Impact:</span>
                <strong className={`font-mono ${varianceValue < 0 ? "text-rose-700 font-black" : "text-emerald-700 font-black"}`}>
                  {varianceValue < 0 ? `-₹${Math.abs(varianceValue).toLocaleString("en-IN")}` : `+₹${varianceValue.toLocaleString("en-IN")}`}
                </strong>
              </div>
            </div>
          </div>

          {/* Reason & Action Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Discrepancy Root Cause *
              </label>
              <select
                value={formData.discrepancyReason}
                onChange={(e) => setFormData({ ...formData, discrepancyReason: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="MISPLACED_BIN">Misplaced in Adjacent Aisle Bin</option>
                <option value="DAMAGED_UNRECORDED">Damaged Unrecorded (Scrap Leak)</option>
                <option value="THEFT_PILFERAGE">Theft / Pilferage Suspected</option>
                <option value="INWARD_OVERCOUNT">Inward GRN Overcount</option>
                <option value="PICKING_DISPATCH_LEAK">Picking Dispatch Slip</option>
                <option value="DATA_ENTRY_SLIP">Manual Data Entry Typo</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Reconciliation Action *
              </label>
              <select
                value={formData.reconciliationStatus}
                onChange={(e) => setFormData({ ...formData, reconciliationStatus: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden bg-white"
              >
                <option value="ADJUSTMENT_REQUESTED">Request Ledger Stock Adjustment</option>
                <option value="ADJUSTMENT_APPROVED">Authorize Immediate Ledger Sync</option>
                <option value="WRITE_OFF_RECORDED">Record Formal Inventory Write-Off</option>
                <option value="PENDING_AUDIT_REVIEW">Hold for Second Blind Recount</option>
              </select>
            </div>
          </div>

          {/* Supervisor Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Supervisor Audit Trail & Floor Notes
            </label>
            <textarea
              rows="2"
              value={formData.supervisorNotes}
              onChange={(e) => setFormData({ ...formData, supervisorNotes: e.target.value })}
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
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? "Recording..." : "Submit Cycle Count Audit"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
