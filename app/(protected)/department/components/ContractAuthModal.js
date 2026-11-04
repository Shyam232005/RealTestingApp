"use client";
import React, { useState } from "react";
import { X, Handshake, FileText, CheckCircle2, Building, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function ContractAuthModal({
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
    partnerType: selectedContract?.partnerType || "3PL_CARRIER",
    contractType: selectedContract?.contractType || "3PL_MASTER_SERVICE_AGREEMENT",
    title: selectedContract?.title || "",
    annualValue: selectedContract?.annualValue || 12000000,
    tenureYears: selectedContract?.tenureYears || 3,
    serviceRegions: selectedContract?.serviceRegions?.join(", ") || "North Zone, West Zone, Pan-India Corridor",
    committedThroughputTons: selectedContract?.committedThroughputTons || 2500,
    slaCommitmentOtif: selectedContract?.slaCommitmentOtif || 98.5,
    penaltyClause: selectedContract?.penaltyClause || "2.5% invoice clawback on monthly OTIF below 95%.",
    action: "APPROVE",
    directorNotes: "Long-term Master Service Agreement authorized by Director under multi-year network expansion strategy.",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;
      if (isAuthorizingExisting) {
        // Authorize existing contract
        res = await fetch("/api/logistics/director/contract-auth", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractId: selectedContract.id || selectedContract._id,
            action: formData.action,
            directorNotes: formData.directorNotes,
          }),
        });
      } else {
        // Create new multi-year contract proposal
        res = await fetch("/api/logistics/director/contract-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partnerName: formData.partnerName,
            partnerType: formData.partnerType,
            contractType: formData.contractType,
            title: formData.title,
            annualValue: Number(formData.annualValue),
            tenureYears: Number(formData.tenureYears),
            serviceRegions: formData.serviceRegions.split(",").map((s) => s.trim()).filter(Boolean),
            committedThroughputTons: Number(formData.committedThroughputTons),
            slaCommitmentOtif: Number(formData.slaCommitmentOtif),
            penaltyClause: formData.penaltyClause,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process contract.");
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      toast.success(data.message || "Contract processed successfully!");
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      toast.error(err.message || "Contract action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-200/80 text-indigo-800">
                  Tier 6 Executive Authority
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Network &amp; MSA Governance
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                {isAuthorizingExisting
                  ? `Authorize Master Service Agreement: ${selectedContract?.contractCode || ""}`
                  : "Register & Authorize Multi-Year 3PL/4PL MSA Contract"}
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
          {!isAuthorizingExisting ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contract Agreement Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Pan-India Dedicated Long-Haul Fleet & Sorting Hub Contract"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Partner Entity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partnerName}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    placeholder="e.g. BlueDart Express Ltd"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contract Agreement Type
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden"
                  >
                    <option value="3PL_MASTER_SERVICE_AGREEMENT">3PL Master Service Agreement (MSA)</option>
                    <option value="4PL_MANAGED_LOGISTICS">4PL Lead Logistics Partner</option>
                    <option value="FACILITY_LEASE_ACQUISITION">Facility Lease &amp; Warehouse Landlord</option>
                    <option value="MULTI_YEAR_VENDOR_PO">Multi-Year Vendor Master Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Annual Value (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.annualValue}
                    onChange={(e) => setFormData({ ...formData, annualValue: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tenure (Years)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={formData.tenureYears}
                    onChange={(e) => setFormData({ ...formData, tenureYears: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    OTIF SLA Guarantee (%)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min={80}
                    max={100}
                    value={formData.slaCommitmentOtif}
                    onChange={(e) => setFormData({ ...formData, slaCommitmentOtif: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Corridors &amp; Regions (Comma separated)
                </label>
                <input
                  type="text"
                  value={formData.serviceRegions}
                  onChange={(e) => setFormData({ ...formData, serviceRegions: e.target.value })}
                  placeholder="North Zone, West Zone, JNPT Corridor"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden"
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedContract?.contractCode}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    {selectedContract?.contractType?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800">{selectedContract?.partnerName}</p>
                <p className="text-[11px] text-slate-600">{selectedContract?.title}</p>
                <div className="flex items-center gap-4 text-xs font-mono pt-1 text-slate-700">
                  <span>Annual: ₹{(selectedContract?.annualValue || 0).toLocaleString("en-IN")}</span>
                  <span>Tenure: {selectedContract?.tenureYears} Years</span>
                  <span>SLA: {selectedContract?.slaCommitmentOtif}% OTIF</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Director Sign-Off Action
                </label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden"
                >
                  <option value="APPROVE">Approve &amp; Activate Multi-Year Contract</option>
                  <option value="REJECT">Reject Contract Proposal</option>
                  <option value="TERMINATE">Terminate Master Agreement</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Director Executive Strategy Notes
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {loading
                  ? "Processing..."
                  : isAuthorizingExisting
                  ? "Sign & Authorize Contract"
                  : "Register & Authorize MSA"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
