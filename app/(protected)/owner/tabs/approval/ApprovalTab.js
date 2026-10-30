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
  UserPlus,
  Building2,
  Filter,
  RotateCcw,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import CrownZeroState from "@/components/ui/CrownZeroState";
import { TableSkeleton } from "@/components/ui/CrownSkeletonLoader";
import {
  emitOwnerApproveData,
  emitOwnerRejectData,
  subscribeToEvent,
} from "@/lib/socketClient";

export default function ApprovalTab({
  organization,
  selectedBranch = "all",
  setSelectedBranch,
}) {
  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    reportsCount: 0,
  });

  const [activeView, setActiveView] = useState("PENDING"); // "PENDING", "STAFF", "HISTORY", "EMPLOYEE", "CA"
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const poLimit = Number(organization?.poApprovalLimit || 25000);

  const fetchApprovals = async () => {
    try {
      const res = await fetch("/api/owner/approvals");
      if (res.ok) {
        const data = await res.json();
        setAllRequests(data.all || []);
        setPendingList(data.pending || []);
        setPendingStaff(data.pendingStaff || []);
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
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/owner/approvals");
        if (res.ok && !ignore) {
          const data = await res.json();
          setAllRequests(data.all || []);
          setPendingList(data.pending || []);
          setPendingStaff(data.pendingStaff || []);
          setHistoryList(data.history || []);
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to load approvals data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();

    // Listen for live CA Data Access Requests via Socket.io
    let cleanupSocket = () => {};
    (async () => {
      cleanupSocket = await subscribeToEvent("owner-receive-request", (payload) => {
        setToastMessage(`⚡ New Request: CA ${payload?.caName || "Firm"} requested financial data access!`);
        fetchApprovals();
        setTimeout(() => setToastMessage(""), 5000);
      });
    })();

    return () => {
      ignore = true;
      cleanupSocket();
    };
  }, []);

  const handleDecision = async (requestId, action, notes = "", type = "") => {
    try {
      setActionLoadingId(requestId);
      const res = await fetch("/api/owner/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, decisionNotes: notes, type }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process decision.");
      }

      setToastMessage(
        data.message ||
          (action === "APPROVE" ? "Request Approved successfully!" : "Request Declined.")
      );
      setTimeout(() => setToastMessage(""), 3500);

      // Emit socket event to instantly notify CA
      if (data.updatedRequest?.type === "CA_DATA_ACCESS" || type === "CA_DATA_ACCESS") {
        if (action === "APPROVE") {
          emitOwnerApproveData({
            requestId,
            caId: data.updatedRequest?.caId,
            caFirmId: data.updatedRequest?.caId,
            clientName: organization?.legalEntityName || organization?.name,
            companyId: organization?.ownerId,
          });
        } else if (action === "REJECT" || action === "REVOKE") {
          emitOwnerRejectData({
            requestId,
            caId: data.updatedRequest?.caId,
            caFirmId: data.updatedRequest?.caId,
          });
        }
      }

      // Refresh list
      fetchApprovals();

      // Dispatch global event for live sidebar & dashboard update
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("owner-staff-updated", {
            detail: { action, requestId, type },
          })
        );
      }
    } catch (err) {
      setToastMessage(err.message || "Failed to update approval.");
      setTimeout(() => setToastMessage(""), 3500);
    } finally {
      setActionLoadingId(null);
    }
  };

  const branchTitle =
    selectedBranch === "all"
      ? "All Business Branches"
      : `Branch ${selectedBranch.replace("branch-", "#")}`;

  // Filter history based on active view tab
  const displayedHistory = historyList.filter((item) => {
    if (activeView === "EMPLOYEE") return item.type === "EMPLOYEE_PO";
    if (activeView === "CA") return item.type === "CA_DATA_ACCESS";
    return true; // "HISTORY" or "PENDING"
  });

  const totalPending = pendingList.length + pendingStaff.length;

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
            Review and sign off on staff department registrations, CA data-access, and purchase orders exceeding{" "}
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
            {totalPending}
          </p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">
            {pendingStaff.length} Staff • {pendingList.length} PO/CA
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
            Orders above this need your approval
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
          { id: "PENDING", label: `Pending Approvals (${totalPending})` },
          { id: "STAFF", label: `Staff Requests (${pendingStaff.length})` },
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
        <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                Action Required: Pending Approvals
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Staff department registrations, POs, and CA data-access requests waiting for your decision
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-mono">
              {totalPending} Pending
            </span>
          </div>

          {/* 1.1 Pending Staff Registrations */}
          {pendingStaff.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wide">
                <UserPlus className="w-4 h-4 text-amber-600" />
                <span>Staff Department Registrations ({pendingStaff.length})</span>
              </div>
              <div className="space-y-3">
                {pendingStaff.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/90 text-xs space-y-3 hover:border-amber-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{cand.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono bg-purple-100 text-purple-800">
                              Staff Registration
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {cand.email} • {cand.phoneNumber}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Department
                        </span>
                        <span className="text-sm font-black text-indigo-700 block mt-0.5">
                          {cand.department}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {cand.postTitle || cand.postLevel}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-amber-200/60 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Requested Branch & Capacity Check:
                          </span>
                          <span className="font-extrabold text-slate-800 block mt-0.5">
                            {cand.branchName}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">
                            Active Headcount: {cand.activeStaffInBranch} / {cand.branchCapacity || "Open"}
                            {cand.isBranchFull && (
                              <span className="ml-2 text-rose-600 font-bold">(Capacity Full)</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Requested At:
                          </span>
                          <span className="text-slate-600 block mt-0.5">
                            {new Date(cand.requestedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {cand.workDescription && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Work Responsibilities:
                          </span>
                          <p className="text-[11px] text-slate-700 font-medium italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                            "{cand.workDescription}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={actionLoadingId === cand.id}
                        onClick={() => handleDecision(cand.id, "REJECT", "", "STAFF_REGISTRATION")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject & Remove
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === cand.id || cand.isBranchFull}
                        onClick={() => handleDecision(cand.id, "APPROVE", "", "STAFF_REGISTRATION")}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {actionLoadingId === cand.id
                          ? "Approving..."
                          : cand.isBranchFull
                          ? "Branch Full"
                          : "Approve & Confirm Staff"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1.2 Pending PO & CA Requests */}
          {pendingList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wide">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                <span>PO & CA Access Requests ({pendingList.length})</span>
              </div>
              <div className="space-y-3">
                {pendingList.map((item) => {
                  const reqDate = new Date(item.requestedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isCaRequest = item.type === "CA_DATA_ACCESS";

                  return (
                    <div
                      key={item._id}
                      className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/90 text-xs space-y-3 hover:border-amber-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isCaRequest
                                ? "bg-purple-100 text-purple-700"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {isCaRequest ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
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
                            <p className="text-[11px] text-slate-600 mt-2">
                              Reason: {item.requestReason || "Mandatory MCA / GST statutory review."}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-xs">
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
            </div>
          )}

          {totalPending === 0 && (
            <CrownZeroState
              compact
              variant="ca_hub"
              title="Approvals Desk is Clear"
              description="No staff department registrations, employee purchase orders, or CA data-access requests are waiting for your signature. 0 items pending."
            />
          )}
        </div>
      )}

      {/* SECTION 2: STAFF REQUESTS DEDICATED VIEW */}
      {activeView === "STAFF" && (
        <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                Staff Department Registrations
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Employees who joined with your company code requesting branch and department approval
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-mono">
              {pendingStaff.length} Requests
            </span>
          </div>

          {pendingStaff.length > 0 ? (
            <div className="space-y-3">
              {pendingStaff.map((cand) => (
                <div
                  key={cand.id}
                  className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/90 text-xs space-y-3 hover:border-amber-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{cand.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono bg-purple-100 text-purple-800">
                            Staff Registration
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {cand.email} • {cand.phoneNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Department
                      </span>
                      <span className="text-sm font-black text-indigo-700 block mt-0.5">
                        {cand.department}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {cand.postTitle || cand.postLevel}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-amber-200/60 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Requested Branch & Capacity Check:
                        </span>
                        <span className="font-extrabold text-slate-800 block mt-0.5">
                          {cand.branchName}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">
                          Active Headcount: {cand.activeStaffInBranch} / {cand.branchCapacity || "Open"}
                          {cand.isBranchFull && (
                            <span className="ml-2 text-rose-600 font-bold">(Capacity Full)</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Requested At:
                        </span>
                        <span className="text-slate-600 block mt-0.5">
                          {new Date(cand.requestedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {cand.workDescription && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Work Responsibilities:
                        </span>
                        <p className="text-[11px] text-slate-700 font-medium italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                          "{cand.workDescription}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={actionLoadingId === cand.id}
                      onClick={() => handleDecision(cand.id, "REJECT", "", "STAFF_REGISTRATION")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject & Remove
                    </button>

                    <button
                      type="button"
                      disabled={actionLoadingId === cand.id || cand.isBranchFull}
                      onClick={() => handleDecision(cand.id, "APPROVE", "", "STAFF_REGISTRATION")}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {actionLoadingId === cand.id
                        ? "Approving..."
                        : cand.isBranchFull
                        ? "Branch Full"
                        : "Approve & Confirm Staff"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <UserPlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                0 Pending Staff Registrations
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When new staff members register using your business code, their department and branch requests will appear here for your approval.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: COMPREHENSIVE APPROVAL HISTORY & AUDIT TRAIL */}
      {activeView !== "PENDING" && activeView !== "STAFF" && (
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
                  <th className="py-3 px-3">Particulars / Details</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Decision</th>
                  <th className="py-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedHistory.length > 0 ? (
                  displayedHistory.map((item) => {
                    const decidedDate = item.decidedAt
                      ? new Date(item.decidedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";

                    const isApproved = item.status === "APPROVED";
                    const isRejected = item.status === "REJECTED";
                    const isCa = item.type === "CA_DATA_ACCESS";

                    return (
                      <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {decidedDate}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {isCa ? item.caName : item.employeeName}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCa
                                ? "bg-purple-100 text-purple-800"
                                : "bg-indigo-100 text-indigo-800"
                            }`}
                          >
                            {isCa ? "CA Access" : "Purchase Order"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">
                          {isCa
                            ? (item.requestedAccounts || []).join(", ")
                            : `${item.vendorName || "Vendor"} — ${item.poDescription || item.poNumber}`}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                          {item.amount ? `₹${item.amount.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : isRejected
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 italic max-w-xs truncate">
                          {item.decisionNotes || "Signed off by Founder"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No decisions logged in this filter yet.
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
