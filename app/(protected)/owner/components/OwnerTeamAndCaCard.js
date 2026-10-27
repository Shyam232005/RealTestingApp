"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  UserCheck,
  Building2,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

const ROLE_NAME_MAP = {
  BILLING_COUNTER: "Billing Counter Operator",
  GODOWN_STOCKS: "Godown & Stock Manager",
  FIELD_SALES: "Field Sales Representative",
  ACCOUNTS: "Accountant / Cashier",
  OWNER: "Business Owner",
  CA: "Chartered Accountant",
};

const DEPARTMENT_NAME_MAP = {
  operations: "Operations & Billing",
  "sales&marketing": "Sales & Marketing",
  "supplies&logistics": "Godown & Logistics",
  "finance&accounts": "Finance & Accounts",
  general: "General Business Operations",
};

export default function OwnerTeamAndCaCard({
  owner,
  organization,
  selectedBranch = "all",
  setActiveTab,
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [headcount, setHeadcount] = useState({
    total: typeof owner?.approvedStaffCount === "number" ? owner.approvedStaffCount : 0,
    byBranch: {},
  });
  const [headcountLoaded, setHeadcountLoaded] = useState(false);

  const employees = owner?.employees || [];
  const linkedCAs = owner?.linkedCAs || [];
  const inviteCode = owner?.inviteCode || "BIZ-CROWN1";

  const branchCount = Math.max(1, Number(organization?.branches || 1));
  const embeddedBranches = organization?.branchList || [];
  const activeBranches = embeddedBranches.filter((b) => b.status === "active");

  const currentBranch = embeddedBranches.find(
    (b) => b.branchId === selectedBranch
  );

  const currentBranchCapacity = currentBranch
    ? (Number(currentBranch.staffCount) || (currentBranch.branchNumber === 1 ? Number(organization?.employeeCount || 0) : 0))
    : Number(organization?.employeeCount || 0);

  const approvedStaffCount =
    selectedBranch === "all"
      ? headcount.total
      : (headcount.byBranch?.[selectedBranch] || 0);

  const displayStaffCount = headcountLoaded
    ? approvedStaffCount
    : (typeof owner?.approvedStaffCount === "number" ? owner.approvedStaffCount : 0);

  // Load Pending Approvals and Live Headcount
  useEffect(() => {
    let isCancelled = false;

    async function fetchPendingAndHeadcount() {
      try {
        const res = await fetch("/api/owner/employees/pending");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setPendingEmployees(data.pending || []);
            if (data.headcount) {
              setHeadcount(data.headcount);
              setHeadcountLoaded(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load pending employees:", err);
      }
    }

    fetchPendingAndHeadcount();

    // Listen to real-time updates across the app (approvals, deletes, transfers)
    const handleStaffUpdate = (e) => {
      if (e?.detail?.action === "APPROVE") {
        setHeadcount((prev) => ({
          total: (prev.total || 0) + 1,
          byBranch: {
            ...prev.byBranch,
            ...(e.detail.branchId
              ? { [e.detail.branchId]: (prev.byBranch?.[e.detail.branchId] || 0) + 1 }
              : {}),
          },
        }));
      } else if (e?.detail?.action === "REJECT" || e?.detail?.action === "DELETE") {
        setHeadcount((prev) => ({
          total: Math.max(0, (prev.total || 0) - 1),
          byBranch: {
            ...prev.byBranch,
            ...(e.detail?.branchId
              ? { [e.detail.branchId]: Math.max(0, (prev.byBranch?.[e.detail.branchId] || 0) - 1) }
              : {}),
          },
        }));
      }
      fetchPendingAndHeadcount();
    };

    window.addEventListener("owner-staff-updated", handleStaffUpdate);

    return () => {
      isCancelled = true;
      window.removeEventListener("owner-staff-updated", handleStaffUpdate);
    };
  }, []);

  const handleReview = async (employeeId, action) => {
    setReviewingId(employeeId);
    setReviewFeedback("");
    const cand = pendingEmployees.find((p) => p.id === employeeId);
    try {
      const res = await fetch("/api/owner/employees/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action.toLowerCase()} employee`);

      setReviewFeedback(data.message);
      // Remove from local list
      setPendingEmployees((prev) => prev.filter((p) => p.id !== employeeId));

      // Update real-time headcount
      if (data.headcount) {
        setHeadcount(data.headcount);
        setHeadcountLoaded(true);
      } else if (action === "APPROVE") {
        setHeadcount((prev) => ({
          total: (prev.total || 0) + 1,
          byBranch: {
            ...prev.byBranch,
            ...(cand?.branchId
              ? { [cand.branchId]: (prev.byBranch?.[cand.branchId] || 0) + 1 }
              : {}),
          },
        }));
      }

      // Notify entire app in real time
      window.dispatchEvent(
        new CustomEvent("owner-staff-updated", {
          detail: {
            action,
            employeeId,
            branchId: cand?.branchId,
          },
        })
      );

      setTimeout(() => setReviewFeedback(""), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setReviewingId(null);
    }
  };

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            My Staff & Chartered Accountant
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Team members and CA linked to your company
          </p>
        </div>
        {setActiveTab && (
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className="text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>Team Tab</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-purple-50/70 border border-purple-100 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
            {selectedBranch === "all" ? "Total Staff (All Units)" : "Branch Staff"}
          </p>
          <p className="text-lg font-black text-purple-950 font-mono mt-0.5">
            {displayStaffCount}
          </p>
          <p className="text-[9px] text-purple-600 font-semibold truncate mt-0.5">
            {selectedBranch === "all"
              ? `${activeBranches.length} of ${branchCount} Units Active`
              : `${currentBranch?.name || "Main HQ"}${currentBranchCapacity ? ` • ${currentBranchCapacity} Cap` : ""}`}
          </p>
        </div>
        <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
            My CA
          </p>
          <p className="text-lg font-black text-indigo-950 font-mono mt-0.5">
            {linkedCAs.length}
          </p>
          <p className="text-[9px] text-indigo-600 font-semibold truncate mt-0.5">
            {linkedCAs.length > 0 ? "Linked & Active" : "Invite Pending"}
          </p>
        </div>
      </div>

      {/* PENDING APPROVALS ALERT BOX (If any employees awaiting approval) */}
      {pendingEmployees.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
              </span>
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                Staff Awaiting Your Approval ({pendingEmployees.length})
              </h4>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">
              Action Required
            </span>
          </div>

          {reviewFeedback && (
            <p className="text-xs font-bold text-emerald-800 bg-emerald-100/80 p-2 rounded-xl">
              ✓ {reviewFeedback}
            </p>
          )}

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {pendingEmployees.map((cand) => (
              <div
                key={cand.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-900 text-sm">{cand.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {cand.email} • {cand.phoneNumber}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-extrabold text-[10px] uppercase">
                    {cand.department}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Branch Requested:</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {cand.branchName}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      Cap: {cand.activeStaffInBranch}/{cand.branchCapacity || "Open"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Post Requested:</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {cand.postTitle || cand.postLevel}
                    </span>
                  </div>
                </div>

                {cand.workDescription && (
                  <p className="text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded-lg italic border border-slate-100">
                    "{cand.workDescription}"
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleReview(cand.id, "REJECT")}
                    disabled={reviewingId === cand.id}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                  >
                    Reject & Remove
                  </button>
                  <button
                    onClick={() => handleReview(cand.id, "APPROVE")}
                    disabled={reviewingId === cand.id || cand.isBranchFull}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {reviewingId === cand.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                    ) : cand.isBranchFull ? (
                      "Branch Full"
                    ) : (
                      "Approve Staff"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branch Headcount & Connection Status */}
      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            Branch Units ({activeBranches.length}/{branchCount} Active)
          </span>
          <span className="text-[10px] font-mono text-purple-700 font-extrabold bg-purple-100/70 px-1.5 py-0.5 rounded-md">
             Total Staff
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
          {Array.from({ length: branchCount }, (_, i) => {
            const bNum = i + 1;
            const bId = `branch-${bNum}`;
            const existing = embeddedBranches.find(
              (eb) => eb.branchId === bId || eb.branchNumber === bNum
            );
            const isActive = bNum === 1 || (existing && existing.status === "active");
            const staffCapacity =
              bNum === 1
                ? Number(existing?.staffCount) || Number(organization?.employeeCount) || 0
                : Number(existing?.staffCount) || 0;

            const assignedStaff = employees.filter(
              (e) => (e.branchId || "branch-1") === bId
            ).length;

            const isCurrent =
              selectedBranch === bId || (selectedBranch === "all" && bNum === 1);

            return (
              <div
                key={bId}
                className={`flex items-center justify-between text-xs p-2 rounded-xl transition-all border ${
                  isActive
                    ? isCurrent && selectedBranch !== "all"
                      ? "bg-purple-50/60 border-purple-200"
                      : "bg-white border-slate-100"
                    : "bg-amber-50/40 border-amber-100"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    <p className="font-bold text-slate-800 truncate text-[11px]">
                      {existing?.name ||
                        (bNum === 1
                          ? `${organization?.RegisterName || "Branch 1"} - Main (HQ)`
                          : `Branch ${bNum}`)}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate pl-3.5 mt-0.5">
                    {existing?.location ||
                      (bNum === 1
                        ? organization?.location || "Headquarters"
                        : "Setup Required")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-black font-mono text-slate-800 block leading-tight">
                      {isActive ? `${assignedStaff} / ${staffCapacity}` : "0 / 0"}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 block leading-tight">
                      {isActive ? `Max: ${staffCapacity}` : "Inactive"}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? assignedStaff > staffCapacity
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isActive ? (assignedStaff > staffCapacity ? "Exceeded" : "Within Limit") : "Inactive"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 1: Staff / Employees */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            Approved Team Members ({employees.length})
          </span>
          {employees.length > 0 && (
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              {employees.filter((e) => e.isActive !== false).length} Active
            </span>
          )}
        </div>

        {employees.length > 0 ? (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {employees.map((emp, idx) => {
              const friendlyRole =
                ROLE_NAME_MAP[emp.role] || emp.postTitle || emp.roleInCompany || emp.role || "Team Member";
              const rawDept = emp.department ? emp.department.toLowerCase() : "general";
              const friendlyDept = DEPARTMENT_NAME_MAP[rawDept] || emp.department || "Operations";

              return (
                <div
                  key={emp._id || idx}
                  className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{emp.name}</p>
                    <p className="text-[11px] text-purple-700 font-semibold truncate mt-0.5">
                      {friendlyRole}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      Dept: {friendlyDept} • {emp.branchName || "Main HQ"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      emp.isActive !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {emp.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-4 text-center space-y-2">
            <p className="text-xs font-bold text-purple-950">No Staff Registered Yet</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Give your staff members your Business Code to join your company:
            </p>
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-purple-200 text-xs">
              <span className="font-mono font-black text-purple-900 tracking-wider">
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-bold transition-all cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Chartered Accountant (CA) */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            Chartered Accountant (CA)
          </span>
          <button
            onClick={() => setActiveTab("ca-hub")}
            className="text-[11px] text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-0.5 cursor-pointer"
          >
            CA-Hub
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {linkedCAs.length > 0 ? (
          <div className="space-y-2">
            {linkedCAs.map((ca, idx) => (
              <div
                key={ca._id || idx}
                className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900">{ca.name || "CA Partner"}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Actively Linked
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 font-mono">
                  ICAI Reg: {ca.icaiNumber || "Verified Member"}
                </p>
                <p className="text-[10px] text-emerald-800 font-medium">
                  ✓ Authorized for GST Returns & Audit Review
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center space-y-2">
            <p className="text-xs font-bold text-slate-800">No CA Linked Yet</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Link your Chartered Accountant so they can audit your books and prepare GST returns directly without paperwork.
            </p>
            <button
              onClick={() => setActiveTab("ca-hub")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
            >
              Connect CA in CA-Hub
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
