"use client";

import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { MapPin, Building2, Tag, Calendar } from "lucide-react";
import { dexieDb } from "@/lib/dexieDb";

/**
 * TerritoryForecast - Analyst Territory Demand & Pipeline Forecasting Component
 * Strict Root-Cause Architecture:
 * - Direct LiveQuery over Dexie deals
 * - Early return zero state when empty
 * - Pure dynamic data.map() loop with ZERO hardcoded cards, contact fallbacks, or mock deal values
 */
export default function TerritoryForecast({
  deals: propDeals,
  className = "",
}) {
  const liveDeals = useLiveQuery(
    async () => {
      try {
        return await dexieDb.deals.reverse().sortBy("createdAt");
      } catch (e) {
        console.error("Dexie territory deals live query error:", e);
        return [];
      }
    },
    [],
    []
  );

  const deals = propDeals !== undefined ? propDeals : liveDeals;

  // Step 4: Strict Early-Return Zero State Architecture
  if (!deals || deals.length === 0) {
    return (
      <div className={`p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3 ${className}`}>
        <MapPin className="w-12 h-12 mx-auto text-slate-300" />
        <div>
          <p className="text-sm font-black text-slate-800">
            No Territory Demand Forecast Available
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Territory forecasts, pipeline stage weighting, and confidence scores will generate automatically as deals are added to the CRM pipeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Pure dynamic mapping over Dexie deals collection */}
      {deals.map((deal) => {
        const dealVal = Number(deal.dealValue || deal.value || 0);
        const stage = (deal.stage || "QUALIFIED").replace(/_/g, " ");
        const client = deal.clientName || deal.title || "Pipeline Account";
        const closeDate = deal.expectedCloseDate || (deal.createdAt ? new Date(deal.createdAt).toLocaleDateString("en-IN") : "This Quarter");

        return (
          <div
            key={deal.id || deal.dealCode || deal._id}
            className="p-5 rounded-2xl bg-blue-50/40 border border-blue-200 text-xs space-y-2 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                {client}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
                {stage}
              </span>
            </div>

            {deal.contactPerson && (
              <p className="text-[11px] text-slate-500 font-medium">
                Contact: <span className="text-slate-700 font-semibold">{deal.contactPerson}</span>
              </p>
            )}

            <div className="flex items-center justify-between text-slate-600 font-medium pt-1">
              <span>
                Deal Value:{" "}
                <strong className="text-slate-900 font-mono">
                  ₹ {dealVal.toLocaleString("en-IN")}
                </strong>
              </span>
              <span>
                Close Date:{" "}
                <strong className="text-slate-800 font-mono">
                  {closeDate}
                </strong>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
