"use client";
import React, { useState } from "react";
import { X, CheckCircle2, ShieldCheck, Warehouse, FileCheck2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function PostGrnModal({
  isOpen,
  onClose,
  onSuccess,
  grn,
  employee,
}) {
  const [loading, setLoading] = useState(false);
  const [targetBin, setTargetBin] = useState("Bin A-01");
  const [supervisorComments, setSupervisorComments] = useState(
    "Physical inspection complete. Packaging and vendor delivery challan verified against PO. Stock approved for master ledger."
  );
  const [checklist, setChecklist] = useState({
    packagingIntact: true,
    poQuantitiesMatched: true,
    qcCleared: true,
  });

  if (!isOpen || !grn) return null;

  const allChecksPassed =
    checklist.packagingIntact &&
    checklist.poQuantitiesMatched &&
    checklist.qcCleared;

  const handleAuthorizeAndPost = async (e) => {
    e.preventDefault();
    if (!allChecksPassed) {
      toast.error("All 3 physical receiving checks must be verified by the Supervisor.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/inbound/grn-authorize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grnId: grn.id,
          documentId: grn._id,
          supervisorComments,
          targetBin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to authorize final GRN.");
      }

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.75 } });
      } catch {}

      toast.success("Final GRN Authorized & Posted!", {
        description: `Goods Receipt Note #${grn.id} committed to master inventory in ${targetBin}.`,
      });

      if (onSuccess) {
        onSuccess(data.grn);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to post final GRN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">
                Authorize & Post Final GRN
              </h3>
              <p className="text-[11px] text-slate-400">
                Tier 4 Supervisor Authority • Commits Stock into Master Inventory
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
        <form onSubmit={handleAuthorizeAndPost} className="p-6 space-y-4 text-xs">
          {/* GRN Summary Banner */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-sm text-slate-900">
                {grn.id}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                Draft Pending Authorization
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <p>
                Vendor: <strong className="text-slate-900">{grn.vendorName}</strong>
              </p>
              <p>
                PO Ref: <strong className="font-mono text-slate-900">{grn.poRef}</strong>
              </p>
              <p>
                LR / Bilty: <strong className="font-mono text-slate-900">{grn.lrRef || "N/A"}</strong>
              </p>
              <p>
                Received Qty: <strong className="font-mono text-slate-900">{grn.receivedQty} units</strong>
              </p>
            </div>
          </div>

          {/* Supervisor Physical Verification Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-black uppercase text-slate-900">
                  Supervisor Physical Receiving Audit
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  allChecksPassed
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {allChecksPassed ? "Checks Verified ✓" : "Verification Required"}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {[
                {
                  key: "packagingIntact",
                  label: "1. Outer Packaging & Pallet Seal: No crushed cartons, leaks or moisture damage.",
                },
                {
                  key: "poQuantitiesMatched",
                  label: "2. Document Line-Item Match: Physical count matches Lorry Receipt & PO.",
                },
                {
                  key: "qcCleared",
                  label: "3. Quarantine & QC Gate: Zero unaddressed defect holds on this consignment.",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                    checklist[item.key]
                      ? "bg-white border-emerald-300 text-emerald-950 font-bold"
                      : "bg-white/60 border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={(e) =>
                      setChecklist({ ...checklist, [item.key]: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Warehouse Bin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-sky-600" />
                <span>Target Warehouse Bin Allocation *</span>
              </label>
              <select
                value={targetBin}
                onChange={(e) => setTargetBin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden bg-white"
              >
                <option value="Bin A-01">Bin A-01 (Raw Material Rack)</option>
                <option value="Bin A-02">Bin A-02 (Heavy Metal Coils)</option>
                <option value="Bin A-03">Bin A-03 (Fast-Moving Consumables)</option>
                <option value="Bin B-01">Bin B-01 (Packaging Supplies)</option>
                <option value="Bin B-02">Bin B-02 (Finished Goods Hold)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Stock Allocation Action
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-medium">
                Increments live ledger in {targetBin}
              </div>
            </div>
          </div>

          {/* Supervisor Comments */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Supervisor Authorization Sign-Off Notes
            </label>
            <textarea
              rows="2"
              value={supervisorComments}
              onChange={(e) => setSupervisorComments(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden bg-white"
            />
          </div>

          {!allChecksPassed && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Final GRN posting is locked until all 3 receiving verification points are checked.</span>
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
                allChecksPassed ? "bg-emerald-600 hover:bg-emerald-500" : "bg-slate-300 text-slate-500"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? "Posting to Ledger..." : "Post Final GRN (Authorize)"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
