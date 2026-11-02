"use client";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Handshake,
  Kanban,
  Plus,
  ArrowRight,
  Building2,
  Calendar,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  Calculator,
  ChevronDown,
  ChevronUp,
  Tag,
  Receipt,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  syncDealToMongoDB,
  fetchLatestRecordsFromMongoDB,
} from "@/actions/syncActions";
import DealsZeroState from "./DealsZeroState";

// Zod Schema for creating new deals from Draft New Estimate
const dealSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(2, { message: "Client name must be at least 2 characters" }),
  dealTitle: z
    .string()
    .trim()
    .min(3, { message: "Deal title must be at least 3 characters" }),
  dealValue: z.coerce
    .number()
    .min(1000, { message: "Deal value must be at least ₹1,000" }),
  marginPercent: z.coerce
    .number()
    .min(18, { message: "Minimum margin must satisfy the 18% floor set by HQ" }),
  expectedCloseDate: z.string().min(4, { message: "Close date is required" }),
});

// Helper generators outside component scope for React 19 compiler purity
function generateActiveDealCode() {
  return `DEAL-${Date.now().toString().slice(-4)}`;
}

function generateQuoteItemId() {
  return Date.now();
}

// Inline Form Component on each Active Deal Card
function InlineMarginQuoteForm({ deal, onSaveItem }) {
  const [expanded, setExpanded] = useState(false);
  const [itemName, setItemName] = useState("");
  const [costPrice, setCostPrice] = useState(15000);
  const [sellingPrice, setSellingPrice] = useState(20000);
  const [quantity, setQuantity] = useState(1);

  // Live dynamic calculation of margin
  const calculatedMargin =
    sellingPrice > 0
      ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 100)
      : 0;

  const isMarginHealthy = calculatedMargin >= 18;

  const handleAddLineItem = (e) => {
    e.preventDefault();
    if (!itemName) return;

    const lineTotal = Number(sellingPrice) * Number(quantity);
    const item = {
      id: generateQuoteItemId(),
      description: itemName,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity),
      total: lineTotal,
      marginPercent: calculatedMargin,
    };

    onSaveItem(deal, item);
    setItemName("");
    setQuantity(1);
    setExpanded(false);
  };

  return (
    <div className="pt-2 border-t border-slate-100 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full py-1 px-2 rounded-xl bg-purple-50 hover:bg-purple-100/70 text-purple-700 font-bold flex items-center justify-between transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5" />
          <span>Margin Calculator &amp; Quote Items</span>
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <form onSubmit={handleAddLineItem} className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
              Line Item / Part Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MS Flanges &amp; Fasteners"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                Selling (₹)
              </label>
              <input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                Qty
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Real-time Dynamic Margin Floor Badge */}
          <div className="flex items-center justify-between pt-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isMarginHealthy
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {isMarginHealthy
                ? `✓ Healthy Margin: ${calculatedMargin}%`
                : `⚠️ ${calculatedMargin}% (Below 18% Floor)`}
            </span>

            <button
              type="submit"
              disabled={!isMarginHealthy}
              className={`px-2.5 py-1 rounded-lg text-white font-bold text-[11px] transition-all cursor-pointer ${
                isMarginHealthy
                  ? "bg-slate-900 hover:bg-black"
                  : "bg-slate-400 cursor-not-allowed"
              }`}
            >
              + Add to Quote
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ActiveDealsContent({
  ownerName = "Main HQ",
  currentMonthTarget = 500000,
  className = "",
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [toastMessage, setToastMessage] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // 1. Data Hook: Live Query watching active deals (stage !== 'won') in Dexie.js
  const deals = useLiveQuery(
    () => (typeof window !== "undefined" ? db.deals.where("stage").notEqual("won").toArray() : []),
    []
  );

  // 2. Initial offline hydration from MongoDB if Dexie store is empty
  useEffect(() => {
    async function hydrateInitial() {
      try {
        const count = await db.deals.count();
        if (count === 0) {
          const res = await fetchLatestRecordsFromMongoDB();
          if (res?.success && res.deals?.length > 0) {
            await db.deals.bulkPut(res.deals);
          }
        }
      } catch (err) {
        console.warn("Initial Dexie deals hydration skipped:", err?.message);
      }
    }
    hydrateInitial();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      clientName: "",
      dealTitle: "",
      dealValue: 250000,
      marginPercent: 22,
      expectedCloseDate: "2026-11-20",
    },
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Action: Create Deal from Draft Estimate
  const handleCreateDeal = async (formData) => {
    const dealCode = generateActiveDealCode();
    const newDeal = {
      dealCode,
      title: formData.dealTitle || `${formData.clientName} Contract`,
      clientName: formData.clientName,
      contactPerson: formData.clientName,
      dealValue: Number(formData.dealValue) || 250000,
      marginPercent: Number(formData.marginPercent) || 22,
      stage: "requirement_gathering",
      expectedCloseDate: formData.expectedCloseDate,
      quoteItems: [],
      createdAt: new Date().toISOString(),
      synced: false,
    };

    try {
      await db.deals.add(newDeal);
      triggerToast(`Deal "${dealCode}" created in Requirement Gathering!`);
      reset();
      setCreateModalOpen(false);

      // Background sync to MongoDB
      syncDealToMongoDB(newDeal).then((res) => {
        if (res?.success) {
          db.deals.where("dealCode").equals(dealCode).modify({ synced: true });
        }
      });
    } catch (err) {
      console.error("Failed to add deal:", err);
      triggerToast("Error saving deal to IndexedDB.");
    }
  };

  // Action: Update Stage (e.g. Requirement Gathering -> Negotiation -> Won)
  const handleUpdateStage = async (deal, newStage) => {
    try {
      if (deal.id) {
        await db.deals.update(deal.id, { stage: newStage });
      } else if (deal.dealCode) {
        await db.deals.where("dealCode").equals(deal.dealCode).modify({ stage: newStage });
      }

      triggerToast(
        newStage === "won"
          ? `🎉 Deal "${deal.dealCode}" marked WON! Synced to Master Client Directory.`
          : `Deal "${deal.dealCode}" moved to ${newStage.replace(/_/g, " ")}.`
      );

      // Background sync to MongoDB
      syncDealToMongoDB({ ...deal, stage: newStage }).catch((err) =>
        console.warn("Background deal stage update queued:", err?.message)
      );
    } catch (err) {
      console.error("Failed to update deal stage:", err);
    }
  };

  // Action: Add Quote Line Item & Recalculate Margin on Active Deal Card
  const handleSaveLineItem = async (deal, item) => {
    const existingItems = deal.quoteItems || [];
    const updatedItems = [...existingItems, item];
    const newTotal = updatedItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const avgMargin = Math.round(
      updatedItems.reduce((sum, it) => sum + (it.marginPercent || 0), 0) / updatedItems.length
    );

    try {
      if (deal.id) {
        await db.deals.update(deal.id, {
          quoteItems: updatedItems,
          dealValue: newTotal > 0 ? newTotal : deal.dealValue,
          marginPercent: avgMargin > 0 ? avgMargin : deal.marginPercent,
        });
      } else if (deal.dealCode) {
        await db.deals.where("dealCode").equals(deal.dealCode).modify({
          quoteItems: updatedItems,
          dealValue: newTotal > 0 ? newTotal : deal.dealValue,
          marginPercent: avgMargin > 0 ? avgMargin : deal.marginPercent,
        });
      }

      triggerToast(`Line item "${item.description}" added to ${deal.dealCode}!`);

      // Background sync updated quote lines
      syncDealToMongoDB({
        ...deal,
        quoteItems: updatedItems,
        dealValue: newTotal > 0 ? newTotal : deal.dealValue,
        marginPercent: avgMargin > 0 ? avgMargin : deal.marginPercent,
      }).catch((err) => console.warn("Quote update sync queued:", err?.message));
    } catch (err) {
      console.error("Failed to update quote items:", err);
    }
  };

  // SSR Loading Pulse
  if (!isClient || deals === undefined) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4 font-sans animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="h-4 w-72 bg-slate-100 rounded-md" />
        <div className="grid grid-cols-4 gap-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-slate-50 rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const KANBAN_STAGES = [
    { id: "requirement_gathering", label: "Requirement Gathering" },
    { id: "negotiation", label: "Negotiation" },
    { id: "won", label: "Won (Auto-Synced)" },
    { id: "lost", label: "Lost" },
  ];

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded-md">
              Dexie Live
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONDITIONAL ZERO STATE VS KANBAN BOARD */}
      {deals.length === 0 ? (
        <DealsZeroState
          ownerName={ownerName}
          currentMonthTarget={currentMonthTarget}
          onSubmit={handleCreateDeal}
          onDraftEstimate={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {/* Header with Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Live Active Deals ({deals.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Dexie.js reactive Kanban &bull; Interactive inline quote margin calculator &bull; 18% floor
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>+ Draft New Estimate</span>
            </button>
          </div>

          {/* 4-Stage Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {KANBAN_STAGES.map((col) => {
              const colDeals = deals.filter((d) => d.stage === col.id);
              const colValue = colDeals.reduce((sum, d) => sum + (Number(d.dealValue) || 0), 0);

              return (
                <div
                  key={col.id}
                  className="flex flex-col rounded-3xl bg-slate-50/70 border border-slate-200/90 p-3.5 space-y-3 min-h-[460px]"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {col.label}
                      </h4>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        ₹{colValue.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {colDeals.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colDeals.map((deal) => (
                      <div
                        key={deal.id || deal.dealCode}
                        className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">
                              {deal.dealCode}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                              {deal.title || deal.clientName}
                            </h5>
                          </div>
                          <span className="text-xs font-mono font-black text-slate-900 shrink-0">
                            ₹{Number(deal.dealValue).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-0.5 font-medium">
                          <div className="font-semibold text-slate-700">{deal.clientName}</div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Close: {deal.expectedCloseDate || "This Month"}</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold">
                            Effective Margin: {deal.marginPercent || 22}%
                          </div>
                        </div>

                        {/* Existing Quote Items Summary */}
                        {deal.quoteItems && deal.quoteItems.length > 0 && (
                          <div className="p-2 rounded-xl bg-purple-50/50 border border-purple-100 text-[10px] space-y-1">
                            <span className="font-bold text-purple-900 block">
                              Quote Lines ({deal.quoteItems.length}):
                            </span>
                            {deal.quoteItems.map((qi, idx) => (
                              <div key={idx} className="flex justify-between text-slate-600 font-mono">
                                <span className="truncate max-w-[120px]">{qi.description}</span>
                                <span>₹{qi.total?.toLocaleString("en-IN")}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Step 2 Core Feature: Interactive Inline Margin Calculator & Quote Generator */}
                        <InlineMarginQuoteForm
                          deal={deal}
                          onSaveItem={handleSaveLineItem}
                        />

                        {/* Stage Progression Controls */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {col.id === "requirement_gathering" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStage(deal, "negotiation")}
                              className="w-full py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Move to Negotiation</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {col.id === "negotiation" && (
                            <div className="flex items-center gap-1.5 w-full">
                              <button
                                type="button"
                                onClick={() => handleUpdateStage(deal, "won")}
                                className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                Mark Won ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStage(deal, "lost")}
                                className="py-1.5 px-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                              >
                                Lost
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE DEAL / ESTIMATE MODAL */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Handshake className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Draft New Estimate</h3>
                    <p className="text-[11px] text-slate-500">Subject to Owner minimum 18% margin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleCreateDeal)} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Client Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register("clientName")}
                    type="text"
                    placeholder="e.g. Modern Fabricators LLP"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-hidden focus:border-purple-600"
                  />
                  {errors.clientName && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                      {errors.clientName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Deal Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register("dealTitle")}
                    type="text"
                    placeholder="e.g. Q4 Supply Agreement"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-hidden focus:border-purple-600"
                  />
                  {errors.dealTitle && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                      {errors.dealTitle.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Estimated Deal Value (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register("dealValue")}
                      type="number"
                      step="5000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
                    />
                    {errors.dealValue && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.dealValue.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Margin % (HQ Min 18%) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register("marginPercent")}
                      type="number"
                      min="18"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
                    />
                    {errors.marginPercent && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.marginPercent.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Expected Close Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register("expectedCloseDate")}
                    type="date"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Deal</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
