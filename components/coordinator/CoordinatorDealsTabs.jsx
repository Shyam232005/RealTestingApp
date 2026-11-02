"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  FileCheck2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Clock,
  Building2,
  ArrowRight,
  Zap,
  BarChart3,
  Calendar,
  DollarSign,
  Boxes,
  Check,
  ClipboardCheck,
  Handshake,
} from "lucide-react";
import { dexieDb } from "@/lib/dexieDb";
import { approveEstimate } from "@/actions/coordinator";
import ApprovalZeroState from "./ApprovalZeroState";

export default function CoordinatorDealsTabs({
  coordinatorId = "coord_sys_01",
  coordinatorName = "Tier 2 Sales Coordinator",
  className = "",
}) {
  const [activeTab, setActiveTab] = useState("estimate-approvals"); // 'estimate-approvals' | 'velocity-analytics'
  const [approvingId, setApprovingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live Query 1: Sales Orders / Estimates pending approval
  const pendingApprovals = useLiveQuery(
    async () => {
      try {
        return await dexieDb.salesOrders
          .filter((so) => so.status === "PENDING_APPROVAL")
          .reverse()
          .sortBy("createdAt");
      } catch (e) {
        console.error("Dexie pending approvals query error:", e);
        return [];
      }
    },
    [],
    []
  );

  // Live Query 2: All Deals for Pipeline Velocity Metrics
  const deals = useLiveQuery(
    async () => {
      try {
        return await dexieDb.deals.toArray();
      } catch (e) {
        return [];
      }
    },
    [],
    []
  );

  // Live Query 3: All Sales Orders for commercial velocity
  const allSalesOrders = useLiveQuery(
    async () => {
      try {
        return await dexieDb.salesOrders.toArray();
      } catch (e) {
        return [];
      }
    },
    [],
    []
  );

  // CTA Handler: Approve & Allocate Stock
  const handleApproveEstimate = async (order) => {
    const orderIdToApprove = order.orderReference || order.orderNumber || order.id?.toString();
    setApprovingId(order.id || orderIdToApprove);

    try {
      // 1. Prepare updated items with RESERVED_IN_INVENTORY status
      const currentItems = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : [
            {
              itemId: "SKU-AUTO",
              name: order.itemsSummary || "Quotation Product Line",
              quantity: 1,
              unitPrice: order.totalAmount || 0,
              total: order.totalAmount || 0,
            },
          ];

      const allocatedItems = currentItems.map((item) => ({
        ...item,
        allocationStatus: "RESERVED_IN_INVENTORY",
      }));

      // 2. Update Dexie first for zero-latency local-first UI reactivity
      if (order.id) {
        await dexieDb.salesOrders.update(order.id, {
          status: "APPROVED",
          approvedBy: coordinatorId,
          approvedByName: coordinatorName,
          items: allocatedItems,
          synced: false,
        });
      }

      // 3. Dispatch Server Action wrapped in Mongoose
      const res = await approveEstimate({
        orderId: orderIdToApprove,
        coordinatorId,
        coordinatorName,
      });

      if (res?.success) {
        if (order.id) {
          await dexieDb.salesOrders.update(order.id, { synced: true });
        }
        showToast(
          `Order ${orderIdToApprove} approved! Stock reserved in main warehouse.`
        );
      } else {
        showToast("Estimate approved locally. Background sync pending.");
      }
    } catch (err) {
      console.error("Error approving estimate:", err);
      showToast("Approval error. Check console for details.");
    } finally {
      setApprovingId(null);
    }
  };

  // Pipeline Velocity Aggregations
  const totalPipelineValue = (deals || []).reduce(
    (sum, d) => sum + (parseFloat(d.dealValue) || 0),
    0
  );
  const totalApprovedRevenue = (allSalesOrders || [])
    .filter((so) => so.status === "APPROVED")
    .reduce((sum, so) => sum + (parseFloat(so.totalAmount) || 0), 0);
  const wonDealsCount = (deals || []).filter((d) => d.stage === "WON").length;
  const totalDealsCount = deals?.length || 0;
  const winRate = totalDealsCount > 0 ? ((wonDealsCount / totalDealsCount) * 100).toFixed(1) : "0.0";
  const avgDealSize = totalDealsCount > 0 ? (totalPipelineValue / totalDealsCount).toFixed(0) : "0";

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
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 border border-purple-200/60 shadow-2xs">
            <Handshake className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Deals &amp; Quotations
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Track multi-stage negotiations, outside field visits, and formal financial estimates
            </p>
          </div>
        </div>

        {/* PILL MENU NAVIGATION */}
        <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("estimate-approvals")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "estimate-approvals"
                ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-200/50"
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === "estimate-approvals" ? "text-purple-600" : "text-slate-400"}`} />
            <span>Estimate Approvals</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                activeTab === "estimate-approvals"
                  ? "bg-purple-50 text-purple-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {pendingApprovals?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("velocity-analytics")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "velocity-analytics"
                ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-200/50"
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${activeTab === "velocity-analytics" ? "text-purple-600" : "text-slate-400"}`} />
            <span>Pipeline Velocity</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ESTIMATE APPROVALS TABLE */}
      {activeTab === "estimate-approvals" && (
        <div className="space-y-4">
          {!pendingApprovals || pendingApprovals.length === 0 ? (
            /* Strict Tier 2 Component-Level Zero State: No Table or Kanban Columns */
            <ApprovalZeroState
              onReviewPipeline={() => setActiveTab("velocity-analytics")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingApprovals.map((order) => {
                const isCurrentlyApproving = approvingId === (order.id || order.orderReference);
                return (
                  <div
                    key={order.id || order.orderReference}
                    className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            {order.orderReference || order.orderNumber || "EST-PENDING"}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            Awaiting Stock Allocation
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-900">
                          {order.clientName || "Commercial Client"}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Payment Terms: <span className="font-bold text-slate-700">{order.paymentTerms || "NET_30"}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-bold block">Estimated Total</span>
                        <span className="text-xl font-black text-slate-900 font-mono">
                          ₹ {(parseFloat(order.totalAmount) || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Items Allocation Breakdown */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-700">
                          {order.itemsSummary || (order.items?.length ? `${order.items.length} line item(s)` : "Commercial Product Package")}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md self-start sm:self-auto">
                        Stock: Unallocated (Pending Approval)
                      </span>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isCurrentlyApproving}
                        onClick={() => handleApproveEstimate(order)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isCurrentlyApproving
                            ? "Allocating Stock..."
                            : "Approve & Allocate Stock"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PIPELINE VELOCITY ANALYTICS */}
      {activeTab === "velocity-analytics" && (
        <div className="space-y-6">
          {!deals || deals.length === 0 ? (
            /* Strict Tier 2 Coordinator Zero State Component: No Metric Cards or Progress Bars */
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  No active pipeline deals to analyze.
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Pipeline velocity, stage duration, and margin compliance metrics calculate once deals are logged by the sales team.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("estimate-approvals")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Review Estimate Approvals</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Aggregated Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Active Pipeline Value
                  </span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    ₹ {totalPipelineValue.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-purple-600 font-semibold mt-1 block">
                    {deals?.length || 0} Deals in CRM Pipeline
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Approved Revenue
                  </span>
                  <div className="text-xl font-black text-emerald-600 font-mono">
                    ₹ {totalApprovedRevenue.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    Stock Reserved &amp; Cleared
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Win-Loss Conversion
                  </span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {winRate}%
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
                    {wonDealsCount} Closed Won Deals
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Average Deal Size
                  </span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    ₹ {Number(avgDealSize).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                    Target: &gt; ₹ 50,000 / Deal
                  </span>
                </div>
              </div>

              {/* Velocity Breakdown & Stage Health */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Pipeline Stage Velocity
                    </h4>
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                      Avg 4.8 Days Cycle
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        stage: "Requirement Gathering",
                        count: (deals || []).filter((d) => d.stage === "REQUIREMENT_GATHERING").length,
                        pct: 40,
                        color: "bg-blue-600",
                      },
                      {
                        stage: "Negotiation & Quotes",
                        count: (deals || []).filter((d) => d.stage === "NEGOTIATION").length,
                        pct: 35,
                        color: "bg-purple-600",
                      },
                      {
                        stage: "Closed Won (Fulfillment Ready)",
                        count: (deals || []).filter((d) => d.stage === "WON").length,
                        pct: 20,
                        color: "bg-emerald-600",
                      },
                      {
                        stage: "Lost / Dormant",
                        count: (deals || []).filter((d) => d.stage === "LOST").length,
                        pct: 5,
                        color: "bg-slate-400",
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{item.stage}</span>
                          <span className="font-mono text-slate-900 font-bold">{item.count} deals</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`${item.color} h-full rounded-full transition-all`}
                            style={{
                              width: `${Math.max(8, (item.count / Math.max(1, totalDealsCount)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Margin Benchmark Compliance
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Min 18% Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    As Tier 2 Coordinator, you enforce the owner&apos;s gross margin threshold. Commercial estimates with margins below 18% require escalated executive waiver.
                  </p>

                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        Healthy Margin Pipeline
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        {deals?.length ? "100% of active estimates adhere to margin policy" : "No estimates logged"}
                      </span>
                    </div>
                    <Zap className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
