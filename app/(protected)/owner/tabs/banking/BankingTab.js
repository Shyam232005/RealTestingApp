"use client";
import React, { useState, useEffect } from "react";
import {
  Landmark,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  Download,
  PlusCircle,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import BankingDetailsModal from "./BankingDetailsModal";
import NewTransactionModal from "./NewTransactionModal";

export default function BankingTab({
  organization,
  selectedBranch = "all",
  setActiveTab,
}) {
  const [bankingModalOpen, setBankingModalOpen] = useState(false);
  const [newTxnModalOpen, setNewTxnModalOpen] = useState(false);

  // Live Banking Data loaded permanently from MongoDB
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [bankBalance, setBankBalance] = useState(
    Number(organization?.openingBalance || 0)
  );
  const [cashBalance, setCashBalance] = useState(
    Number(organization?.openingCash || 0)
  );
  const [totalLiquidBalance, setTotalLiquidBalance] = useState(
    Number(organization?.openingBalance || 0) +
      Number(organization?.openingCash || 0)
  );

  // Filter & Search states for Live Ledger
  const [filterAccount, setFilterAccount] = useState("ALL"); // ALL, BANK, CASH, CREDIT, DEBIT
  const [searchQuery, setSearchQuery] = useState("");
  const [statementPeriod, setStatementPeriod] = useState("ALL"); // ALL, THIS_MONTH, LAST_MONTH

  // Fetch permanent transactions from backend
  const fetchBankingData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/owner/banking/transactions?branch=${encodeURIComponent(selectedBranch || "all")}`
      );
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        if (data.bankBalance !== undefined) setBankBalance(data.bankBalance);
        if (data.cashBalance !== undefined) setCashBalance(data.cashBalance);
        if (data.totalLiquidBalance !== undefined)
          setTotalLiquidBalance(data.totalLiquidBalance);
      }
    } catch (err) {
      console.error("Failed to load live banking transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingData();
  }, [selectedBranch]);

  // Handle new transaction added
  const handleTransactionCreated = (newTxn, responseData) => {
    setTransactions((prev) => [newTxn, ...prev]);
    if (responseData.bankBalance !== undefined)
      setBankBalance(responseData.bankBalance);
    if (responseData.cashBalance !== undefined)
      setCashBalance(responseData.cashBalance);
    if (responseData.totalLiquidBalance !== undefined)
      setTotalLiquidBalance(responseData.totalLiquidBalance);
  };

  // Branch Title Formatting
  const isAll = selectedBranch === "all";
  const branchTitle = isAll
    ? "All Branches (Consolidated)"
    : selectedBranch === "branch-1"
    ? "Branch 1 - Main (HQ)"
    : selectedBranch.replace("branch-", "Branch ");

  // Filtered transactions for table
  const filteredTransactions = transactions.filter((t) => {
    // Account type filter
    if (filterAccount === "BANK" && t.accountType !== "BANK") return false;
    if (filterAccount === "CASH" && t.accountType !== "CASH") return false;
    if (filterAccount === "CREDIT" && t.type !== "CREDIT") return false;
    if (filterAccount === "DEBIT" && t.type !== "DEBIT") return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || "").toLowerCase().includes(q);
      const matchRef = (t.reference || "").toLowerCase().includes(q);
      const matchCat = (t.category || "").toLowerCase().includes(q);
      if (!matchTitle && !matchRef && !matchCat) return false;
    }

    return true;
  });

  // Statement calculations
  const totalInflows = transactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalOutflows = transactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Download official CSV Statement
  const handleDownloadCSV = () => {
    const headers =
      "Date,Reference No,Account,Type,Category,Description,Amount (INR),Running Balance (INR),Status\n";
    const rows = filteredTransactions
      .map((t) => {
        const dateStr = new Date(t.date).toISOString().split("T")[0];
        const cleanTitle = `"${(t.title || "").replace(/"/g, '""')}"`;
        const cleanCat = `"${(t.category || "").replace(/"/g, '""')}"`;
        return `${dateStr},${t.reference || ""},${t.accountType},${t.type},${cleanCat},${cleanTitle},${t.amount},${t.runningBalance || 0},${t.status}`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeOrgName = (organization?.RegisterName || "FineOps").replace(
      /\s+/g,
      "_"
    );
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Bank_Statement_${safeOrgName}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const minCashAlert = Number(organization.minCashReserveAlert || 100000);
  const isCashLow = totalLiquidBalance < minCashAlert;

  return (
    <div className="space-y-7">
      {/* Pop-up Card 1: Dedicated Banking Credentials Modal */}
      <BankingDetailsModal
        organization={organization}
        isOpen={bankingModalOpen}
        onClose={() => setBankingModalOpen(false)}
      />

      {/* Pop-up Card 2: Record Live Transaction Modal */}
      <NewTransactionModal
        isOpen={newTxnModalOpen}
        onClose={() => setNewTxnModalOpen(false)}
        onTransactionCreated={handleTransactionCreated}
        organization={organization}
        selectedBranch={selectedBranch}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Commercial Banking & Cash Desk
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {branchTitle}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Commercial account balance, physical vault cash, and permanent live transaction tracking.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Dedicated Button to open Banking Details Pop-up Card */}
          <button
            type="button"
            onClick={() => setBankingModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer group"
          >
            <Landmark className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            <span>Show Banking Details</span>
          </button>

          {/* Record Live Transaction Button */}
          <button
            type="button"
            onClick={() => setNewTxnModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Live Transaction</span>
          </button>
        </div>
      </div>

      {/* 3 Top Balance Cards:
          - Main Commercial Account Balance (Bank)
          - Cash in Hand Balance (Vault Cash)
          - Total Liquid Funds
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: MAIN BALANCE (Bank Account) */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-purple-300">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                Main Account Balance
              </span>
            </div>
            <span className="text-[10px] font-mono bg-purple-500/20 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/30 font-bold">
              Current Account
            </span>
          </div>

          <div>
            <p className="text-3xl font-black font-mono tracking-tight text-white">
              ₹{bankBalance.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-300 font-semibold mt-1">
              {organization.BankName}
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            {/* Pop-up trigger right on the main balance card */}
            <button
              type="button"
              onClick={() => setBankingModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-300 hover:text-white transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Account Details</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono">
              Live Bank Ledger
            </span>
          </div>
        </div>

        {/* Card 2: BALANCED IN CASH (Vault Cash in Hand) */}
        <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Balanced in Cash
              </span>
            </div>
            <span className="text-[10px] font-bold bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full border border-pink-200">
              Vault Cash
            </span>
          </div>

          <div>
            <p className="text-3xl font-black font-mono tracking-tight text-slate-900">
              ₹{cashBalance.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Physical Cash in Hand (Shop & Factory Vault)
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              Available for counter expenses
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Liquid Cash
            </span>
          </div>
        </div>

        {/* Card 3: TOTAL COMBINED LIQUID FUNDS */}
        <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Liquid Funds
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isCashLow
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {isCashLow ? "Below Alert Cap" : "Safe Reserve"}
            </span>
          </div>

          <div>
            <p className="text-3xl font-black font-mono tracking-tight text-slate-900">
              ₹{totalLiquidBalance.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Bank (₹{bankBalance.toLocaleString("en-IN")}) + Cash (₹{cashBalance.toLocaleString("en-IN")})
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              Alert Trigger: ₹{minCashAlert.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              100% Asset Backed
            </span>
          </div>
        </div>
      </div>

      {/* STATEMENTS SECTION ("and below with statments") */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Bank Statements & Audit Summary
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official statement movements for audit, CA filing, and internal reconciliation
              </p>
            </div>
          </div>

          {/* Statement Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Statement (CSV)
            </button>
          </div>
        </div>

        {/* Statement Summary KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Total Inflows / Credits
            </span>
            <p className="font-mono font-black text-emerald-900 text-base mt-1">
              +₹{totalInflows.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              Total Outflows / Debits
            </span>
            <p className="font-mono font-black text-rose-900 text-base mt-1">
              -₹{totalOutflows.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
              Net Movement
            </span>
            <p className="font-mono font-black text-purple-950 text-base mt-1">
              ₹{(totalInflows - totalOutflows).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Recorded Entries
            </span>
            <p className="font-mono font-black text-slate-900 text-base mt-1">
              {transactions.length} Vouchers
            </p>
          </div>
        </div>
      </div>

      {/* LIVE TRANSACTIONS LEDGER (PERMANENT TRACKING OF PAST & LIVE HISTORY) */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Permanent Live Transaction Ledger
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Permanent History
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log tracking all past setup deposits, customer receipts, and payouts
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setNewTxnModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Entry
            </button>
            <button
              onClick={fetchBankingData}
              title="Refresh ledger"
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Account Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "ALL", label: "All History" },
              { id: "BANK", label: "Bank Account" },
              { id: "CASH", label: "Vault Cash" },
              { id: "CREDIT", label: "Inflows (+)" },
              { id: "DEBIT", label: "Outflows (-)" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterAccount(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                  filterAccount === f.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, UTR, ref..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none text-xs font-medium"
            />
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Reference / UTR</th>
                <th className="py-3 px-3">Account</th>
                <th className="py-3 px-3">Description & Category</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
                <th className="py-3 px-3 text-right">Running Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn, idx) => {
                  const isCredit = txn.type === "CREDIT";
                  const dateObj = new Date(txn.date);
                  const formattedDate = dateObj.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={txn._id || idx}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {formattedDate}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formattedTime}
                        </span>
                      </td>

                      {/* Reference No */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] font-bold text-slate-600">
                        {txn.reference || `TXN-${idx + 1}`}
                      </td>

                      {/* Account Pill */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            txn.accountType === "BANK"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-pink-50 text-pink-700 border-pink-200"
                          }`}
                        >
                          {txn.accountType === "BANK" ? (
                            <>
                              <Landmark className="w-3 h-3" />
                              Bank
                            </>
                          ) : (
                            <>
                              <Coins className="w-3 h-3" />
                              Cash
                            </>
                          )}
                        </span>
                      </td>

                      {/* Title & Category */}
                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">
                          {txn.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {txn.category || "General"} • {txn.paymentMethod || "SYSTEM"}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-sm">
                        <span
                          className={
                            isCredit ? "text-emerald-600" : "text-rose-600"
                          }
                        >
                          {isCredit ? "+" : "-"}₹
                          {Number(txn.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Running Balance */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-semibold text-slate-800">
                        ₹
                        {Number(txn.runningBalance || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Settled
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-slate-700 text-xs">
                      No Live Transactions Recorded Yet
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      Your commercial bank account and cash vault are initialized with your setup baseline balances. Post an entry via &quot;Record Live Transaction&quot; or process vendor bills to start tracking live history.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>
            Showing <strong>{filteredTransactions.length}</strong> of{" "}
            <strong>{transactions.length}</strong> permanent ledger entries
          </span>
          <span className="font-mono text-purple-700 font-bold">
            All records permanently stored in FinOps MongoDB Ledger
          </span>
        </div>
      </div>
    </div>
  );
}
