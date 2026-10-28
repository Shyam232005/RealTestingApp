"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  FileText,
  Building2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { writeLocalRecord, queueBackgroundSync, generateCrdtId } from "@/lib/localCrdtSync";

export default function NewJournalEntryModal({
  isOpen,
  onClose,
  accounts = [],
  branches = [],
  onEntryCreated = () => {},
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [branchId, setBranchId] = useState("all");
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState([
    { accountId: accounts[0]?._id || "", debit: "", credit: "", description: "" },
    { accountId: accounts[1]?._id || "", debit: "", credit: "", description: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  // Calculate live totals
  const totalDebit = lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);
  const difference = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;
  const isBalanced = difference <= 0.01 && totalDebit > 0;

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;

    // Mutually exclusive: entering debit clears credit and vice versa
    if (field === "debit" && Number(value) > 0) {
      updated[index].credit = "";
    } else if (field === "credit" && Number(value) > 0) {
      updated[index].debit = "";
    }

    setLines(updated);
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      { accountId: accounts[0]?._id || "", debit: "", credit: "", description: "" },
    ]);
  };

  const handleRemoveLine = (index) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!narration.trim()) {
      setErrorMsg("Please provide a narration describing this transaction.");
      return;
    }

    if (!isBalanced) {
      setErrorMsg(
        `Double-entry rule violation: Total Debits (₹${totalDebit.toLocaleString("en-IN")}) must equal Total Credits (₹${totalCredit.toLocaleString("en-IN")}). Difference is ₹${difference.toFixed(2)}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date,
        branchId,
        reference: reference || generateCrdtId("JV"),
        narration,
        entryType: "MANUAL",
        totalDebit,
        totalCredit,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description,
        })),
      };

      // 1. Optimistic local CRDT write (microsecond response)
      const optimisticEntry = {
        ...payload,
        _id: generateCrdtId("opt"),
        status: "POSTED",
        createdAt: new Date().toISOString(),
      };
      await writeLocalRecord("journal_entries", optimisticEntry);

      // Instant optimistic UI callback before waiting on network
      onEntryCreated(optimisticEntry);
      onClose();

      // 2. Queue asynchronous background sync to MongoDB
      await queueBackgroundSync({
        endpoint: "/api/owner/ledger",
        method: "POST",
        payload,
        recordId: optimisticEntry._id,
        collection: "journal_entries",
      });
    } catch (err) {
      setErrorMsg(err.message || "Failed to post entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  New Journal Voucher (JV)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                  Double-Entry
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Record manual adjustments, capital injections, transfers, or depreciation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Posting Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Branch / Cost Center
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Branches (Consolidated)</option>
                {branches.map((b) => (
                  <option key={b.branchId || b._id} value={b.branchId || b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Bill / Ref Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. PO-8901 / RTGS-4421"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Narration / Transaction Memo *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Being owner capital introduced via RTGS into SBI account"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
            />
          </div>

          {/* Journal Lines Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Voucher Line Items (Debits & Credits)
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Account (Chart of Accounts)</th>
                    <th className="py-2.5 px-3">Description (Optional)</th>
                    <th className="py-2.5 px-3 text-right w-36">Debit (₹)</th>
                    <th className="py-2.5 px-3 text-right w-36">Credit (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <select
                          required
                          value={line.accountId}
                          onChange={(e) => handleLineChange(idx, "accountId", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-hidden"
                        >
                          <option value="">Select Account...</option>
                          {accounts.map((acc) => (
                            <option key={acc._id} value={acc._id}>
                              {acc.code} - {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Line note..."
                          value={line.description}
                          onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-hidden"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.debit}
                          onChange={(e) => handleLineChange(idx, "debit", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-right text-emerald-700 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.credit}
                          onChange={(e) => handleLineChange(idx, "credit", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-right text-purple-700 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-mono font-bold text-xs border-t border-slate-200">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-right text-slate-700 uppercase font-sans font-bold text-[11px]">
                      Totals:
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700">
                      ₹{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-purple-700">
                      ₹{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Dual-Entry Balance Verification Card */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
              isBalanced
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                : "bg-amber-50/80 border-amber-300 text-amber-950"
            }`}
          >
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="font-bold">
                  {isBalanced
                    ? "Voucher is Perfectly Balanced (Debits = Credits)"
                    : `Unbalanced Entry: Difference of ₹${difference.toFixed(2)}`}
                </p>
                <p className="text-[11px] opacity-80">
                  {isBalanced
                    ? "The fundamental double-entry rule is satisfied. Ready to post."
                    : "Add or adjust line items so that total debits match total credits."}
                </p>
              </div>
            </div>

            <div className="text-right font-mono font-bold text-xs">
              <span className="block text-[10px] text-slate-500 uppercase">Balance Delta</span>
              <span className={isBalanced ? "text-emerald-700" : "text-amber-700"}>
                ₹{difference.toFixed(2)}
              </span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Server-side verification active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isBalanced || submitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>{submitting ? "Posting..." : "Post to Ledger"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
