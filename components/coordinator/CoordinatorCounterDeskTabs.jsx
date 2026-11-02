"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Store,
  Truck,
  Receipt,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  X,
  Send,
  Building2,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  PackageCheck,
} from "lucide-react";
import { dexieDb } from "@/lib/dexieDb";
import { createDispatchLog, createDelegatedTask } from "@/actions/coordinator";
import DispatchZeroState from "./DispatchZeroState";
import ReceivablesContent from "./ReceivablesContent";

// Zod Validation Schema for Dispatch Log
const dispatchLogFormSchema = z.object({
  orderId: z.string().min(2, "Sales Order reference or ID is required"),
  shippingProvider: z.string().min(2, "Shipping provider or carrier name is required"),
  trackingNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
  scheduledDispatchDate: z.string().min(1, "Scheduled dispatch date is required"),
  dispatchStatus: z.enum(["PENDING_PICKUP", "DISPATCHED"]),
  dispatchNotes: z.string().optional(),
});

function generateDispatchIdentifier() {
  return "DISP-" + Math.floor(1000 + Math.random() * 9000);
}

function generateRandomTrackingNumber() {
  return `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
}

function generateRandomTaskId() {
  return "TSK-" + Math.floor(1000 + Math.random() * 9000);
}

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function CoordinatorCounterDeskTabs({
  coordinatorId = "coord_sys_01",
  coordinatorName = "Tier 2 Sales Coordinator",
  className = "",
}) {
  const [activeTab, setActiveTab] = useState("receivables-collections"); // 'receivables-collections' | 'dispatch-fulfillment'
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live Query 1: Receivables & Collections (Confirmed orders with pending balance or payment)
  const pendingReceivables = useLiveQuery(
    async () => {
      try {
        return await dexieDb.salesOrders
          .filter(
            (so) =>
              so.paymentStatus !== "PAID" &&
              (so.status === "APPROVED" || so.status === "CONFIRMED" || !so.status)
          )
          .reverse()
          .sortBy("createdAt");
      } catch (e) {
        console.error("Dexie receivables query error:", e);
        return [];
      }
    },
    [],
    []
  );

  // Live Query 2: Dispatch & Fulfillment Tracker ordered by scheduled dispatch date
  const pendingDispatch = useLiveQuery(
    async () => {
      try {
        return await dexieDb.dispatchLogs
          .orderBy("scheduledDispatchDate")
          .toArray();
      } catch (e) {
        console.error("Dexie dispatch logs query error:", e);
        return [];
      }
    },
    [],
    []
  );
  const dispatchLogs = pendingDispatch || [];

  // React Hook Form for Create Dispatch Log Modal
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(dispatchLogFormSchema),
    defaultValues: {
      orderId: "",
      shippingProvider: "VRL Logistics Express",
      trackingNumber: "",
      vehicleNumber: "",
      scheduledDispatchDate: "",
      dispatchStatus: "PENDING_PICKUP",
      dispatchNotes: "Fragile industrial items. Handle with care.",
    },
  });

  const onSubmitDispatchLog = async (data) => {
    setIsSubmitting(true);
    try {
      const dispatchId = generateDispatchIdentifier();
      const localLog = {
        dispatchId,
        orderId: data.orderId,
        orderReference: data.orderId,
        coordinatorId,
        coordinatorName,
        shippingProvider: data.shippingProvider,
        trackingNumber: data.trackingNumber || generateRandomTrackingNumber(),
        vehicleNumber: data.vehicleNumber || "MH-12-TX-8921",
        scheduledDispatchDate: new Date(data.scheduledDispatchDate).toISOString(),
        dispatchStatus: data.dispatchStatus,
        dispatchNotes: data.dispatchNotes || "",
        createdAt: new Date().toISOString(),
        synced: false,
      };

      // 1. Write to Dexie immediately
      await dexieDb.dispatchLogs.add(localLog);

      // 2. Dispatch Server Action
      const res = await createDispatchLog({
        orderId: data.orderId,
        orderReference: data.orderId,
        coordinatorId,
        coordinatorName,
        shippingProvider: data.shippingProvider,
        trackingNumber: localLog.trackingNumber,
        vehicleNumber: localLog.vehicleNumber,
        scheduledDispatchDate: data.scheduledDispatchDate,
        dispatchStatus: data.dispatchStatus,
        dispatchNotes: data.dispatchNotes,
      });

      if (res?.success) {
        await dexieDb.dispatchLogs
          .where("dispatchId")
          .equals(dispatchId)
          .modify({ synced: true });
        showToast(`Dispatch log created for ${data.orderId}!`);
      } else {
        showToast("Dispatch log recorded locally. Background sync queued.");
      }

      reset();
      setIsDispatchModalOpen(false);
    } catch (err) {
      console.error("Failed to create dispatch log:", err);
      showToast("Error creating dispatch log. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Action: Delegate Payment Follow-up task for an overdue receivable
  const handleQuickPaymentFollowup = async (order) => {
    try {
      const taskPayload = {
        assignedBy: coordinatorId,
        assignedByName: coordinatorName,
        assignedToName: "Tier 1 Sales Assistant",
        customerId: order.orderReference || order.clientName,
        customerName: order.clientName,
        taskType: "PAYMENT_FOLLOWUP",
        priority: "HIGH",
        status: "OPEN",
        description: `Follow up with ${order.clientName} for pending balance of ₹ ${(
          order.balanceDue || order.totalAmount || 0
        ).toLocaleString()} (Terms: ${order.paymentTerms || "NET_30"}).`,
        dueDate: getTomorrowDateString(),
      };

      await dexieDb.tasks.add({
        ...taskPayload,
        taskId: generateRandomTaskId(),
        createdAt: new Date().toISOString(),
      });

      await createDelegatedTask(taskPayload);
      showToast(`Payment follow-up task delegated to Assistant for ${order.clientName}!`);
    } catch (e) {
      console.error("Error creating quick payment task:", e);
      showToast("Failed to create payment follow-up task.");
    }
  };

  const handleToggleDispatchStatus = async (log) => {
    const nextStatus = log.dispatchStatus === "PENDING_PICKUP" ? "DISPATCHED" : "PENDING_PICKUP";
    try {
      if (log.id) {
        await dexieDb.dispatchLogs.update(log.id, {
          dispatchStatus: nextStatus,
          actualDispatchDate: nextStatus === "DISPATCHED" ? new Date().toISOString() : null,
        });
        showToast(`Dispatch status updated to ${nextStatus}`);
      }
    } catch (e) {
      console.error("Error updating dispatch status:", e);
    }
  };

  // Summary Metrics with strict NaN prevention
  const totalOutstanding = (pendingReceivables || []).reduce(
    (sum, o) =>
      sum +
      (Number(o?.balanceDue ?? o?.grandTotal ?? o?.totalAmount ?? 0) || 0),
    0
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODULE HEADER & SUB-NAVIGATION PILLS */}
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
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("receivables-collections")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "receivables-collections"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-200/50"
              }`}
            >
              <Receipt className={`w-3.5 h-3.5 ${activeTab === "receivables-collections" ? "text-emerald-600" : "text-slate-400"}`} />
              <span>Receivables &amp; Collections</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                  activeTab === "receivables-collections"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {pendingReceivables?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dispatch-fulfillment")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "dispatch-fulfillment"
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-200/50"
              }`}
            >
              <Truck className={`w-3.5 h-3.5 ${activeTab === "dispatch-fulfillment" ? "text-emerald-600" : "text-slate-400"}`} />
              <span>Dispatch &amp; Fulfillment</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                  activeTab === "dispatch-fulfillment"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {dispatchLogs?.length || 0}
              </span>
            </button>
          </div>

          {activeTab === "dispatch-fulfillment" && (
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Dispatch Log</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: RECEIVABLES & COLLECTIONS */}
      {activeTab === "receivables-collections" && (
        <ReceivablesContent
          orders={pendingReceivables}
          onCreateDispatch={() => {
            setActiveTab("dispatch-fulfillment");
            setIsDispatchModalOpen(true);
          }}
          onFollowup={handleQuickPaymentFollowup}
        />
      )}

      {/* TAB 2: DISPATCH & FULFILLMENT TRACKER */}
      {activeTab === "dispatch-fulfillment" && (
        <div className="space-y-4">
          {!pendingDispatch || pendingDispatch.length === 0 ? (
            /* Strict Tier 2 Coordinator Zero State Component: No Table or Thead */
            <DispatchZeroState
              onCreateDispatchLog={() => setIsDispatchModalOpen(true)}
            />
          ) : (
            <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Order Reference</th>
                      <th className="px-5 py-3.5">Carrier / Provider</th>
                      <th className="px-5 py-3.5">Tracking &amp; Vehicle</th>
                      <th className="px-5 py-3.5">Scheduled Date</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Notes</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dispatchLogs.map((log) => (
                      <tr key={log.id || log.dispatchId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-slate-900 block text-xs">
                            {log.orderReference || log.orderId || "SO-REF"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            By: {log.coordinatorName || coordinatorName}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                            <Truck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{log.shippingProvider}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono font-semibold text-slate-700 block">
                            {log.trackingNumber || "Pending AWBL"}
                          </span>
                          {log.vehicleNumber && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Veh: {log.vehicleNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {log.scheduledDispatchDate
                                ? new Date(log.scheduledDispatchDate).toLocaleDateString()
                                : "Today"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              log.dispatchStatus === "DISPATCHED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {log.dispatchStatus === "DISPATCHED" ? "Dispatched" : "Pending Pickup"}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-xs text-slate-600 text-[11px] truncate">
                          {log.dispatchNotes || "Standard fulfillment"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleDispatchStatus(log)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              log.dispatchStatus === "PENDING_PICKUP"
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                            }`}
                          >
                            <PackageCheck className="w-3 h-3" />
                            <span>
                              {log.dispatchStatus === "PENDING_PICKUP"
                                ? "Mark Dispatched"
                                : "Revert Pickup"}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE DISPATCH LOG */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Schedule Freight Dispatch Log
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Allocate transport carrier &amp; generate tracking details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitDispatchLog)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Sales Order / Reference <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("orderId")}
                    placeholder="e.g. SO-9841"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                  />
                  {errors.orderId && (
                    <span className="text-[10px] text-rose-500 mt-1 block">
                      {errors.orderId.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Carrier / Provider <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("shippingProvider")}
                    placeholder="e.g. VRL Logistics, Bluedart"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                  />
                  {errors.shippingProvider && (
                    <span className="text-[10px] text-rose-500 mt-1 block">
                      {errors.shippingProvider.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tracking / Docket Number
                  </label>
                  <input
                    type="text"
                    {...register("trackingNumber")}
                    placeholder="e.g. VRL-99210-BLR"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Vehicle / Truck Number
                  </label>
                  <input
                    type="text"
                    {...register("vehicleNumber")}
                    placeholder="e.g. KA-01-AB-1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Scheduled Dispatch Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("scheduledDispatchDate")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                  />
                  {errors.scheduledDispatchDate && (
                    <span className="text-[10px] text-rose-500 mt-1 block">
                      {errors.scheduledDispatchDate.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Dispatch Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("dispatchStatus")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600"
                  >
                    <option value="PENDING_PICKUP">Pending Pickup (At Warehouse)</option>
                    <option value="DISPATCHED">Dispatched (In Transit)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dispatch Notes &amp; Packaging Instructions
                </label>
                <textarea
                  rows={2}
                  {...register("dispatchNotes")}
                  placeholder="e.g. Palletized packing verified; delivery challan #491 attached..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-hidden focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Scheduling..." : "Schedule Dispatch"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
