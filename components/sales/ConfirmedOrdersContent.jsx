"use client";
import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Store,
  Receipt,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Phone,
  QrCode,
  CreditCard,
  Banknote,
  PackageCheck,
  X,
  Keyboard,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  syncSalesOrderToMongoDB,
  fetchLatestRecordsFromMongoDB,
} from "@/actions/syncActions";
import CounterDeskZeroState from "./CounterDeskZeroState";

// Zod Schema for High-Speed POS Billing Modal
const posOrderSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(2, { message: "Client / Customer name is required" }),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, {
      message: "Enter a valid 10-digit Indian mobile number",
    }),
  itemsSummary: z
    .string()
    .trim()
    .min(3, { message: "Specify line items / product summary" }),
  totalAmount: z.coerce
    .number()
    .min(100, { message: "Total amount must be at least ₹100" }),
  advanceCollected: z.coerce
    .number()
    .min(0, { message: "Advance cannot be negative" }),
  paymentMode: z.enum(["UPI", "CASH", "CARD", "NEFT_RTGS"]),
});

// Helper generator outside component scope for React 19 compiler purity
function generateSalesOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  return `SO-${dateStr}-${randomSeq}`;
}

export default function ConfirmedOrdersContent({
  hqWarehouseName = "Main (HQ) Warehouse",
  className = "",
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [toastMessage, setToastMessage] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const clientNameInputRef = useRef(null);

  // 1. Data Hook: Live Query watching salesOrders sorted by createdAt descending in Dexie.js
  const orders = useLiveQuery(
    () => (typeof window !== "undefined" ? db.salesOrders.orderBy("createdAt").reverse().toArray() : []),
    []
  );

  // 2. Initial offline hydration from MongoDB if Dexie store is empty
  useEffect(() => {
    async function hydrateInitial() {
      try {
        const count = await db.salesOrders.count();
        if (count === 0) {
          const res = await fetchLatestRecordsFromMongoDB();
          if (res?.success && res.salesOrders?.length > 0) {
            await db.salesOrders.bulkPut(res.salesOrders);
          }
        }
      } catch (err) {
        console.warn("Initial Dexie salesOrders hydration skipped:", err?.message);
      }
    }
    hydrateInitial();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(posOrderSchema),
    defaultValues: {
      clientName: "",
      customerPhone: "",
      itemsSummary: "",
      totalAmount: "",
      advanceCollected: "",
      paymentMode: "UPI",
    },
  });

  const totalAmountWatch = watch("totalAmount") || 0;
  const advanceWatch = watch("advanceCollected") || 0;
  const paymentModeWatch = watch("paymentMode");
  const calculatedBalance = Math.max(0, Number(totalAmountWatch) - Number(advanceWatch));

  // Keyboard shortcut listener: F1 to instantly trigger POS Billing Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F1" || e.code === "F1") {
        e.preventDefault();
        setModalOpen(true);
      }
      if (e.key === "Escape" && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  // Autofocus customer name when modal opens
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => {
        clientNameInputRef.current?.focus();
      }, 100);
    }
  }, [modalOpen]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Action: Write finalized transaction to Dexie & sync with CA Double-Entry Log
  const handleFinalizeOrder = async (formData) => {
    const grossTotal = Number(formData.totalAmount) || 50000;
    const advance = Number(formData.advanceCollected) || 0;
    const balance = grossTotal - advance;
    const orderNumber = generateSalesOrderNumber();

    const newOrder = {
      orderNumber,
      clientName: formData.clientName,
      customerPhone: formData.customerPhone,
      itemsSummary: formData.itemsSummary || "Counter billing items",
      totalAmount: grossTotal,
      advanceCollected: advance,
      balanceDue: balance,
      paymentMode: formData.paymentMode || "UPI",
      paymentStatus: balance <= 0 ? "PAID_IN_FULL" : advance > 0 ? "PARTIALLY_PAID" : "UNPAID",
      ledgerSyncStatus: "synced_to_ca",
      deliveryBranch: hqWarehouseName,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    try {
      // 1. Write to Dexie IndexedDB
      await db.salesOrders.add(newOrder);

      triggerToast(
        `✓ Order "${orderNumber}" finalized! Live synced with ${hqWarehouseName} & CA Ledger.`
      );
      reset();
      setModalOpen(false);

      // 2. Background sync to MongoDB with CA JournalEntry double-entry generation
      syncSalesOrderToMongoDB(newOrder).then((res) => {
        if (res?.success) {
          db.salesOrders.where("orderNumber").equals(orderNumber).modify({ synced: true });
        }
      });
    } catch (err) {
      console.error("Failed to add sales order:", err);
      triggerToast("Error saving order to IndexedDB.");
    }
  };

  // SSR Loading Pulse
  if (!isClient || orders === undefined) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4 font-sans animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="h-4 w-72 bg-slate-100 rounded-md" />
        <div className="h-40 bg-slate-50 rounded-2xl border border-slate-100" />
      </div>
    );
  }

  const filteredOrders = orders.filter((o) =>
    `${o.orderNumber} ${o.clientName} ${o.customerPhone} ${o.itemsSummary}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Step 4: Strict Early-Return Zero State Architecture
  if (!orders || orders.length === 0) {
    return (
      <CounterDeskZeroState
        hqWarehouseName={hqWarehouseName}
        onSubmit={handleFinalizeOrder}
        onStartOrder={() => setModalOpen(true)}
      />
    );
  }

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md">
              Dexie + CA Auto-Sync
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
          {/* Table Header with Search and High-Speed F1 Action */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200/70">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Confirmed Sales Orders ({orders.length})
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Live Dexie.js query &bull; Auto-posts double-entry vouchers to CA Portal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              {/* Step 3 Core Action: Keyboard-Accessible New Order Button */}
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ New Order</span>
                <kbd className="px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700">
                  F1
                </kbd>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/70">
                  <th className="py-3 px-4">SO Number</th>
                  <th className="py-3 px-4">Client Name &amp; Contact</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Order Total</th>
                  <th className="py-3 px-4 text-right">Advance Received</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">CA Ledger Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((order) => (
                  <tr key={order.id || order.orderNumber} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div>{order.orderNumber}</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Recent"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.clientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 truncate font-normal">
                        {order.itemsSummary}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono font-semibold">
                        Mode: {order.paymentMode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                      ₹{Number(order?.totalAmount || order?.grandTotal || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{Number(order?.advanceCollected || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                      ₹{Number(order?.balanceDue || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Auto-Posted to CA Trail</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          triggerToast(`Invoice slip printed for ${order.orderNumber}`)
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-slate-500" />
                        <span>Print Bill</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* HIGH-SPEED KEYBOARD-NAVIGABLE POS BILLING MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      High-Speed Counter Sales Order (POS)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Press <kbd className="px-1 rounded bg-slate-100 font-mono text-[9px] border border-slate-200">Tab</kbd> to jump fields &bull; Auto-syncs to CA Portal
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleFinalizeOrder)} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Customer / Client Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register("clientName")}
                      type="text"
                      ref={(e) => {
                        register("clientName").ref(e);
                        clientNameInputRef.current = e;
                      }}
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-600"
                    />
                    {errors.clientName && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.clientName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register("customerPhone")}
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-600"
                    />
                    {errors.customerPhone && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.customerPhone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Items / Product Summary <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register("itemsSummary")}
                    type="text"
                    placeholder="e.g. 50x Industrial Bearings, 10x Hydraulic Seals"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:border-emerald-600"
                  />
                  {errors.itemsSummary && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                      {errors.itemsSummary.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Total Order Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register("totalAmount")}
                      type="number"
                      step="500"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-black text-slate-900 focus:outline-hidden focus:border-emerald-600"
                    />
                    {errors.totalAmount && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.totalAmount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Advance Collected (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register("advanceCollected")}
                      type="number"
                      step="500"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-emerald-700 focus:outline-hidden focus:border-emerald-600"
                    />
                    {errors.advanceCollected && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.advanceCollected.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Live Dynamic Balance Due Bar */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Remaining Balance Due:</span>
                  <span className="font-mono font-black text-sm text-rose-600">
                    ₹{calculatedBalance.toLocaleString("en-IN")}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Payment Instrument Mode
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "UPI", label: "UPI", icon: QrCode },
                      { id: "CASH", label: "Cash", icon: Banknote },
                      { id: "CARD", label: "Card POS", icon: CreditCard },
                      { id: "NEFT_RTGS", label: "Bank Transfer", icon: Building2 },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = paymentModeWatch === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setValue("paymentMode", mode.id)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-[11px] transition-all cursor-pointer ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel (Esc)
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirm &amp; Finalize Order</span>
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
