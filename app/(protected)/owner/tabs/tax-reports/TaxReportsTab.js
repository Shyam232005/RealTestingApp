"use client";
import React from "react";
import { FileSpreadsheet, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function TaxReportsTab({ organization, selectedBranch = "all" }) {
  const isAll = selectedBranch === "all";
  const branchTitle = isAll
    ? "All Branches (Consolidated)"
    : selectedBranch === "branch-1"
    ? "Branch 1 - Main (HQ)"
    : selectedBranch.replace("branch-", "Branch ");

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              GST & Tax Compliance
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {branchTitle}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your registered GSTIN, tax credit status, and government supplier payment rules.
          </p>
        </div>

        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 font-mono self-start sm:self-auto">
          GSTIN: {organization.GST}
        </span>
      </div>

      {/* 3 Simple Tax Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
          <p className="font-extrabold text-slate-900 text-sm">GST Tax Credit (GSTR-2B)</p>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Checks all supplier bills against the GST portal so you get 100% tax credits on your purchases.
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
            Ready for Filing
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
          <p className="font-extrabold text-slate-900 text-sm">Supplier Payment Rule (Sec 43B(h))</p>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Configured to {organization.defaultCreditDays} Days. Pay MSME suppliers on time to avoid income tax disallowance.
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Rule Active ({organization.defaultCreditDays}d)
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
          <p className="font-extrabold text-slate-900 text-sm">Government Audit Trail</p>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Tamper-proof digital records active to protect your business during MCA and tax reviews.
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            {organization.mcaAuditLog ? "Active & Protected" : "Standard"}
          </span>
        </div>
      </div>

      {/* Empty State */}
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center space-y-2">
        <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">No Tax Returns Filed Here Yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Your Chartered Accountant can review your GST bills and upload verified audit summaries directly through the CA-Hub.
        </p>
      </div>
    </div>
  );
}
