"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Stamp,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  Hash,
  Clock,
  Sparkles,
} from "lucide-react";

export default function DigitalAuditStampModal({
  isOpen,
  onClose,
  clientName = "Apex Industrial Enterprises Pvt Ltd",
  financialYear = "2025-26 (AY 2026-27)",
  user,
  onStampSuccess,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [udin, setUdin] = useState(() => {
    const yr = new Date().getFullYear().toString().slice(-2);
    const mNo = (user?.icaiNumber || "048912").replace(/\D/g, "").padStart(6, "0").slice(-6);
    const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    return `${yr}${mNo}${randHex}${randSeq}`;
  });

  if (!isOpen) return null;

  const handleApplyStamp = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/ca/sign-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_stamp",
          role: "CA_PARTNER",
          clientFirmId: clientName,
          udin,
          reportType: "Statutory Balance Sheet & Tax Audit Report",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to endorse digital stamp.");
      }

      onStampSuccess(data.auditRecord);
      onClose();
    } catch (err) {
      setError(err.message || "Stamping error.");
    } finally {
      setSubmitting(false);
    }
  };

  const partnerName = user?.name || "CA Rajesh K. Singhal (FCA)";
  const firmName = user?.firmName || "Singhal & Associates, Chartered Accountants";
  const icaiNumber = user?.icaiNumber || "FCA-048912";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Stamp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Statutory Digital Stamp Endorsement
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  ICAI Standards on Auditing (SA 700) • Mandatory UDIN Generation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Client Notice */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Audited Client Entity
              </span>
              <h4 className="text-xs font-black text-slate-900">{clientName}</h4>
              <p className="text-[11px] text-slate-500">
                Period: <span className="font-bold text-slate-700">{financialYear}</span> • Final Balance Sheet &amp; 3CD Schedule
              </p>
            </div>

            {/* Official Stamp Preview */}
            <div className="p-5 rounded-3xl bg-emerald-50/40 border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-center space-y-3">
              {user?.digitalStampUrl ? (
                <div className="w-32 h-32 flex items-center justify-center">
                  <img
                    src={user.digitalStampUrl}
                    alt="Digital Stamp Seal"
                    className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-dashed border-emerald-700 flex flex-col items-center justify-center p-2 text-emerald-800 rotate-[-4deg]">
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-700">
                    ★ CHARTERED ACCOUNTANT ★
                  </span>
                  <span className="text-[9px] font-black text-emerald-900 leading-tight">
                    {partnerName.slice(0, 18)}
                  </span>
                  <span className="text-[8px] font-mono font-bold text-emerald-800">
                    {icaiNumber}
                  </span>
                  <span className="text-[7px] font-black uppercase tracking-widest text-emerald-700 mt-1">
                    AUDIT SIGNED
                  </span>
                </div>
              )}

              <div className="space-y-0.5">
                <span className="text-[11px] font-black text-emerald-900 block">
                  {partnerName} • {icaiNumber}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 block">
                  {firmName}
                </span>
              </div>
            </div>

            {/* UDIN Certificate Token */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span>ICAI Unique Document Identification Number (UDIN)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={udin}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-black text-slate-900 tracking-wider shadow-2xs select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    const yr = new Date().getFullYear().toString().slice(-2);
                    const mNo = (user?.icaiNumber || "048912").replace(/\D/g, "").padStart(6, "0").slice(-6);
                    const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const randSeq = Math.floor(1000 + Math.random() * 9000);
                    setUdin(`${yr}${mNo}${randHex}${randSeq}`);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
                  title="Generate New UDIN Token"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Mandatory under ICAI Council Gazette Notification. Timestamp will be permanently anchored to the ledger.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleApplyStamp}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Stamp className="w-4 h-4" />
              <span>{submitting ? "Signing & Stamping..." : "Confirm Stamp & Sign-off"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
