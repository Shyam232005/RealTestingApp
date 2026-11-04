"use client";
import React, { useState } from "react";
import { X, Network, CheckCircle2, UserCheck, ShieldCheck, Target } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function OrgRestructureModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  roster = [],
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mandateTitle: "Pan-India Automated Fulfillment & OTIF Excellence",
    targetExecutiveRole: "DIRECTOR",
    appointedLeaderName: roster.find((r) => r.rank === 6)?.name || "Director of Logistics",
    regionalCluster: "Pan-India Corridors (North, West, South, East)",
    targetMetric: "99.2% OTIF Delivery Compliance",
    boardResolutionRef: `BR-${new Date().getFullYear()}-CLO-ORG-${Math.floor(1000 + Math.random() * 9000)}`,
    charterNotes: "Strategic executive appointment and multi-node restructuring charter approved by Chief Logistics Officer.",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      toast.success(`Executive mandate "${formData.mandateTitle}" assigned to ${formData.appointedLeaderName}.`);
      if (onSuccess) onSuccess(formData);
      setLoading(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-sky-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 border border-sky-200 text-sky-800">
              <Network className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-200/80 text-sky-900">
                  Tier 7 Departmental Governance
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {formData.boardResolutionRef}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Restructure Departmental Command Architecture
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Top-Level Strategic Corporate Mandate
            </label>
            <input
              type="text"
              required
              value={formData.mandateTitle}
              onChange={(e) => setFormData({ ...formData, mandateTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Leadership Level
              </label>
              <select
                value={formData.targetExecutiveRole}
                onChange={(e) => setFormData({ ...formData, targetExecutiveRole: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              >
                <option value="DIRECTOR">Director of Logistics / Supply Chain Head (Tier 6)</option>
                <option value="VP_REGIONAL">Vice President - Regional Distribution</option>
                <option value="MANAGER">Logistics & Supply Chain Manager (Tier 5)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Appoint / Reassign Leadership
              </label>
              <input
                type="text"
                required
                value={formData.appointedLeaderName}
                onChange={(e) => setFormData({ ...formData, appointedLeaderName: e.target.value })}
                placeholder="Leader name or email"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Regional Cluster / Logistics Zone
              </label>
              <input
                type="text"
                required
                value={formData.regionalCluster}
                onChange={(e) => setFormData({ ...formData, regionalCluster: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cascading Throughput / SLA Target
              </label>
              <input
                type="text"
                required
                value={formData.targetMetric}
                onChange={(e) => setFormData({ ...formData, targetMetric: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chief Logistics Officer Mandate Notes
            </label>
            <textarea
              rows={2}
              value={formData.charterNotes}
              onChange={(e) => setFormData({ ...formData, charterNotes: e.target.value })}
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
                <span>Restructuring...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Execute Restructuring Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
