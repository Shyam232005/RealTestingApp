"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCa } from "./CaContext";
import DigitalAuditStampModal from "./DigitalAuditStampModal";
import CrownZeroState from "@/components/ui/CrownZeroState";
import { emitStaffSubmitAudit, emitPartnerStampAudit } from "@/lib/socketClient";
import {
  Stamp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Send,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  FileCheck,
  Printer,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";

export default function AuditSignOffsView() {
  const { role, user, setActiveTab } = useCa();
  const [stampModalOpen, setStampModalOpen] = useState(false);
  const [auditRecord, setAuditRecord] = useState(null);
  const [staffSubmitted, setStaffSubmitted] = useState(false);

  const clientList = useMemo(() => {
    return (role === "CA_STAFF" ? user?.assignedClients : user?.clients) || [];
  }, [role, user?.assignedClients, user?.clients]);

  const [selectedClientId, setSelectedClientId] = useState("");
  const activeClientId = selectedClientId || clientList[0]?.id || clientList[0]?._id || "";

  const [pipelineData, setPipelineData] = useState(null);
  const [loadingPipeline, setLoadingPipeline] = useState(false);

  const isPartner = role === "CA_PARTNER";
  const isStaff = role === "CA_STAFF";

  // Fetch real-time data from Ultra-Fast Financial Data Pipeline
  useEffect(() => {
    let ignore = false;
    async function fetchPipeline() {
      if (!activeClientId) return;
      setLoadingPipeline(true);
      try {
        const res = await fetch(`/api/ca/data-pipeline?clientId=${activeClientId}`);
        const data = await res.json();
        if (!ignore && data?.success) {
          setPipelineData(data);
        }
      } catch (e) {
        console.warn("Pipeline load issue:", e);
      } finally {
        if (!ignore) setLoadingPipeline(false);
      }
    }
    fetchPipeline();
    return () => {
      ignore = true;
    };
  }, [activeClientId]);

  const selectedClientObj = clientList.find(
    (c) => (c.id || c._id) === activeClientId
  );
  const selectedClientName =
    pipelineData?.client?.name || selectedClientObj?.name || "Client Business";

  const handleStaffSubmit = async () => {
    try {
      const res = await fetch("/api/ca/sign-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_to_partner",
          role: "CA_STAFF",
          clientFirmId: selectedClientName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStaffSubmitted(true);
        // Live Socket Broadcast
        emitStaffSubmitAudit({
          caFirmId: user?.caFirmId || user?.id,
          staffName: user?.name,
          clientName: selectedClientName,
          submittedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStampComplete = (record) => {
    setAuditRecord(record);
    // Live Socket Broadcast
    emitPartnerStampAudit({
      caFirmId: user?.id,
      partnerName: user?.name,
      udin: record?.udin,
      clientName: selectedClientName,
      stampedAt: new Date().toISOString(),
    });
  };

  // ZERO STATE: No clients connected or allocated
  if (clientList.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Stamp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  Statutory Audit Review &amp; Digital Sign-offs
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Sec 44AB • Form 3CA/3CD
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Review finalized financial statements, dual-entry balances, and apply the official ICAI rubber stamp.
              </p>
            </div>
          </div>
        </div>

        <CrownZeroState
          variant="ca_hub"
          icon={Stamp}
          badge="Audit Desk Empty"
          title="No Connected Clients for Audit Sign-off"
          description="Your practice currently has zero connected MSME client businesses. Link a client via their business invite code or send a data access request to begin reviewing books and applying statutory rubber stamps."
          actionText={isPartner ? "Link MSME Client Business" : null}
          onAction={isPartner ? () => setActiveTab("clients") : null}
          secondaryActionText={isPartner ? "Request Data Access" : null}
          onSecondaryAction={isPartner ? () => setActiveTab("data-requests") : null}
        />
      </div>
    );
  }

  // Extract ledger accounts for balance sheet
  const ledgerAccounts = pipelineData?.ledgerAccounts || [];
  const liabilityAndEquityAccounts = ledgerAccounts.filter((a) => {
    const cat = (a.category || "").toUpperCase();
    return cat.includes("LIABILITY") || cat.includes("EQUITY") || cat.includes("CAPITAL");
  });
  const assetAccounts = ledgerAccounts.filter((a) => {
    const cat = (a.category || "").toUpperCase();
    return cat.includes("ASSET");
  });

  const totalLiabilities = liabilityAndEquityAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalAssets = assetAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const isBalanced = Math.abs(totalAssets - totalLiabilities) < 0.01;

  return (
    <div className="space-y-6">
      {/* Top Banner & Client Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Stamp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                Statutory Audit Review &amp; Digital Sign-offs
              </h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Sec 44AB • Form 3CA/3CD
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Review finalized financial statements, dual-entry balances, and apply the official ICAI rubber stamp.
            </p>
          </div>
        </div>

        {/* Client Entity Switcher & Pipeline Latency Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {pipelineData?.latencyMs && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[10px] font-mono font-black border border-emerald-200 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pipeline: {pipelineData.latencyMs}ms</span>
            </span>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Audited Entity:</label>
            <select
              value={activeClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setAuditRecord(null);
                setStaffSubmitted(false);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-800 focus:outline-hidden focus:border-indigo-600 cursor-pointer shadow-2xs"
            >
              {clientList.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* RBAC ROLE BANNER */}
      {isStaff && (
        <div className="p-4 rounded-3xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-indigo-950 block">
                Staff Audit Mode Active (CA_STAFF Role)
              </span>
              <p className="text-[11px] text-indigo-800">
                You have verification and discrepancy-checking privileges. Under ICAI regulations, statutory digital stamping is restricted to the Managing Partner (FCA).
              </p>
            </div>
          </div>
          {staffSubmitted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-black text-[11px] whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Queued for Partner Sign-off</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleStaffSubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit to Partner for Stamping</span>
            </button>
          )}
        </div>
      )}

      {/* STATUTORY AUDIT REPORT CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm relative overflow-hidden font-sans">
        {/* Applied Digital Stamp Seal Overlay (if stamped) */}
        {auditRecord && (
          <motion.div
            initial={{ scale: 2, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 0.95, rotate: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute top-8 right-8 pointer-events-none z-20 flex flex-col items-center justify-center"
          >
            {user?.digitalStampUrl ? (
              <div className="relative">
                <img
                  src={user.digitalStampUrl}
                  alt="Official CA Audit Stamp"
                  className="w-44 h-44 object-contain filter drop-shadow-md"
                />
                <div className="mt-1 text-center bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-emerald-500/40 shadow-xs">
                  <span className="text-[9px] font-mono font-black text-emerald-900 block tracking-wider">
                    UDIN: {auditRecord.udin}
                  </span>
                  <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest block">
                    Sec 44AB • Statutory Audit Passed
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-44 h-44 rounded-full border-4 border-dashed border-emerald-600 bg-emerald-50/70 p-3 flex flex-col items-center justify-center text-center shadow-lg">
                <ShieldCheck className="w-8 h-8 text-emerald-700 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                  STATUTORY AUDIT SEAL
                </span>
                <span className="text-[10px] font-black text-emerald-950 mt-1">
                  {auditRecord.certifiedBy}
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-800">
                  {auditRecord.icaiNumber}
                </span>
                <div className="h-px w-20 bg-emerald-400 my-1" />
                <span className="text-[8px] font-mono font-black text-emerald-900 tracking-wider">
                  UDIN: {auditRecord.udin?.slice(0, 14)}...
                </span>
                <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600 mt-0.5">
                  AUDIT CERTIFIED
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Report Top Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Form No. 3CB / 3CD Schedule • Section 44AB of the Income-Tax Act, 1961
            </span>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              Independent Auditor&apos;s Report &amp; Balance Sheet
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Assessee: <strong className="text-slate-900">{selectedClientName}</strong> • GSTIN:{" "}
              <strong className="font-mono">{pipelineData?.organization?.gstin || "Direct Client Feed"}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 block">Assessment Year</span>
            <span className="text-base font-black text-slate-900 font-mono">2026-27</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Financial Year 2025-26</span>
          </div>
        </div>

        {/* Statutory Compliance Audit Checklist Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Dual-Entry Balance</span>
            <span className={`font-black flex items-center gap-1 font-mono ${isBalanced ? "text-emerald-700" : "text-amber-700"}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> {isBalanced ? "Balanced (₹0.00)" : `Variance: ₹${Math.abs(totalAssets - totalLiabilities).toLocaleString("en-IN")}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">OCR Inward Documents</span>
            <span className="font-black text-emerald-700 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> {pipelineData?.ocrDocuments?.length || 0} Scans Verified
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Bank Transactions</span>
            <span className="font-black text-emerald-700 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> {pipelineData?.transactions?.length || 0} Feed Records
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Statutory Audit Status</span>
            <span className="font-black text-indigo-700 flex items-center gap-1">
              {auditRecord ? "Stamped & Approved" : staffSubmitted ? "Pending Partner Sign" : "Final Draft Review"}
            </span>
          </div>
        </div>

        {/* High-Density T-Account Balance Sheet Table */}
        {ledgerAccounts.length === 0 ? (
          <div className="my-8">
            <CrownZeroState
              variant="ledger"
              compact={true}
              badge="Client Books Empty"
              title="No Journal Entries or Ledger Accounts Recorded"
              description="This client organization has not yet posted starting balances, journal entries, or scanned invoices. When vouchers are posted or documents are scanned via the AI OCR scanner, the double-entry balance sheet populates dynamically in sub-45ms."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-xs">
            {/* Left: LIABILITIES & EQUITY */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-100 p-3 font-black text-slate-800 uppercase text-[10px] tracking-wider border-b border-slate-200 flex justify-between">
                <span>Capital &amp; Liabilities</span>
                <span>Amount (₹)</span>
              </div>
              <table className="w-full divide-y divide-slate-100 font-medium">
                <tbody>
                  {liabilityAndEquityAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {acc.name} <span className="text-[10px] text-slate-400 font-mono">({acc.code})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{acc.balance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="py-3 px-3 uppercase text-[11px]">Total Liabilities &amp; Capital</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-slate-950">
                      ₹{totalLiabilities.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Right: ASSETS */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-100 p-3 font-black text-slate-800 uppercase text-[10px] tracking-wider border-b border-slate-200 flex justify-between">
                <span>Properties &amp; Assets</span>
                <span>Amount (₹)</span>
              </div>
              <table className="w-full divide-y divide-slate-100 font-medium">
                <tbody>
                  {assetAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {acc.name} <span className="text-[10px] text-slate-400 font-mono">({acc.code})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{acc.balance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="py-3 px-3 uppercase text-[11px]">Total Properties &amp; Assets</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-emerald-800">
                      ₹{totalAssets.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Auditor Declaration & Signature Block */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="text-xs text-slate-500 max-w-lg space-y-1">
            <span className="font-bold text-slate-800 block">Auditor&apos;s Responsibility Note:</span>
            <p>
              In our opinion, proper books of accounts as required by law have been kept by the assessee so far as appears from our examination of those books. The Balance Sheet and Profit and Loss Account dealt with by this report are in agreement with the books of account.
            </p>
          </div>

          {/* RBAC ACTION ZONE (Strictly conditional based on CA_PARTNER vs CA_STAFF) */}
          <div className="flex flex-col items-end gap-3">
            {isPartner ? (
              <button
                type="button"
                onClick={() => setStampModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-xl shadow-emerald-700/20 transition-all active:scale-95 cursor-pointer"
              >
                <Stamp className="w-4 h-4" />
                <span>Apply Digital Stamp &amp; Approve</span>
              </button>
            ) : (
              <div className="text-right space-y-2">
                <button
                  type="button"
                  onClick={handleStaffSubmit}
                  disabled={staffSubmitted}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs shadow-md shadow-indigo-700/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{staffSubmitted ? "Submitted to Partner" : "Submit to Partner for Stamping"}</span>
                </button>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Stamping is reserved for the ICAI Registered Partner (FCA)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Digital Stamp Modal */}
      <DigitalAuditStampModal
        isOpen={stampModalOpen}
        onClose={() => setStampModalOpen(false)}
        clientName={selectedClientName}
        financialYear="2025-26 (AY 2026-27)"
        user={user}
        onStampSuccess={handleStampComplete}
      />
    </div>
  );
}
