"use client";
import React, { useState, useEffect } from "react";
import {
  Scale,
  CheckCircle2,
  BookOpen,
  Plus,
  RefreshCw,
  FileText,
  TrendingUp,
  Boxes,
  Zap,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import NewJournalEntryModal from "@/components/accounting/NewJournalEntryModal";
import GeneralLedgerView from "@/components/accounting/GeneralLedgerView";
import FinancialStatementsView from "@/components/accounting/FinancialStatementsView";
import BusinessInsightsDashboard from "@/components/accounting/BusinessInsightsDashboard";

export default function FinancialTab({ organization, selectedBranch = "all" }) {
  const [subView, setSubView] = useState("books"); // books | ledger | statements | insights
  const [accounts, setAccounts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

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

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const res = await fetch(`/api/owner/ledger?branchId=${selectedBranch}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setAccounts(data.accounts || []);
          setEntries(data.entries || []);
        }
      } catch (err) {
        console.error("Failed to fetch journal entries:", err);
      } finally {
        if (!ignore) setLoadingEntries(false);
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, [selectedBranch]);

  const refreshLedger = () => {
    setLoadingEntries(true);
    fetch(`/api/owner/ledger?branchId=${selectedBranch}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAccounts(data.accounts || []);
          setEntries(data.entries || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingEntries(false));
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSubView("books")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subView === "books"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Account Books & Starting Balances</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView("ledger")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subView === "ledger"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>General Ledger (T-Accounts)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView("statements")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subView === "statements"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Automated Statements</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView("insights")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              subView === "insights"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Insights & Runway</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/books/ledger"
            prefetch={true}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 px-3 py-1.5 rounded-xl hover:bg-purple-50 transition-colors"
          >
            Dedicated Ledger View ↗
          </Link>
          <button
            type="button"
            onClick={() => setShowVoucherModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Voucher</span>
          </button>
        </div>
      </div>

      {/* SUBVIEW 1: STARTING BALANCES & JOURNAL ENTRIES */}
      {subView === "books" && (
        <div className="space-y-6">
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

          {/* Posted Double-Entry Journal Entries Register */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Posted Double-Entry Journal Register ({entries.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every voucher strictly enforces Total Debits == Total Credits before posting
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Double-Entry Enforced
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-3">Voucher #</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Narration</th>
                      <th className="py-3 px-3 text-right">Debit / Credit Total (₹)</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                          No manual journal vouchers posted yet. Click "+ Post Voucher" to record your first transaction.
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">
                            {entry.entryNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(entry.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {entry.entryType}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-sm">
                            <span className="font-bold text-slate-900 block truncate">{entry.narration}</span>
                            <span className="text-[10px] text-slate-400">
                              {entry.lines?.length || 0} line items • Ref: {entry.reference || "None"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                            ₹{Number(entry.totalDebit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW 2: GENERAL LEDGER (T-ACCOUNTS) */}
      {subView === "ledger" && (
        <GeneralLedgerView
          organization={organization}
          selectedBranch={selectedBranch}
        />
      )}

      {/* SUBVIEW 3: AUTOMATED FINANCIAL STATEMENTS */}
      {subView === "statements" && (
        <FinancialStatementsView
          organization={organization}
          selectedBranch={selectedBranch}
        />
      )}

      {/* SUBVIEW 4: BUSINESS INSIGHTS */}
      {subView === "insights" && (
        <BusinessInsightsDashboard
          organization={organization}
          selectedBranch={selectedBranch}
        />
      )}

      {/* Modal */}
      <NewJournalEntryModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        accounts={accounts}
        branches={organization.branchList || []}
        onEntryCreated={() => {
          refreshLedger();
        }}
      />
    </div>
  );
}
