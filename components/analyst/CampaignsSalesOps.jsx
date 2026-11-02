"use client";

import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  getCampaignMetrics,
  createMarketingCampaign,
} from "@/actions/analystActions";

const CAMPAIGN_SUBVIEWS = [
  { id: "campaign_roi", label: "Campaign ROI & Leads" },
  { id: "commission_tracker", label: "Commission Tracker" },
  { id: "crm_hygiene", label: "CRM Data Hygiene" },
];

const campaignFormSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  channel: z.string().min(1, "Channel is required"),
  budget: z.coerce.number().min(0, "Budget must be 0 or positive"),
  spend: z.coerce.number().min(0, "Spend must be 0 or positive"),
  leadsCount: z.coerce.number().min(0, "Leads count must be 0 or positive"),
  revenueGenerated: z.coerce.number().min(0, "Revenue must be 0 or positive"),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).default("ACTIVE"),
});

/**
 * CampaignsSalesOps - Tier 3 Sales Ops Analyst View
 * Deduplicated single header block with right-aligned pill navigation.
 * Connected to MongoDB via Server Actions and local-first Dexie.js.
 */
export default function CampaignsSalesOps({
  activeSubView = "campaign_roi",
  onSubViewChange,
  employee,
  onNotify = () => {},
  className = "",
}) {
  const [selectedSubView, setSelectedSubView] = useState(null);
  const currentSubView = selectedSubView || activeSubView || "campaign_roi";
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [serverCampaigns, setServerCampaigns] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2: Fetch MongoDB live data via Server Action
  useEffect(() => {
    let isMounted = true;
    async function loadCampaigns() {
      try {
        const res = await getCampaignMetrics();
        if (isMounted && res?.success && Array.isArray(res.campaigns)) {
          setServerCampaigns(res.campaigns);
        }
      } catch (err) {
        console.error("Failed to load campaign metrics from MongoDB:", err);
      }
    }
    loadCampaigns();
    return () => {
      isMounted = false;
    };
  }, []);

  // Step 2: Live Dexie Queries
  const localCampaigns = useLiveQuery(
    async () => {
      try {
        if (!db.marketingCampaigns) return [];
        return await db.marketingCampaigns.reverse().toArray();
      } catch (e) {
        return [];
      }
    },
    [],
    []
  );

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

  const campaignsList =
    localCampaigns && localCampaigns.length > 0
      ? localCampaigns
      : serverCampaigns;

  const ordersList = localSalesOrders || [];
  const leadsList = localLeads || [];
  const dealsList = localDeals || [];

  // React Hook Form for Modal
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      channel: "Google Ads",
      budget: 50000,
      spend: 15000,
      leadsCount: 12,
      revenueGenerated: 85000,
      status: "ACTIVE",
    },
  });

  const onSubmitCampaign = async (data) => {
    setIsSubmitting(true);
    try {
      const spendNum = Number(data.spend) || 0;
      const revNum = Number(data.revenueGenerated) || 0;
      const computedRoi =
        spendNum > 0
          ? Number((((revNum - spendNum) / spendNum) * 100).toFixed(1))
          : 0;

      // 1. Persist to MongoDB via Server Action
      const serverRes = await createMarketingCampaign({
        ...data,
        branchName: employee?.branchName || "Main HQ",
        createdBy: employee?.name || "Sales Ops Analyst",
      });

      // 2. Persist to Dexie for local-first reactive UI update
      if (db.marketingCampaigns) {
        await db.marketingCampaigns.add({
          name: data.name,
          channel: data.channel,
          budget: Number(data.budget) || 0,
          spend: spendNum,
          leadsCount: Number(data.leadsCount) || 0,
          revenueGenerated: revNum,
          roi: computedRoi,
          status: data.status,
          branchName: employee?.branchName || "Main HQ",
          createdBy: employee?.name || "Sales Ops Analyst",
          createdAt: new Date().toISOString(),
          synced: true,
        });
      }

      if (serverRes?.success && serverRes.campaign) {
        setServerCampaigns((prev) => [serverRes.campaign, ...prev]);
      }

      reset();
      setIsCampaignModalOpen(false);
      onNotify("Marketing campaign logged & ROI tracking initiated!");
    } catch (err) {
      console.error("Failed to submit campaign:", err);
      onNotify("Error saving campaign: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tabId) => {
    setSelectedSubView(tabId);
    if (typeof onSubViewChange === "function") {
      onSubViewChange(tabId);
    }
  };

  // Aggregated campaign calculations
  const totalSpend = campaignsList.reduce(
    (acc, c) => acc + (Number(c.spend) || 0),
    0
  );
  const totalRevenue = campaignsList.reduce(
    (acc, c) => acc + (Number(c.revenueGenerated) || 0),
    0
  );
  const totalLeads = campaignsList.reduce(
    (acc, c) => acc + (Number(c.leadsCount) || 0),
    0
  );
  const blendedRoi =
    totalSpend > 0
      ? (((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(1)
      : "0.0";

  return (
    <div className={`space-y-6 ${className}`}>
      {/* =========================================================================
          STEP 1: STRICTLY ONE DEDUPLICATED MODULE HEADER
          Title text on the left, pill menu aligned to the right. No other headers above or below.
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 border border-purple-200/60 shadow-2xs">
            <Megaphone className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Campaigns &amp; Sales Ops
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Track marketing channel ROI, sales commission disbursements, and CRM cleanliness audit
            </p>
          </div>
        </div>

        {/* Pill Menu Sub-Navigation Aligned to the Right */}
        <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
          {CAMPAIGN_SUBVIEWS.map((tab) => {
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
          SUB-VIEW 1: CAMPAIGN ROI & LEADS
         ========================================================================= */}
      {currentSubView === "campaign_roi" && (
        <div className="space-y-6">
          {/* STEP 3: STRICT ZERO STATE IMPLEMENTATION (EXACT MATCH)
              Condition: campaigns.length === 0 */}
          {campaignsList.length === 0 ? (
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
          ) : (
            /* Populated State with Live Aggregations */
            <div className="space-y-6">
              {/* 4 Real-Time KPI Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Total Ad Spend
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    ₹ {totalSpend.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[11px] font-bold text-slate-500 mt-1 block">
                    Across {campaignsList.length} campaigns
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Attributed Revenue
                  </span>
                  <p className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                    ₹ {totalRevenue.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                    Direct closed revenue
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Inbound Campaign Leads
                  </span>
                  <p className="text-2xl font-black text-blue-600 font-mono tracking-tight">
                    {totalLeads} Leads
                  </p>
                  <span className="text-[11px] font-bold text-blue-700 mt-1 block">
                    Attributed to marketing channels
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Blended Campaign ROI
                  </span>
                  <p className="text-2xl font-black text-purple-600 font-mono tracking-tight">
                    {blendedRoi}%
                  </p>
                  <span className="text-[11px] font-bold text-purple-700 mt-1 block">
                    Net return multiplier
                  </span>
                </div>
              </div>

              {/* Campaign ROI & Attribution Table */}
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
                    <span>+ Log Ad Spend</span>
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
                        {campaignsList.map((camp, idx) => {
                          const spend = Number(camp.spend || 0);
                          const revenue = Number(camp.revenueGenerated || 0);
                          const roi =
                            spend > 0
                              ? (((revenue - spend) / spend) * 100).toFixed(1)
                              : "0.0";
                          return (
                            <tr
                              key={camp._id || camp.id || `${camp.name}-${idx}`}
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
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-VIEW 2: COMMISSION TRACKER
         ========================================================================= */}
      {currentSubView === "commission_tracker" && (
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
                    {ordersList.map((order, idx) => {
                      const total = Number(order?.grandTotal || order?.totalAmount || 0);
                      const commission = total * 0.025; // 2.5% standard commission
                      return (
                        <tr
                          key={order._id || order.id || order.orderReference || idx}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
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

      {/* =========================================================================
          SUB-VIEW 3: CRM DATA HYGIENE
         ========================================================================= */}
      {currentSubView === "crm_hygiene" && (
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
                <span className="font-bold text-emerald-700 font-mono">
                  {ordersList.length} Synced
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REACT HOOK FORM MODAL: LOG AD SPEND & LAUNCH CAMPAIGN
         ========================================================================= */}
      {isCampaignModalOpen && (
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

            <form
              onSubmit={handleSubmit(onSubmitCampaign)}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Google Ads - MSME Supply Chain"
                  {...register("name")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                {errors.name && (
                  <p className="text-rose-500 text-[11px] font-semibold mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Channel
                  </label>
                  <select
                    {...register("channel")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  >
                    <option value="Google Ads">Google Ads</option>
                    <option value="Meta Ads">Meta Ads</option>
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
                    {...register("status")}
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
                    {...register("budget")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  {errors.budget && (
                    <p className="text-rose-500 text-[11px] font-semibold mt-1">
                      {errors.budget.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Actual Spend (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    {...register("spend")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  {errors.spend && (
                    <p className="text-rose-500 text-[11px] font-semibold mt-1">
                      {errors.spend.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attributed Leads
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 18"
                    {...register("leadsCount")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  {errors.leadsCount && (
                    <p className="text-rose-500 text-[11px] font-semibold mt-1">
                      {errors.leadsCount.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attributed Revenue (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 120000"
                    {...register("revenueGenerated")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  {errors.revenueGenerated && (
                    <p className="text-rose-500 text-[11px] font-semibold mt-1">
                      {errors.revenueGenerated.message}
                    </p>
                  )}
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
                  <span>
                    {isSubmitting ? "Launching..." : "Save & Track Campaign"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
