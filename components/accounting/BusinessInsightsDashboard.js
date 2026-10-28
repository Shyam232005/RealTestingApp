"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  CreditCard,
  MessageSquare,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
  Package,
  Users,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { MetricsCardsSkeleton, ChartSkeleton } from "@/components/ui/CrownSkeletonLoader";
import CrownZeroState from "@/components/ui/CrownZeroState";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function BusinessInsightsDashboard({
  organization,
  selectedBranch = "all",
}) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAgingTab, setActiveAgingTab] = useState("receivables"); // receivables | payables

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/owner/insights?branchId=${selectedBranch}`);
        const data = await res.json();
        if (!ignore && data.success && data.insights) {
          setInsights(data.insights);
        }
      } catch (err) {
        console.error("Failed to fetch insights:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [selectedBranch]);

  const refreshInsights = () => {
    setLoading(true);
    fetch(`/api/owner/insights?branchId=${selectedBranch}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.insights) {
          setInsights(data.insights);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  // One-click WhatsApp Reminder Generator
  const sendWhatsAppReminder = (party) => {
    const companyName = organization?.RegisterName || "Crownops Enterprise";
    const cleanPhone = (party.phone || "").replace(/\D/g, "");
    const message = `Namaste ${party.partyName} ji,\n\nThis is a polite reminder from *${companyName}* regarding outstanding invoice *${party.invoiceRef}* for *₹${Number(party.amount).toLocaleString("en-IN")}*, which is currently overdue by ${party.daysOverdue} days.\n\nKindly arrange clearance via RTGS / NEFT / UPI at your earliest convenience.\n\nThank you for your business!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <MetricsCardsSkeleton count={4} />
        <ChartSkeleton height="h-80" />
      </div>
    );
  }

  if (!insights) {
    return (
      <CrownZeroState
        variant="financial_statements"
        title="No Insights Available Yet"
        description="Business metrics, runway calculations, and automated WhatsApp payment reminders will appear once sales invoices and vouchers are posted."
        actionText="Refresh Metrics"
        onAction={fetchInsights}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Enterprise Business Insights
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Zoho/Odoo-style predictive analytics, cash flow runway, aging and margins
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshInsights}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh Insights"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================================
          1. CASH FLOW RUNWAY & 30-DAY VELOCITY (RECHARTS AREA CHART)
         ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">
              Liquidity & Runway Forecast
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {insights.runwayMonths} Months
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Healthy Cash Buffer
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Estimated based on liquid reserves of ₹{insights.currentLiquidReserves?.toLocaleString("en-IN")} and average monthly burn of ₹{insights.monthlyBurn?.toLocaleString("en-IN")}.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">30-Day Cash In</span>
              <span className="text-sm font-black text-emerald-700 font-mono">
                ₹{insights.cashFlowTimeline?.reduce((a, b) => a + b.cashIn, 0)?.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">30-Day Cash Out</span>
              <span className="text-sm font-black text-purple-700 font-mono">
                ₹{insights.cashFlowTimeline?.reduce((a, b) => a + b.cashOut, 0)?.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={insights.cashFlowTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cashInGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cashOutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "16px",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
              />
              <Area
                type="monotone"
                dataKey="cashIn"
                name="Cash In (Receipts)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cashInGrad)"
              />
              <Area
                type="monotone"
                dataKey="cashOut"
                name="Cash Out (Payments)"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cashOutGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* =========================================================================
          2. RECEIVABLES & PAYABLES AGING WITH 1-CLICK WHATSAPP REMINDERS
         ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Receivables & Payables Aging Buckets
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track outstanding dues and collect payments faster via instant WhatsApp reminders
            </p>
          </div>

          <div className="p-1 rounded-2xl bg-slate-100 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveAgingTab("receivables")}
              className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                activeAgingTab === "receivables"
                  ? "bg-white text-emerald-800 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Debtors (Money Owed to You)
            </button>
            <button
              type="button"
              onClick={() => setActiveAgingTab("payables")}
              className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                activeAgingTab === "payables"
                  ? "bg-white text-purple-800 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Creditors (Money You Owe)
            </button>
          </div>
        </div>

        {/* Aging Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Party / Business Name</th>
                <th className="py-3 px-4">Reference Doc</th>
                <th className="py-3 px-4 text-center">Aging Bracket</th>
                <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {activeAgingTab === "receivables"
                ? insights.agingReceivables?.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900 block">{r.partyName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{r.phone}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{r.invoiceRef}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            r.bucket === "0-30 days"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.bucket === "31-60 days"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800 animate-pulse"
                          }`}
                        >
                          {r.bucket} ({r.daysOverdue} days)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        ₹{Number(r.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => sendWhatsAppReminder(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-transform active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Reminder</span>
                        </button>
                      </td>
                    </tr>
                  ))
                : insights.agingPayables?.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900 block">{p.partyName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{p.phone}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.billRef}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                          Due in {p.daysRemaining} days
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-purple-700 text-sm">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 text-[11px]">
                        Scheduled for Payout
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          3. TOP MOVERS & MARGIN ANALYSIS
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Top 5 Highest Margin Products */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Top 5 High-Margin Products
            </h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Profit Drivers
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {insights.topProducts?.map((item, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-black text-slate-900 text-xs block">{item.name}</span>
                  <span className="text-[11px] text-slate-400">
                    Selling: ₹{item.sellingPrice} • Cost: ₹{item.costPrice} • Sold: {item.unitsSold} units
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-sm text-emerald-700 block">
                    {item.marginPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Gross Margin</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Clients */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Top Active Clients by Volume
            </h4>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Loyal Accounts
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {insights.topClients?.map((client, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-black text-slate-900 text-xs block">{client.name}</span>
                  <span className="text-[11px] text-slate-400">
                    {client.ordersCount} Completed Orders • Rating: {client.paymentRating}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-sm text-slate-900 block">
                    ₹{Number(client.totalTurnover).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold uppercase">Turnover</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
