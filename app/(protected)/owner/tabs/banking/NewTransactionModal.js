"use client";
import React, { useState } from "react";
import {
  X,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Coins,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function NewTransactionModal({
  isOpen,
  onClose,
  onTransactionCreated,
  organization,
  selectedBranch,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    accountType: "BANK", // "BANK" or "CASH"
    type: "CREDIT", // "CREDIT" or "DEBIT"
    amount: "",
    title: "",
    category: "Customer Inflow",
    paymentMethod: "IMPS",
    reference: "",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const numAmount = Number(form.amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount greater than ₹0.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter a title / description for the transaction.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/owner/banking/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: form.accountType,
          type: form.type,
          amount: numAmount,
          title: form.title.trim(),
          category: form.category,
          paymentMethod: form.paymentMethod,
          reference: form.reference.trim(),
          notes: form.notes.trim(),
          branchId: selectedBranch || "all",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record transaction.");
      }

      if (onTransactionCreated) {
        onTransactionCreated(data.transaction, data);
      }

      onClose();
    } catch (err) {
      setError(err.message || "Failed to record transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Record Live Transaction
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Permanently post a credit or debit entry to your books
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Account & Type Toggles */}
          <div className="grid grid-cols-2 gap-3">
            {/* Account Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Target Account
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, accountType: "BANK", paymentMethod: "IMPS" })}
                  className={`py-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    form.accountType === "BANK"
                      ? "bg-white text-purple-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  Bank
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, accountType: "CASH", paymentMethod: "CASH" })}
                  className={`py-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    form.accountType === "CASH"
                      ? "bg-white text-pink-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  Cash
                </button>
              </div>
            </div>

            {/* Inflow vs Outflow */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Movement Type
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "CREDIT" })}
                  className={`py-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    form.type === "CREDIT"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Inflow (+)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "DEBIT" })}
                  className={`py-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    form.type === "DEBIT"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Outflow (-)
                </button>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Transaction Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="25,000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-bold text-sm"
              />
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Description / Particulars *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Inward Customer Payment - Invoice #INV-102"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium text-xs"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium text-xs"
              >
                <option value="Customer Inflow">Customer Payment Inflow</option>
                <option value="Vendor Payout">Vendor / Supplier Payout</option>
                <option value="Cash Deposit">Cash Deposit into Bank</option>
                <option value="Cash Withdrawal">ATM / Counter Cash Withdrawal</option>
                <option value="Operating Expense">Office & Petty Expense</option>
                <option value="Freight & Logistics">Freight & Transport</option>
                <option value="Statutory Tax">GST / TDS Tax Payout</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium text-xs"
              >
                {form.accountType === "BANK" ? (
                  <>
                    <option value="IMPS">IMPS Immediate Transfer</option>
                    <option value="NEFT">NEFT Direct Settlement</option>
                    <option value="RTGS">RTGS Real-Time Gross</option>
                    <option value="UPI">UPI Instant QR</option>
                    <option value="CHEQUE">Bank Clearing Cheque</option>
                  </>
                ) : (
                  <>
                    <option value="CASH">Physical Counter Cash</option>
                    <option value="TRANSFER">Internal Vault Transfer</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Reference / UTR Number */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              UTR / Cheque / Reference No. (Optional)
            </label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="e.g. UTR-9823412093 or CHQ-00129"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium text-xs uppercase"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-200" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Post Permanent Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
