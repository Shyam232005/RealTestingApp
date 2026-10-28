"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  TrendingUp,
  Boxes,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Building2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { MetricsCardsSkeleton, TableSkeleton } from "@/components/ui/CrownSkeletonLoader";
import CrownZeroState from "@/components/ui/CrownZeroState";

export default function FinancialStatementsView({
  organization,
  selectedBranch = "all",
}) {
  const [activeReport, setActiveReport] = useState("balance_sheet"); // balance_sheet | pnl | inventory
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [pnlData, setPnlData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Accordion state for Balance Sheet sub-categories
  const [accordionOpen, setAccordionOpen] = useState({
    currentAssets: true,
    fixedAssets: true,
    currentLiabilities: true,
    longTermLiabilities: true,
    equity: true,
  });

  const toggleAccordion = (key) => {
    setAccordionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [bsRes, pnlRes, invRes] = await Promise.all([
          fetch(`/api/owner/reports/balance-sheet?branchId=${selectedBranch}`),
          fetch(`/api/owner/reports/pnl?branchId=${selectedBranch}`),
          fetch(`/api/owner/reports/inventory?branchId=${selectedBranch}`),
        ]);

        const [bsJson, pnlJson, invJson] = await Promise.all([
          bsRes.json(),
          pnlRes.json(),
          invRes.json(),
        ]);

        if (!ignore) {
          if (bsJson.success) setBalanceSheet(bsJson.report);
          if (pnlJson.success) setPnlData(pnlJson.report);
          if (invJson.success) setInventoryData(invJson.report);
        }
      } catch (err) {
        console.error("Failed to fetch financial reports:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [selectedBranch]);

  const refreshReports = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/owner/reports/balance-sheet?branchId=${selectedBranch}`).then((r) => r.json()),
      fetch(`/api/owner/reports/pnl?branchId=${selectedBranch}`).then((r) => r.json()),
      fetch(`/api/owner/reports/inventory?branchId=${selectedBranch}`).then((r) => r.json()),
    ])
      .then(([bsJson, pnlJson, invJson]) => {
        if (bsJson.success) setBalanceSheet(bsJson.report);
        if (pnlJson.success) setPnlData(pnlJson.report);
        if (invJson.success) setInventoryData(invJson.report);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Automated Financial Statements
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Real-time Mongoose Aggregation pipelines with zero manual data entry
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab pills */}
          <div className="p-1 rounded-2xl bg-slate-100 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveReport("balance_sheet")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                activeReport === "balance_sheet"
                  ? "bg-white text-purple-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Balance Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport("pnl")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                activeReport === "pnl"
                  ? "bg-white text-purple-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Profit & Loss (P&L)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReport("inventory")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                activeReport === "inventory"
                  ? "bg-white text-purple-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Stock & Valuation</span>
            </button>
          </div>

          <button
            type="button"
            onClick={refreshReports}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Statements"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <MetricsCardsSkeleton count={3} />
          <TableSkeleton rows={7} cols={3} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* =========================================================================
              1. AUTOMATED BALANCE SHEET
             ========================================================================= */}
          {activeReport === "balance_sheet" && balanceSheet && (
            <motion.div
              key="balance_sheet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Balance Equation Status Card */}
              <div
                className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  balanceSheet.isBalanced
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                    : "bg-amber-50/80 border-amber-200 text-amber-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                      balanceSheet.isBalanced ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    }`}
                  >
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">
                      {balanceSheet.isBalanced
                        ? "Balance Sheet Perfectly Reconciled (Assets = Liabilities + Equity)"
                        : "Balance Sheet Discrepancy Detected"}
                    </h3>
                    <p className="text-xs opacity-80 mt-0.5">
                      Fundamental Equation: Assets (₹{balanceSheet.totalAssets?.toLocaleString("en-IN")}) =
                      Liabilities (₹{balanceSheet.liabilities?.total?.toLocaleString("en-IN")}) +
                      Equity (₹{balanceSheet.equity?.total?.toLocaleString("en-IN")})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-white/80 border border-current shadow-xs">
                    Diff: ₹{balanceSheet.difference?.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 2-Column Side-by-Side: Assets vs Liabilities & Equity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* LEFT COLUMN: ASSETS */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Total Assets
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        What Business Owns
                      </span>
                    </div>
                    <span className="text-lg font-black font-mono text-emerald-700">
                      ₹{balanceSheet.totalAssets?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Current Assets Accordion */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("currentAssets")}
                      className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Current Assets (Liquid)</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({balanceSheet.assets?.currentAssets?.length || 0} accounts)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700">
                          ₹{balanceSheet.assets?.totalCurrent?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        {accordionOpen.currentAssets ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {accordionOpen.currentAssets && (
                      <div className="divide-y divide-slate-100 p-2 text-xs">
                        {balanceSheet.assets?.currentAssets?.map((acc, i) => (
                          <div key={i} className="py-2 px-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                            <span className="text-slate-700 font-medium">
                              <span className="font-mono text-slate-400 mr-2">{acc.code}</span>
                              {acc.name}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              ₹{acc.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fixed Assets Accordion */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("fixedAssets")}
                      className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Fixed & Non-Current Assets</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({balanceSheet.assets?.fixedAssets?.length || 0} accounts)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700">
                          ₹{balanceSheet.assets?.totalFixed?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        {accordionOpen.fixedAssets ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {accordionOpen.fixedAssets && (
                      <div className="divide-y divide-slate-100 p-2 text-xs">
                        {balanceSheet.assets?.fixedAssets?.length === 0 ? (
                          <p className="p-3 text-slate-400 text-center">No fixed assets logged.</p>
                        ) : (
                          balanceSheet.assets?.fixedAssets?.map((acc, i) => (
                            <div key={i} className="py-2 px-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                              <span className="text-slate-700 font-medium">
                                <span className="font-mono text-slate-400 mr-2">{acc.code}</span>
                                {acc.name}
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                ₹{acc.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: LIABILITIES & EQUITY */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Total Liabilities & Equity
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        Financed By
                      </span>
                    </div>
                    <span className="text-lg font-black font-mono text-purple-700">
                      ₹{balanceSheet.totalLiabilitiesAndEquity?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Current Liabilities Accordion */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("currentLiabilities")}
                      className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Current Liabilities (Short-Term Dues)</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({balanceSheet.liabilities?.currentLiabilities?.length || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-rose-700">
                          ₹{balanceSheet.liabilities?.totalCurrent?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        {accordionOpen.currentLiabilities ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {accordionOpen.currentLiabilities && (
                      <div className="divide-y divide-slate-100 p-2 text-xs">
                        {balanceSheet.liabilities?.currentLiabilities?.length === 0 ? (
                          <p className="p-3 text-slate-400 text-center">No short-term payables logged.</p>
                        ) : (
                          balanceSheet.liabilities?.currentLiabilities?.map((acc, i) => (
                            <div key={i} className="py-2 px-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                              <span className="text-slate-700 font-medium">
                                <span className="font-mono text-slate-400 mr-2">{acc.code}</span>
                                {acc.name}
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                ₹{acc.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Long-Term Liabilities Accordion */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("longTermLiabilities")}
                      className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Long-Term Debt & Loans</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({balanceSheet.liabilities?.longTermLiabilities?.length || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-rose-700">
                          ₹{balanceSheet.liabilities?.totalLongTerm?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        {accordionOpen.longTermLiabilities ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {accordionOpen.longTermLiabilities && (
                      <div className="divide-y divide-slate-100 p-2 text-xs">
                        {balanceSheet.liabilities?.longTermLiabilities?.length === 0 ? (
                          <p className="p-3 text-slate-400 text-center">No long-term loans outstanding.</p>
                        ) : (
                          balanceSheet.liabilities?.longTermLiabilities?.map((acc, i) => (
                            <div key={i} className="py-2 px-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                              <span className="text-slate-700 font-medium">
                                <span className="font-mono text-slate-400 mr-2">{acc.code}</span>
                                {acc.name}
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                ₹{acc.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Owner's Equity Accordion */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("equity")}
                      className="w-full px-4 py-3 bg-purple-50/60 flex items-center justify-between text-xs font-bold text-purple-950 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>Owner's Equity & Retained Earnings</span>
                        <span className="text-[10px] text-purple-700 font-normal">
                          (Net Worth)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-purple-900 font-black">
                          ₹{balanceSheet.equity?.total?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        {accordionOpen.equity ? (
                          <ChevronUp className="w-4 h-4 text-purple-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                    </button>
                    {accordionOpen.equity && (
                      <div className="divide-y divide-slate-100 p-2 text-xs">
                        {balanceSheet.equity?.accounts?.map((acc, i) => (
                          <div key={i} className="py-2 px-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                            <span className="text-slate-700 font-medium">
                              <span className="font-mono text-slate-400 mr-2">{acc.code}</span>
                              {acc.name}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              ₹{acc.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                        <div className="py-2 px-3 flex items-center justify-between bg-purple-50/50 rounded-xl font-bold">
                          <span className="text-purple-900">
                            Current Period Net Profit / Loss (P&L Transfer)
                          </span>
                          <span className="font-mono font-black text-purple-700">
                            ₹{balanceSheet.equity?.netProfitOrLoss?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              2. AUTOMATED PROFIT & LOSS (P&L) STATEMENT
             ========================================================================= */}
          {activeReport === "pnl" && pnlData && (
            <motion.div
              key="pnl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6"
            >
              {/* P&L Metrics Header */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Gross Turnover / Revenue
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    ₹{pnlData.revenue?.total?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block mb-1">
                    Gross Profit
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-purple-950 font-mono">
                      ₹{pnlData.grossProfit?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] font-bold text-purple-700">
                      ({pnlData.grossProfitMargin}%)
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Operating Profit (EBIT)
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    ₹{pnlData.operatingProfit?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    Net Profit
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-emerald-950 font-mono">
                      ₹{pnlData.netProfit?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">
                      ({pnlData.netProfitMargin}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Comprehensive P&L Breakdown Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Financial Element / Ledger Item</th>
                      <th className="py-3 px-4 text-right">Sub-total (₹)</th>
                      <th className="py-3 px-4 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {/* 1. Revenue */}
                    <tr className="bg-slate-50/40 font-bold text-slate-900">
                      <td colSpan={2} className="py-2.5 px-4 uppercase text-[11px] text-purple-900">
                        I. Revenue from Operations & Sales
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        ₹{pnlData.revenue?.total?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {pnlData.revenue?.operating?.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-8 text-slate-600">
                          <span className="font-mono text-slate-400 mr-2">{r.code}</span>
                          {r.name}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-700">
                          ₹{r.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    ))}

                    {/* 2. COGS */}
                    <tr className="bg-slate-50/40 font-bold text-slate-900">
                      <td colSpan={2} className="py-2.5 px-4 uppercase text-[11px] text-rose-900">
                        II. Less: Cost of Goods Sold (Direct Material & Labor)
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-700">
                        (₹{pnlData.cogs?.total?.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                      </td>
                    </tr>
                    {pnlData.cogs?.items?.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-8 text-slate-600">
                          <span className="font-mono text-slate-400 mr-2">{c.code}</span>
                          {c.name}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-700">
                          ₹{c.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    ))}

                    {/* Gross Profit Summary */}
                    <tr className="bg-purple-50/50 font-black text-purple-950">
                      <td className="py-3 px-4">GROSS PROFIT (I - II)</td>
                      <td className="py-3 px-4 text-right text-xs">Margin: {pnlData.grossProfitMargin}%</td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-purple-700">
                        ₹{pnlData.grossProfit?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* 3. Operating Expenses */}
                    <tr className="bg-slate-50/40 font-bold text-slate-900">
                      <td colSpan={2} className="py-2.5 px-4 uppercase text-[11px] text-slate-800">
                        III. Less: Operating & Administrative Expenses
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-700">
                        (₹{pnlData.operatingExpenses?.total?.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                      </td>
                    </tr>
                    {pnlData.operatingExpenses?.items?.map((op, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-8 text-slate-600">
                          <span className="font-mono text-slate-400 mr-2">{op.code}</span>
                          {op.name}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-700">
                          ₹{op.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    ))}

                    {/* Operating Profit */}
                    <tr className="bg-slate-100/70 font-black text-slate-900">
                      <td colSpan={2} className="py-3 px-4">
                        OPERATING PROFIT / EBITDA
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm">
                        ₹{pnlData.operatingProfit?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* 4. Financial Costs */}
                    {pnlData.financialExpenses?.items?.length > 0 && (
                      pnlData.financialExpenses.items.map((fe, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-8 text-slate-600">IV. Less: {fe.name}</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-700">
                            (₹{fe.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                          </td>
                          <td></td>
                        </tr>
                      ))
                    )}

                    {/* Net Profit Summary */}
                    <tr className="bg-emerald-50/80 font-black text-emerald-950">
                      <td className="py-4 px-4 text-sm">NET PROFIT FOR THE PERIOD</td>
                      <td className="py-4 px-4 text-right font-bold text-xs text-emerald-700">
                        Net Margin: {pnlData.netProfitMargin}%
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-base text-emerald-700">
                        ₹{pnlData.netProfit?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              3. AUTOMATED STOCK & INVENTORY VALUATION
             ========================================================================= */}
          {activeReport === "inventory" && inventoryData && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Opening Stock Valuation
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    ₹{inventoryData.openingStockValuation?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">From Business Setup</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    Inward Stock Extracted via OCR
                  </span>
                  <span className="text-xl font-black text-emerald-800 font-mono">
                    ₹{inventoryData.totalInwardValuation?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-1">From Verified Bills & GRNs</span>
                </div>

                <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Closing Stock Valuation ({inventoryData.valuationMethod})
                  </span>
                  <span className="text-xl font-black font-mono">
                    ₹{inventoryData.closingStockValuation?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-purple-300 block mt-1">Real-time Balance Sheet Asset</span>
                </div>
              </div>

              {/* Inward History from OCR Bills */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Recent Inward Materials Scanned via OCR
                  </h4>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 font-bold">
                    Zero-Typing Feed
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Doc Type</th>
                        <th className="py-2.5 px-3">Material Description</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                        <th className="py-2.5 px-3 text-right">Total Inward Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {inventoryData.inwardHistory?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                            No scanned bills found yet. Scanned invoices in Logistics will automatically appear here.
                          </td>
                        </tr>
                      ) : (
                        inventoryData.inwardHistory?.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(item.date).toLocaleDateString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {item.sourceDoc}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{item.itemDescription}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                              ₹{Number(item.totalValuation).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Branch Stock Register */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Branch Stock Register & Re-order Levels
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Branch Location</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">In Stock Units</th>
                        <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                        <th className="py-2.5 px-3 text-right">Asset Valuation (₹)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {inventoryData.liveStockItems?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                            No branch stock items logged yet.
                          </td>
                        </tr>
                      ) : (
                        inventoryData.liveStockItems?.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-600 font-bold">{item.branchName}</td>
                            <td className="py-2.5 px-3 font-black text-slate-900">{item.name}</td>
                            <td className="py-2.5 px-3 text-slate-500">{item.category}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                              ₹{Number(item.valuation).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  item.status === "in_stock"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.status === "low_stock"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {item.status?.replace(/_/g, " ")}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
