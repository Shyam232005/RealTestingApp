"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Handshake,
  Kanban,
  MapPin,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  TrendingUp,
  Building2,
  Calendar,
  DollarSign,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Percent,
  Navigation,
  Clock,
  Layers,
  FileText,
  CreditCard,
  Send,
  Eye,
} from "lucide-react";
import { useSalesFlow } from "@/context/SalesFlowContext";
import DealsZeroState from "./DealsZeroState";
import DealsContainer from "./DealsContainer";
import ActiveDealsContent from "./ActiveDealsContent";

// Subcomponent: Create Deal Modal with clean uncontrolled initialization (React 19 compliant)
function CreateDealModal({ isOpen, onClose, initialData, onSubmit }) {
  const [dealForm, setDealForm] = useState(() => ({
    title:
      initialData?.title ||
      (initialData?.clientName ? `${initialData.clientName} Contract` : ""),
    clientName: initialData?.clientName || "",
    contactPerson: initialData?.contactPerson || "",
    phone: initialData?.phone || "",
    dealValue: initialData?.dealValue || 250000,
    stage: initialData?.stage || "REQUIREMENT_GATHERING",
    expectedCloseDate: "2026-11-20",
    assignedAE: "Active AE",
    marginPercent: initialData?.marginPercent || 22,
    city: initialData?.city || "Regional Branch",
    notes: initialData?.notes || "",
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(dealForm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {initialData
                  ? "Convert Lead into Active Deal"
                  : "Create New Pipeline Deal"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {initialData
                  ? `Auto-transferred from ${initialData.sourceLeadId || "Lead Pool"}`
                  : "Enter deal criteria complying with owner parameters"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Deal Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={dealForm.title}
              onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Client / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={dealForm.clientName}
                onChange={(e) => setDealForm({ ...dealForm, clientName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-purple-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={dealForm.phone}
                onChange={(e) => setDealForm({ ...dealForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Deal Value (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1000"
                value={dealForm.dealValue}
                onChange={(e) => setDealForm({ ...dealForm, dealValue: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Target Gross Margin (%)
              </label>
              <input
                type="number"
                min="18"
                value={dealForm.marginPercent}
                onChange={(e) =>
                  setDealForm({ ...dealForm, marginPercent: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Initial Stage
            </label>
            <select
              value={dealForm.stage}
              onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
            >
              <option value="REQUIREMENT_GATHERING">Requirement Gathering</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="WON">Won (Auto-sync to Client Master)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Confirm &amp; Insert into Pipeline</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function DealTabs({
  ownerName = "Main HQ",
  paramKey = "tab",
  className = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    deals,
    fieldVisits,
    estimates,
    stagedLeadForDeal,
    dealModalOpen,
    setDealModalOpen,
    createDeal,
    updateDealStage,
    convertQuoteToSalesOrder,
    triggerToast,
  } = useSalesFlow();

  // URL Query Param state management
  const currentTabFromUrl =
    searchParams?.get(paramKey) || searchParams?.get("dealSubtab") || "active-deals";

  const activeTab = ["active-deals", "geo-tracker", "estimates-quotes"].includes(
    currentTabFromUrl
  )
    ? currentTabFromUrl
    : "active-deals";

  const handleTabChange = (newTab) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set(paramKey, newTab);
    params.set("dealSubtab", newTab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Interactive Quote Builder State
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [newQuote, setNewQuote] = useState({
    dealId: "DEAL-302",
    clientName: "Modern Fabricators LLP",
    lineItems: [
      { id: 1, item: "Standard Machinery Parts", qty: 10, rate: 15000, total: 150000 },
    ],
    taxPercent: 18,
    paymentTerms: "50% Advance with PO, Balance on Delivery",
  });

  const handleAddLineItem = () => {
    setNewQuote((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          id: Date.now(),
          item: "Industrial Components Package",
          qty: 1,
          rate: 10000,
          total: 10000,
        },
      ],
    }));
  };

  const calculateSubtotal = (items) =>
    items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const KANBAN_STAGES = [
    { id: "REQUIREMENT_GATHERING", label: "Requirement Gathering", color: "blue" },
    { id: "NEGOTIATION", label: "Negotiation", color: "purple" },
    { id: "WON", label: "Won (Auto-Synced)", color: "emerald" },
    { id: "LOST", label: "Lost", color: "slate" },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* MODULE HEADER WITH PILL-MENU SUB-NAVIGATION ON THE RIGHT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 border border-purple-200/60 shadow-2xs">
            <Handshake className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Deals &amp; Quotations Management
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Track multi-stage negotiations, outside field visits, and formal financial estimates
            </p>
          </div>
        </div>

        {/* PILL MENU NAVIGATION */}
        <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            {
              id: "active-deals",
              label: "Active Deals (Kanban)",
              icon: Kanban,
              badge: deals.length,
            },
            {
              id: "geo-tracker",
              label: "Field Visit Geo-Tracker",
              icon: MapPin,
              badge: fieldVisits.length,
            },
            {
              id: "estimates-quotes",
              label: "Estimates & Price Quotes",
              icon: FileSpreadsheet,
              badge: estimates.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-200/50"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-purple-600" : "text-slate-400"
                  }`}
                />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-purple-50 text-purple-700 font-mono"
                      : "bg-slate-200 text-slate-600 font-mono"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ACTIVE DEALS (REAL-TIME DEXIE KANBAN + MONGO SYNC)
         ========================================================================= */}
      {activeTab === "active-deals" && (
        <ActiveDealsContent ownerName={ownerName} />
      )}

      {/* =========================================================================
          TAB 2: FIELD VISIT GEO-TRACKER
         ========================================================================= */}
      {activeTab === "geo-tracker" && (
        <div className="space-y-4">
          {!fieldVisits || fieldVisits.length === 0 ? (
            /* Strict Component-Level Zero State: No Telemetry Banner or List Wrappers */
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  No outside field visits or route coordinates recorded.
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Schedule on-site client inspections and territory routing from your active deals.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("active-deals")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ View Active Deals</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-amber-950">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-600" />
                  <span>Outside Sales Territory Routing &amp; Client Coordinates</span>
                </div>
                <span className="text-[11px] text-amber-700 font-mono">
                  GPS Telemetry &bull; Peenya - Whitefield Corridor
                </span>
              </div>

              <div className="space-y-3">
                {fieldVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {visit.id}
                        </span>
                        <h4 className="text-sm font-black text-slate-900">{visit.clientName}</h4>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            visit.meetingStatus === "EN_ROUTE"
                              ? "bg-blue-100 text-blue-800 animate-pulse"
                              : visit.meetingStatus === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {visit.meetingStatus?.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{visit.location}</span>
                        <span className="font-mono font-bold text-slate-800 shrink-0">
                          ({visit.distanceKm})
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        🎯 <strong>Objective:</strong> {visit.objective}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Contact: {visit.contactPerson}</span>
                        <span>•</span>
                        <a href={`tel:${visit.phone}`} className="font-mono text-blue-600 font-bold">
                          {visit.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 self-start md:self-center">
                      <button
                        type="button"
                        onClick={() =>
                          triggerToast(`GPS navigation routed to ${visit.clientName}!`)
                        }
                        className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Route Maps</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          triggerToast(`✓ Check-in recorded at ${visit.clientName} site!`)
                        }
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Check-in Site
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: ESTIMATES & PRICE QUOTES
         ========================================================================= */}
      {activeTab === "estimates-quotes" && (
        <div className="space-y-6">
          {!estimates || estimates.length === 0 ? (
            /* Strict Component-Level Zero State: No Header or Line-Item Quote Table */
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                <FileSpreadsheet className="w-8 h-8 text-purple-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  No formal price estimates or quotations drafted.
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Generate line-item estimates with GST and payment terms adhering to Owner pricing policies.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteBuilder(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Draft New Line-Item Quote</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-800">
                    Official Commercial Estimates ({estimates.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Line-item rate builders adhering to Owner 18% gross margin floor
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuoteBuilder(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Draft New Line-Item Quote</span>
                </button>
              </div>

          <div className="space-y-4">
            {estimates.map((quote) => (
              <div
                key={quote.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-mono font-bold text-xs border border-purple-200">
                      QT
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900">
                          {quote.quoteNumber}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {quote.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900">{quote.clientName}</h4>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">
                      Total Invoice Value (Incl. 18% GST)
                    </span>
                    <span className="text-lg font-black font-mono text-purple-950">
                      ₹{Number(quote.grandTotal).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                        <th className="pb-2">Item Description</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Unit Rate (₹)</th>
                        <th className="pb-2 text-right">Line Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {quote.lineItems?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 font-semibold text-slate-800">{item.item}</td>
                          <td className="py-2.5 text-center font-mono text-slate-600">
                            {item.qty}
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-600">
                            ₹{Number(item.rate).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{Number(item.total).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary & PRIMARY ACTION */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-3.5 rounded-2xl">
                  <div className="text-xs text-slate-600 font-medium">
                    <span>Payment Terms: </span>
                    <strong className="text-slate-800">{quote.paymentTerms}</strong>
                  </div>

                  {/* PRIMARY ACTION: CONVERT QUOTE TO SALES ORDER */}
                  <button
                    type="button"
                    onClick={() => convertQuoteToSalesOrder(quote)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition-all shadow-md shadow-slate-900/10 cursor-pointer self-start sm:self-auto"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Convert Quote to Sales Order</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )}

      {/* CREATE DEAL MODAL (AUTO-PREFILLED ON STAGED LEAD) */}
      <AnimatePresence>
        {dealModalOpen && (
          <CreateDealModal
            key={stagedLeadForDeal?.sourceLeadId || "manual-deal"}
            isOpen={dealModalOpen}
            onClose={() => setDealModalOpen(false)}
            initialData={stagedLeadForDeal}
            onSubmit={(formData) => {
              createDeal(formData);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
