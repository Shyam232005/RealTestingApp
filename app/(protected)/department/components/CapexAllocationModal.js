"use client";
import React, { useState } from "react";
import { X, Building2, CheckCircle2, ShieldAlert, Cpu, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function CapexAllocationModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "GREENFIELD_MEGA_HUB",
    region: "West Zone (JNPT / Mumbai)",
    location: "JNPT Multi-Modal Logistics Park, Navi Mumbai",
    allocatedCapex: 45000000, // ₹4.50 Cr default
    tenureYears: 3,
    projectedIrrPct: 19.5,
    paybackYears: 3.8,
    esgRating: "A+",
    scope3ReductionPct: 26.5,
    engineeringPartner: "L&T Industrial & Automation Infrastructure",
    boardResolutionRef: `BR-${new Date().getFullYear()}-CLO-${Math.floor(1000 + Math.random() * 9000)}`,
    notes: "Multi-year automated infrastructure deployment approved by Chief Logistics Officer under strategic network expansion charter.",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/logistics/c-suite/capex-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to authorize CAPEX project.");
      }

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      toast.success(data.message || "CAPEX Project successfully authorized!");
      if (onSuccess) onSuccess(data.project);
      onClose();
    } catch (err) {
      toast.error(err.message || "CAPEX authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-sky-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 border border-sky-200 text-sky-800">
              <Building2 className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-200/80 text-sky-900">
                  Tier 7 Supreme Board Authority
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {formData.boardResolutionRef}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Authorize Multi-Year CAPEX Deployment
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Title & Strategic Facility Scope
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Western Corridor Automated Mega-Hub & AMR Sortation Center"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="GREENFIELD_MEGA_HUB">Greenfield Mega-Hub Facility</option>
                <option value="AMR_WAREHOUSE_AUTOMATION">AMR & Robotics Automation</option>
                <option value="COLD_CHAIN_EXPANSION">Cold-Chain High-Capacity Hub</option>
                <option value="FLEET_ELECTRIFICATION">Fleet EV Charging & Solar Depot</option>
                <option value="CROSS_DOCK_FACILITY">High-Velocity Cross-Dock Feeder</option>
                <option value="MULTI_MODAL_PORT_GATEWAY">Maritime Multi-Modal Port Terminal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Geographic Region</label>
              <input
                type="text"
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Allocated CAPEX (₹ INR)
              </label>
              <input
                type="number"
                required
                min={1000000}
                step={500000}
                value={formData.allocatedCapex}
                onChange={(e) => setFormData({ ...formData, allocatedCapex: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          {/* ROI and Financial Feasibility */}
          <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Tenure</span>
              <span className="text-xs font-mono font-black text-slate-800">{formData.tenureYears} Years</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Projected IRR</span>
              <span className="text-xs font-mono font-black text-emerald-700">{formData.projectedIrrPct}%</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Payback</span>
              <span className="text-xs font-mono font-black text-indigo-700">{formData.paybackYears} Years</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 block uppercase">ESG Rating</span>
              <span className="text-xs font-mono font-black text-sky-700">{formData.esgRating}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Engineering & EPC Partner
              </label>
              <input
                type="text"
                required
                value={formData.engineeringPartner}
                onChange={(e) => setFormData({ ...formData, engineeringPartner: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Scope 3 Carbon Reduction (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.scope3ReductionPct}
                onChange={(e) => setFormData({ ...formData, scope3ReductionPct: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chief Logistics Officer Executive Charter & Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Authorizing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute CAPEX Deployment (₹{(formData.allocatedCapex || 0).toLocaleString("en-IN")})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
