"use client";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  UserCheck,
  Plus,
  Phone,
  User,
  Sparkles,
  Tag,
  Building2,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  X,
  Clock,
  ArrowRight,
  Headset,
} from "lucide-react";
import { db } from "@/lib/db";
import { syncLeadToMongoDB, fetchLatestRecordsFromMongoDB } from "@/actions/syncActions";
import LeadPoolZeroState from "./LeadPoolZeroState";

// Dedicated List View for Active Inquiries
export function UnassignedInquiriesList({ data = [], onClaimLead, onLogWalkin }) {
  const [search, setSearch] = useState("");

  const filtered = data.filter((l) =>
    `${l.contactName} ${l.companyName} ${l.phone} ${l.inquiryType} ${l.interest}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
      {/* List Header & Search */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Active Inbound Leads ({data.length})
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Live Dexie.js query &bull; Auto-synced with MongoDB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <button
            type="button"
            onClick={onLogWalkin}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Walk-in Lead</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/70">
              <th className="py-3 px-4">Lead Code</th>
              <th className="py-3 px-4">Prospect &amp; Company</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4">Inquiry Category</th>
              <th className="py-3 px-4">Origin</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map((lead) => (
              <tr key={lead.id || lead.leadCode} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                  {lead.leadCode}
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
                  <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 mb-0.5">
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
                  <button
                    type="button"
                    onClick={() => onClaimLead(lead)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Claim Lead</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LeadPoolContainer({
  ownerName = "Main HQ",
  dailyTarget = 50,
  className = "",
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [toastMessage, setToastMessage] = useState("");
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);

  // 1. Live Query to local Dexie IndexedDB
  const leads = useLiveQuery(
    () => (typeof window !== "undefined" ? db.leads.where("status").equals("unassigned").toArray() : []),
    []
  );

  useEffect(() => {
    // Background hydration sync: if Dexie is empty on startup, pull existing leads from MongoDB
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
        console.warn("Initial Dexie hydration skipped:", err?.message);
      }
    }
    hydrateInitial();
  }, []);

  const triggerFeedback = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // 2. Action: Write to Dexie and background sync to MongoDB
  const handleCreateLead = async (formData) => {
    const newLead = {
      leadCode: `LEAD-${Date.now().toString().slice(-4)}`,
      contactName: formData.name,
      companyName: formData.name,
      phone: formData.phone,
      inquiryType: formData.inquiryType || "WALK_IN_RETAIL",
      interest: formData.notes || formData.inquiryType,
      notes: formData.notes || "",
      source: "MANUAL_WALKIN",
      status: "unassigned",
      createdAt: new Date().toISOString(),
      synced: false,
    };

    // Immediate local insertion (Dexie useLiveQuery instantly detects this!)
    await db.leads.add(newLead);
    setWalkinModalOpen(false);
    triggerFeedback(`✓ Lead ${newLead.leadCode} (${newLead.contactName}) written to Dexie!`);

    // Asynchronous background sync to MongoDB
    syncLeadToMongoDB(newLead)
      .then((res) => {
        if (res?.success) {
          db.leads.where("leadCode").equals(newLead.leadCode).modify({ synced: true });
        }
      })
      .catch((err) => {
        console.error("Background sync error:", err);
      });
  };

  // Claim Lead: changes status to 'claimed' in Dexie
  const handleClaimLead = async (lead) => {
    await db.leads.where("leadCode").equals(lead.leadCode).modify({
      status: "claimed",
      claimedBy: "You (Active AE)",
    });

    triggerFeedback(`✓ Lead ${lead.leadCode} claimed into active queue!`);

    syncLeadToMongoDB({
      ...lead,
      status: "claimed",
      claimedBy: "You (Active AE)",
    }).catch(console.error);
  };

  // Prevent SSR flash
  if (!isClient || leads === undefined) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 animate-pulse text-center">
        <Headset className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
        <span className="text-xs font-bold text-slate-400">Querying Dexie IndexedDB...</span>
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
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md">
              Dexie LiveSync Active
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONDITIONAL ZERO STATE VS REAL DATA VIEW */}
      {leads.length === 0 ? (
        <LeadPoolZeroState
          ownerName={ownerName}
          dailyTarget={dailyTarget}
          callsCompleted={0}
          onSubmit={handleCreateLead}
          onPingManager={() => triggerFeedback("⚡ Lead allocation ping transmitted to HQ!")}
        />
      ) : (
        <UnassignedInquiriesList
          data={leads}
          onClaimLead={handleClaimLead}
          onLogWalkin={() => setWalkinModalOpen(true)}
        />
      )}

      {/* Walk-in Lead Logging Modal */}
      <AnimatePresence>
        {walkinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Log Walk-in Lead (Dexie + MongoDB)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setWalkinModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target;
                  handleCreateLead({
                    name: target.name.value,
                    phone: target.phone.value,
                    inquiryType: target.inquiryType.value,
                    notes: target.notes.value,
                  });
                }}
                className="pt-4 space-y-3.5 text-xs font-medium text-slate-700"
              >
                <div>
                  <label className="font-bold block mb-1">
                    Prospect Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    10-Digit Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9825012345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <select
                    name="inquiryType"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                  >
                    <option value="WALK_IN_RETAIL">Counter / Store Walk-in Customer</option>
                    <option value="WHOLESALE_BULK">Wholesale B2B / Bulk Order</option>
                    <option value="PRICE_ESTIMATE">Custom Estimate / Rate Inquire</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Requirements / Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Item details, quantities..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setWalkinModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-md cursor-pointer"
                  >
                    + Write to Dexie &amp; Sync
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
