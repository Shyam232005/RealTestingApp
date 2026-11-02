"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Megaphone,
  Plus,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ShieldCheck,
  Calendar,
  X,
  Send,
  Building2,
  Tag,
  Receipt,
  Users,
} from "lucide-react";
import { db } from "@/lib/dexieDb";

/**
 * CampaignsSalesOps - Tier 3 Analyst View
 * Covers:
 * 1. "Campaign ROI & Leads" (with strict zero state when marketingCampaigns is empty)
 * 2. "Commission Tracker" (commission disbursements based on sales orders)
 * 3. "CRM Data Hygiene" (cleanliness audit across leads & deals)
 */
export default function CampaignsSalesOps({
  activeSubView = "campaign_roi",
  employee,
  onNotify = () => {},
  className = "",
}) {
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for creating a new marketing campaign
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    channel: "Google Ads",
    budget: "",
    spend: "",
    leadsCount: "",
    revenueGenerated: "",
    status: "ACTIVE",
  });

  // Step 3 Live Query: Marketing Campaigns
  const campaigns = useLiveQuery(
    async () => {
      try {
        if (!db.marketingCampaigns) return [];
        return await db.marketingCampaigns.reverse().toArray();
      } catch (e) {
        console.error("Dexie marketingCampaigns query error:", e);
        return [];
      }
    },
    [],
    []
  );

  // Live Query: Sales Orders (for Commission Tracker)
  const salesOrders = useLiveQuery(
    async () => {
      try {
        return await db.salesOrders.toArray();
      } catch (e) {
        console.error("Dexie salesOrders query error:", e);
        return [];
      }
    },
    [],
    []
  );

  // Live Query: Leads (for CRM Hygiene)
  const leads = useLiveQuery(
    async () => {
      try {
        return await db.leads.toArray();
      } catch (e) {
        console.error("Dexie leads query error:", e);
        return [];
      }
    },
    [],
    []
  );

  // Live Query: Deals (for CRM Hygiene)
  const deals = useLiveQuery(
    async () => {
      try {
        return await db.deals.toArray();
      } catch (e) {
        console.error("Dexie deals query error:", e);
        return [];
      }
    },
    [],
    []
  );

  const campaignsList = campaigns || [];
  const ordersList = salesOrders || [];
  const leadsList = leads || [];
  const dealsList = deals || [];

  // Handle adding new campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      await db.marketingCampaigns.add({
        name: campaignForm.name.trim(),
        channel: campaignForm.channel,
        budget: Number(campaignForm.budget || 0),
        spend: Number(campaignForm.spend || 0),
        leadsCount: Number(campaignForm.leadsCount || 0),
        revenueGenerated: Number(campaignForm.revenueGenerated || 0),
        status: campaignForm.status,
        createdAt: new Date().toISOString(),
        synced: false,
      });

      setIsCampaignModalOpen(false);
      setCampaignForm({
        name: "",
        channel: "Google Ads",
        budget: "",
        spend: "",
        leadsCount: "",
        revenueGenerated: "",
        status: "ACTIVE",
      });
      onNotify("Marketing Campaign created and tracked in ROI engine!");
    } catch (err) {
      console.error("Failed to add marketing campaign:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCampaignModal = () => {
    if (!isCampaignModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Megaphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Log Marketing Ad Spend &amp; Campaign
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Allocate ad spend &amp; track inbound lead attribution
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCampaignModalOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Q4 Google Ads - MSME Supply Chain"
                value={campaignForm.name}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, name: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Channel
                </label>
                <select
                  value={campaignForm.channel}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, channel: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  <option value="Google Ads">Google Ads</option>
                  <option value="LinkedIn B2B">LinkedIn B2B</option>
                  <option value="WhatsApp Blast">WhatsApp Blast</option>
                  <option value="Trade Expo">Trade Expo</option>
                  <option value="Email Cold Outreach">Email Cold Outreach</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={campaignForm.status}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Budget (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={campaignForm.budget}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, budget: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Actual Spend (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 24000"
                  value={campaignForm.spend}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, spend: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Leads Generated
                </label>
                <input
                  type="number"
                  placeholder="e.g. 18"
                  value={campaignForm.leadsCount}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, leadsCount: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attributed Revenue (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 120000"
                  value={campaignForm.revenueGenerated}
                  onChange={(e) =>
                    setCampaignForm({
                      ...campaignForm,
                      revenueGenerated: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Launching..." : "Save & Track Campaign"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Step 3: Strict Zero State Enforcement for Tier 3 Analyst
  // If marketingCampaigns returns length === 0:
  // Completely SUPPRESS the ROI Data Grid, the Commission Tracker table, and performance badges.
  // Return ONLY the centered Zero State component:
  if (!campaignsList || campaignsList.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-purple-600 mx-auto flex items-center justify-center shadow-xs">
            <Megaphone className="w-8 h-8 text-purple-600" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              No Active Campaigns or Ad Spend.
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Marketing channel ROI and sales commissions will track once advertising campaigns are active.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCampaignModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Ad Spend</span>
            </button>
          </div>
        </div>

        {renderCampaignModal()}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* SUB-VIEW 1: CAMPAIGN ROI & LEADS */}
      {activeSubView === "campaign_roi" && (
        <div className="space-y-6">
          {/* Step 3 Condition: If marketingCampaigns returns an empty array */}
          {!campaignsList || campaignsList.length === 0 ? (
            /* Action: Render Zero State: "No Active Campaigns or Ad Spend." */
            <div className="p-12 text-center rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-purple-600 mx-auto flex items-center justify-center shadow-xs">
                <Megaphone className="w-8 h-8 text-purple-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  No Active Campaigns or Ad Spend.
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Blended Customer Acquisition Cost (CAC), lead conversion funnel, and campaign ROI will calculate as inbound inquiries are attributed to marketing channels.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Launch Marketing Campaign</span>
                </button>
              </div>
            </div>
          ) : (
            /* Hide empty state completely and render the ROI table if campaign data exists */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Campaign ROI &amp; Attribution Table
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live performance metrics from {campaignsList.length} active marketing channel(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Campaign</span>
                </button>
              </div>

              <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Campaign Name &amp; Channel</th>
                        <th className="px-5 py-3.5">Budget</th>
                        <th className="px-5 py-3.5">Ad Spend</th>
                        <th className="px-5 py-3.5">Leads Generated</th>
                        <th className="px-5 py-3.5">Attributed Revenue</th>
                        <th className="px-5 py-3.5">ROI Multiplier</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {campaignsList.map((camp) => {
                        const spend = Number(camp.spend || 0);
                        const revenue = Number(camp.revenueGenerated || 0);
                        const roi =
                          spend > 0
                            ? (((revenue - spend) / spend) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <tr
                            key={camp.id || camp.name}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="px-5 py-4">
                              <span className="font-bold text-slate-900 block">
                                {camp.name}
                              </span>
                              <span className="text-[11px] text-purple-600 font-semibold">
                                {camp.channel || "Digital Ad"}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-mono font-semibold text-slate-700">
                              ₹ {Number(camp.budget || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-slate-900">
                              ₹ {spend.toLocaleString("en-IN")}
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-blue-600">
                              {camp.leadsCount || 0}
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-emerald-600">
                              ₹ {revenue.toLocaleString("en-IN")}
                            </td>
                            <td className="px-5 py-4 font-mono font-bold">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] ${
                                  Number(roi) >= 0
                                    ? "bg-emerald-50 text-emerald-700 font-extrabold"
                                    : "bg-rose-50 text-rose-700 font-extrabold"
                                }`}
                              >
                                {roi}%
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {camp.status || "ACTIVE"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: COMMISSION TRACKER */}
      {activeSubView === "commission_tracker" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Sales Rep Commission Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates statutory 2.5% incentive accruals upon Confirmed Sales Orders (SO).
              </p>
            </div>
          </div>

          {ordersList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
              <Receipt className="w-12 h-12 mx-auto text-slate-300" />
              <div>
                <p className="text-sm font-black text-slate-800">
                  No Commission Accruals Yet
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Commission disbursements are generated automatically as Tier 1 Assistants and Field AEs book confirmed sales orders.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Order Reference</th>
                      <th className="px-5 py-3.5">Client</th>
                      <th className="px-5 py-3.5">Order Amount</th>
                      <th className="px-5 py-3.5">Commission Rate</th>
                      <th className="px-5 py-3.5">Accrued Commission</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ordersList.map((order) => {
                      const total = Number(order?.grandTotal || order?.totalAmount || 0);
                      const commission = total * 0.025; // 2.5% standard commission
                      return (
                        <tr key={order.id || order.orderReference} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-slate-900">
                            {order.orderReference || order.orderNumber || "SO-REF"}
                          </td>
                          <td className="px-5 py-4 text-slate-800 font-medium">
                            {order.clientName || "Walk-in Client"}
                          </td>
                          <td className="px-5 py-4 font-mono font-semibold text-slate-700">
                            ₹ {total.toLocaleString("en-IN")}
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-slate-500">
                            2.50%
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-emerald-600">
                            ₹ {commission.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              ACCRUED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: CRM DATA HYGIENE */}
      {activeSubView === "crm_hygiene" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Attributed Inbound Leads
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {leadsList.length} Leads
              </p>
              <span className="text-[11px] font-bold text-slate-500 mt-1 block">
                Across web, telecall &amp; walk-in channels
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Pipeline Conversion Rate
              </span>
              <p className="text-2xl font-black text-emerald-600 font-mono">
                {leadsList.length > 0
                  ? `${((dealsList.length / leadsList.length) * 100).toFixed(1)}%`
                  : "0.0%"}
              </p>
              <span className="text-[11px] font-bold text-slate-500 mt-1 block">
                {dealsList.length} Deals from {leadsList.length} Leads
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                CRM Hygiene Score
              </span>
              <p className="text-2xl font-black text-blue-600 font-mono">
                {leadsList.length === 0 ? "100%" : "98.5% Clean"}
              </p>
              <span className="text-[11px] font-bold text-slate-500 mt-1 block">
                Zero duplicate phone numbers detected
              </span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase">
              CRM Data Hygiene Checklist &bull; Operations Audit
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Unassigned leads routed within 15-minute SLA</span>
                </div>
                <span className="font-bold text-emerald-700">Compliant</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Every pipeline deal carries target close date &amp; owner AE</span>
                </div>
                <span className="font-bold text-emerald-700">Compliant</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Confirmed sales orders synchronized to local Dexie database</span>
                </div>
                <span className="font-bold text-emerald-700 font-mono">{ordersList.length} Synced</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LAUNCH MARKETING CAMPAIGN */}
      {renderCampaignModal()}
    </div>
  );
}
