"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Scale,
  Plus,
  RefreshCw,
  FileText,
  DollarSign,
  Download,
} from "lucide-react";
import NewJournalEntryModal from "./NewJournalEntryModal";
import CrownZeroState from "@/components/ui/CrownZeroState";
import { TableSkeleton } from "@/components/ui/CrownSkeletonLoader";
import { writeLocalRecord, queueBackgroundSync } from "@/lib/localCrdtSync";

export default function GeneralLedgerView({
  organization,
  selectedBranch = "all",
}) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [accountFilter, setAccountFilter] = useState("ALL"); // ALL | ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewVoucherModal, setShowNewVoucherModal] = useState(false);

  // Fetch all accounts
  useEffect(() => {
    let ignore = false;
    async function loadAccounts() {
      try {
        const res = await fetch(`/api/owner/ledger?branchId=${selectedBranch}`);
        const data = await res.json();
        if (!ignore && data.success && data.accounts) {
          setAccounts(data.accounts);
          setSelectedAccountId((prev) => prev || (data.accounts.length > 0 ? data.accounts[0]._id : null));
        }
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      } finally {
        if (!ignore) setLoadingAccounts(false);
      }
    }
    loadAccounts();
    return () => {
      ignore = true;
    };
  }, [selectedBranch]);

  // Fetch ledger for selected account
  useEffect(() => {
    if (!selectedAccountId) return;
    let ignore = false;
    async function loadLedger() {
      try {
        const res = await fetch(`/api/owner/ledger/${selectedAccountId}?branchId=${selectedBranch}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setLedgerData(data);
        }
      } catch (err) {
        console.error("Failed to fetch account ledger:", err);
      } finally {
        if (!ignore) setLoadingLedger(false);
      }
    }
    loadLedger();
    return () => {
      ignore = true;
    };
  }, [selectedAccountId, selectedBranch]);

  const refreshAccountsAndLedger = () => {
    setLoadingAccounts(true);
    if (selectedAccountId) setLoadingLedger(true);

    fetch(`/api/owner/ledger?branchId=${selectedBranch}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.accounts) {
          setAccounts(data.accounts);
          const targetId = selectedAccountId || (data.accounts[0] ? data.accounts[0]._id : null);
          if (targetId) {
            setSelectedAccountId(targetId);
            return fetch(`/api/owner/ledger/${targetId}?branchId=${selectedBranch}`).then((r) => r.json());
          }
        }
      })
      .then((lData) => {
        if (lData && lData.success) {
          setLedgerData(lData);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoadingAccounts(false);
        setLoadingLedger(false);
      });
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesType = accountFilter === "ALL" || acc.type === accountFilter;
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery);
    return matchesType && matchesSearch;
  });

  const selectedAccount = accounts.find((a) => a._id === selectedAccountId);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">General Ledger & T-Accounts</h2>
              <p className="text-xs text-slate-500 font-medium">
                Dual-entry chronological records with live running balances per ledger account
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refreshAccountsAndLedger}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowNewVoucherModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Journal Voucher</span>
          </button>
        </div>
      </div>

      {/* Main Split-View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Chart of Accounts Selector */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
              Chart of Accounts ({filteredAccounts.length})
            </span>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search account name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
            {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountFilter(type)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  accountFilter === type
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Account List */}
          <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto pr-1">
            {loadingAccounts ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 animate-pulse flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 rounded bg-slate-200" />
                      <div className="h-2.5 w-16 rounded bg-slate-100" />
                    </div>
                    <div className="h-3.5 w-16 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-4">
                <CrownZeroState
                  compact
                  variant="search"
                  title="No Accounts Found"
                  description="Try clearing your search query or selecting ALL categories."
                  actionText="Reset Filter"
                  onAction={() => {
                    setAccountFilter("ALL");
                    setSearchQuery("");
                  }}
                />
              </div>
            ) : (
              filteredAccounts.map((acc) => {
                const isSelected = acc._id === selectedAccountId;
                return (
                  <motion.div
                    key={acc._id}
                    onClick={() => setSelectedAccountId(acc._id)}
                    whileHover={{ x: 2 }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple-50/90 border border-purple-200 text-purple-950 font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {acc.code}
                        </span>
                        <span className="text-xs font-bold truncate max-w-[170px]">
                          {acc.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold ${
                          acc.currentBalance < 0
                            ? "text-rose-600"
                            : isSelected
                            ? "text-purple-700"
                            : "text-slate-900"
                        }`}
                      >
                        ₹{Number(acc.currentBalance || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="uppercase font-semibold tracking-wider">
                        {acc.subCategory?.replace(/_/g, " ")}
                      </span>
                      <span>Normal: {acc.normalBalance}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: T-Account Detail View */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
          {selectedAccount && (
            <motion.div
              key={selectedAccount._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Account Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800">
                      {selectedAccount.code}
                    </span>
                    <h3 className="text-lg font-black text-slate-900">{selectedAccount.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Classification: <span className="font-bold text-slate-700">{selectedAccount.type}</span> • Sub-category: <span className="font-bold text-slate-700">{selectedAccount.subCategory?.replace(/_/g, " ")}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                    Normal Balance: {selectedAccount.normalBalance}
                  </span>
                </div>
              </div>

              {/* 3 Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    Total Debits (Dr)
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-emerald-900 font-mono">
                      ₹{Number(ledgerData?.totalDebit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">DR</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block mb-1">
                    Total Credits (Cr)
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-purple-900 font-mono">
                      ₹{Number(ledgerData?.totalCredit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-purple-700 font-bold">CR</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Net Running Balance
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black font-mono">
                      ₹{Math.abs(Number(ledgerData?.netBalance || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-purple-300 font-bold">
                      {ledgerData?.netBalance >= 0 ? selectedAccount.normalBalance : selectedAccount.normalBalance === "DEBIT" ? "CREDIT" : "DEBIT"}
                    </span>
                  </div>
                </div>
              </div>

              {/* T-Account Transaction Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Chronological Ledger Entries ({ledgerData?.rows?.length || 0})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Calculated per Double-Entry Rules
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Voucher #</th>
                          <th className="py-3 px-3">Narration / Memo</th>
                          <th className="py-3 px-3 text-right">Debit (₹)</th>
                          <th className="py-3 px-3 text-right">Credit (₹)</th>
                          <th className="py-3 px-3 text-right">Running Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {loadingLedger ? (
                          Array.from({ length: 5 }).map((_, idx) => (
                            <tr key={idx} className="animate-pulse">
                              <td className="py-3.5 px-3"><div className="h-3 w-16 bg-slate-200 rounded" /></td>
                              <td className="py-3.5 px-3"><div className="h-3 w-20 bg-slate-200 rounded" /></td>
                              <td className="py-3.5 px-3"><div className="h-3 w-36 bg-slate-200 rounded" /></td>
                              <td className="py-3.5 px-3 text-right"><div className="h-3 w-14 bg-slate-200 rounded ml-auto" /></td>
                              <td className="py-3.5 px-3 text-right"><div className="h-3 w-14 bg-slate-200 rounded ml-auto" /></td>
                              <td className="py-3.5 px-3 text-right"><div className="h-3 w-20 bg-slate-200 rounded ml-auto" /></td>
                            </tr>
                          ))
                        ) : !ledgerData?.rows || ledgerData.rows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center">
                              <CrownZeroState
                                compact
                                variant="ledger"
                                title="No Transactions for This Account"
                                description="Post a journal voucher, inward bill, or starting balance to view dual-entry debit and credit records."
                                actionText="Post Journal Entry"
                                onAction={() => setShowNewVoucherModal(true)}
                              />
                            </td>
                          </tr>
                        ) : (
                          ledgerData.rows.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                                {new Date(row.date).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">
                                {row.entryNumber}
                              </td>
                              <td className="py-3 px-3 max-w-xs">
                                <span className="font-semibold text-slate-900 block truncate">
                                  {row.narration}
                                </span>
                                {row.description && (
                                  <span className="text-[11px] text-slate-400 block truncate">
                                    {row.description}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                                {row.debit > 0
                                  ? `₹${Number(row.debit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                  : "-"}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-purple-600 whitespace-nowrap">
                                {row.credit > 0
                                  ? `₹${Number(row.credit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                  : "-"}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                                ₹{Math.abs(Number(row.runningBalance)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}{" "}
                                <span className="text-[10px] text-slate-400">{row.balanceSide}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* New Journal Entry Modal */}
      <NewJournalEntryModal
        isOpen={showNewVoucherModal}
        onClose={() => setShowNewVoucherModal(false)}
        accounts={accounts}
        branches={organization.branchList || []}
        onEntryCreated={() => {
          refreshAccountsAndLedger();
        }}
      />
    </div>
  );
}
