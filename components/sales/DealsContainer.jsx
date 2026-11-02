"use client";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  FileText,
  DollarSign,
} from "lucide-react";
import { db } from "@/lib/db";
import { syncDealToMongoDB, fetchLatestRecordsFromMongoDB } from "@/actions/syncActions";
import DealsZeroState from "./DealsZeroState";

// Dedicated Kanban View for Active Pipeline Deals
export function ActiveDealsKanban({ deals = [], onUpdateStage, onCreateDeal }) {
  const KANBAN_STAGES = [
    { id: "requirement_gathering", label: "Requirement Gathering" },
    { id: "negotiation", label: "Negotiation" },
    { id: "won", label: "Won (Archived / CRM)" },
    { id: "lost", label: "Lost" },
  ];

  return (
    <div className="space-y-4">
      {/* Header with Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Live Pipeline Deals ({deals.length})
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Real-time Dexie.js useLiveQuery &bull; Stage Gateway &bull; Owner 18% margin floor
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateDeal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-purple-400" />
          <span>+ Create New Deal</span>
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
                        Margin: {deal.marginPercent || 22}%
                      </div>
                    </div>

                    {/* Stage Progression Controls */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      {col.id === "requirement_gathering" && (
                        <button
                          type="button"
                          onClick={() => onUpdateStage(deal, "negotiation")}
                          className="w-full py-1 rounded-lg bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Move to Negotiation</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {col.id === "negotiation" && (
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => onUpdateStage(deal, "won")}
                            className="flex-1 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            Mark Won ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateStage(deal, "lost")}
                            className="py-1 px-2 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                          >
                            Lost
                          </button>
                        </div>
                      )}

                      {(col.id === "won" || col.id === "lost") && (
                        <span className="text-[10px] font-mono text-slate-400 mx-auto">
                          Archived in Dexie
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {colDeals.length === 0 && (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                    No active deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DealsContainer({
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
  const [dealModalOpen, setDealModalOpen] = useState(false);

  // 1. Live Query: Watch non-won active pipeline deals in Dexie
  const deals = useLiveQuery(
    () => (typeof window !== "undefined" ? db.deals.where("stage").notEqual("won").toArray() : []),
    []
  );

  useEffect(() => {
    // Background hydration sync: if Dexie is empty on startup, pull existing deals from MongoDB
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
        console.warn("Initial Deals hydration skipped:", err?.message);
      }
    }
    hydrateInitial();
  }, []);

  const triggerFeedback = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // 2. Action: Write new Deal to Dexie and background sync to MongoDB
  const handleCreateDeal = async (formData) => {
    const newDeal = {
      dealCode: `DEAL-${Date.now().toString().slice(-4)}`,
      title: formData.title || `${formData.clientName} Proposal`,
      clientName: formData.clientName,
      contactPerson: formData.contactPerson || formData.clientName,
      phone: formData.phone || "",
      dealValue: Number(formData.dealValue) || 100000,
      stage: formData.stage || "requirement_gathering",
      expectedCloseDate: formData.expectedCloseDate || new Date().toISOString().split("T")[0],
      assignedAE: "Active AE",
      marginPercent: Number(formData.marginPercent) || 22,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    // Immediate local insertion (Dexie useLiveQuery detects this instantly!)
    await db.deals.add(newDeal);
    setDealModalOpen(false);
    triggerFeedback(`✓ Deal ${newDeal.dealCode} inserted into Dexie pipeline!`);

    // Asynchronous background sync to MongoDB
    syncDealToMongoDB(newDeal)
      .then((res) => {
        if (res?.success) {
          db.deals.where("dealCode").equals(newDeal.dealCode).modify({ synced: true });
        }
      })
      .catch((err) => {
        console.error("Background sync error for Deal:", err);
      });
  };

  // Update deal stage
  const handleUpdateStage = async (deal, newStage) => {
    await db.deals.where("dealCode").equals(deal.dealCode).modify({
      stage: newStage,
    });

    triggerFeedback(`✓ Deal ${deal.dealCode} stage updated to ${newStage}!`);

    syncDealToMongoDB({
      ...deal,
      stage: newStage,
    }).catch(console.error);
  };

  if (!isClient || deals === undefined) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 animate-pulse text-center">
        <Handshake className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
        <span className="text-xs font-bold text-slate-400">Loading pipeline from Dexie...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
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
            <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded-md">
              Dexie LiveSync Active
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONDITIONAL ZERO STATE VS REAL DATA VIEW */}
      {deals.length === 0 ? (
        <DealsZeroState
          ownerName={ownerName}
          currentMonthTarget={currentMonthTarget}
          currentBooked={0}
          onSubmit={handleCreateDeal}
        />
      ) : (
        <ActiveDealsKanban
          deals={deals}
          onUpdateStage={handleUpdateStage}
          onCreateDeal={() => setDealModalOpen(true)}
        />
      )}

      {/* Create Deal Modal */}
      <AnimatePresence>
        {dealModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Handshake className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Draft New Deal (Dexie + MongoDB)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDealModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target;
                  handleCreateDeal({
                    clientName: target.clientName.value,
                    dealValue: target.dealValue.value,
                    marginPercent: target.marginPercent.value,
                    expectedCloseDate: target.expectedCloseDate.value,
                  });
                }}
                className="pt-4 space-y-3.5 text-xs font-medium text-slate-700"
              >
                <div>
                  <label className="font-bold block mb-1">
                    Client / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="clientName"
                    type="text"
                    required
                    placeholder="e.g. Mahavir Textiles Private Limited"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">
                      Deal Value (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="dealValue"
                      type="number"
                      required
                      min="1000"
                      placeholder="75000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Target Margin (%)</label>
                    <input
                      name="marginPercent"
                      type="number"
                      min="18"
                      defaultValue="22"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold block mb-1">Expected Close Date</label>
                  <input
                    name="expectedCloseDate"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDealModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-md cursor-pointer"
                  >
                    + Write Deal to Dexie
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
