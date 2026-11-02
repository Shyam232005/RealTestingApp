"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  TrendingUp,
  MapPin,
  Users,
  Plus,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Target,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/dexieDb";
import { getRevenueMetrics } from "@/actions/analystActions";
import TerritoryForecast from "./TerritoryForecast";
import TeamLeaderboard from "./TeamLeaderboard";

const REVENUE_SUBVIEWS = [
  { id: "quota_actuals", label: "Quota vs. Actuals" },
  { id: "territory_forecast", label: "Territory Forecast" },
  { id: "team_leaderboard", label: "Team Leaderboard" },
];

/**
 * RevenueQuotaDashboard - Tier 3 Sales Ops Analyst View
 * Deduplicated single header block with right-aligned pill navigation.
 * Connected to MongoDB via Server Actions and local-first Dexie.js.
 */
export default function RevenueQuotaDashboard({
  activeSubView = "quota_actuals",
  onSubViewChange,
  employee,
  onBookOrder,
  className = "",
}) {
  const router = useRouter();
  const [selectedSubView, setSelectedSubView] = useState(null);
  const currentSubView = selectedSubView || activeSubView || "quota_actuals";
  const [serverMetrics, setServerMetrics] = useState(null);
  const [targetQuota] = useState(500000); // Benchmark target: ₹ 5,00,000 (5 Lakhs)

  // Step 2: Fetch Live MongoDB Aggregations via Server Action
  useEffect(() => {
    let isMounted = true;
    async function loadMetrics() {
      try {
        const res = await getRevenueMetrics();
        if (isMounted && res?.success) {
          setServerMetrics(res);
        }
      } catch (err) {
        console.error("Failed to fetch MongoDB revenue metrics:", err);
      }
    }
    loadMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Step 2: Live Dexie Queries for Local-First Reactivity
  const localSalesOrders = useLiveQuery(
    async () => {
      try {
        return await db.salesOrders.toArray();
      } catch (e) {
        return [];
      }
    },
    [],
    []
  );

  const localDeals = useLiveQuery(
    async () => {
      try {
        return await db.deals.toArray();
      } catch (e) {
        return [];
      }
    },
    [],
    []
  );

  const localLeads = useLiveQuery(
    async () => {
      try {
        return await db.leads.toArray();
      } catch (e) {
        return [];
      }
    },
    [],
    []
  );

  // Merge sources: Prioritize local reactive store when populated, fallback to server action
  const ordersList =
    localSalesOrders && localSalesOrders.length > 0
      ? localSalesOrders
      : serverMetrics?.salesOrders || [];

  const dealsList =
    localDeals && localDeals.length > 0
      ? localDeals
      : serverMetrics?.deals || [];

  const leadsList =
    localLeads && localLeads.length > 0
      ? localLeads
      : [];

  const handleTabChange = (tabId) => {
    setSelectedSubView(tabId);
    if (typeof onSubViewChange === "function") {
      onSubViewChange(tabId);
    }
  };

  const handleBookOrderNavigate = () => {
    if (typeof onBookOrder === "function") {
      onBookOrder();
    }
    router.push("/department/sales?tab=sales_orders");
  };

  // Calculations
  const bookedRevenue = ordersList.reduce(
    (sum, so) => sum + (Number(so?.grandTotal ?? so?.totalAmount ?? 0) || 0),
    0
  );

  const activePipelineValue = dealsList.reduce((sum, d) => {
    const stage = (d?.stage || "").toLowerCase();
    if (
      stage !== "won" &&
      stage !== "lost" &&
      stage !== "closed_won" &&
      stage !== "closed_lost"
    ) {
      return sum + (Number(d?.dealValue || d?.value || 0) || 0);
    }
    return sum;
  }, 0);

  const confirmedSalesOrdersCount = ordersList.length;
  const inboundLeadsCount =
    leadsList.filter(
      (l) =>
        (l?.status || "").toLowerCase() === "unassigned" ||
        (l?.status || "").toLowerCase() === "new"
    ).length || (serverMetrics?.inboundLeadsCount || 0);

  const attainmentPct =
    bookedRevenue > 0
      ? Math.min(100, (bookedRevenue / targetQuota) * 100).toFixed(1)
      : "0.0";

  return (
    <div className={`space-y-6 ${className}`}>
      {/* =========================================================================
          STEP 1: STRICTLY ONE DEDUPLICATED MODULE HEADER
          Title text on the left, pill menu aligned to the right. No other headers above or below.
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-200/60 shadow-2xs">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Revenue &amp; Quota Dashboard
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Analyze monthly sales quota attainment, regional pipeline demand, and AE leaderboards
            </p>
          </div>
        </div>

        {/* Pill Menu Sub-Navigation Aligned to the Right */}
        <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
          {REVENUE_SUBVIEWS.map((tab) => {
            const isActive = currentSubView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SUB-VIEW 1: QUOTA VS. ACTUALS
         ========================================================================= */}
      {currentSubView === "quota_actuals" && (
        <div className="space-y-6">
          {/* STEP 3: STRICT ZERO STATE IMPLEMENTATION (EXACT MATCH)
              Condition: salesOrders.length === 0 (or orders.length === 0) */}
          {ordersList.length === 0 ? (
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  No Confirmed Sales Orders Booked Yet.
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Revenue analytics and territory demand will calculate once the sales team books confirmed orders.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleBookOrderNavigate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Book First Sales Order</span>
                </button>
              </div>
            </div>
          ) : (
            /* Populated State with Live Aggregations */
            <div className="space-y-6">
              {/* 4 Real-Time KPI Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Widget 1: Booked Revenue */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Booked Revenue
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    ₹ {bookedRevenue.toLocaleString("en-IN")}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`text-[11px] font-bold ${
                        bookedRevenue > 0 ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {attainmentPct}% Quota Attainment
                    </span>
                  </div>
                </div>

                {/* Widget 2: Active Pipeline Value */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Active Pipeline Value
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    ₹ {activePipelineValue.toLocaleString("en-IN")}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[11px] font-bold text-purple-600">
                      {dealsList.filter((d) => {
                        const s = (d?.stage || "").toLowerCase();
                        return s !== "won" && s !== "lost";
                      }).length}{" "}
                      active deals in CRM
                    </span>
                  </div>
                </div>

                {/* Widget 3: Confirmed Sales Orders */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Confirmed Sales Orders
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {confirmedSalesOrdersCount}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`text-[11px] font-bold ${
                        confirmedSalesOrdersCount > 0
                          ? "text-blue-600"
                          : "text-slate-400"
                      }`}
                    >
                      {confirmedSalesOrdersCount > 0
                        ? "Booked for fulfillment"
                        : "Zero orders booked"}
                    </span>
                  </div>
                </div>

                {/* Widget 4: Inbound Leads Pool */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Inbound Leads Pool
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {inboundLeadsCount}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`text-[11px] font-bold ${
                        inboundLeadsCount > 0 ? "text-amber-600" : "text-slate-400"
                      }`}
                    >
                      {inboundLeadsCount > 0
                        ? "Prospect inquiries in queue"
                        : "Queue empty"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Quota Attainment Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Monthly Sales Quota Attainment
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Target: ₹ {targetQuota.toLocaleString("en-IN")} &bull; Branch Benchmark
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                    {attainmentPct}% Reached
                  </span>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">Branch Revenue Quota</span>
                      <span className="text-emerald-700 font-mono font-extrabold">
                        ₹ {bookedRevenue.toLocaleString("en-IN")} Booked
                      </span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(2, (bookedRevenue / targetQuota) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Remaining to Target
                      </span>
                      <span className="text-sm font-black font-mono text-slate-800">
                        ₹ {Math.max(0, targetQuota - bookedRevenue).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Average Order Value (AOV)
                      </span>
                      <span className="text-sm font-black font-mono text-slate-800">
                        ₹ {Math.round(bookedRevenue / (ordersList.length || 1)).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Pacing Status
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-600">
                        {bookedRevenue >= targetQuota
                          ? "Quota Achieved (100%+)"
                          : "Active Run Rate"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 2: TERRITORY FORECAST
         ========================================================================= */}
      {currentSubView === "territory_forecast" && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Territory Demand &amp; Forecast
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Expected sales volume across regional accounts and branch territories.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">
              {dealsList.length} Accounts Tracked
            </div>
          </div>

          <TerritoryForecast deals={dealsList} />
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 3: TEAM LEADERBOARD
         ========================================================================= */}
      {currentSubView === "team_leaderboard" && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                AE &amp; SDR Performance Leaderboard
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rankings driven by closed-won revenue and active CRM deal volume.
              </p>
            </div>
          </div>

          <TeamLeaderboard
            salesOrders={ordersList}
            deals={dealsList}
            employee={employee}
          />
        </div>
      )}
    </div>
  );
}
