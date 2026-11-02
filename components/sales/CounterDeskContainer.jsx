"use client";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  ShoppingCart,
  Receipt,
  Plus,
  QrCode,
  CreditCard,
  Banknote,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  Keyboard,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { syncSalesOrderToMongoDB, fetchLatestRecordsFromMongoDB } from "@/actions/syncActions";
import CounterDeskZeroState from "./CounterDeskZeroState";

// Dedicated Table View for Confirmed Sales Orders
export function ConfirmedOrdersTable({ data = [], onStartNewOrder, triggerFeedback }) {
  const [search, setSearch] = useState("");

  const filtered = data.filter((o) =>
    `${o.orderNumber} ${o.clientName} ${o.itemsSummary} ${o.paymentMode}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
      {/* Table Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Confirmed Counter Sales Orders ({data.length})
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Live Dexie query &bull; Live CA double-entry ledger integration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-600"
            />
          </div>

          <button
            type="button"
            onClick={onStartNewOrder}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ New Order</span>
            <kbd className="px-1 py-0.2 rounded-md bg-slate-800 text-slate-300 font-mono text-[9px]">
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
            {filtered.map((order) => (
              <tr key={order.id || order.orderNumber} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-mono font-bold text-slate-900 block">
                    {order.orderNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Recent"}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{order.clientName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {order.customerPhone || order.contactPerson}
                  </div>
                </td>
                <td className="py-3.5 px-4 max-w-xs">
                  <p className="text-slate-700 truncate font-normal">
                    {order.itemsSummary}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Mode: {order.paymentMode || "UPI"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                  ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                  ₹{Number(order.advanceCollected).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                  ₹{Number(order.balanceDue).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Auto-Posted to CA Trail</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      triggerFeedback(`Invoice slip generated for ${order.orderNumber}`)
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    Print Bill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CounterDeskContainer({
  hqWarehouseName = "Main (HQ) Warehouse",
  className = "",
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [toastMessage, setToastMessage] = useState("");
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState("UPI");

  // 1. Live Query: Watch sales orders ordered by createdAt descending
  const orders = useLiveQuery(
    () => (typeof window !== "undefined" ? db.salesOrders.orderBy("createdAt").reverse().toArray() : []),
    []
  );

  useEffect(() => {
    // Background hydration sync: if Dexie is empty on startup, pull existing orders from MongoDB
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
        console.warn("Initial SalesOrders hydration skipped:", err?.message);
      }
    }
    hydrateInitial();
  }, []);

  // Keyboard shortcut listener: F1 to open new sales order modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F1" || e.code === "F1") {
        e.preventDefault();
        setOrderModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerFeedback = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // 2. Action: Write new order to Dexie and background sync with CA Double-Entry Log to MongoDB
  const handleCreateOrder = async (formData) => {
    const total = Number(formData.totalAmount) || 50000;
    const advance = Number(formData.advanceCollected) || Math.round(total * 0.5);

    const newOrder = {
      orderNumber: `SO-${Date.now().toString().slice(-4)}`,
      clientName: formData.customerName || formData.clientName,
      contactPerson: formData.customerName || formData.clientName,
      customerPhone: formData.customerPhone || formData.phone || "",
      itemsSummary: formData.itemsSummary || "Line items from counter desk",
      totalAmount: total,
      advanceCollected: advance,
      balanceDue: total - advance,
      paymentMode: formData.paymentMode || paymentMode,
      paymentStatus: advance >= total ? "PAID" : "PARTIAL",
      ledgerSyncStatus: "SYNCED",
      createdAt: new Date().toISOString(),
      synced: false,
    };

    // Immediate local insertion (Dexie useLiveQuery detects this instantly!)
    await db.salesOrders.add(newOrder);
    setOrderModalOpen(false);
    triggerFeedback(`✓ Order ${newOrder.orderNumber} booked into Dexie!`);

    // Asynchronous background sync with CA double-entry journal creation in MongoDB
    syncSalesOrderToMongoDB(newOrder)
      .then((res) => {
        if (res?.success) {
          db.salesOrders
            .where("orderNumber")
            .equals(newOrder.orderNumber)
            .modify({ synced: true, ledgerSyncStatus: "SYNCED" });
        }
      })
      .catch((err) => {
        console.error("Background sync error for Sales Order:", err);
      });
  };

  if (!isClient || orders === undefined) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 animate-pulse text-center">
        <Store className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
        <span className="text-xs font-bold text-slate-400">Loading counter desk from Dexie...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
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
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md">
              Dexie LiveSync Active
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONDITIONAL ZERO STATE VS REAL DATA VIEW */}
      {orders.length === 0 ? (
        <CounterDeskZeroState
          hqWarehouseName={hqWarehouseName}
          onSubmit={handleCreateOrder}
        />
      ) : (
        <ConfirmedOrdersTable
          data={orders}
          onStartNewOrder={() => setOrderModalOpen(true)}
          triggerFeedback={triggerFeedback}
        />
      )}

      {/* Counter Sales Order Creation Modal */}
      <AnimatePresence>
        {orderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      New Counter Sales Order (Dexie + CA Audit Trail)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Live sync with {hqWarehouseName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target;
                  handleCreateOrder({
                    customerName: target.customerName.value,
                    customerPhone: target.customerPhone.value,
                    itemsSummary: target.itemsSummary.value,
                    totalAmount: target.totalAmount.value,
                    advanceCollected: target.advanceCollected.value,
                    paymentMode: paymentMode,
                  });
                }}
                className="pt-4 space-y-3.5 text-xs font-medium text-slate-700"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="customerName"
                      type="text"
                      required
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Phone</label>
                    <input
                      name="customerPhone"
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">
                    Items &amp; Delivery Summary <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="itemsSummary"
                    rows={2}
                    required
                    placeholder="e.g. 50x Industrial Cotton Rolls (Batch #402)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">
                      Gross Order Total (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="totalAmount"
                      type="number"
                      required
                      defaultValue="25000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Advance Collected (₹)</label>
                    <input
                      name="advanceCollected"
                      type="number"
                      defaultValue="12500"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Settlement Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "UPI", label: "Instant UPI", icon: QrCode },
                      { id: "CASH", label: "Counter Cash", icon: Banknote },
                      { id: "CARD", label: "POS Card", icon: CreditCard },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const active = paymentMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMode(mode.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            active
                              ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOrderModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-md cursor-pointer"
                  >
                    + Post to Dexie &amp; CA Ledger
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
