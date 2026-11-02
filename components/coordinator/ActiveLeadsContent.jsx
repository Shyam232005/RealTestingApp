"use client";

import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Users,
  Phone,
  Tag,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { dexieDb } from "@/lib/dexieDb";

/**
 * ActiveLeadsContent - Coordinator Active Leads Data Table
 * Strict Root-Cause Architecture:
 * - Direct LiveQuery over Dexie leads
 * - Early return zero state when empty
 * - Pure dynamic data.map() loop in <tbody> with ZERO hardcoded fallback rows
 * - Absolutely NO 'LEAD-AUTO' or hardcoded 70% fallback strings
 */
export default function ActiveLeadsContent({
  leads: propLeads,
  onAssignLead,
  className = "",
}) {
  const liveLeads = useLiveQuery(
    async () => {
      try {
        return await dexieDb.leads
          .filter((lead) => lead.status !== "archived")
          .reverse()
          .sortBy("createdAt");
      } catch (e) {
        console.error("Dexie active leads live query error:", e);
        return [];
      }
    },
    [],
    []
  );

  const leads = propLeads !== undefined ? propLeads : liveLeads;

  // Step 4: Strict Early-Return Zero State Architecture
  if (!leads || leads.length === 0) {
    return (
      <div className={`p-12 text-center rounded-3xl border border-slate-200 bg-white shadow-xs ${className}`}>
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          Zero Active Leads in Pool
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          There are currently no raw or unassigned inbound leads awaiting coordinator delegation. New inquiries from marketing campaigns or walk-ins will appear here automatically.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Tier 1 Assistants can log walk-in leads directly into the live Dexie pool</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Lead Details</th>
              <th className="px-5 py-3.5">Contact / Phone</th>
              <th className="px-5 py-3.5">Inquiry Type</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Lead Score</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const leadScoreNum = typeof lead.leadScore === "number" ? lead.leadScore : null;
              const displayCode = lead.leadCode || lead.id || lead._id || "NEW-LEAD";

              return (
                <tr key={lead.id || lead._id || displayCode} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-bold text-slate-900 block text-xs">
                      {lead.companyName || lead.contactName || "Direct Prospect"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {displayCode}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{lead.phone || "No phone provided"}</span>
                    </div>
                    {lead.contactName && lead.companyName && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Attn: {lead.contactName}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {lead.inquiryType || "COMMERCIAL"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                      {lead.status || "UNASSIGNED"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {leadScoreNum !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, leadScoreNum))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-700">
                          {leadScoreNum}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        Unscored
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onAssignLead && onAssignLead(lead)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>Assign</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
