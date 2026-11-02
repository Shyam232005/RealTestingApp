"use client";

import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  Phone,
  Send,
  AlertCircle,
  Building2,
} from "lucide-react";
import { dexieDb } from "@/lib/dexieDb";

/**
 * ReceivablesContent - Coordinator Receivables & Collections Data Table
 * Strict Root-Cause Architecture:
 * - Direct LiveQuery over Dexie salesOrders
 * - Early return zero state when empty
 * - Pure dynamic data.map() loop in <tbody> with ZERO hardcoded fallback <tr> rows
 */
export default function ReceivablesContent({
  orders: propOrders,
  onCreateDispatch,
  onFollowup = () => {},
  className = "",
}) {
  // Live Query from Dexie if prop not provided
  const liveOrders = useLiveQuery(
    async () => {
      try {
        return await dexieDb.salesOrders
          .filter((so) => {
            const bal = Number(so?.balanceDue ?? so?.grandTotal ?? so?.totalAmount ?? 0);
            const status = (so?.paymentStatus || "").toUpperCase();
            return bal > 0 && status !== "PAID_IN_FULL" && status !== "SETTLED";
          })
          .reverse()
          .sortBy("createdAt");
      } catch (e) {
        console.error("Dexie receivables live query error:", e);
        return [];
      }
    },
    [],
    []
  );

  const receivables = propOrders !== undefined ? propOrders : liveOrders;

  // Step 4: Strict Early-Return Zero State Architecture
  if (!receivables || receivables.length === 0) {
    return (
      <div className={`p-12 text-center rounded-3xl border border-slate-200 bg-white shadow-xs ${className}`}>
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
          <Receipt className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          Zero Pending Receivables
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          All confirmed sales orders have collected full advance or settled customer balances. When new orders with pending payment terms are booked, they will track here.
        </p>
        {onCreateDispatch && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onCreateDispatch}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Dispatch Log</span>
            </button>
          </div>
        )}
        <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Collections sync in real-time with the accounting ledger</span>
        </div>
      </div>
    );
  }

  // Summary Metrics calculated dynamically from genuine data
  const totalOutstanding = receivables.reduce(
    (sum, o) => sum + (Number(o?.balanceDue ?? o?.grandTotal ?? o?.totalAmount ?? 0) || 0),
    0
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Summary Cards - Only rendered when genuine records exist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Outstanding Receivables
          </span>
          <div className="text-xl font-black text-rose-600 font-mono">
            ₹ {Number(totalOutstanding || 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
            Across {receivables.length} Pending Invoices
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Credit Term Compliance
          </span>
          <div className="text-xl font-black text-slate-900 font-mono">
            NET_30
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            MSME Statutory 45-day Safe Zone
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Fulfillment Safety
          </span>
          <div className="text-xl font-black text-emerald-600 font-mono">
            LOCKED
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
            Dispatch requires coordinator release
          </span>
        </div>
      </div>

      {/* Data Table: <tbody> contains ONLY the dynamic data.map loop */}
      <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Order / Reference</th>
                <th className="px-5 py-3.5">Client &amp; Contact</th>
                <th className="px-5 py-3.5">Payment Terms</th>
                <th className="px-5 py-3.5">Order Total</th>
                <th className="px-5 py-3.5">Balance Due</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receivables.map((order) => {
                const orderTotal = Number(order?.grandTotal || order?.totalAmount || 0);
                const balance = Number(order?.balanceDue ?? orderTotal);
                const ref = order.orderReference || order.orderNumber || order.id || "SO-REF";
                return (
                  <tr key={order.id || ref} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-slate-900 block text-xs">
                        {ref}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Recent"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{order.clientName}</div>
                      {order.customerPhone && (
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.customerPhone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold">
                        {order.paymentTerms || "NET_30"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-slate-900">
                      ₹ {orderTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 font-mono font-black text-rose-600">
                      ₹ {balance.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                        {order.paymentStatus || "PENDING_COLLECTION"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onFollowup(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        <Send className="w-3 h-3 text-emerald-400" />
                        <span>Delegate Follow-up</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
