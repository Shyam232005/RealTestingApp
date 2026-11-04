"use client";
import React, { useState } from "react";
import { X, Scale, Percent, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function FreightAuditModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  initialData = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: initialData?.invoiceNumber || `INV-3PL-${Math.floor(10000 + Math.random() * 90000)}`,
    awbNumber: initialData?.awbNumber || "",
    orderReference: initialData?.orderReference || "",
    carrier: initialData?.carrier || "BlueDart Express",
    destinationZone: initialData?.destinationZone || "North Zone (Tier 1)",
    actualWeightKg: initialData?.actualWeightKg ? String(initialData.actualWeightKg) : "20",
    billedWeightKg: initialData?.billedWeightKg ? String(initialData.billedWeightKg) : "20.8",
    ratePerKg: "60",
    disputeReason: initialData?.disputeReason || "",
  });

  if (!isOpen) return null;

  const actual = Math.max(0.1, Number(formData.actualWeightKg) || 0.1);
  const billed = Math.max(0.1, Number(formData.billedWeightKg) || 0.1);
  const rate = Math.max(1, Number(formData.ratePerKg) || 1);

  const variancePercent = Number((((billed - actual) / actual) * 100).toFixed(2));
  const expectedAmount = Number((actual * rate).toFixed(2));
  const billedAmount = Number((billed * rate).toFixed(2));
  const differenceAmount = Number((billedAmount - expectedAmount).toFixed(2));

  const isWithinTolerance = Math.abs(variancePercent) <= 5.0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoiceNumber || !formData.awbNumber) {
      toast.error("Invoice Number and AWB Number are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/freight/audit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          actualWeightKg: actual,
          billedWeightKg: billed,
          ratePerKg: rate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit freight audit.");
      }

      if (isWithinTolerance) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        } catch {}
        toast.success("Freight Bill Approved (Within 5% Tolerance)!", {
          description: `Invoice #${formData.invoiceNumber} approved with variance of ${variancePercent}%.`,
        });
      } else {
        toast.warning("Freight Bill Disputed (> 5% Variance Gate)!", {
          description: `Dispute logged against ${formData.carrier}. Variance of ${variancePercent}% exceeds allowable 5% limit.`,
        });
      }

      if (onSuccess) {
        onSuccess(data.auditRecord);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to process freight audit");
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
                Freight Billing Pre-Audit (5% Variance Rule)
              </h3>
              <p className="text-[11px] text-slate-400">
                Tier 2 Coordinator Action • Validates Carrier Billed vs Actual Volumetric Wt
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
          {/* Invoice & AWB */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Carrier Freight Invoice # *
              </label>
              <input
                type="text"
                required
                placeholder="INV-BD-99104"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                AWB / Waybill # *
              </label>
              <input
                type="text"
                required
                placeholder="AWB-BD-88410291"
                value={formData.awbNumber}
                onChange={(e) => setFormData({ ...formData, awbNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Carrier & Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                3PL Carrier
              </label>
              <select
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
              >
                <option value="BlueDart Express">BlueDart Express</option>
                <option value="Delhivery Logistics">Delhivery Logistics</option>
                <option value="V-Trans Heavy Freight">V-Trans Heavy Freight</option>
                <option value="TCI Express">TCI Express</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Order Reference
              </label>
              <input
                type="text"
                placeholder="SO-CRW-2026-9041"
                value={formData.orderReference}
                onChange={(e) => setFormData({ ...formData, orderReference: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
              />
            </div>
          </div>

          {/* Weights & Rate Input */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Actual Vol Wt (kg) *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={formData.actualWeightKg}
                onChange={(e) => setFormData({ ...formData, actualWeightKg: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Carrier Billed Wt (kg) *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={formData.billedWeightKg}
                onChange={(e) => setFormData({ ...formData, billedWeightKg: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Rate / kg (₹)
              </label>
              <input
                type="number"
                min="1"
                value={formData.ratePerKg}
                onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Dynamic 5% Gate Evaluation Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isWithinTolerance
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                : "bg-rose-50/70 border-rose-300 text-rose-950"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase">
                {isWithinTolerance ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Variance: {variancePercent > 0 ? `+${variancePercent}` : variancePercent}% (Pass: ≤ 5.0%)</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Variance: {variancePercent > 0 ? `+${variancePercent}` : variancePercent}% (Exceeds 5.0% Limit!)</span>
                  </>
                )}
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  isWithinTolerance
                    ? "bg-emerald-200 text-emerald-800"
                    : "bg-rose-200 text-rose-800"
                }`}
              >
                {isWithinTolerance ? "Within 5% Tolerance" : "Dispute Mandatory"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Expected Bill:</span>
                <strong className="font-mono text-slate-900">₹{expectedAmount.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Carrier Billed:</span>
                <strong className="font-mono text-slate-900">₹{billedAmount.toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Difference:</span>
                <strong className={`font-mono ${differenceAmount > 0 ? "text-rose-700 font-black" : "text-emerald-700"}`}>
                  {differenceAmount > 0 ? `+₹${differenceAmount}` : `₹${differenceAmount}`}
                </strong>
              </div>
            </div>
          </div>

          {/* Dispute Reason if over tolerance */}
          {!isWithinTolerance && (
            <div>
              <label className="block text-[11px] font-bold text-rose-800 uppercase mb-1">
                Dispute Reason (Mandatory for &gt; 5% Variance) *
              </label>
              <textarea
                rows="2"
                required
                placeholder="e.g. Carrier billed 28kg. Actual verified volumetric tare weight is 20kg. Holding invoice for credit note."
                value={formData.disputeReason}
                onChange={(e) => setFormData({ ...formData, disputeReason: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs focus:outline-hidden bg-rose-50/30"
              />
            </div>
          )}

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
              className={`px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 ${
                isWithinTolerance ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? "Evaluating..."
                  : isWithinTolerance
                  ? "Authorize & Approve Pre-Audit"
                  : "Flag & Log Carrier Dispute"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
