"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Handshake,
  Store,
  ShieldCheck,
  Zap,
  Wifi,
  WifiOff,
  Sparkles,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { dexieDb } from "@/lib/dexieDb";
import CoordinatorLeadPoolTabs from "./CoordinatorLeadPoolTabs";
import CoordinatorDealsTabs from "./CoordinatorDealsTabs";
import CoordinatorCounterDeskTabs from "./CoordinatorCounterDeskTabs";

export default function CoordinatorWorkspace({
  coordinatorId = "coord_sys_01",
  coordinatorName = "Tier 2 Sales Coordinator",
  className = "",
}) {
  const [activeModule, setActiveModule] = useState("lead-pool"); // 'lead-pool' | 'deals' | 'counter-desk'
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // One-click helper to reset to strict zero state
  const resetToStrictZeroState = async () => {
    try {
      await dexieDb.leads.clear();
      await dexieDb.deals.clear();
      await dexieDb.salesOrders.clear();
      await dexieDb.dispatchLogs.clear();
      await dexieDb.tasks.clear();
    } catch (e) {
      console.error("Error clearing Dexie tables:", e);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* COORDINATOR WORKSPACE TOP IDENTITY BANNER */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Tier 2 Commercial &amp; Operations Control
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>Dexie Sync Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Offline (IndexedDB Active)</span>
                </>
              )}
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Sales Coordinator Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
            Lead pool delegation, high-margin estimate approvals, inventory stock reservations, and freight dispatch operations for Crown Ecosystems.
          </p>
        </div>

        {/* Quick Testing Controls (Strict Zero State Purge) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={resetToStrictZeroState}
            title="Reset Dexie tables to strict zero state"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear to Zero State</span>
          </button>
        </div>
      </div>

      {/* THREE SALES MODULE SWITCHER TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveModule("lead-pool")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
            activeModule === "lead-pool"
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Lead Pool &amp; Delegation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModule("deals")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
            activeModule === "deals"
              ? "bg-white text-purple-600 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>2. Deals &amp; Estimate Approvals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModule("counter-desk")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
            activeModule === "counter-desk"
              ? "bg-white text-emerald-600 shadow-xs border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>3. Counter Desk &amp; Fulfillment</span>
        </button>
      </div>

      {/* MODULE 1: LEAD POOL & DELEGATED TASKS */}
      {activeModule === "lead-pool" && (
        <CoordinatorLeadPoolTabs
          coordinatorId={coordinatorId}
          coordinatorName={coordinatorName}
        />
      )}

      {/* MODULE 2: DEALS & ESTIMATE APPROVALS */}
      {activeModule === "deals" && (
        <CoordinatorDealsTabs
          coordinatorId={coordinatorId}
          coordinatorName={coordinatorName}
        />
      )}

      {/* MODULE 3: COUNTER DESK & DISPATCH TRACKER */}
      {activeModule === "counter-desk" && (
        <CoordinatorCounterDeskTabs
          coordinatorId={coordinatorId}
          coordinatorName={coordinatorName}
        />
      )}
    </div>
  );
}
