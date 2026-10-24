"use client";
import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  FileCheck2,
  User,
  Building2,
  Filter,
  RotateCcw,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

export default function ApprovalTab({
  organization,
  selectedBranch = "all",
  setSelectedBranch,
}) {
  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    reportsCount: 0,
  });

  const [activeView, setActiveView] = useState("PENDING"); // "PENDING", "HISTORY", "EMPLOYEE", "CA"
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const poLimit = Number(organization?.poApprovalLimit || 25000);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/owner/approvals");
      if (res.ok) {
        const data = await res.json();
        setAllRequests(data.all || []);
        setPendingList(data.pending || []);
        setHistoryList(data.history || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load approvals data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (requestId, action, notes = "") => {
    try {
      setActionLoadingId(requestId);
      const res = await fetch("/api/owner/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, decisionNotes: notes }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process decision.");
      }

      setToastMessage(
        action === "APPROVE"
          ? "Request Approved successfully!"
          : "Request Declined."
      );
      setTimeout(() => setToastMessage(""), 3500);

      // Refresh list
      fetchApprovals();
    } catch (err) {
      setToastMessage(err.message || "Failed to update approval.");
      setTimeout(() => setToastMessage(""), 3500);
    } finally {
      setActionLoadingId(null);
    }
  };

  const isAll = selectedBranch === "all";
  const branchTitle = isAll
    ? "All Branches (Consolidated)"
    : selectedBranch === "branch-1"
    ? "Branch 1 - Main (HQ)"
    : selectedBranch.replace("branch-", "Branch ");

  // Filter history based on active view tab
  const displayedHistory = historyList.filter((item) => {
    if (activeView === "EMPLOYEE") return item.type === "EMPLOYEE_PO";
    if (activeView === "CA") return item.type === "CA_DATA_ACCESS";
    return true; // "HISTORY" or "PENDING"
  });

  return (
    <div className="space-y-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Founder Approval Desk & Authorization History
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {branchTitle}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and sign off on CA data-access requests and employee purchase orders exceeding{" "}
            <span className="font-bold text-slate-800 font-mono">
              ₹{poLimit.toLocaleString("en-IN")}
            </span>
            .
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh Desk
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Pending Decisions
          </span>
          <p className="font-mono font-black text-amber-950 text-2xl mt-1">
            {pendingList.length}
          </p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">
            Awaiting your OK
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Approved in History
          </span>
          <p className="font-mono font-black text-emerald-950 text-2xl mt-1">
            {stats.approvedCount}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
            Authorized sign-offs
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            PO Approval Limit
          </span>
          <p className="font-mono font-black text-slate-900 text-2xl mt-1">
            ₹{poLimit.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Founder threshold
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
            Total History Log
          </span>
          <p className="font-mono font-black text-purple-950 text-2xl mt-1">
            {allRequests.length}
          </p>
          <p className="text-[10px] text-purple-700 font-medium mt-0.5">
            Immutable log
          </p>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: "PENDING", label: `Pending Approvals (${pendingList.length})` },
          { id: "HISTORY", label: `All Decision History (${historyList.length})` },
          {
            id: "EMPLOYEE",
            label: `Employee POs (${allRequests.filter((r) => r.type === "EMPLOYEE_PO").length})`,
          },
          {
            id: "CA",
            label: `CA Data Access (${allRequests.filter((r) => r.type === "CA_DATA_ACCESS").length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeView === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: PENDING APPROVALS DESK */}
      {activeView === "PENDING" && (
        <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                Action Required: Pending Approvals
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Staff purchase orders and CA data-access requests waiting for your decision
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-mono">
              {pendingList.length} Pending
            </span>
          </div>

          {pendingList.length > 0 ? (
            <div className="space-y-3">
              {pendingList.map((item) => {
                const reqDate = new Date(item.requestedAt).toLocaleDateString(
                  "en-IN",
                  { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
                );

                const isCaRequest = item.type === "CA_DATA_ACCESS";

                return (
                  <div
                    key={item._id}
                    className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/90 text-xs space-y-3 hover:border-amber-300 transition-all"
                  >
                    {/* Top Identity Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCaRequest
                              ? "bg-purple-100 text-purple-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {isCaRequest ? (
                            <Briefcase className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">
                              {isCaRequest ? item.caName : item.employeeName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                                isCaRequest
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {isCaRequest ? "CA Data Access" : `PO: ${item.poNumber}`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {isCaRequest
                              ? `Firm: ${item.caFirm || "CA Practice"} • ICAI: ${item.icaiNumber}`
                              : `Role: ${item.employeeRole} • Dept: ${item.employeeDepartment}`}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount or Badge */}
                      {!isCaRequest && (
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Order Amount
                          </span>
                          <span className="text-lg font-black font-mono text-slate-900">
                            ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 block">
                            Exceeds limit by ₹
                            {(Number(item.amount || 0) - poLimit).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Particulars */}
                    <div className="p-3.5 rounded-xl bg-white border border-amber-200/60 space-y-1">
                      {isCaRequest ? (
                        <>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Accounts Requested for Audit:
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {(item.requestedAccounts || []).map((acc, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold"
                              >
                                {acc}
                              </span>
                            ))}
                          </div>
                          {item.requestReason && (
                            <p className="text-[11px] text-slate-600 mt-1">
                              <strong>Audit Purpose:</strong> {item.requestReason}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              Vendor: {item.vendorName || "Commercial Supplier"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Requested: {reqDate}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            {item.poDescription || "Procurement voucher exceeding founder approval limit."}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Decision Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={actionLoadingId === item._id}
                        onClick={() => handleDecision(item._id, "REJECT")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === item._id}
                        onClick={() => handleDecision(item._id, "APPROVE")}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve & Sign Off
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                All Clear — 0 Pending Approvals
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No employee purchase orders or CA data-access requests are waiting for your signature right now.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: COMPREHENSIVE APPROVAL HISTORY & AUDIT TRAIL */}
      {activeView !== "PENDING" && (
        <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Permanent Approval History & Audit Trail
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Complete chronological record of all past decisions for employees and CA partners
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
              {displayedHistory.length} Logged Decisions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Decision Date</th>
                  <th className="py-3 px-3">Requester</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Particulars / Scope</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Decided By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {displayedHistory.length > 0 ? (
                  displayedHistory.map((item, idx) => {
                    const decDate = item.decidedAt
                      ? new Date(item.decidedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Completed";

                    const isCa = item.type === "CA_DATA_ACCESS";
                    const isApproved = item.status === "APPROVED";
                    const isRejected = item.status === "REJECTED";

                    return (
                      <tr key={item._id || idx} className="hover:bg-slate-50/70 transition-colors">
                        {/* Decision Date */}
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-800">
                          {decDate}
                        </td>

                        {/* Requester */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className="font-extrabold text-slate-900">
                            {isCa ? item.caName : item.employeeName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isCa ? item.icaiNumber : item.employeeDepartment}
                          </p>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isCa
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            {isCa ? "CA Data Access" : "Purchase Order"}
                          </span>
                        </td>

                        {/* Particulars */}
                        <td className="py-3 px-3 max-w-xs truncate">
                          {isCa ? (
                            <span className="text-slate-600">
                              {(item.requestedAccounts || []).join(", ")}
                            </span>
                          ) : (
                            <div>
                              <p className="font-bold text-slate-900 truncate">
                                {item.vendorName || "Supplier Order"}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {item.poDescription}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold">
                          {isCa ? (
                            <span className="text-slate-400 font-normal">Read-Only</span>
                          ) : (
                            <span className="text-slate-900">
                              ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : isRejected
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Approved
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Declined
                              </>
                            )}
                          </span>
                        </td>

                        {/* Decided By */}
                        <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500">
                          {item.decidedBy || "Business Owner"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-700">No Approval History Logged Yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Whenever you approve or decline an employee purchase order or CA data-access request, it will be permanently recorded here in real-time.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
