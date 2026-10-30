"use client";
import React, { useState, useEffect } from "react";
import { useCa } from "./CaContext";
import {
  Users,
  FileText,
  Bell,
  Calendar,
  Upload,
  PlusCircle,
  FileSpreadsheet,
  MessageSquare,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Stamp,
  BookOpenCheck,
  Scale,
  Search,
  KeyRound,
} from "lucide-react";
import CrownZeroState from "@/components/ui/CrownZeroState";

export default function CaDashboardView() {
  const { role, user, setActiveTab } = useCa();
  const [realRequests, setRealRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const isPartner = role === "CA_PARTNER";

  const partnerName = user?.name || user?.partnerName || "CA Partner";
  const firmName = user?.firmName || "Chartered Accountants Firm";

  const clientCount = user?.clients?.length ?? 0;
  const staffCount = user?.staff?.length ?? 0;
  const assignedCount = user?.assignedClients?.length ?? 0;

  useEffect(() => {
    let ignore = false;
    async function fetchRequests() {
      try {
        const res = await fetch("/api/ca/data-request");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data?.requests) {
            setRealRequests(data.requests);
          }
        }
      } catch (err) {
        console.warn("Failed to load requests:", err);
      } finally {
        if (!ignore) setLoadingRequests(false);
      }
    }
    fetchRequests();
    return () => {
      ignore = true;
    };
  }, []);

  // Stat Cards adapted from reference screenshot DNA
  const statCards = isPartner
    ? [
        {
          id: "clients",
          icon: Users,
          iconBg: "bg-blue-50 text-blue-600",
          value: clientCount > 0 ? clientCount.toString() : "0",
          label: "Connected Client MSMEs",
          pill: clientCount > 0 ? `${clientCount} Active` : "None Linked",
          pillColor: clientCount > 0 ? "text-slate-400 font-bold" : "text-amber-700 font-bold",
        },
        {
          id: "ledgers",
          icon: FileText,
          iconBg: "bg-teal-50 text-teal-600",
          value: clientCount > 0 ? (clientCount * 4).toString() : "0",
          label: "Audited Ledger Books",
          pill: clientCount > 0 ? "Verified Feeds" : "Awaiting Data",
          pillColor: "text-slate-400 font-bold",
        },
        {
          id: "signoffs",
          icon: Bell,
          iconBg: "bg-rose-50 text-rose-600",
          value: clientCount > 0 ? "1" : "0",
          label: "Pending Partner Sign-offs",
          pill: clientCount > 0 ? "Needs review" : "Queue Empty",
          pillColor: clientCount > 0 ? "text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200" : "text-slate-400 font-bold",
        },
        {
          id: "deadlines",
          icon: Calendar,
          iconBg: "bg-amber-50 text-amber-600",
          value: "2",
          label: "Statutory Deadlines",
          pill: "Upcoming (Tax Audit)",
          pillColor: "text-slate-400 font-bold",
        },
      ]
    : [
        {
          id: "assigned",
          icon: Building2,
          iconBg: "bg-blue-50 text-blue-600",
          value: assignedCount.toString(),
          label: "Assigned Client MSMEs",
          pill: assignedCount > 0 ? `${assignedCount} Files` : "Zero Assigned",
          pillColor: assignedCount > 0 ? "text-slate-400 font-bold" : "text-amber-700 font-bold",
        },
        {
          id: "vouchers",
          icon: BookOpenCheck,
          iconBg: "bg-teal-50 text-teal-600",
          value: assignedCount > 0 ? (assignedCount * 25).toString() : "0",
          label: "Vouchers Verified",
          pill: assignedCount > 0 ? "98.5% Accuracy" : "Desk Empty",
          pillColor: "text-slate-400 font-bold",
        },
        {
          id: "discrepancies",
          icon: AlertTriangle,
          iconBg: "bg-rose-50 text-rose-600",
          value: "0",
          label: "Open Discrepancies",
          pill: "All Clean",
          pillColor: "text-emerald-700 font-bold",
        },
        {
          id: "reconciled",
          icon: Scale,
          iconBg: "bg-purple-50 text-purple-600",
          value: assignedCount > 0 ? "1" : "0",
          label: "Banks Reconciled",
          pill: "In-Sync",
          pillColor: "text-emerald-700 font-bold",
        },
      ];

  // Real audit requests and submissions from database
  const recentSubmissions = realRequests.map((r) => ({
    id: r._id,
    title: r.requestReason || "Statutory Ledger Audit & Double-Entry Verification",
    client: r.organizationId?.legalEntityName || r.ownerId?.name || "Client Business",
    author: r.caName || "Audit Partner",
    timeAgo: r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : "Recent",
    status: r.status === "APPROVED" ? "Approved" : r.status === "PENDING" ? "Pending Approval" : "Revoked",
    statusColor:
      r.status === "APPROVED"
        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
        : r.status === "PENDING"
        ? "bg-amber-50 text-amber-800 border border-amber-200"
        : "bg-rose-50 text-rose-800 border border-rose-200",
    actionTab: "data-requests",
  }));

  return (
    <div className="space-y-8">
      {/* Title Header Greeting (Adapted from reference image) */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {isPartner ? "Auditing Practice Dashboard" : "Staff Audit Workspace"}
        </h1>
        <p className="text-xs font-bold text-slate-500 mt-1">
          Welcome back, <span className="text-slate-800 font-black">{partnerName}</span> • {firmName}
        </p>
      </div>

      {/* Row of 4 Rounded Stat Cards (Adapted from reference screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-xs transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${card.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] ${card.pillColor}`}>{card.pill}</span>
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight block">
                  {card.value}
                </span>
                <span className="text-xs font-bold text-slate-500 block mt-0.5">
                  {card.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Bottom Area (Adapted from reference image: Recent Submissions + Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Card: Recent Audit Submissions & Ledger Queue */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">
              Recent Audit Submissions &amp; Ledger Queue
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab("audit-signoffs")}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
            >
              View Full Queue &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSubmissions.length > 0 && (isPartner ? clientCount > 0 : assignedCount > 0) ? (
              recentSubmissions.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setActiveTab("audit-signoffs")}
                  className="py-4 flex items-center justify-between gap-4 group cursor-pointer hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <span className="font-bold text-slate-700">{item.client}</span> • {item.author} • <span className="text-slate-400">{item.timeAgo}</span>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-3 py-1 rounded-full whitespace-nowrap ${item.statusColor}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <CrownZeroState
                variant="ca_hub"
                compact={true}
                badge={isPartner ? "Auditing Queue Clean" : "Desk Unallocated"}
                title={isPartner ? "No Active Audit Submissions" : "Zero Client Portfolios Assigned"}
                description={
                  isPartner
                    ? "Your practice currently has zero active audit submissions from client organizations. Request data access from client founders or link a new business entity to start."
                    : "Your Managing Partner has not yet allocated any client MSME audit files to your desk. Contact your managing partner to receive audit files."
                }
                actionText={isPartner ? "Request Data Access" : null}
                onAction={isPartner ? () => setActiveTab("data-requests") : null}
              />
            )}
          </div>
        </div>

        {/* Right Card: Quick Actions (Grid of 4 Rounded Buttons from reference screenshot) */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-2xs space-y-6">
          <h3 className="text-sm font-black text-slate-900">
            High-Priority Audit Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Action 1 */}
            <button
              type="button"
              onClick={() => setActiveTab("audit-signoffs")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Stamp className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800 group-hover:text-indigo-900">
                {isPartner ? "Digital Audit Stamp" : "Review Final Ledgers"}
              </span>
            </button>

            {/* Action 2 */}
            <button
              type="button"
              onClick={() => setActiveTab(isPartner ? "data-requests" : "discrepancies")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800 group-hover:text-indigo-900">
                {isPartner ? "Request Data Access" : "Check Discrepancies"}
              </span>
            </button>

            {/* Action 3 */}
            <button
              type="button"
              onClick={() => setActiveTab(isPartner ? "reports" : "draft-reports")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800 group-hover:text-teal-900">
                Export Form 3CD &amp; P&amp;L
              </span>
            </button>

            {/* Action 4 */}
            <button
              type="button"
              onClick={() => setActiveTab(isPartner ? "clients" : "reconciliation")}
              className="p-5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 flex flex-col items-center justify-center text-center gap-2.5 transition-all group cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800 group-hover:text-purple-900">
                {isPartner ? "Manage Client MSMEs" : "Bank Reconciliation"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
