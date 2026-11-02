"use client";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Inbox,
  Phone,
  User,
  Plus,
  Sparkles,
  Search,
  CheckCircle2,
  Handshake,
  Tag,
  ArrowRight,
  X,
  TrendingUp,
  Percent,
  Calendar,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  syncLeadToMongoDB,
  syncDealToMongoDB,
  fetchLatestRecordsFromMongoDB,
} from "@/actions/syncActions";
import LeadPoolZeroState from "./LeadPoolZeroState";

// Zod validation for manual walk-in inquiry creation
const walkinSchema = z.object({
  contactName: z
    .string()
    .trim()
    .min(2, { message: "Prospect name must be at least 2 characters" })
    .max(80, { message: "Name cannot exceed 80 characters" }),
  companyName: z.string().trim().max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, {
      message: "Enter a valid 10-digit Indian mobile number (starts with 6-9)",
    }),
  inquiryType: z
    .string()
    .min(1, { message: "Please select an inquiry type" }),
  notes: z.string().trim().max(300).optional(),
});

// Zod validation for Qualify & Create Deal modal
const qualifyDealSchema = z.object({
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
  expectedCloseDate: z
    .string()
    .min(4, { message: "Expected close date is required" }),
});

// Helper generators outside component scope for React 19 compiler purity
function generateDealCode() {
  return `DEAL-${Date.now().toString().slice(-4)}`;
}

function generateLeadCode() {
  return `LEAD-${Date.now().toString().slice(-4)}`;
}

