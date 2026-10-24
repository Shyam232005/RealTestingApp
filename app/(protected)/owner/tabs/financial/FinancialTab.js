"use client";
import React from "react";
import { Scale, CheckCircle2 } from "lucide-react";

export default function FinancialTab({ organization, selectedBranch = "all" }) {
  const isAll = selectedBranch === "all";
  const branchTitle = isAll
    ? "All Branches (Consolidated)"
    : selectedBranch === "branch-1"
    ? "Branch 1 - Main (HQ)"
    : selectedBranch.replace("branch-", "Branch ");

  const totalAssets =
    Number(organization.openingBalance || 0) +
    Number(organization.openingCash || 0) +
    Number(organization.currentStockValue || 0);

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Account Books & Starting Balances
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {branchTitle}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your starting business balance sheet based on the setup details you entered.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Always Balanced (Assets = Capital)
        </span>
      </div>

      {/* Simple Explanation Note */}
      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-purple-950 flex items-start gap-3">
        <Scale className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-purple-900">How Your Business Books Work:</p>
          <p className="text-slate-600 leading-relaxed">
            In business accounting, everything you own (Money in Bank, Cash in Hand, and Stock in Godown) is balanced against your starting Owner Investment (Capital). Both sides always match to the exact rupee.
          </p>
        </div>
      </div>

      {/* Balance Sheet Table in Plain Business Language */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Account / Item</th>
              <th className="py-3 px-3">Entry Code</th>
              <th className="py-3 px-3 text-right">What You Own / Assets (₹)</th>
              <th className="py-3 px-3 text-right">Owner Investment / Capital (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            <tr>
              <td className="py-3.5 px-3">Setup Date</td>
              <td className="py-3.5 px-3 font-bold text-slate-900">
                Money in Bank ({organization.BankName})
              </td>
              <td className="py-3.5 px-3 font-mono text-slate-400">OB-01</td>
              <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">
                ₹{Number(organization.openingBalance || 0).toLocaleString("en-IN")}
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-slate-400">-</td>
            </tr>
            <tr>
              <td className="py-3.5 px-3">Setup Date</td>
              <td className="py-3.5 px-3 font-bold text-slate-900">
                Cash in Hand (Shop & Office Vault)
              </td>
              <td className="py-3.5 px-3 font-mono text-slate-400">OB-02</td>
              <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">
                ₹{Number(organization.openingCash || 0).toLocaleString("en-IN")}
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-slate-400">-</td>
            </tr>
            <tr>
              <td className="py-3.5 px-3">Setup Date</td>
              <td className="py-3.5 px-3 font-bold text-slate-900">
                Goods & Material Stock in Godown ({organization.primaryWarehouse})
              </td>
              <td className="py-3.5 px-3 font-mono text-slate-400">OB-03</td>
              <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">
                ₹{Number(organization.currentStockValue || 0).toLocaleString("en-IN")}
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-slate-400">-</td>
            </tr>
            <tr className="bg-slate-50/70 font-bold">
              <td className="py-3.5 px-3">Setup Date</td>
              <td className="py-3.5 px-3 text-slate-900">
                Total Starting Owner Capital (Net Worth)
              </td>
              <td className="py-3.5 px-3 font-mono text-slate-400">OB-04</td>
              <td className="py-3.5 px-3 text-right font-mono text-slate-400">-</td>
              <td className="py-3.5 px-3 text-right font-mono font-black text-purple-700 text-sm">
                ₹{totalAssets.toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
