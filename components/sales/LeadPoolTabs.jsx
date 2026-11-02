"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  PhoneCall,
  Calendar,
  UserCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Phone,
  Building2,
  Tag,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  User,
  Check,
  X,
  FileText,
  ChevronRight,
  Headset,
} from "lucide-react";
import { useSalesFlow } from "@/context/SalesFlowContext";
import LeadPoolZeroState from "./LeadPoolZeroState";
import LeadPoolContainer from "./LeadPoolContainer";
import UnassignedInquiriesContent from "./UnassignedInquiriesContent";

export default function LeadPoolTabs({
  ownerName = "Main HQ",
  paramKey = "tab", // allows customizable query param name
  className = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    unassignedLeads,
    coldCallQueue,
    followUps,
    claimLead,
    logCallDisposition,
    qualifyAndCreateDeal,
    triggerToast,
  } = useSalesFlow();

  // URL Query Param state management
  const currentTabFromUrl = searchParams?.get(paramKey) || searchParams?.get("leadSubtab") || "unassigned";
  
  // Normalized active tab state
  const activeTab = ["unassigned", "cold-call-queue", "follow-up-calendar"].includes(currentTabFromUrl)
    ? currentTabFromUrl
    : "unassigned";

  const handleTabChange = (newTab) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set(paramKey, newTab);
    params.set("leadSubtab", newTab); // dual compatibility
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Callback modal state for Cold Call Queue
  const [callbackModalLead, setCallbackModalLead] = useState(null);
  const [callbackForm, setCallbackForm] = useState({
    date: "Tomorrow",
    time: "11:30 AM",
    priority: "HIGH",
    notes: "",
  });

  const handleSaveCallback = (e) => {
    e.preventDefault();
    if (!callbackModalLead) return;
    logCallDisposition(
      callbackModalLead.id,
      "CALLBACK_SCHEDULED",
      callbackForm.notes || "Customer requested callback",
      {
        contactName: callbackModalLead.contactName,
        companyName: callbackModalLead.companyName,
        phone: callbackModalLead.phone,
        date: callbackForm.date,
        time: callbackForm.time,
        priority: callbackForm.priority,
      }
    );
    setCallbackModalLead(null);
    setCallbackForm({ date: "Tomorrow", time: "11:30 AM", priority: "HIGH", notes: "" });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* MODULE HEADER WITH PILL-MENU SUB-NAVIGATION ON THE RIGHT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-200/60 shadow-2xs">
            <Headset className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Lead Pool &amp; Telecalling Hub
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Capture raw inquiries, dial cold call prospects, and schedule targeted follow-ups
            </p>
          </div>
        </div>

        {/* PILL MENU NAVIGATION */}
        <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            {
              id: "unassigned",
              label: "Unassigned Inquiries",
              icon: Inbox,
              badge: unassignedLeads.length,
            },
            {
              id: "cold-call-queue",
              label: "Cold Call Queue",
              icon: PhoneCall,
              badge: coldCallQueue.length,
            },
            {
              id: "follow-up-calendar",
              label: "Follow-Up Calendar",
              icon: Calendar,
              badge: followUps.length,
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
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-blue-50 text-blue-700 font-mono" : "bg-slate-200 text-slate-600 font-mono"
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
          TAB 1: UNASSIGNED INQUIRIES (REAL-TIME DEXIE + MONGO SYNC)
         ========================================================================= */}
      {activeTab === "unassigned" && (
        <UnassignedInquiriesContent ownerName={ownerName} />
      )}

      {/* =========================================================================
          TAB 2: COLD CALL QUEUE
         ========================================================================= */}
      {activeTab === "cold-call-queue" && (
        <div className="space-y-4">
          {!coldCallQueue || coldCallQueue.length === 0 ? (
            /* Strict Component-Level Zero State: No List Wrappers or Thead */
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <PhoneCall className="w-8 h-8 text-blue-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Your telecalling queue is currently empty.
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Claim inbound leads from Unassigned Inquiries or log new walk-in prospects to start dialing.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("unassigned")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Claim Inbound Leads</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {coldCallQueue.map((lead) => (
                <div
                  key={lead.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">
                        {lead.id}
                      </span>
                      <span className="font-black text-sm text-slate-900">
                        {lead.companyName || lead.contactName}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                        {lead.city || "Branch Territory"}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        • {lead.callAttempts || 0} Attempts
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {lead.contactName}
                      </span>
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {lead.phone}
                      </a>
                      <span className="text-slate-400">• Last dialed: {lead.lastContact || "Pending"}</span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      💡 {lead.notes || lead.interest || "Prospect interested in bulk order catalog."}
                    </p>
                  </div>

                  {/* Inline Dispositions & Cross-Flow Action */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    {/* Disposition 1: Interested */}
                    <button
                      type="button"
                      onClick={() =>
                        logCallDisposition(lead.id, "INTERESTED", "Prospect confirmed active requirements")
                      }
                      className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Interested ✓
                    </button>

                    {/* Disposition 2: Schedule Callback */}
                    <button
                      type="button"
                      onClick={() => setCallbackModalLead(lead)}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      Callback 🕒
                    </button>

                    {/* Disposition 3: Disqualified */}
                    <button
                      type="button"
                      onClick={() =>
                        logCallDisposition(lead.id, "DISQUALIFIED", "Budget not matching or out of service area")
                      }
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Disqualify
                    </button>

                    {/* PRIMARY ACTION: QUALIFY & CREATE DEAL */}
                    <button
                      type="button"
                      onClick={() => qualifyAndCreateDeal(lead)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition-all shadow-md shadow-slate-900/10 cursor-pointer ml-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Qualify &amp; Create Deal</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: FOLLOW-UP CALENDAR
         ========================================================================= */}
      {activeTab === "follow-up-calendar" && (
        <div className="space-y-4">
          {!followUps || followUps.length === 0 ? (
            /* Strict Component-Level Zero State: No Banner or List Wrappers */
            <div className="p-10 sm:p-14 text-center rounded-3xl border border-slate-200 bg-slate-50 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <Calendar className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  No callbacks scheduled for today.
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Marking a lead as &quot;Callback Requested&quot; in the Cold Call Queue will automatically schedule reminders here.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("cold-call-queue")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Open Cold Call Queue</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between text-xs font-bold text-indigo-950">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Today&apos;s Telecalling Agenda &amp; Scheduled Callbacks ({followUps.length})</span>
                </div>
                <span className="text-[11px] text-indigo-700 font-mono">Real-time Reminders Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followUps.map((fu) => (
                <div
                  key={fu.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      <Clock className="w-3 h-3 text-indigo-600" />
                      <span>{fu.scheduledDate} • {fu.scheduledTime}</span>
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        fu.priority === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {fu.priority} Priority
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">{fu.companyName}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                      <User className="w-3 h-3" />
                      <span>{fu.contactName}</span>
                      <span>•</span>
                      <a href={`tel:${fu.phone}`} className="font-mono font-bold text-blue-600">
                        {fu.phone}
                      </a>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    📝 {fu.agenda}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={`tel:${fu.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Dial Now</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => triggerToast(`✓ Callback for ${fu.companyName} marked completed!`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

      {/* SCHEDULE CALLBACK MODAL */}
      <AnimatePresence>
        {callbackModalLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Schedule Callback</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {callbackModalLead.companyName || callbackModalLead.contactName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCallbackModalLead(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCallback} className="p-5 space-y-3.5 text-xs font-medium text-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Target Date</label>
                    <select
                      value={callbackForm.date}
                      onChange={(e) => setCallbackForm({ ...callbackForm, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900"
                    >
                      <option value="Today">Today</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="Day After Tomorrow">In 2 Days</option>
                      <option value="Next Monday">Next Monday</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Preferred Time</label>
                    <input
                      type="text"
                      value={callbackForm.time}
                      onChange={(e) => setCallbackForm({ ...callbackForm, time: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Urgency Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["LOW", "MEDIUM", "HIGH"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCallbackForm({ ...callbackForm, priority: p })}
                        className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          callbackForm.priority === p
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Notes / Call Agenda</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Call after factory shift change; discuss pricing"
                    value={callbackForm.notes}
                    onChange={(e) => setCallbackForm({ ...callbackForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCallbackModalLead(null)}
                    className="px-3.5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold cursor-pointer"
                  >
                    Confirm Callback Slot
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
