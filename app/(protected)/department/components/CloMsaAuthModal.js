"use client";
import React, { useState } from "react";
import { X, Handshake, CheckCircle2, ShieldCheck, TrendingUp, Building } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function CloMsaAuthModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  selectedContract = null,
}) {
  const isAuthorizingExisting = Boolean(selectedContract?.id || selectedContract?._id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partnerName: selectedContract?.partnerName || "",
    partnerType: selectedContract?.partnerType || "JOINT_VENTURE_PARTNER",
    contractType: selectedContract?.contractType || "STRATEGIC_JOINT_VENTURE",
    title: selectedContract?.title || "",
    annualValue: selectedContract?.annualValue || 35000000,
    tenureYears: selectedContract?.tenureYears || 5,
    serviceRegions: selectedContract?.serviceRegions?.join(", ") || "Pan-India Dedicated Freight Corridor",
    committedThroughputTons: selectedContract?.committedThroughputTons || 12000,
    slaCommitmentOtif: selectedContract?.slaCommitmentOtif || 99.2,
    jvEquityPct: selectedContract?.jvEquityPct || 25,
    divestmentProceeds: selectedContract?.divestmentProceeds || 0,
    boardResolutionRef: selectedContract?.boardResolutionRef || `BR-${new Date().getFullYear()}-CLO-${Math.floor(1000 + Math.random() * 9000)}`,
    cloNotes: "Supreme corporate execution authorized by Chief Logistics Officer under strategic enterprise M&A and network sovereignty charter.",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;
      if (isAuthorizingExisting) {
        res = await fetch("/api/logistics/c-suite/msa-authorization", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractId: selectedContract.id || selectedContract._id,
            action: "APPROVE_CLO_EXECUTION",
            boardResolutionRef: formData.boardResolutionRef,
            cloNotes: formData.cloNotes,
            jvEquityPct: Number(formData.jvEquityPct),
            divestmentProceeds: Number(formData.divestmentProceeds),
          }),
        });
      } else {
        res = await fetch("/api/logistics/c-suite/msa-authorization", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CREATE_STRATEGIC",
            partnerName: formData.partnerName,
            partnerType: formData.partnerType,
            contractType: formData.contractType,
            title: formData.title,
            annualValue: Number(formData.annualValue),
            tenureYears: Number(formData.tenureYears),
            serviceRegions: formData.serviceRegions.split(",").map((s) => s.trim()).filter(Boolean),
            committedThroughputTons: Number(formData.committedThroughputTons),
            slaCommitmentOtif: Number(formData.slaCommitmentOtif),
            jvEquityPct: Number(formData.jvEquityPct),
            divestmentProceeds: Number(formData.divestmentProceeds),
            boardResolutionRef: formData.boardResolutionRef,
            cloNotes: formData.cloNotes,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process strategic agreement.");
      }

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      toast.success(data.message || "Agreement successfully executed!");
      if (onSuccess) onSuccess(data.contract);
      onClose();
    } catch (err) {
      toast.error(err.message || "Execution failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-sky-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 border border-sky-200 text-sky-800">
              <Handshake className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-200/80 text-sky-900">
                  Tier 7 Supreme Execution
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {formData.boardResolutionRef}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                {isAuthorizingExisting
                  ? `Execute Strategic MSA: ${selectedContract.partnerName}`
                  : "Charter Strategic Enterprise MSA / Joint Venture"}
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
          {!isAuthorizingExisting ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Partner / Entity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partnerName}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    placeholder="e.g. Concor Multi-Modal Logistics Consortium"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Agreement Type
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                  >
                    <option value="STRATEGIC_JOINT_VENTURE">Strategic Joint Venture (JV)</option>
                    <option value="CARRIER_FLEET_LEASING">National Carrier Dedicated Fleet Lease</option>
                    <option value="3PL_MASTER_SERVICE_AGREEMENT">National 3PL Master Service Agreement</option>
                    <option value="4PL_MANAGED_LOGISTICS">4PL Lead Logistics Provider Mandate</option>
                    <option value="ASSET_DIVESTMENT">Non-Core Logistics Asset Divestment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agreement Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Western Corridor Automated Container Train Transit Charter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Annual Value (₹ INR)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000000}
                    value={formData.annualValue}
                    onChange={(e) => setFormData({ ...formData, annualValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tenure (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={formData.tenureYears}
                    onChange={(e) => setFormData({ ...formData, tenureYears: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">JV Equity Share (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.jvEquityPct}
                    onChange={(e) => setFormData({ ...formData, jvEquityPct: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-sky-800">
                  {selectedContract.contractCode}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                  {selectedContract.contractType?.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm font-black text-slate-900">{selectedContract.title}</p>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-600">Partner: {selectedContract.partnerName}</span>
                <span className="text-emerald-700 font-bold">
                  Annual: ₹{(selectedContract.annualValue || 0).toLocaleString("en-IN")}
                </span>
                <span className="text-slate-600">Tenure: {selectedContract.tenureYears} Years</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Board Resolution Reference
              </label>
              <input
                type="text"
                required
                value={formData.boardResolutionRef}
                onChange={(e) => setFormData({ ...formData, boardResolutionRef: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SLA OTIF Target Commitment (%)
              </label>
              <input
                type="number"
                step="0.1"
                min={90}
                max={100}
                value={formData.slaCommitmentOtif}
                onChange={(e) => setFormData({ ...formData, slaCommitmentOtif: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chief Logistics Officer Boardroom Endorsement & Governance Notes
            </label>
            <textarea
              rows={2}
              value={formData.cloNotes}
              onChange={(e) => setFormData({ ...formData, cloNotes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800"
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
                <span>Executing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Supreme Sign-Off</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
