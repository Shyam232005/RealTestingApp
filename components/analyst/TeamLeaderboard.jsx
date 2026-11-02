"use client";

import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Users, Award, TrendingUp, DollarSign } from "lucide-react";
import { dexieDb } from "@/lib/dexieDb";

/**
 * TeamLeaderboard - Analyst Performance Leaderboard Component
 * Strict Root-Cause Architecture:
 * - Direct LiveQuery over Dexie salesOrders and deals
 * - Early return zero state when empty
 * - Pure dynamic data.map() loop with ZERO hardcoded cards or static 'User B' entries
 */
export default function TeamLeaderboard({
  salesOrders: propOrders,
  deals: propDeals,
  employee,
  className = "",
}) {
  const liveOrders = useLiveQuery(
    async () => {
      try {
        return await dexieDb.salesOrders.toArray();
      } catch (e) {
        console.error("Dexie leaderboard orders query error:", e);
        return [];
      }
    },
    [],
    []
  );

  const liveDeals = useLiveQuery(
    async () => {
      try {
        return await dexieDb.deals.toArray();
      } catch (e) {
        console.error("Dexie leaderboard deals query error:", e);
        return [];
      }
    },
    [],
    []
  );

  const orders = propOrders !== undefined ? propOrders : liveOrders || [];
  const deals = propDeals !== undefined ? propDeals : liveDeals || [];

  // Step 4: Strict Early-Return Zero State Architecture
  if (orders.length === 0 && deals.length === 0) {
    return (
      <div className={`p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3 ${className}`}>
        <Users className="w-12 h-12 mx-auto text-slate-300" />
        <div>
          <p className="text-sm font-black text-slate-800">
            Leaderboard Standing By
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Account Executives and sales team members will be ranked here as confirmed sales orders and closed deals are recorded.
          </p>
        </div>
      </div>
    );
  }

  // Dynamically compute aggregate rankings by representative
  const repMap = new Map();

  // Aggregate from confirmed sales orders
  orders.forEach((order) => {
    const repName =
      order.salesRepName ||
      order.salesRep ||
      order.approvedByName ||
      order.createdBy ||
      (employee?.name ? `${employee.name}` : "Sales Associate");

    if (!repMap.has(repName)) {
      repMap.set(repName, {
        name: repName,
        role: "Account Executive",
        ordersCount: 0,
        dealsCount: 0,
        totalBooked: 0,
      });
    }

    const current = repMap.get(repName);
    current.ordersCount += 1;
    current.totalBooked += Number(order.grandTotal || order.totalAmount || 0);
  });

  // Aggregate from active deals
  deals.forEach((deal) => {
    const repName =
      deal.assignedAEName ||
      deal.assignedAE ||
      deal.owner ||
      (employee?.name ? `${employee.name}` : "Account Executive");

    if (!repMap.has(repName)) {
      repMap.set(repName, {
        name: repName,
        role: "Sales Representative",
        ordersCount: 0,
        dealsCount: 0,
        totalBooked: 0,
      });
    }

    const current = repMap.get(repName);
    current.dealsCount += 1;
  });

  const rankings = Array.from(repMap.values()).sort(
    (a, b) => b.totalBooked - a.totalBooked
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Pure dynamic mapping over dynamically computed rankings */}
      {rankings.map((rep, idx) => (
        <div
          key={rep.name || idx}
          className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-mono font-bold flex items-center justify-center text-xs shrink-0">
              #{idx + 1}
            </div>
            <div>
              <span className="font-black text-slate-900 text-sm block mb-0.5">
                {rep.name} <span className="text-slate-500 font-normal text-xs">({rep.role})</span>
              </span>
              <p className="text-slate-500 font-medium">
                {rep.ordersCount} Confirmed Order(s) &bull; {rep.dealsCount} Pipeline Deal(s)
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
              Total Booked
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-mono font-black text-sm shadow-xs inline-block">
              ₹ {rep.totalBooked.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
