"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  X,
  MapPin,
  Users,
  TrendingUp,
  Package,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function BranchActivationModal({
  isOpen,
  onClose,
  branchNumber,
  branchId,
  onSuccess,
}) {
  const [name, setName] = useState(`Branch ${branchNumber || 2}`);
  const [location, setLocation] = useState("");
  const [staffCount, setStaffCount] = useState("");
  const [lastMonthSales, setLastMonthSales] = useState("");
  const [monthlySalesTarget, setMonthlySalesTarget] = useState("");
  const [allocatedFunds, setAllocatedFunds] = useState("");

  // Stock items list
  const [stockItems, setStockItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Finished Goods");
  const [itemQty, setItemQty] = useState("");
  const [itemUnit, setItemUnit] = useState("Pcs");
  const [itemPrice, setItemPrice] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleAddStock = () => {
    if (!itemName.trim()) {
      setErrorMsg("Please enter product name.");
      return;
    }
    const qty = Math.max(0, Number(itemQty) || 0);
    const price = Math.max(0, Number(itemPrice) || 0);

    const newItem = {
      itemId: `stk-${Date.now()}`,
      name: itemName.trim(),
      category: itemCategory,
      quantity: qty,
      unit: itemUnit,
      unitPrice: price,
      stockStatus: qty > 10 ? "in_stock" : qty > 0 ? "low_stock" : "out_of_stock",
    };

    setStockItems((prev) => [...prev, newItem]);
    setItemName("");
    setItemQty("");
    setItemPrice("");
    setErrorMsg("");
  };

  const handleRemoveStock = (idx) => {
    setStockItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Please enter a valid branch name (at least 2 letters).");
      return;
    }

    if (!location.trim() || location.trim().length < 2) {
      setErrorMsg("Please enter the branch operating address / city.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/owner/branches/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: branchId || `branch-${branchNumber}`,
          branchNumber: branchNumber || 2,
          name: name.trim(),
          location: location.trim(),
          staffCount: Number(staffCount) || 0,
          lastMonthSales: Number(lastMonthSales) || 0,
          monthlySalesTarget: Number(monthlySalesTarget) || 0,
          allocatedFunds: Number(allocatedFunds) || 0,
          stockItems: stockItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to activate branch.");
      }

      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      if (onSuccess) {
        onSuccess(data.branch, data.organization);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "An error occurred while activating the branch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-6 text-white relative">
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                    Unit Setup & Onboarding
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-mono">
                    Branch #{branchNumber}
                  </span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                  Activate Branch Operations
                </h2>
              </div>
            </div>
            <p className="text-xs text-purple-100/90 mt-2">
              Provide this branch’s location, employee count, and stock items to unlock its dedicated operations center and customer CRM.
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleActivate} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Branch / Store Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Surat Ring Road Unit"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Operating Location / City *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ring Road, Surat, Gujarat"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Staff / Employees at Branch
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="0"
                    value={staffCount}
                    onChange={(e) => setStaffCount(e.target.value)}
                    placeholder="e.g. 6"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Last Month Sales Income (₹)
                </label>
                <div className="relative">
                  <TrendingUp className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="0"
                    value={lastMonthSales}
                    onChange={(e) => setLastMonthSales(e.target.value)}
                    placeholder="e.g. 185000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Monthly Sales Target (₹)
                </label>
                <div className="relative">
                  <TrendingUp className="w-4 h-4 text-purple-600 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="0"
                    value={monthlySalesTarget}
                    onChange={(e) => setMonthlySalesTarget(e.target.value)}
                    placeholder="e.g. 350000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Allot Initial Funds / Cash (₹)
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="0"
                    value={allocatedFunds}
                    onChange={(e) => setAllocatedFunds(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Current Stock Items Builder */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    Branch Stock Items (What this branch sells/stocks)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  {stockItems.length} Items Listed
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Add the goods or products stocked at this branch location.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Item / Product Name *"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 outline-none focus:border-purple-600"
                  >
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Trading Goods">Trading Goods</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Apparel / Retail">Apparel / Retail</option>
                    <option value="Hardware / Spare">Hardware / Spare</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Unit Price ₹"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddStock}
                    className="w-full h-full min-h-[34px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Add Stock Item"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              {stockItems.length > 0 && (
                <div className="mt-2.5 max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {stockItems.map((stk, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-slate-900 truncate">{stk.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {stk.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                        <span>{stk.quantity} {stk.unit}</span>
                        <span className="text-purple-700 font-bold">₹{stk.unitPrice}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStock(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Branch...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm & Activate Branch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
