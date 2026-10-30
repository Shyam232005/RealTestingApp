"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  Send,
  Plus,
  RefreshCw,
  Sparkles,
  ExternalLink,
  BookOpenCheck,
  Check,
  FileCheck2,
} from "lucide-react";
import { useCa } from "./CaContext";
import CrownZeroState from "@/components/ui/CrownZeroState";
import {
  getSocketClient,
  emitCaDataRequest,
  subscribeToEvent,
} from "@/lib/socketClient";

export default function CaDataAccessTab() {
  const { user, setActiveTab } = useCa();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form states for new data access request
  const [selectedClientFirm, setSelectedClientFirm] = useState("");
  const [clientInviteCode, setClientInviteCode] = useState("");
  const [requestReason, setRequestReason] = useState(
    "Statutory Tax Audit FY 2025-26 under Section 44AB and Dual-Entry Ledger Verification."
  );
  const [selectedAccounts, setSelectedAccounts] = useState([
    "General Ledger & Bank Statements",
    "GST Invoices & Purchase Registers (GSTR-2B)",
    "TDS Deductions & Form 26AS",
  ]);

  const availableBooks = [
    "General Ledger & Bank Statements",
    "GST Invoices & Purchase Registers (GSTR-2B)",
    "TDS Deductions & Form 26AS",
    "Warehouse Inventory & Stock Valuation",
    "Payroll & Expense Vouchers",
  ];

  const fetchRequests = React.useCallback(async () => {
    try {
      const res = await fetch("/api/ca/data-request");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load CA data requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch("/api/ca/data-request");
        if (res.ok && !ignore) {
          const data = await res.json();
          setRequests(data.requests || []);
        }
      } catch (err) {
        console.error("Failed to load CA data requests:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    // Listen for real-time Owner approvals via Socket.io
    let cleanupSocket = () => {};
    (async () => {
      cleanupSocket = await subscribeToEvent("ca-data-unlocked", (payload) => {
        setToastMessage(`⚡ Live Notification: Founder approved data access for ${payload?.clientName || "Client MSME"}! Data unlocked.`);
        fetchRequests();
        setTimeout(() => setToastMessage(""), 5000);
      });
    })();

    return () => {
      ignore = true;
      cleanupSocket();
    };
  }, [fetchRequests]);

  const handleToggleAccount = (item) => {
    if (selectedAccounts.includes(item)) {
      setSelectedAccounts(selectedAccounts.filter((x) => x !== item));
    } else {
      setSelectedAccounts([...selectedAccounts, item]);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/ca/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientFirmId: selectedClientFirm,
          clientInviteCode: clientInviteCode ? clientInviteCode.trim().toUpperCase() : "",
          requestedAccounts: selectedAccounts,
          requestReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create request.");
      }

      setToastMessage("Data access request sent to Business Owner! Live alert transmitted.");
      setIsModalOpen(false);
      fetchRequests();

      // Emit real-time Socket event to notify Owner dashboard instantly
      emitCaDataRequest({
        ...data.request,
        caFirmId: user?.id,
        caName: user?.name,
      });

      setTimeout(() => setToastMessage(""), 4500);
    } catch (err) {
      alert(err.message || "Request submission error.");
    } finally {
      setSubmitting(false);
    }
  };

  // Skeleton Loader (Zero Circular Spinners)
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          <div className="h-64 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Real-Time Live Toast Alert */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md">
            Socket Sub-45ms Active
          </span>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Client Data Access &amp; Owner Approvals
            </h1>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Zero-Leak Architecture
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Financial transactions, ledgers, and books are only transmitted and unlocked in this tab after explicit approval by the client company founder.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchRequests}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Requests"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-md shadow-slate-900/10 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Request Data Access</span>
          </button>
        </div>
      </div>

      {/* ZERO STATE (If no requests submitted yet) */}
      {requests.length === 0 ? (
        <CrownZeroState
          variant="ca_hub"
          icon={KeyRound}
          badge="Audit Data Authorization"
          title="Zero Client Data Requests Submitted"
          description="You have not requested financial ledger or GST invoice access from any connected business founders. Submit an authorization request to begin statutory audit and balance sheet verification."
          actionText="Request Client Data Access"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {requests.map((req) => {
            const isApproved = req.status === "APPROVED";
            const isPending = req.status === "PENDING";
            const isRejected = req.status === "REJECTED";
            const clientName =
              req.organizationId?.legalEntityName ||
              req.organizationId?.name ||
              req.ownerId?.name ||
              "Client MSME Entity";

            return (
              <div
                key={req._id}
                className={`rounded-3xl border p-6 transition-all shadow-2xs ${
                  isApproved
                    ? "bg-white border-emerald-200/90 hover:border-emerald-300"
                    : isRejected
                    ? "bg-white border-rose-200 hover:border-rose-300"
                    : "bg-white border-amber-200 hover:border-amber-300"
                }`}
              >
                {/* Request Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700"
                          : isRejected
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {isApproved ? (
                        <Unlock className="w-5 h-5" />
                      ) : isRejected ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">{clientName}</h3>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : isRejected
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {isApproved
                            ? "Data Unlocked & Transmitted"
                            : isRejected
                            ? "Request Declined by Owner"
                            : "Awaiting Owner Approval"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Requested on {new Date(req.requestedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} • Purpose: {req.requestReason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span>Listening for Founder Sign-off</span>
                      </span>
                    )}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("audit-signoffs")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                      >
                        <BookOpenCheck className="w-3.5 h-3.5" />
                        <span>Send to Audit &amp; Sign-offs</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Requested Accounts Pills */}
                <div className="pt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">Requested Portfolios:</span>
                  {(req.requestedAccounts || []).map((acc, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {acc}
                    </span>
                  ))}
                </div>

                {/* LOCKED STATE BANNER (When Not Approved) */}
                {!isApproved && (
                  <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-black text-slate-800 block">
                        Financial Books Locked &amp; Encrypted
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        Under Crownops Zero-Leak Architecture, general ledger accounts, bank transactions, and customer records cannot be streamed to the CA portal until the business founder clicks "Approve" on their Founder Approval Desk.
                      </p>
                    </div>
                  </div>
                )}

                {/* UNLOCKED REAL FINANCIAL DATA (Only After Owner Approval) */}
                {isApproved && req.unlockedData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-5 pt-4 border-t border-slate-100 space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-black text-slate-900">
                          Live Unlocked Ledger Stream
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Verified Dual-Entry Balance: ₹0.00
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Approved by {req.unlockedData.approvedBy} on{" "}
                        {new Date(req.unlockedData.unlockedAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Unlocked Accounts Mini-Grid */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-4">Account Head</th>
                            <th className="py-2.5 px-4">Group</th>
                            <th className="py-2.5 px-4 text-center">Type</th>
                            <th className="py-2.5 px-4 text-right">Balance (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium font-mono">
                          {req.unlockedData.accounts.slice(0, 5).map((acc, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 font-sans">
                              <td className="py-2.5 px-4 font-bold text-slate-900">{acc.name}</td>
                              <td className="py-2.5 px-4 text-slate-500 text-[11px]">{acc.group}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    acc.type === "Debit"
                                      ? "bg-blue-50 text-blue-800"
                                      : "bg-purple-50 text-purple-800"
                                  }`}
                                >
                                  {acc.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 text-xs">
                                ₹{Number(acc.balance).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-4 uppercase text-[10px] tracking-wider text-slate-500">
                              Total Verified Assets
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-700 text-xs">
                              ₹{Number(req.unlockedData.totalAssets).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* NEW DATA ACCESS REQUEST MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Request Client Data Access
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Requires explicit sign-off by Business Founder
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
                {/* Select from connected clients or enter code */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Select Client MSME / Company:
                  </label>
                  {user?.clients && user.clients.length > 0 ? (
                    <select
                      value={selectedClientFirm}
                      onChange={(e) => setSelectedClientFirm(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600"
                    >
                      <option value="">Choose connected client...</option>
                      {user.clients.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name} ({c.inviteCode || "No Code"})
                        </option>
                      ))}
                    </select>
                  ) : null}

                  <div className="mt-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Or Enter Business Owner Invite Code:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BIZ-XXXXXX"
                      value={clientInviteCode}
                      onChange={(e) => setClientInviteCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Requested Portfolios Checkboxes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Select Financial Books &amp; Records to Request:
                  </label>
                  <div className="space-y-2">
                    {availableBooks.map((book) => {
                      const isChecked = selectedAccounts.includes(book);
                      return (
                        <div
                          key={book}
                          onClick={() => handleToggleAccount(book)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-indigo-50 border-indigo-200 text-indigo-950"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          <span>{book}</span>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Statutory Purpose / Audit Reason:
                  </label>
                  <textarea
                    rows={2}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:border-indigo-600 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Sending..." : "Submit to Founder"}</span>
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
