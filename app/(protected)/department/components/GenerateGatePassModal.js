"use client";
import React, { useState } from "react";
import { X, Truck, ShieldCheck, FileCheck2, Scale, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function GenerateGatePassModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  stagedConsignments = [],
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleNumber: "MH-12-RN-8841",
    carrier: "BlueDart Express",
    driverName: "Rajesh Kumar",
    driverPhone: "+91 98200 44321",
    driverLicense: "DL-1420110012345",
    destinationHub: "Bhiwandi Regional Hub",
    orderReferences: stagedConsignments[0]?.orderReference || "SO-CRW-2026-9041",
    grossWeightKg: "135",
    tareWeightKg: "15",
    sealNumber: `SEAL-CRW-${Math.floor(100000 + Math.random() * 900000)}`,
    supervisorNotes: "5-point load audit verified. Tarpaulin secured. Outward exit authorized.",
    loadAuditChecklist: {
      strappingVerified: true,
      labelingVerified: true,
      weighbridgeMatches: true,
      tarpaulinSecured: true,
      sealIntact: true,
    },
  });

  if (!isOpen) return null;

  const gross = Number(formData.grossWeightKg) || 0;
  const tare = Number(formData.tareWeightKg) || 0;
  const netWeight = Math.max(0, gross - tare);

  const checks = formData.loadAuditChecklist;
  const allChecksPassed =
    checks.strappingVerified &&
    checks.labelingVerified &&
    checks.weighbridgeMatches &&
    checks.tarpaulinSecured &&
    checks.sealIntact;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicleNumber || !formData.driverName) {
      toast.error("Vehicle Plate Number and Driver Name are required.");
      return;
    }

    if (!allChecksPassed) {
      toast.error("All 5 points on the Physical Load Audit Checklist must be verified.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/outbound/gate-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          orderReferences: [formData.orderReferences],
          grossWeightKg: gross,
          tareWeightKg: tare,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue Outward Gate Pass.");
      }

      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
      } catch {}

      toast.success("Outward Gate Pass Issued & Signed!", {
        description: `Gate Pass #${data.gatePass?.gatePassNumber} authorized for vehicle ${formData.vehicleNumber}. Seal #${formData.sealNumber} locked.`,
      });

      if (onSuccess) {
        onSuccess(data.gatePass);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to generate Gate Pass");
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
                Outward Gate Pass Authorization & Load Audit
              </h3>
              <p className="text-[11px] text-slate-400">
                Tier 4 Supervisor Sign-Off • Security Gate Clearance
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
          {/* Vehicle & Carrier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Vehicle Plate Number *
              </label>
              <input
                type="text"
                required
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-black focus:outline-hidden focus:border-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Carrier Partner *
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
                <option value="Dedicated Customer Fleet">Dedicated Customer Fleet</option>
              </select>
            </div>
          </div>

          {/* Driver Details */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Driver Name *
              </label>
              <input
                type="text"
                required
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Driver Phone
              </label>
              <input
                type="text"
                value={formData.driverPhone}
                onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                License Number
              </label>
              <input
                type="text"
                value={formData.driverLicense}
                onChange={(e) => setFormData({ ...formData, driverLicense: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-white"
              />
            </div>
          </div>

          {/* Weighbridge Tare, Gross & Net */}
          <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-sky-950 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-sky-700" />
                Weighbridge Weight Audit (KG)
              </span>
              <span className="text-[10px] font-mono text-sky-800 font-bold">
                Net = Gross - Tare
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Gross Weight</label>
                <input
                  type="number"
                  required
                  value={formData.grossWeightKg}
                  onChange={(e) => setFormData({ ...formData, grossWeightKg: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tare Weight</label>
                <input
                  type="number"
                  required
                  value={formData.tareWeightKg}
                  onChange={(e) => setFormData({ ...formData, tareWeightKg: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Verified Net Cargo</label>
                <div className="px-2.5 py-1.5 rounded-xl bg-white border border-sky-300 text-xs font-mono font-black text-sky-900">
                  {netWeight} kg
                </div>
              </div>
            </div>
          </div>

          {/* Security Seal & Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-sky-600" />
                <span>Security Container Seal # *</span>
              </label>
              <input
                type="text"
                required
                value={formData.sealNumber}
                onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-black text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Destination Distribution Hub
              </label>
              <input
                type="text"
                value={formData.destinationHub}
                onChange={(e) => setFormData({ ...formData, destinationHub: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              />
            </div>
          </div>

          {/* 5-Point Physical Load Audit Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-sky-700" />
                <span className="text-xs font-black uppercase text-slate-900">
                  5-Point Physical Load Audit Checklist
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  allChecksPassed
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {allChecksPassed ? "All 5 Checked ✓" : "Audit Incomplete"}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {[
                { key: "strappingVerified", label: "1. Strapping & Pallet Integrity: Consignments shrink-wrapped and strap-banded." },
                { key: "labelingVerified", label: "2. Barcode & AWB Labels: Shipping labels visible and scanned on all cartons." },
                { key: "weighbridgeMatches", label: "3. Weighbridge Tare Check: Measured net weight matches dispatch manifest." },
                { key: "tarpaulinSecured", label: "4. Tarpaulin & Weatherproofing: Secured against rain, wind, and transit shock." },
                { key: "sealIntact", label: "5. Tamper-Evident Seal: High-security seal tag verified locked on vehicle door." },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                    formData.loadAuditChecklist[item.key]
                      ? "bg-white border-sky-300 text-sky-950 font-bold"
                      : "bg-white/60 border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.loadAuditChecklist[item.key]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        loadAuditChecklist: {
                          ...formData.loadAuditChecklist,
                          [item.key]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span className="text-[11px]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {!allChecksPassed && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Gate pass issuance is locked until all 5 physical loading audit points are confirmed.</span>
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
              disabled={loading || !allChecksPassed}
              className={`px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 ${
                allChecksPassed ? "bg-sky-600 hover:bg-sky-500" : "bg-slate-300 text-slate-500"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? "Issuing..." : "Authorize & Sign Outward Gate Pass"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
