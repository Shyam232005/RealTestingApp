"use client";
import React, { useState } from "react";
import { X, Send, Scale, Truck, MapPin, Layers, CheckCircle2, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function AllocateCarrierModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  orders = [],
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orderReference: orders[0]?.orderReference || "SO-CRW-2026-9041",
    deliveryPinCode: "400001",
    destinationCity: "Mumbai South Hub",
    carrier: "BlueDart Express",
    lengthCm: "50",
    widthCm: "40",
    heightCm: "40",
    deadWeightKg: "15",
    vehicleNumber: "MH-12-RN-8841",
    driverContact: "+91 98200 12345",
    notes: "Express commercial delivery. Fragile inner carton packaging.",
  });

  if (!isOpen) return null;

  // IATA Volumetric Calculation: (L * W * H) / 5000
  const l = Number(formData.lengthCm) || 0;
  const w = Number(formData.widthCm) || 0;
  const h = Number(formData.heightCm) || 0;
  const dead = Number(formData.deadWeightKg) || 0;
  const volumetric = Number(((l * w * h) / 5000).toFixed(2));
  const chargeable = Math.max(dead, volumetric);
  const isVolumetricHigher = volumetric > dead;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orderReference || !formData.deliveryPinCode) {
      toast.error("Order Reference and Delivery PIN Code are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/outbound/carrier-allocation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lengthCm: l,
          widthCm: w,
          heightCm: h,
          deadWeightKg: dead,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to allocate 3PL carrier.");
      }

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.75 } });
      } catch {}

      toast.success("Carrier Allocated & AWB Generated!", {
        description: `Master AWB #${data.allocation?.awbNumber} and Part-B E-Way Bill #${data.allocation?.ewayBillNumber} created for ${data.allocation?.carrier}.`,
      });

      if (onSuccess) {
        onSuccess(data.allocation);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to route consignment");
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
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">
                3PL Freight Routing & AWB Generation
              </h3>
              <p className="text-[11px] text-slate-400">
                Tier 2 Coordinator Action • Volumetric Calculation & Master Waybill
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
          {/* Order Ref & Carrier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Order / Consignment Reference *
              </label>
              <input
                type="text"
                required
                placeholder="SO-CRW-2026-9041"
                value={formData.orderReference}
                onChange={(e) => setFormData({ ...formData, orderReference: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Contracted 3PL Carrier *
              </label>
              <select
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-sky-500 bg-white"
              >
                <option value="BlueDart Express">BlueDart Express (Air Express)</option>
                <option value="Delhivery Logistics">Delhivery Logistics (Surface Fast)</option>
                <option value="V-Trans Heavy Freight">V-Trans Heavy Freight (Part Truckload)</option>
                <option value="TCI Express">TCI Express (Nationwide Heavy)</option>
              </select>
            </div>
          </div>

          {/* Destination PIN & City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Destination PIN Code *</span>
              </label>
              <input
                type="text"
                required
                placeholder="400001"
                maxLength={6}
                value={formData.deliveryPinCode}
                onChange={(e) => setFormData({ ...formData, deliveryPinCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Destination City / Hub
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai, Surat, Delhi"
                value={formData.destinationCity}
                onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Dimension & Volumetric Weight Calculator */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-sky-950 uppercase flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-sky-700" />
                Volumetric Weight Calculator (IATA / 5000)
              </span>
              <span className="text-[10px] font-mono text-sky-800 bg-sky-100 px-2 py-0.5 rounded font-bold">
                (L × W × H) / 5000
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.lengthCm}
                  onChange={(e) => setFormData({ ...formData, lengthCm: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Width (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.widthCm}
                  onChange={(e) => setFormData({ ...formData, widthCm: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dead Wt (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={formData.deadWeightKg}
                  onChange={(e) => setFormData({ ...formData, deadWeightKg: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-sky-100 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-500">Volumetric: </span>
                <strong className="font-mono text-slate-900">{volumetric} kg</strong>
                <span className="text-slate-400 mx-1.5">|</span>
                <span className="text-slate-500">Dead Wt: </span>
                <strong className="font-mono text-slate-900">{dead} kg</strong>
              </div>
              <div className="font-bold">
                <span className="text-sky-900">Chargeable Wt: </span>
                <span className="px-2 py-0.5 rounded bg-sky-600 text-white font-mono font-black">
                  {chargeable} kg
                </span>
                {isVolumetricHigher && (
                  <span className="text-[9px] text-amber-700 ml-1.5 font-bold">
                    (Volumetric Applied)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Plate & Driver Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Transporter Vehicle Plate
              </label>
              <input
                type="text"
                required
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Driver Contact Number
              </label>
              <input
                type="text"
                value={formData.driverContact}
                onChange={(e) => setFormData({ ...formData, driverContact: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Dispatch Instructions / Handling Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              <span>{loading ? "Allocating..." : "Assign Carrier & Generate Master AWB"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
