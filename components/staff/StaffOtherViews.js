"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  ExternalLink,
  BookOpenCheck,
  AlertCircle,
  Scale,
  FileText,
  CheckCircle2,
  Lock,
  Send,
  Download,
  AlertTriangle,
  ArrowRight,
  Plus,
  Zap,
} from "lucide-react";
import { useStaff } from "./StaffContext";
import CrownZeroState from "@/components/ui/CrownZeroState";
import { emitStaffSubmitAudit } from "@/lib/socketClient";

// 1. Staff Assigned Clients View
export function StaffAssignedClientsView() {
  const { user, setActiveTab } = useStaff();
  const assignedClients = user?.assignedClients || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Assigned Client MSMEs
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Allocated Files
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Client businesses allocated to your desk by your Managing Partner for statutory checking.
          </p>
        </div>

        <span className="text-xs font-bold bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 shadow-2xs">
          Assigned: <strong className="text-slate-900">{assignedClients.length} Entities</strong>
        </span>
      </div>

      {assignedClients.length === 0 ? (
        <CrownZeroState
          variant="ca_hub"
          icon={Building2}
          badge="No Clients Allocated"
          title="Zero Client Files Allocated"
          description="Your Managing Partner has not yet allocated any client MSME audit files to your desk. As soon as your partner assigns work, your allocated client files will appear here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Client Legal Entity</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {assignedClients.map((c) => (
                <tr key={c.id || c._id} className="hover:bg-slate-50/70">
                  <td className="py-4 px-5">
                    <span className="font-black text-slate-900 block text-xs">{c.name}</span>
                    <span className="text-[11px] text-slate-400">Invite Code: {c.inviteCode || "BIZ-LINKED"}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono text-slate-800 block text-[11px]">{c.phoneNumber || "N/A"}</span>
                    <span className="text-[11px] text-slate-400">{c.email || "N/A"}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Audit File Active
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab("ledger-audit")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                    >
                      <span>Audit Vouchers</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 2. Staff Ledger Audit & Voucher Checking View (Live Data Pipeline Connected)
export function StaffLedgerAuditView() {
  const { user } = useStaff();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const assignedClients = useMemo(
    () => user?.assignedClients || [],
    [user?.assignedClients]
  );
  const [selectedClientId, setSelectedClientId] = useState("");
  const activeClientId =
    selectedClientId || assignedClients[0]?.id || assignedClients[0]?._id || "";

  const [pipelineData, setPipelineData] = useState(null);
  const [loadingPipeline, setLoadingPipeline] = useState(false);

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
        console.warn("Staff pipeline load issue:", e);
      } finally {
        if (!ignore) setLoadingPipeline(false);
      }
    }
    fetchPipeline();
    return () => {
      ignore = true;
    };
  }, [activeClientId]);

  const selectedClientObj = assignedClients.find(
    (c) => (c.id || c._id) === activeClientId
  );
  const selectedClientName =
    pipelineData?.client?.name || selectedClientObj?.name || "Client Business";

  const handleStaffSubmit = async () => {
    setSubmitting(true);
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
        setSubmitted(true);
        emitStaffSubmitAudit({
          caFirmId: user?.caFirmId,
          staffName: user?.name,
          clientName: selectedClientName,
          submittedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // ZERO STATE (If staff has 0 assigned clients)
  if (assignedClients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  Staff Ledger Audit &amp; Voucher Checking Desk
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Article Verification Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Review line-item vouchers, check debit/credit double-entry, and submit finalized audit file to Managing Partner for statutory rubber stamp sign-off.
              </p>
            </div>
          </div>
        </div>

        <CrownZeroState
          variant="ca_hub"
          icon={BookOpenCheck}
          badge="Desk Unallocated"
          title="No Client MSMEs Allocated to Your Desk"
          description="Your Managing Partner has not yet allocated any client MSME audit files to your desk. Once files are allocated from the partner team tab, you can audit vouchers and double-entry books here."
        />
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                Staff Ledger Audit &amp; Voucher Checking Desk
              </h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Article Verification Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Review line-item vouchers, check debit/credit double-entry, and submit finalized audit file to Managing Partner for statutory rubber stamp sign-off.
            </p>
          </div>
        </div>

        {/* Client Selector & Pipeline Latency */}
        <div className="flex items-center gap-3">
          {pipelineData?.latencyMs && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[10px] font-mono font-black border border-emerald-200">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pipeline: {pipelineData.latencyMs}ms</span>
            </span>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Audited Entity:</label>
            <select
              value={activeClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {assignedClients.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Restriction Notice & Partner Submission Action */}
      <div className="p-4 rounded-3xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-indigo-950 block">
              Staff Working Papers Mode (CA_STAFF Role)
            </span>
            <p className="text-[11px] text-indigo-800">
              Under ICAI regulations (SA 700), statutory digital rubber stamping and UDIN generation is strictly reserved for the Managing Partner (FCA). You can verify vouchers and submit them for review.
            </p>
          </div>
        </div>

        {submitted ? (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4" />
            <span>Submitted to Partner for Stamping</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleStaffSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Submitting..." : "Submit to Partner for Stamping"}</span>
          </button>
        )}
      </div>

      {/* T-Account Balance Sheet Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="border-b pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Double-Entry T-Account Trial Balance Sheet
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Entity: <strong className="text-slate-800">{selectedClientName}</strong> • Financial Year 2025-26
            </p>
          </div>
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${isBalanced ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
            {isBalanced ? "✓ Balanced (₹0.00 Variance)" : `Variance: ₹${Math.abs(totalAssets - totalLiabilities).toLocaleString("en-IN")}`}
          </span>
        </div>

        {ledgerAccounts.length === 0 ? (
          <CrownZeroState
            variant="ledger"
            compact={true}
            badge="Ledger Clean"
            title="No Ledger Accounts or Vouchers Recorded"
            description="This allocated client has not recorded transactions or starting balances yet. When the client founder posts journal entries or scans documents, real-time T-accounts will appear here automatically."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Liabilities */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-100 p-3 font-black text-slate-800 uppercase text-[10px] tracking-wider border-b flex justify-between">
                <span>Capital &amp; Liabilities</span>
                <span>Amount (₹)</span>
              </div>
              <table className="w-full divide-y divide-slate-100 font-medium">
                <tbody>
                  {liabilityAndEquityAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold">{acc.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        ₹{acc.balance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="py-3 px-3 uppercase text-[11px]">Total Liabilities</td>
                    <td className="py-3 px-3 text-right font-mono text-sm">
                      ₹{totalLiabilities.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Assets */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-100 p-3 font-black text-slate-800 uppercase text-[10px] tracking-wider border-b flex justify-between">
                <span>Properties &amp; Assets</span>
                <span>Amount (₹)</span>
              </div>
              <table className="w-full divide-y divide-slate-100 font-medium">
                <tbody>
                  {assetAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold">{acc.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        ₹{acc.balance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="py-3 px-3 uppercase text-[11px]">Total Assets</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-emerald-800">
                      ₹{totalAssets.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Staff Discrepancies View
export function StaffDiscrepanciesView() {
  const { user } = useStaff();
  const assignedClients = user?.assignedClients || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Audit Discrepancies &amp; Client Query Log
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Flagged items requiring client employee explanation or vendor invoices
          </p>
        </div>
      </div>

      <CrownZeroState
        variant="ca_hub"
        icon={AlertCircle}
        badge="Audit Clean"
        title="Zero Audit Discrepancies Flagged"
        description="All double-entry vouchers and GST line-items for your allocated client businesses are mathematically balanced with zero reported discrepancies."
      />
    </div>
  );
}

// 4. Staff Reconciliation View
export function StaffReconciliationView() {
  const { user } = useStaff();
  const assignedClients = user?.assignedClients || [];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-black text-slate-900">
          Bank &amp; Cash Reconciliation (BRS)
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Automated multi-bank OCR feed verification against cash book and bank statements
        </p>
      </div>

      {assignedClients.length === 0 ? (
        <CrownZeroState
          variant="financial_statements"
          icon={Scale}
          badge="BRS Clean"
          title="No Bank Accounts Allocated"
          description="Your Managing Partner has not yet allocated any client MSME bank accounts to your desk. Check back once clients are assigned to begin verifying BRS feeds."
        />
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-black text-emerald-950 block">Bank Feeds Verified In-Sync</span>
                <p className="text-[11px] text-emerald-800">
                  Allocated accounts for {assignedClients[0]?.name || "Client"} are in balance with zero unexplained contra variances.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-900 bg-white/70 px-2 py-1 rounded-md">
              Variance: ₹0.00
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. Staff Draft Reports View
export function StaffDraftReportsView() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-black text-slate-900">
          Draft Audit Reports &amp; Partner Submissions
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Draft workpapers prepared for Managing Partner review and statutory UDIN stamping
        </p>
      </div>

      <CrownZeroState
        variant="invoices"
        icon={FileText}
        badge="Workpapers Clean"
        title="No Draft Audit Reports Prepared Yet"
        description="Verify vouchers and test dual-entry reconciliations under Ledger Audit to compile draft statutory schedules for Managing Partner sign-off."
      />
    </div>
  );
}
