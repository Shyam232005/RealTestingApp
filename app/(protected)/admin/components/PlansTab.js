"use client";
import React, { useState } from "react";
import {
  Zap,
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function PlansTab({
  subscriptionsData,
  loading,
  onRefresh,
  onModifyPlan,
  onViewProfile,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const subscribers = subscriptionsData?.subscribers || [];
  const metrics = subscriptionsData?.metrics || {};
  const tierSummaries = subscriptionsData?.tierSummaries || [];

  const filteredSubscribers = subscribers.filter((sub) => {
    if (tierFilter !== "ALL" && sub.planName !== tierFilter) return false;
    if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = sub.ownerName?.toLowerCase().includes(q);
      const matchOrg = sub.organizationName?.toLowerCase().includes(q);
      const matchEmail = sub.ownerEmail?.toLowerCase().includes(q);
      const matchPhone = sub.ownerPhone?.toLowerCase().includes(q);
      if (!matchName && !matchOrg && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white">
              Subscription Plans & Revenue Governance
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time subscriber distribution, recurring revenue telemetry, quota enforcement, and multi-tier management.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-pulse" : ""}`} />
          <span>Refresh Plans</span>
        </button>
      </div>

      {/* Financial & Subscriber Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Subscribed Companies
          </span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {metrics.totalOrganizations || 0}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-bold">{metrics.totalActivePaid || 0} Paid</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{metrics.totalTrialing || 0} Trial</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">
            Est. Monthly Revenue (MRR)
          </span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            ₹{(metrics.totalEstimatedMRR || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-purple-400 mt-1">
            Recurring software billings
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
            Annual Run Rate (ARR)
          </span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            ₹{(metrics.totalEstimatedARR || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">
            Projected 12-month ARR
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">
            Active Paid Ratio
          </span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {metrics.totalOrganizations
              ? `${Math.round(((metrics.totalActivePaid || 0) / metrics.totalOrganizations) * 100)}%`
              : "0%"}
          </p>
          <p className="text-[11px] text-indigo-400 mt-1">
            Conversion & retention rate
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl col-span-2 lg:col-span-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
            Billing Cycle Split
          </span>
          <div className="flex items-center gap-3 mt-2 text-xs font-mono font-bold">
            <span className="text-purple-300">{metrics.cycleSplit?.annual || 0} Annual</span>
            <span className="text-slate-500">|</span>
            <span className="text-indigo-300">{metrics.cycleSplit?.monthly || 0} Mo</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300">{metrics.cycleSplit?.trial || 0} Trial</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Contract cycle commitments
          </p>
        </div>
      </div>

      {/* Platform Subscription Tier Showcase Cards (The 4 Plans) */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Platform Standard Subscription Tiers & Capabilities</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tierSummaries.map((tier) => {
            const cfg = tier.config || {};
            return (
              <div
                key={tier.tierName}
                className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-purple-500/40 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${cfg.badgeColor || "bg-slate-800 text-slate-300 border-slate-700"}`}
                    >
                      {tier.tierName}
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 font-bold">
                      {tier.count} Enrolled
                    </span>
                  </div>

                  <div className="mt-3">
                    <h5 className="text-2xl font-black text-white font-mono">
                      {cfg.priceLabel || "Free"}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {cfg.maxUsers === 999 ? "Unlimited Seats" : `Up to ${cfg.maxUsers} Users`} • {cfg.maxInvoices}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                    {(cfg.features || []).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px] leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] flex items-center justify-between font-mono">
                  <span className="text-slate-400">Monthly Contribution:</span>
                  <span className="text-white font-bold">
                    ₹{(tier.monthlyRevenue || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscribers & User Plan Details Directory (Table) */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        {/* Table Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>User Subscription Ledger</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/20 text-purple-300">
                {filteredSubscribers.length} Accounts
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Live subscription states, renewal tracking, seat quotas, and plan modifications.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search business or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-56"
              />
            </div>

            {/* Plan Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="Free Trial">Free Trial</option>
              <option value="MSME Starter">MSME Starter</option>
              <option value="Manufacturing & Growth">Manufacturing & Growth</option>
              <option value="Enterprise Multi-Unit">Enterprise Multi-Unit</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Organization & Owner</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Validity & Expiry</th>
                <th className="py-3 px-4">Seat Quota</th>
                <th className="py-3 px-4 text-right pr-6">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No subscriptions matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const isExpiringSoon = sub.isExpiringSoon;
                  const cfg = sub.tierConfig || {};

                  return (
                    <tr key={sub.ownerId} className="hover:bg-slate-800/40 transition-colors">
                      {/* Organization & Owner */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-300 font-black text-xs flex items-center justify-center shrink-0 border border-purple-500/20">
                            {sub.organizationName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-white text-xs">{sub.organizationName}</p>
                            <p className="text-[11px] text-slate-400">
                              {sub.ownerName} • {sub.ownerPhone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan Tier */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${cfg.badgeColor || "bg-slate-800 text-slate-300 border-slate-700"}`}
                        >
                          {sub.planName}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {cfg.priceLabel || "Free"}
                        </p>
                      </td>

                      {/* Billing Cycle */}
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-mono text-slate-300 text-xs">
                          {sub.cycle || "annual"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                            sub.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : sub.status === "expired"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {sub.status || "active"}
                        </span>
                      </td>

                      {/* Validity & Expiry */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs font-mono">
                          <span className="text-white block">
                            {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "No Expiry"}
                          </span>
                          {sub.daysRemaining !== null && (
                            <span
                              className={`text-[10px] font-bold ${
                                sub.daysRemaining < 0
                                  ? "text-rose-400"
                                  : isExpiringSoon
                                  ? "text-amber-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {sub.daysRemaining < 0
                                ? "Expired"
                                : `${sub.daysRemaining} days remaining`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Seat Quota */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-28">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-300">
                              {sub.currentEmployees} / {sub.maxAllowedUsers === 999 ? "∞" : sub.maxAllowedUsers}
                            </span>
                            <span className="text-purple-400">{sub.quotaUtilizationPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                sub.quotaUtilizationPercent > 90
                                  ? "bg-rose-500"
                                  : sub.quotaUtilizationPercent > 70
                                  ? "bg-amber-500"
                                  : "bg-purple-500"
                              }`}
                              style={{ width: `${sub.quotaUtilizationPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onModifyPlan && onModifyPlan(sub)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            title="Upgrade or change subscription plan"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Modify Plan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewProfile && onViewProfile({ _id: sub.ownerId, userType: "OWNER", name: sub.ownerName })}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
                            title="View full owner profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
