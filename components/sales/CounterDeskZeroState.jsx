"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  MonitorSmartphone,
  ShoppingCart,
  QrCode,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle2,
  Sparkles,
  Zap,
  Building2,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  Keyboard,
} from "lucide-react";

export default function CounterDeskZeroState({
  hqWarehouseName = "Main (HQ) Warehouse",
  onStartOrder,
  syncLatencyMs = 28,
  className = "",
}) {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    itemsSummary: "",
    totalAmount: "",
    paymentMode: "UPI",
    advanceCollected: "",
  });
  const [toastMessage, setToastMessage] = useState("");

  const handleStart = () => {
    setOrderModalOpen(true);
    if (typeof onStartOrder === "function") {
      onStartOrder();
    }
  };

  // Keyboard shortcut listener: F1 to start new sales order instantly
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if F1 was pressed
      if (e.key === "F1" || e.code === "F1") {
        e.preventDefault();
        setOrderModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    setToastMessage(
      `Sales Order booked for ${orderForm.customerName || "Customer"} via ${orderForm.paymentMode}!`
    );
    setOrderModalOpen(false);
    setOrderForm({
      customerName: "",
      customerPhone: "",
      itemsSummary: "",
      totalAmount: "",
      paymentMode: "UPI",
      advanceCollected: "",
    });
    setTimeout(() => setToastMessage(""), 4500);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md">
              Counter Registered
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Empty State Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-8 sm:p-14 text-center shadow-xl shadow-slate-100/60"
      >
        {/* Soft Ambient Radial Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl opacity-75" />

        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          {/* Status Badge & Hierarchy/Owner Connection */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>🟢 Inventory Live-Synced with {hqWarehouseName}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <Zap className="w-3 h-3 text-emerald-600" />
              <span>Sync: {syncLatencyMs}ms</span>
            </span>
          </div>

          {/* Animated Icon Container */}
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{
              repeat: Infinity,
              duration: 3.5,
              ease: "easeInOut",
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-emerald-500/25 bg-emerald-50/80 text-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-6 relative group"
          >
            <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
            <Store className="w-10 h-10 sm:w-11 sm:h-11 relative z-10 text-emerald-600" />
          </motion.div>

          {/* Primary Copy */}
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
            Counter desk is open and ready for billing.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mb-8">
            Terminal registers are cleared and stock availability is synchronized directly with the owner&apos;s master godown ledger. Start billing walk-in buyers or commercial pickups immediately.
          </p>

          {/* MASSIVE, KEYBOARD-ACCESSIBLE PRIMARY BUTTON */}
          <div className="w-full max-w-md space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleStart}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm sm:text-base transition-all shadow-xl shadow-slate-900/15 flex items-center justify-center gap-3 group cursor-pointer border border-slate-800"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Start New Sales Order</span>
              <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono font-bold">
                <Keyboard className="w-3 h-3" />
                <span>F1</span>
              </kbd>
            </motion.button>

            {/* Subtle Ledger & Payment Hint */}
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed px-4">
              💡 <strong className="text-slate-600">Assistant Reminder:</strong> Remember to collect advance payments via UPI or Cash to maintain the daily counter register &amp; general ledger balance.
            </p>
          </div>
        </div>
      </motion.div>

      {/* QUICK SALES ORDER CREATION MODAL */}
      <AnimatePresence>
        {orderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      New Counter Sales Order (SO)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Live sync with {hqWarehouseName} inventory
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleOrderSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Walk-in / Alok Sharma"
                      value={orderForm.customerName}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, customerName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Contact Mobile (For E-Bill)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9825001122"
                      value={orderForm.customerPhone}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, customerPhone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Items &amp; SKU Summary <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5x Cotton Roll #402, 10x Packaging Box"
                    value={orderForm.itemsSummary}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, itemsSummary: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Total Invoice Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 18500"
                      value={orderForm.totalAmount}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, totalAmount: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Settlement Mode
                    </label>
                    <select
                      value={orderForm.paymentMode}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, paymentMode: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="UPI">UPI / QR Code Scan</option>
                      <option value="CASH">Physical Cash at Counter</option>
                      <option value="CARD">POS Card Terminal</option>
                      <option value="NEFT">Bank RTGS / NEFT</option>
                      <option value="CREDIT">Customer Credit Ledger</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Real-time stock deduction from HQ Godown</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">GST-18% Included</span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOrderModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Confirm Order &amp; Post to Ledger</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
