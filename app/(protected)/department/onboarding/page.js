"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { performClientLogout } from "@/lib/clientLogout";
import {
  Building2,
  Briefcase,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  LogOut,
  Users,
} from "lucide-react";

const DEPARTMENTS = [
  {
    id: "OPERATIONS",
    title: "Operations",
    desc: "Production, factory floor, machine schedules & plant management",
    color: "emerald",
  },
  {
    id: "SALES",
    title: "Sales",
    desc: "Customer billing, field orders, quotes & CRM client communication",
    color: "blue",
  },
  {
    id: "LOGISTICS",
    title: "Logistics",
    desc: "Godown storage, raw materials, stock transfer & dispatch fleet",
    color: "amber",
  },
  {
    id: "FINANCIAL",
    title: "Financial",
    desc: "Daily vouchers, cashier accounts, expense logging & ledger entries",
    color: "purple",
  },
  {
    id: "RETAIL",
    title: "Retail & Counter POS",
    desc: "Store billing counter, walk-in customers, rapid barcode scanning & daily cash drawer (D-Mart & Haldiram's Model)",
    color: "rose",
  },
];

const POST_LEVELS = [
  { id: "CHIEF_OFFICER", title: "Chief Officer", subtitle: "COO / CSO / CLO / CFO" },
  { id: "DIRECTOR", title: "Director", subtitle: "Department Head & Strategy" },
  { id: "MANAGER", title: "Manager", subtitle: "Branch / Shift Manager" },
  { id: "SUPERVISOR", title: "Supervisor", subtitle: "Floor / Team Lead" },
  { id: "ANALYST", title: "Analyst", subtitle: "Operations / Sales / Accounts Analyst" },
  { id: "COORDINATOR", title: "Coordinator", subtitle: "Order & Dispatch Coordinator" },
  { id: "ASSISTANT", title: "Assistant", subtitle: "Billing Desk / Counter Assistant" },
  { id: "OTHER", title: "Other", subtitle: "General Support & Staff" },
];

export default function EmployeeOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [availableBranches, setAvailableBranches] = useState([]);

  // Form State
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDept, setSelectedDept] = useState("OPERATIONS");
  const [selectedPost, setSelectedPost] = useState("ASSISTANT");
  const [postTitle, setPostTitle] = useState("");
  const [workDescription, setWorkDescription] = useState("");

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/employee/status");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load status");

        // If employee is already approved, route straight to their department
        if (data.employee?.isApproved && data.employee?.department) {
          router.push(`/department/${data.employee.department.toLowerCase()}`);
          return;
        }

        // If employee has already submitted onboarding and is awaiting approval
        if (data.employee?.approvalStatus === "PENDING_APPROVAL") {
          router.push("/department/pending-approval");
          return;
        }

        setEmployee(data.employee);
        setCompany(data.company);
        setAvailableBranches(data.availableBranches || []);

        // Pre-select first active branch if available
        if (data.availableBranches && data.availableBranches.length > 0) {
          const firstNonFull = data.availableBranches.find((b) => !b.isFull) || data.availableBranches[0];
          setSelectedBranch(firstNonFull.branchId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedBranch) {
      setError("Please select your assigned branch.");
      return;
    }

    if (!workDescription || workDescription.trim().length < 10) {
      setError("Please describe your daily responsibilities (minimum 10 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch,
          department: selectedDept,
          postLevel: selectedPost,
          postTitle: postTitle.trim() || undefined,
          workDescription: workDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit onboarding");

      router.push(data.redirectUrl || "/department/pending-approval");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await performClientLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading your staff profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">Crown</span>
              <span className="font-extrabold text-indigo-600 ml-1 text-base">Ecosystems</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline-block">
              {company?.name || "Company Onboarding"}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden mb-8">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 mb-3">
              <Sparkles className="w-3 h-3" />
              First-Time Staff Setup
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, {employee?.name || "Team Member"}!
            </h1>
            <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed">
              Please specify your assigned business branch, department, and role responsibilities.
              Once submitted, your business owner will review and confirm your access.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8">
            <Building2 className="w-64 h-64 text-white" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold">{error}</div>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Branch Selection */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Select Your Assigned Branch</h2>
                <p className="text-xs text-slate-500">
                  Choose the business location where you will be physically or remotely stationed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {availableBranches.map((b) => {
                const isSelected = selectedBranch === b.branchId;
                const isFull = b.isFull;

                return (
                  <label
                    key={b.branchId}
                    className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isFull
                        ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-50/50 border-indigo-600 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="branch"
                      value={b.branchId}
                      checked={isSelected}
                      disabled={isFull}
                      onChange={() => setSelectedBranch(b.branchId)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Branch #{b.branchNumber}
                      </span>
                      {isFull ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                          Capacity Full
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Available
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 mt-1">{b.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{b.location}</p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                      <span>Staff Headcount:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {b.currentStaff} / {b.staffCapacity || "Open"}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Step 2: Department Selection */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Choose Your Department</h2>
                <p className="text-xs text-slate-500">
                  Select the operational functional department you are reporting to
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {DEPARTMENTS.map((dept) => {
                const isSelected = selectedDept === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedDept(dept.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/50 border-indigo-600 shadow-xs ring-2 ring-indigo-600/20"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">{dept.title}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{dept.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 3: Post Level & Hierarchy */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Your Post Level & Title</h2>
                <p className="text-xs text-slate-500">
                  Indicate your seniority tier according to company organizational hierarchy
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {POST_LEVELS.map((p, idx) => {
                const isSelected = selectedPost === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPost(p.id)}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                      Level {idx + 1}
                    </span>
                    <span className="text-xs font-black block mt-0.5 truncate">{p.title}</span>
                    <span className={`text-[10px] block mt-1 truncate ${isSelected ? "text-indigo-100" : "text-slate-500"}`}>
                      {p.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Specific Post Title (Optional)
              </label>
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="e.g. Senior Billing Executive, Plant Shift Lead, Warehouse Head"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </section>

          {/* Step 4: Work Description */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Work Description & Daily Tasks</h2>
                <p className="text-xs text-slate-500">
                  Summarize your daily responsibilities so the owner can approve your role
                </p>
              </div>
            </div>

            <div className="pt-2">
              <textarea
                rows={4}
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Describe your day-to-day duties (e.g., managing customer invoices at counter, performing daily stock entry in godown, handling delivery routes, collecting cash receipts)..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Minimum 10 characters. This will be visible to your Business Owner for approval.
              </p>
            </div>
          </section>

          {/* Submission CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              By submitting, your profile will be sent to <strong>{company?.ownerName || "the business owner"}</strong> for verification.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting to Owner...
                </>
              ) : (
                <>
                  Submit for Owner Approval
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
