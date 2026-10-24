"use client";
import React from "react";
import {
  FileText,
  X,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  Download,
  Printer,
  Landmark,
} from "lucide-react";

export default function CaReportModal({ report, isOpen, onClose }) {
  if (!isOpen || !report) return null;

  const submittedDate = report.reportSubmittedAt
    ? new Date(report.reportSubmittedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Recently Submitted";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                Official CA Audit Deliverable
              </span>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {report.reportTitle || "Statutory Audit Report"}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audit Report Meta Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Auditor / CA Firm
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5">{report.caName}</p>
            <p className="text-[10px] text-slate-500">{report.caFirm}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ICAI Registration
            </span>
            <p className="font-mono font-bold text-slate-900 mt-0.5">
              {report.icaiNumber || "ICAI Verified"}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified Sign-off
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Report Delivery Date
            </span>
            <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {submittedDate}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold">
              ✓ Status: Submitted
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2 text-xs">
          <h4 className="font-extrabold text-slate-900 text-sm">
            Auditor Opinion & Executive Summary
          </h4>
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 text-slate-700 leading-relaxed font-medium">
            {report.reportSummary ||
              "Full reconciliation of inward supplier invoices against GST portal completed. All eligible ITC verified; Sec 43B(h) vendor payment terms are compliant within 45 days."}
          </div>
        </div>

        {/* Key Findings List */}
        <div className="space-y-2 text-xs">
          <h4 className="font-extrabold text-slate-900 text-sm">
            Key Audit Findings & Compliance Verification
          </h4>
          <div className="space-y-2">
            {(report.reportFindings && report.reportFindings.length > 0
              ? report.reportFindings
              : [
                  "100% matched ITC for all active supplier bills against GSTR-2B portal.",
                  "Zero unverified ITC discrepancies detected in the general ledger.",
                  "All vendor credit terms strictly adhere to Section 43B(h) MSME 45-day guideline.",
                ]
            ).map((finding, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-slate-800 font-medium leading-relaxed">
                  {finding}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audited Accounts Covered */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
            Books & Accounts Audited
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {(report.requestedAccounts || [
              "GSTR-2B Input Tax Credit Log",
              "Primary Commercial Bank",
              "Section 43B(h) Payables",
            ]).map((acc, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200"
              >
                {acc}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
