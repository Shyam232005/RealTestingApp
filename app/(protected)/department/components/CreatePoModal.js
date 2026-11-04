"use client";
import React, { useState } from "react";
import { X, Plus, Calendar, Clock, Building, Truck, FileText, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function CreatePoModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: "",
    vendorGstin: "27AABCV1234Q1Z2",
    vendorAddress: "MIDC Industrial Area, Pune 411026",
    materialDescription: "",
    quantity: "100",
    uom: "KG",
    unitPrice: "85",
    expectedDeliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    dockAppointmentSlot: "Bay 1 (Morning 08:00 - 12:00)",
  });

  if (!isOpen) return null;

  const totalCost = (Number(formData.quantity) || 0) * (Number(formData.unitPrice) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendorName || !formData.materialDescription) {
      toast.error("Vendor Name and Material Description are mandatory.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/procurement/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalCost,
          quantity: Number(formData.quantity) || 1,
          unitPrice: Number(formData.unitPrice) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Purchase Order.");
      }

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {}

      toast.success("Purchase Order & ASN Generated!", {
        description: `PO #${data.purchaseOrder?.poNumber} created with ASN #${data.purchaseOrder?.asnNumber}. Dock slot locked at ${formData.dockAppointmentSlot}.`,
      });

      if (onSuccess) {
        onSuccess(data.purchaseOrder);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to generate Purchase Order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">
                + Create Vendor Purchase Order (PO) & ASN
              </h3>
              <p className="text-[11px] text-slate-400">
                Tier 2 Coordinator Action • Schedules Demurrage-Free Inward Dock Slot
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Vendor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Vendor / Supplier Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tata Steel Products Ltd"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Vendor GSTIN
              </label>
              <input
                type="text"
                placeholder="27AABCV1234Q1Z2"
                value={formData.vendorGstin}
                onChange={(e) => setFormData({ ...formData, vendorGstin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Material / SKU Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDPE Polymers Grade 5002 / TMT Steel Rods"
              value={formData.materialDescription}
              onChange={(e) => setFormData({ ...formData, materialDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-sky-500 bg-white"
            />
          </div>

          {/* Quantity, UOM & Unit Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Unit of Measure (UOM)
              </label>
              <select
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-sky-500 bg-white"
              >
                <option value="KG">KG (Kilograms)</option>
                <option value="MT">MT (Metric Tonnes)</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="BOXES">BOXES (Cartons)</option>
                <option value="ROLLS">ROLLS</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Unit Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Delivery Date & Dock Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Expected Delivery Date *</span>
              </label>
              <input
                type="date"
                required
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-sky-600" />
                <span>Dock Appointment Slot (Anti-Demurrage)</span>
              </label>
              <select
                value={formData.dockAppointmentSlot}
                onChange={(e) => setFormData({ ...formData, dockAppointmentSlot: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-sky-500 bg-white"
              >
                <option value="Bay 1 (Morning 08:00 - 12:00)">Bay 1 (Morning 08:00 - 12:00)</option>
                <option value="Bay 1 (Afternoon 12:00 - 16:00)">Bay 1 (Afternoon 12:00 - 16:00)</option>
                <option value="Bay 2 (Morning 08:00 - 12:00)">Bay 2 (Morning 08:00 - 12:00)</option>
                <option value="Bay 2 (Afternoon 12:00 - 16:00)">Bay 2 (Afternoon 12:00 - 16:00)</option>
                <option value="Bay 3 (Dedicated Direct Fleet Afternoon 14:00 - 18:00)">
                  Bay 3 (Direct Fleet 14:00 - 18:00)
                </option>
              </select>
            </div>
          </div>

          {/* Cost Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                Total PO Estimated Value
              </span>
              <span className="text-base font-black text-slate-900 font-mono">
                ₹{totalCost.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Auto-generates ASN & Dock Pass
              </span>
            </div>
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
              <span>{loading ? "Authorizing..." : "Authorize PO & Lock Dock Slot"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
