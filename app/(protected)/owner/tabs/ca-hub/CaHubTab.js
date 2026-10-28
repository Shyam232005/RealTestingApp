"use client";
import React, { useState, useEffect } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
  UserCheck,
  Check,
  X,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  Copy,
  Lock,
} from "lucide-react";

import CaReportModal from "./CaReportModal";
import { getSocketClient } from "@/lib/socketClient";

export default function CaHubTab({ owner, organization, showToast }) {
  const [loading, setLoading] = useState(true);
  const [caRequests, setCaRequests] = useState([]);
  const [caReports, setCaReports] = useState([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    reportsCount: 0,
  });

  const [activeReportModal, setActiveReportModal] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch CA requests and reports history
  const fetchCaHubData = async () => {
    try {
      const res = await fetch("/api/owner/approvals");
      if (res.ok) {
        const data = await res.json();
        setCaRequests(data.caRequests || []);
        setCaReports(data.caReports || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load CA Hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/owner/approvals");
        if (res.ok && !ignore) {
          const data = await res.json();
          setCaRequests(data.caRequests || []);
          setCaReports(data.caReports || []);
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to load CA Hub data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Handle Owner approving or declining CA data-access request
  const handleDecision = async (requestId, action) => {
    try {
      setActionLoadingId(requestId);
      const res = await fetch("/api/owner/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update CA request.");
      }

      showToast(
        action === "APPROVE"
          ? "CA Data Access Granted! Read-only audit stream active."
          : action === "REVOKE"
          ? "CA Data Access Revoked."
          : "CA Data Access Request Declined."
      );

      // Emit real-time unlock event via Socket.io
      if (action === "APPROVE") {
        getSocketClient().then((socket) => {
          if (socket && (organization?._id || owner?._id)) {
            socket.emit("owner-approve-data", {
              companyId: organization?._id || owner?._id,
              requestId,
              timestamp: new Date().toISOString(),
            });
          }
        }).catch(() => {});
      }

      // Refresh list
      fetchCaHubData();
    } catch (err) {
      showToast(err.message || "Failed to update request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const inviteCode = owner?.inviteCode || "BIZ-CROWN1";

  return (
    <div className="space-y-7">
      {/* Report Modal */}
      <CaReportModal
        report={activeReportModal}
        isOpen={!!activeReportModal}
        onClose={() => setActiveReportModal(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              CA Auditor Collaboration & Access Hub
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Audit-Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track which CA requested data-access, manage approvals, and review delivered audit reports.
          </p>
        </div>

        <button
          onClick={fetchCaHubData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh Status
        </button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Connected CA Firm
          </span>
          <p className="text-lg font-black text-slate-900">
            {stats.approvedCount > 0 ? "Actively Linked" : "Pending Link"}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            ICAI License Verification Enforced
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Data Sharing Access Mode
          </span>
          <p className="text-lg font-black text-purple-700">
            {stats.approvedCount > 0 ? "Read-Only Granted" : "Approval Required"}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Zero write permissions / tamper-proof
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Audit Reports Delivered
          </span>
          <p className="text-lg font-black text-emerald-700 font-mono">
            {caReports.length} Reports
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            MCA Statutory Signed & Sealed
          </p>
        </div>
      </div>

      {/* SECTION 1: CA DATA-ACCESS REQUESTS & APPROVAL HISTORY */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-600" />
              CA Data Access Requests & Approval History
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Record of which CA requested access, for what accounts, and when approval was granted
            </p>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 self-start sm:self-auto font-mono">
            {caRequests.length} Total Requests Logged
          </span>
        </div>

        {/* List of CA Data Access Requests */}
        <div className="space-y-3">
          {caRequests.length > 0 ? (
            caRequests.map((req) => {
              const reqDate = new Date(req.requestedAt).toLocaleDateString(
                "en-IN",
                { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
              );
              const approvedDate = req.decidedAt
                ? new Date(req.decidedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null;

              const isPending = req.status === "PENDING";
              const isApproved = req.status === "APPROVED";
              const isRevoked = req.status === "REVOKED" || req.status === "REJECTED";

              return (
                <div
                  key={req._id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                    isPending
                      ? "bg-amber-50/40 border-amber-200"
                      : isApproved
                      ? "bg-slate-50/70 border-slate-200/90"
                      : "bg-slate-50/40 border-slate-200 opacity-75"
                  }`}
                >
                  {/* Top Row: CA Identity & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {req.caName || "Chartered Accountant"}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                          {req.icaiNumber || "ICAI Member"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Firm: <strong className="text-slate-800">{req.caFirm || "CA Advisory Practice"}</strong> • {req.caEmail}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          isPending
                            ? "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
                            : isApproved
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-slate-200 text-slate-700 border-slate-300"
                        }`}
                      >
                        {isPending
                          ? "Action Required: Pending Approval"
                          : isApproved
                          ? "Access Approved & Active"
                          : "Access Revoked / Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Accounts Requested */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Accounts & Datasets Requested:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(req.requestedAccounts || ["General Ledger & Bank Statements"]).map(
                        (acc, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold"
                          >
                            ✓ {acc}
                          </span>
                        )
                      )}
                    </div>
                    {req.requestReason && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        <strong>Reason:</strong> {req.requestReason}
                      </p>
                    )}
                  </div>

                  {/* Bottom Row: Timeline & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-3">
                      <span>Requested: <strong className="text-slate-700">{reqDate}</strong></span>
                      {approvedDate && (
                        <span>
                          Approved: <strong className="text-emerald-700">{approvedDate}</strong>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoadingId === req._id}
                            onClick={() => handleDecision(req._id, "APPROVE")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve Access
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === req._id}
                            onClick={() => handleDecision(req._id, "REJECT")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          type="button"
                          disabled={actionLoadingId === req._id}
                          onClick={() => handleDecision(req._id, "REVOKE")}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Revoke Access
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/30 p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <Briefcase className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900">
                No CA Data Access Requests Yet
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                When your Chartered Accountant requests access to verify GST invoices, view bank statements, or review general ledgers, their authorization request will appear here for your sign-off.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: AUDIT REPORTS & STATUTORY FILINGS DELIVERED BY CA */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Audit Reports & Statutory Filings Delivered by CA
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Review completed audit certificates, GSTR-2B reconciliations, and compliance reports given by your CA
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto font-mono">
            {caReports.length} Delivered
          </span>
        </div>

        {/* Reports Cards */}
        <div className="space-y-3">
          {caReports.length > 0 ? (
            caReports.map((item) => {
              const deliveredDate = item.reportSubmittedAt
                ? new Date(item.reportSubmittedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Delivered";

              return (
                <div
                  key={item._id}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-purple-200 transition-colors"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {item.reportTitle || "Statutory Audit Report"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Submitted & Signed
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                      {item.reportSummary}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span>Auditor: <strong className="text-slate-800">{item.caName}</strong></span>
                      <span>Delivered on: <strong className="text-slate-800">{deliveredDate}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveReportModal(item)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <span>View Full Report</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900">
                No Audit Reports Delivered Yet
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                Once your linked Chartered Accountant conducts an audit review or statutory tax verification, their signed report, certificate, and executive findings will be archived here permanently.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: INVITE CA TO YOUR WORKSPACE */}
      <div className="p-6 rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-pink-50/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-purple-700" />
            Connect Your CA Firm to This Workspace
          </h4>
          <p className="text-xs text-purple-800/80 mt-1">
            Share your Business Code so your CA can sign up, link their practice, and request data-access directly:
          </p>
          <div className="mt-2 inline-flex items-center gap-2">
            <span className="font-mono font-black text-purple-950 text-sm bg-white px-3 py-1 rounded-xl border border-purple-200 tracking-wider shadow-xs">
              {inviteCode}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(inviteCode);
            showToast("Business invite code copied to clipboard!");
          }}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy Invite Code
        </button>
      </div>
    </div>
  );
}
