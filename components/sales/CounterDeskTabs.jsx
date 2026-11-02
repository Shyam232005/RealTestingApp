"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  ShoppingCart,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Receipt,
  Building2,
  User,
  Phone,
  QrCode,
  CreditCard,
  Banknote,
  Search,
  Filter,
  PackageCheck,
  Truck,
  Sparkles,
  Zap,
  X,
  Keyboard,
  ShieldCheck,
} from "lucide-react";
import { useSalesFlow } from "@/context/SalesFlowContext";
import CounterDeskZeroState from "./CounterDeskZeroState";
import CounterDeskContainer from "./CounterDeskContainer";
import ConfirmedOrdersContent from "./ConfirmedOrdersContent";

// Subcomponent: Create Sales Order Modal with uncontrolled initialization (React 19 compliant)
function CreateSalesOrderModal({ isOpen, onClose, initialData, hqWarehouseName, onSubmit }) {
  const [soForm, setSoForm] = useState(() => ({
    clientName: initialData?.clientName || "",
    contactPerson: initialData?.contactPerson || initialData?.clientName || "",
    phone: initialData?.phone || "",
    itemsSummary: initialData?.itemsSummary || "Line items from formal quotation",
    totalAmount: initialData?.totalAmount || 100000,
    advanceCollected:
      initialData?.advanceCollected || Math.round((initialData?.totalAmount || 100000) * 0.5),
    paymentTerms: initialData?.paymentTerms || "50% Advance with PO",
    paymentMode: "UPI",
    deliveryBranch: hqWarehouseName || "Main HQ Warehouse",
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(soForm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {initialData
                  ? "Execute Sales Order from Quotation"
                  : "Counter Sales Order (SO)"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {initialData
                  ? `Auto-transferred from Quote ${initialData.quoteNumber || ""}`
                  : `Instant billing & live sync with ${hqWarehouseName}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Client Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={soForm.clientName}
                onChange={(e) => setSoForm({ ...soForm, clientName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={soForm.phone}
                onChange={(e) => setSoForm({ ...soForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Items &amp; Delivery Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={soForm.itemsSummary}
              onChange={(e) => setSoForm({ ...soForm, itemsSummary: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Gross Order Total (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={soForm.totalAmount}
                onChange={(e) => setSoForm({ ...soForm, totalAmount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Advance Collected (₹)
              </label>
              <input
                type="number"
                value={soForm.advanceCollected}
                onChange={(e) =>
                  setSoForm({ ...soForm, advanceCollected: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Settlement Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "UPI", label: "Instant UPI", icon: QrCode },
                { id: "CASH", label: "Counter Cash", icon: Banknote },
                { id: "CARD", label: "POS Card", icon: CreditCard },
              ].map((mode) => {
                const Icon = mode.icon;
                const active = soForm.paymentMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSoForm({ ...soForm, paymentMode: mode.id })}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? "text-emerald-600" : "text-slate-400"
                      }`}
                    />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>Post to Ledger &amp; Dispatch Order</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function CounterDeskTabs({
  hqWarehouseName = "Main (HQ) Warehouse",
  paramKey = "tab",
  className = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    salesOrders,
    clientMaster,
    fulfillmentOrders,
    stagedQuoteForOrder,
    soModalOpen,
    setSoModalOpen,
    createSalesOrder,
    triggerToast,
  } = useSalesFlow();

  // URL Query Param state management
  const currentTabFromUrl =
    searchParams?.get(paramKey) || searchParams?.get("counterSubtab") || "confirmed-so";

  const activeTab = ["confirmed-so", "client-master", "live-fulfillment"].includes(
    currentTabFromUrl
  )
    ? currentTabFromUrl
    : "confirmed-so";

  const handleTabChange = (newTab) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set(paramKey, newTab);
    params.set("counterSubtab", newTab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Global F1 Keyboard shortcut to trigger quick sales order modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F1" || e.code === "F1") {
        e.preventDefault();
        setSoModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSoModalOpen]);

  // Search filter for Client Master
  const [clientSearch, setClientSearch] = useState("");
  const filteredClients = clientMaster.filter((c) =>
    `${c.clientName} ${c.contactPerson} ${c.gstin} ${c.city}`
      .toLowerCase()
      .includes(clientSearch.toLowerCase())
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* MODULE HEADER WITH PILL-MENU SUB-NAVIGATION ON THE RIGHT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-200/60 shadow-2xs">
            <Store className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Sales Orders &amp; Counter Desk
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Real-time billing, master client registry, and warehouse fulfillment synchronization
            </p>
          </div>
        </div>

        {/* PILL MENU NAVIGATION */}
        <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            {
              id: "confirmed-so",
              label: "Confirmed Sales Orders (SO)",
              icon: ShoppingCart,
              badge: salesOrders.length,
            },
            {
              id: "client-master",
              label: "Client Master Directory",
              icon: Users,
              badge: clientMaster.length,
            },
            {
              id: "live-fulfillment",
              label: "Live Order Fulfillment Status",
              icon: PackageCheck,
              badge: fulfillmentOrders.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-200/50"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-mono"
                      : "bg-slate-200 text-slate-600 font-mono"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: CONFIRMED SALES ORDERS (REAL-TIME DEXIE + CA DOUBLE-ENTRY AUDIT)
         ========================================================================= */}
      {activeTab === "confirmed-so" && (
        <ConfirmedOrdersContent hqWarehouseName={hqWarehouseName} />
      )}

      {/* =========================================================================
          TAB 2: CLIENT MASTER DIRECTORY (CENTRALIZED CRM TABLE)
         ========================================================================= */}
      {activeTab === "client-master" && (
        <div className="space-y-4">
          {!clientMaster || clientMaster.length === 0 ? (
            /* Strict Component-Level Zero State: No Banner, Search, Table, or Thead */
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  No registered clients in master directory.
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Clients are automatically created and registered here when a deal is closed won or when an order is booked at the counter.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Book First Counter Order</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-blue-950">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>
                    Centralized CRM Registry &bull; Automatically Synced when a Deal is Won
                  </span>
                </div>
                <span className="text-[11px] text-blue-700 font-mono">
                  Total Clients: {clientMaster.length}
                </span>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search clients by company name, contact, city, or GSTIN..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/70">
                        <th className="py-3 px-4">Client ID</th>
                        <th className="py-3 px-4">Company Name</th>
                        <th className="py-3 px-4">Contact Person</th>
                        <th className="py-3 px-4">Location / City</th>
                        <th className="py-3 px-4">GSTIN</th>
                        <th className="py-3 px-4 text-right">Lifetime Value</th>
                        <th className="py-3 px-4">Registration Origin</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {client.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{client.clientName}</div>
                            <div className="text-[10px] text-slate-400">{client.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-semibold">{client.contactPerson}</div>
                            <div className="font-mono text-[11px] text-blue-600">{client.phone}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {client.city}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            {client.gstin}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                            ₹{Number(client.lifetimeValue || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                              {client.registeredVia || "Won Deal Sync"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSoForm((prev) => ({
                                  ...prev,
                                  clientName: client.clientName,
                                  contactPerson: client.contactPerson,
                                  phone: client.phone,
                                }));
                                setSoModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all cursor-pointer"
                            >
                              Book Order
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredClients.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-xs font-semibold">
                            No clients matching &quot;{clientSearch}&quot;
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: LIVE ORDER FULFILLMENT STATUS (WAREHOUSE TIMELINE TRACKER)
         ========================================================================= */}
      {activeTab === "live-fulfillment" && (
        <div className="space-y-4">
          {!fulfillmentOrders || fulfillmentOrders.length === 0 ? (
            /* Strict Component-Level Zero State: No Stepper or Telemetry Banner */
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-teal-600 flex items-center justify-center mx-auto shadow-xs">
                <PackageCheck className="w-8 h-8 text-teal-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  No active warehouse dispatches or fulfillment trackers.
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Warehouse pack-and-ship pipelines activate automatically once sales orders are confirmed and posted to the ledger.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("confirmed-so")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ View Sales Orders</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-teal-950">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-teal-600" />
                  <span>Live Warehouse Clearance &amp; Logistics Dispatch Stepper</span>
                </div>
                <span className="text-[11px] text-teal-700 font-mono">
                  Live Godown Telemetry &bull; Sub-45ms Sync
                </span>
              </div>

              <div className="space-y-4">
                {fulfillmentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900">
                            {order.soId} &bull; {order.id}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {order.trackingNumber}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mt-0.5">
                          {order.clientName}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{order.itemsSummary}</p>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[11px] font-bold text-slate-400 block uppercase">
                          Dispatch Warehouse Hub
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {order.warehouseHub}
                        </span>
                        <span className="text-[10px] text-teal-600 font-bold block mt-0.5">
                          ETA: {order.estimatedDispatch}
                        </span>
                      </div>
                    </div>

                    {/* 4-Stage Stepper Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {order.timeline.map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            step.completed
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                              : "bg-slate-50/80 border-slate-200/80 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              Step 0{idx + 1}
                            </span>
                            {step.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                            )}
                          </div>

                          <h5 className="text-xs font-black leading-tight mb-1">
                            {step.step}
                          </h5>
                          <span className="text-[10px] font-mono font-bold block text-slate-500 mb-1">
                            {step.time}
                          </span>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                            {step.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE SALES ORDER MODAL (AUTO-PREFILLED ON STAGED QUOTE) */}
      <AnimatePresence>
        {soModalOpen && (
          <CreateSalesOrderModal
            key={stagedQuoteForOrder?.quoteNumber || "manual-so"}
            isOpen={soModalOpen}
            onClose={() => setSoModalOpen(false)}
            initialData={stagedQuoteForOrder}
            hqWarehouseName={hqWarehouseName}
            onSubmit={(formData) => {
              createSalesOrder(formData);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
