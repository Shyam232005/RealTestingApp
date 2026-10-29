"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  PlusCircle,
  FileText,
  CreditCard,
  Package,
  TrendingUp,
  Building2,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Phone,
  User,
  Calendar,
} from "lucide-react";

export default function QuickDataEntryModal({
  isOpen,
  onClose,
  organization,
  initialTab = "receivable",
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // receivable | payable | product | cash_flow
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states
  const [branchId, setBranchId] = useState("all");

  // 1. Receivable Form
  const [recForm, setRecForm] = useState({
    partyName: "",
    phone: "",
    invoiceRef: "",
    amount: "",
    daysOverdue: "14",
  });

  // 2. Payable Form
  const [payForm, setPayForm] = useState({
    partyName: "",
    phone: "",
    billRef: "",
    amount: "",
    dueInDays: "12",
  });

  // 3. Product Form
  const [prodForm, setProdForm] = useState({
    name: "",
    category: "Finished Goods",
    sellingPrice: "",
    costPrice: "",
    quantity: "50",
  });

  // 4. Cash Flow Form
  const [cashForm, setCashForm] = useState({
    title: "",
    amount: "",
    type: "CREDIT", // CREDIT (Money In) | DEBIT (Money Out)
    accountType: "BANK", // BANK | CASH
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      let payload = { entryType: activeTab, branchId };

      if (activeTab === "receivable") {
        if (!recForm.partyName.trim() || !Number(recForm.amount)) {
          throw new Error("Please enter party name and a valid invoice amount.");
        }
        payload = {
          ...payload,
          partyName: recForm.partyName.trim(),
          phone: recForm.phone.trim(),
          invoiceRef: recForm.invoiceRef.trim() || `INV-${Date.now().toString().slice(-6)}`,
          amount: Number(recForm.amount),
          daysOverdue: Number(recForm.daysOverdue) || 0,
        };
      } else if (activeTab === "payable") {
        if (!payForm.partyName.trim() || !Number(payForm.amount)) {
          throw new Error("Please enter supplier name and a valid bill amount.");
        }
        payload = {
          ...payload,
          partyName: payForm.partyName.trim(),
          phone: payForm.phone.trim(),
          billRef: payForm.billRef.trim() || `BILL-${Date.now().toString().slice(-6)}`,
          amount: Number(payForm.amount),
          dueInDays: Number(payForm.dueInDays) || 15,
        };
      } else if (activeTab === "product") {
        if (!prodForm.name.trim() || !Number(prodForm.sellingPrice)) {
          throw new Error("Please enter product name and selling price.");
        }
        payload = {
          ...payload,
          name: prodForm.name.trim(),
          category: prodForm.category.trim(),
          sellingPrice: Number(prodForm.sellingPrice),
          costPrice: Number(prodForm.costPrice) || Math.round(Number(prodForm.sellingPrice) * 0.7),
          quantity: Number(prodForm.quantity) || 1,
        };
      } else if (activeTab === "cash_flow") {
        if (!cashForm.title.trim() || !Number(cashForm.amount)) {
          throw new Error("Please enter description title and amount.");
        }
        payload = {
          ...payload,
          title: cashForm.title.trim(),
          amount: Number(cashForm.amount),
          type: cashForm.type,
          accountType: cashForm.accountType,
        };
      }

      const res = await fetch("/api/owner/insights/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record data entry.");
      }

      setSuccessMsg(data.message || "Entry successfully posted to permanent records!");
      if (onSuccess) onSuccess();

      // Reset forms
      setRecForm({ partyName: "", phone: "", invoiceRef: "", amount: "", daysOverdue: "14" });
      setPayForm({ partyName: "", phone: "", billRef: "", amount: "", dueInDays: "12" });
      setProdForm({ name: "", category: "Finished Goods", sellingPrice: "", costPrice: "", quantity: "50" });
      setCashForm({ title: "", amount: "", type: "CREDIT", accountType: "BANK" });

      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const branches = organization?.branchList || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Record Real Business Data
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Enter live transactions, customer dues, supplier bills, and products
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100/70 border-b border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("receivable")}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "receivable"
                  ? "bg-white text-emerald-800 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate">Receivable (Debtor)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("payable")}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "payable"
                  ? "bg-white text-purple-800 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="truncate">Payable (Creditor)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("product")}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "product"
                  ? "bg-white text-blue-800 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span className="truncate">Product & Stock</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cash_flow")}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "cash_flow"
                  ? "bg-white text-indigo-800 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="truncate">Cash Flow (30d)</span>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Target Branch */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Branch / Location
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:border-purple-600"
              >
                <option value="all">Consolidated / Company HQ</option>
                {branches.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.name} ({b.location || "Branch"})
                  </option>
                ))}
              </select>
            </div>

            {/* TAB 1: RECEIVABLE FORM */}
            {activeTab === "receivable" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Customer / Debtor Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Hardware & Trading"
                      value={recForm.partyName}
                      onChange={(e) => setRecForm({ ...recForm, partyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Phone Number (For WhatsApp Reminders)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +919876543210"
                      value={recForm.phone}
                      onChange={(e) => setRecForm({ ...recForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Invoice Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INV-1002"
                      value={recForm.invoiceRef}
                      onChange={(e) => setRecForm({ ...recForm, invoiceRef: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Amount Due (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 85000"
                      value={recForm.amount}
                      onChange={(e) => setRecForm({ ...recForm, amount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Days Overdue
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 14"
                      value={recForm.daysOverdue}
                      onChange={(e) => setRecForm({ ...recForm, daysOverdue: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PAYABLE FORM */}
            {activeTab === "payable" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Supplier / Creditor Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. National Steel & Tube Mills"
                      value={payForm.partyName}
                      onChange={(e) => setPayForm({ ...payForm, partyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +919820011223"
                      value={payForm.phone}
                      onChange={(e) => setPayForm({ ...payForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Bill / Challan Ref
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BILL-904"
                      value={payForm.billRef}
                      onChange={(e) => setPayForm({ ...payForm, billRef: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Amount Payable (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 120000"
                      value={payForm.amount}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-purple-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Due In (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 10"
                      value={payForm.dueInDays}
                      onChange={(e) => setPayForm({ ...payForm, dueInDays: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PRODUCT FORM */}
            {activeTab === "product" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brass Valve 25mm"
                      value={prodForm.name}
                      onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Industrial Hardware"
                      value={prodForm.category}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 450"
                      value={prodForm.sellingPrice}
                      onChange={(e) => setProdForm({ ...prodForm, sellingPrice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Cost Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 260"
                      value={prodForm.costPrice}
                      onChange={(e) => setProdForm({ ...prodForm, costPrice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Stock Units
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={prodForm.quantity}
                      onChange={(e) => setProdForm({ ...prodForm, quantity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CASH FLOW FORM */}
            {activeTab === "cash_flow" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Description / Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Client Payment / Raw Material Purchase"
                      value={cashForm.title}
                      onChange={(e) => setCashForm({ ...cashForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 75000"
                      value={cashForm.amount}
                      onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Flow Direction
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCashForm({ ...cashForm, type: "CREDIT" })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          cashForm.type === "CREDIT"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-black"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        Money In (Receipt)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashForm({ ...cashForm, type: "DEBIT" })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          cashForm.type === "DEBIT"
                            ? "bg-rose-50 border-rose-300 text-rose-800 font-black"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        Money Out (Expense)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCashForm({ ...cashForm, accountType: "BANK" })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          cashForm.accountType === "BANK"
                            ? "bg-indigo-50 border-indigo-300 text-indigo-800 font-black"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        Bank Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashForm({ ...cashForm, accountType: "CASH" })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          cashForm.accountType === "CASH"
                            ? "bg-amber-50 border-amber-300 text-amber-800 font-black"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        Vault Cash
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Recording..." : "Save to Permanent Records"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
