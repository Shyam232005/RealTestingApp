"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { performClientLogout } from "@/lib/clientLogout";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Layers,
  FileText,
  RefreshCw,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState("");

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/employee/status");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check status");

      // If approved, redirect immediately
      if (data.employee?.isApproved && data.employee?.department) {
        router.push(`/department/${data.employee.department.toLowerCase()}`);
        return;
      }

      // If profile incomplete, redirect to onboarding
      if (!data.employee?.approvalStatus || data.employee?.approvalStatus === "PENDING_PROFILE") {
        router.push("/department/onboarding");
        return;
      }

      setEmployee(data.employee);
      setCompany(data.company);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/employee/status");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (isCancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to check status");

        if (data.employee?.isApproved && data.employee?.department) {
          router.push(`/department/${data.employee.department.toLowerCase()}`);
          return;
        }

        if (!data.employee?.approvalStatus || data.employee?.approvalStatus === "PENDING_PROFILE") {
          router.push("/department/onboarding");
          return;
        }

        setEmployee(data.employee);
        setCompany(data.company);
      } catch (err) {
        if (!isCancelled) setError(err.message);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, 10000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  const handleLogout = async () => {
    await performClientLogout();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">Crown</span>
              <span className="font-extrabold text-indigo-600 ml-1 text-base">Ecosystems</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
          {/* Top Status Icon */}
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/70 mb-5 relative">
            <Clock className="w-10 h-10 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
            </span>
          </div>

          <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800 mb-2">
            Verification in Progress
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Submitted for Business Owner Approval
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Thank you, <strong>{employee?.name || "Team Member"}</strong>! Your details have been submitted to{" "}
            <strong>{company?.ownerName || "your Business Owner"}</strong>. Once your role is verified,
            your department portal will unlock automatically.
          </p>

          {/* Submitted Summary Card */}
          <div className="mt-8 text-left rounded-2xl bg-slate-50 border border-slate-200/80 p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted Information Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Assigned Branch</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {employee?.branchName || "Main HQ"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Department</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {employee?.department || "OPERATIONS"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Post Level & Title</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {employee?.postTitle || employee?.postLevel?.replace(/_/g, " ") || "Staff Member"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Company</span>
                  <span className="font-extrabold text-slate-900 text-sm truncate">
                    {company?.name || "Crown Ecosystems"}
                  </span>
                </div>
              </div>
            </div>

            {employee?.workDescription && (
              <div className="pt-3 border-t border-slate-200">
                <span className="text-slate-400 block text-[11px] font-semibold mb-1">
                  Work Responsibilities Summary
                </span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                  "{employee.workDescription}"
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-pulse" : ""}`} />
              {checking ? "Checking Approval..." : "Check Approval Status"}
            </button>
            <p className="text-[11px] text-slate-400 font-medium">
              This page automatically checks every 10 seconds.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