export default function UnassignedInquiriesContent({
  ownerName = "Main HQ",
  dailyTarget = 50,
  className = "",
}) {
  // React 19 SSR hydration safety
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [toastMessage, setToastMessage] = useState("");
  const [search, setSearch] = useState("");
  const [qualifyModalLead, setQualifyModalLead] = useState(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // 1. Data Hook: Live Query watching unassigned leads in Dexie.js
  const leads = useLiveQuery(
    () => (typeof window !== "undefined" ? db.leads.where("status").equals("unassigned").toArray() : []),
    []
  );

  // 2. Initial offline hydration from MongoDB if Dexie store is empty
  useEffect(() => {
    async function hydrateInitial() {
      try {
        const count = await db.leads.count();
        if (count === 0) {
          const res = await fetchLatestRecordsFromMongoDB();
          if (res?.success && res.leads?.length > 0) {
            await db.leads.bulkPut(res.leads);
          }
        }
      } catch (err) {
        console.warn("Initial Dexie leads hydration skipped:", err?.message);
      }
    }
    hydrateInitial();
  }, []);

  // Form for Manual Walk-in Inquiry
  const {
    register: registerManual,
    handleSubmit: handleSubmitManual,
    reset: resetManual,
    formState: { errors: manualErrors, isSubmitting: isSubmittingManual },
  } = useForm({
    resolver: zodResolver(walkinSchema),
    defaultValues: {
      contactName: "",
      companyName: "",
      phone: "",
      inquiryType: "WALK_IN_RETAIL",
      notes: "",
    },
  });

  // Form for Qualify & Create Deal
  const {
    register: registerQualify,
    handleSubmit: handleSubmitQualify,
    reset: resetQualify,
    setValue: setQualifyValue,
    formState: { errors: qualifyErrors, isSubmitting: isSubmittingQualify },
  } = useForm({
    resolver: zodResolver(qualifyDealSchema),
    defaultValues: {
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

  // Action: Add new lead via React Hook Form
  const handleCreateLead = async (formData) => {
    const leadCode = generateLeadCode();
    const newLead = {
      leadCode,
      contactName: formData.contactName || formData.name,
      companyName: formData.companyName || formData.contactName || formData.name,
      phone: formData.phone,
      inquiryType: formData.inquiryType || "WALK_IN_RETAIL",
      source: "MANUAL_WALKIN",
      status: "unassigned",
      notes: formData.notes || "Walk-in inquiry recorded at counter",
      createdAt: new Date().toISOString(),
      synced: false,
    };

    try {
      await db.leads.add(newLead);
      triggerToast(`Lead "${newLead.contactName}" (${leadCode}) saved to local IndexedDB!`);
      resetManual();
      setManualModalOpen(false);

      // Background sync to MongoDB
      syncLeadToMongoDB(newLead).then((res) => {
        if (res?.success) {
          db.leads.where("leadCode").equals(leadCode).modify({ synced: true });
        }
      });
    } catch (err) {
      console.error("Failed to add lead:", err);
      triggerToast("Error saving lead to local database.");
    }
  };

  // Open Qualify Modal for a specific lead
  const handleOpenQualifyModal = (lead) => {
    setQualifyModalLead(lead);
    const defaultTitle = `${lead.companyName || lead.contactName} Commercial Order`;
    setQualifyValue("dealTitle", defaultTitle);
    setQualifyValue("dealValue", 250000);
    setQualifyValue("marginPercent", 22);
    setQualifyValue("expectedCloseDate", "2026-11-20");
  };

  // Action: Qualify & Create Deal
  // Writes new deal to db.deals.add() and updates lead status to 'qualified'
  const handleConfirmQualifyDeal = async (qualifyData) => {
    if (!qualifyModalLead) return;

    const dealCode = generateDealCode();
    const newDeal = {
      dealCode,
      title: qualifyData.dealTitle,
      clientName: qualifyModalLead.companyName || qualifyModalLead.contactName,
      contactPerson: qualifyModalLead.contactName,
      phone: qualifyModalLead.phone,
      dealValue: Number(qualifyData.dealValue) || 250000,
      marginPercent: Number(qualifyData.marginPercent) || 22,
      stage: "requirement_gathering",
      expectedCloseDate: qualifyData.expectedCloseDate,
      sourceLeadId: qualifyModalLead.leadCode || `LEAD-${qualifyModalLead.id}`,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    try {
      // 1. Add deal to Dexie
      await db.deals.add(newDeal);

      // 2. Update lead status in Dexie so it moves out of unassigned queue
      if (qualifyModalLead.id) {
        await db.leads.update(qualifyModalLead.id, {
          status: "qualified_deal",
          disposition: "CONVERTED_TO_DEAL",
        });
      } else if (qualifyModalLead.leadCode) {
        await db.leads.where("leadCode").equals(qualifyModalLead.leadCode).modify({
          status: "qualified_deal",
          disposition: "CONVERTED_TO_DEAL",
        });
      }

      triggerToast(
        `✓ Lead Qualified! Deal "${newDeal.dealCode}" inserted into Active Deals (Kanban).`
      );
      setQualifyModalLead(null);
      resetQualify();

      // 3. Background sync deal & updated lead to MongoDB
      syncDealToMongoDB(newDeal).catch((err) =>
        console.warn("Deal background sync queued:", err?.message)
      );
      syncLeadToMongoDB({
        ...qualifyModalLead,
        status: "qualified_deal",
        disposition: "CONVERTED_TO_DEAL",
      }).catch((err) => console.warn("Lead update sync queued:", err?.message));
    } catch (err) {
      console.error("Failed to qualify deal:", err);
      triggerToast("Error converting lead into deal.");
    }
  };

  // SSR Loading Pulse
  if (!isClient || leads === undefined) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4 font-sans animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="h-4 w-72 bg-slate-100 rounded-md" />
        <div className="h-32 bg-slate-50 rounded-2xl border border-slate-100" />
      </div>
    );
  }

  const filteredLeads = leads.filter((l) =>
    `${l.contactName} ${l.companyName} ${l.phone} ${l.inquiryType} ${l.notes}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md">
              Dexie Live
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONDITIONAL ZERO STATE VS REAL DATA VIEW */}
      {leads.length === 0 ? (
        <LeadPoolZeroState
          ownerName={ownerName}
          dailyTarget={dailyTarget}
          onSubmit={handleCreateLead}
          onLogLead={() => setManualModalOpen(true)}
          onPingManager={() =>
            triggerToast(`⚡ Manager ping sent to ${ownerName} for lead allocation!`)
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
          {/* List Header & Search */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200/70">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Active Inbound Leads ({leads.length})
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Live Dexie.js query &bull; Instant stage progression into Deals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter inquiries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setManualModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>+ Log Lead</span>
              </button>
            </div>
          </div>

          {/* Table of Leads with Qualify & Create Deal Action */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/70">
                  <th className="py-3 px-4">Lead Code</th>
                  <th className="py-3 px-4">Prospect &amp; Business</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Inquiry Category</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Pipeline Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id || lead.leadCode} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {lead.leadCode || `LEAD-${lead.id}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{lead.companyName || lead.contactName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{lead.contactName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{lead.phone}</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/50 mb-0.5">
                        {lead.inquiryType?.replace(/_/g, " ")}
                      </span>
                      <p className="text-[11px] text-slate-600 truncate">{lead.notes || lead.interest}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN") : "Recent"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {/* Step 1 Core Feature: Qualify & Create Deal Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenQualifyModal(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Handshake className="w-3.5 h-3.5" />
                        <span>Qualify &amp; Create Deal</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: MANUAL INQUIRY CREATION MODAL */}
      <AnimatePresence>
        {manualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Log Walk-in Prospect</h3>
                    <p className="text-[11px] text-slate-500">Persists to Dexie.js + MongoDB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitManual(handleCreateLead)} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Prospect / Contact Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...registerManual("contactName")}
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                  {manualErrors.contactName && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                      {manualErrors.contactName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Name</label>
                  <input
                    {...registerManual("companyName")}
                    type="text"
                    placeholder="e.g. Patel Engineering Works"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Indian Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...registerManual("phone")}
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                  {manualErrors.phone && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                      {manualErrors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inquiry Category</label>
                  <select
                    {...registerManual("inquiryType")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  >
                    <option value="WALK_IN_RETAIL">Walk-in Retail Inquiry</option>
                    <option value="WHOLESALE_BULK">Wholesale Bulk Procurement</option>
                    <option value="CONTRACT_TENDER">Contract / Tender Inquiry</option>
                    <option value="PRODUCT_SAMPLE">Product Sample Request</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Requirement Notes</label>
                  <textarea
                    {...registerManual("notes")}
                    rows={2}
                    placeholder="Special requirements, part numbers, quantity requested..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingManual}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save to Queue</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: QUALIFY & CREATE DEAL MODAL */}
      <AnimatePresence>
        {qualifyModalLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Qualify Lead into Commercial Deal
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      From: <strong className="text-slate-800">{qualifyModalLead.companyName || qualifyModalLead.contactName}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQualifyModalLead(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitQualify(handleConfirmQualifyDeal)} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Deal Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...registerQualify("dealTitle")}
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-hidden focus:border-purple-600"
                  />
                  {qualifyErrors.dealTitle && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                      {qualifyErrors.dealTitle.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Estimated Deal Value (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...registerQualify("dealValue")}
                      type="number"
                      step="5000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
                    />
                    {qualifyErrors.dealValue && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {qualifyErrors.dealValue.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Target Margin % (HQ Min 18%) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...registerQualify("marginPercent")}
                      type="number"
                      min="18"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
                    />
                    {qualifyErrors.marginPercent && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {qualifyErrors.marginPercent.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Expected Close Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...registerQualify("expectedCloseDate")}
                    type="date"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-[11px] text-purple-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    Submitting writes to <strong>db.deals</strong>, updates lead status, and syncs to MongoDB.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setQualifyModalLead(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQualify}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Create Deal</span>
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
