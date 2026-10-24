"use client";
import React, { useState } from "react";
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

export default function OwnerTeamAndCaCard({ owner, organization, setActiveTab }) {
  const [copiedCode, setCopiedCode] = useState(false);

  const employees = owner?.employees || [];
  const linkedCAs = owner?.linkedCAs || [];
  const inviteCode = owner?.inviteCode || "BIZ-CROWN1";

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
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-purple-50/70 border border-purple-100 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
            My Staff
          </p>
          <p className="text-lg font-black text-purple-950 font-mono mt-0.5">
            {employees.length}
          </p>
        </div>
        <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
            My CA
          </p>
          <p className="text-lg font-black text-indigo-950 font-mono mt-0.5">
            {linkedCAs.length}
          </p>
        </div>
      </div>

      {/* Section 1: Staff / Employees */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            Team Members ({employees.length})
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
                ROLE_NAME_MAP[emp.role] || emp.roleInCompany || emp.role || "Team Member";
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
                      Dept: {friendlyDept}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      emp.isActive !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {emp.isActive !== false ? "On Duty" : "Inactive"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-4 text-center space-y-2">
            <p className="text-xs font-bold text-purple-950">No Staff Registered Yet</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Give your billing desk, godown keeper, or sales team your Business Code to join your company:
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
