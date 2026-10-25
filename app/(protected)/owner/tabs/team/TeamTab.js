"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Building2,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  X,
  Phone,
  Mail,
  Check,
  Ban,
  Filter,
  Sparkles,
  ShieldCheck,
  Layers,
  Flame,
} from "lucide-react";

const DEPARTMENTS = [
  { id: "ALL", label: "All Departments" },
  { id: "OPERATIONS", label: "Operations" },
  { id: "SALES", label: "Sales" },
  { id: "LOGISTICS", label: "Logistics" },
  { id: "FINANCIAL", label: "Financial" },
];

const DUTY_STATUSES = [
  { id: "ALL", label: "All Statuses" },
  { id: "ON_DUTY", label: "🟢 On Duty (Punched In)" },
  { id: "COMPLETED", label: "⚪ Completed Shift" },
  { id: "OFF_DUTY", label: "⚪ Off Duty" },
  { id: "ON_LEAVE", label: "🏖️ On Leave" },
];

const DEPT_COLORS = {
  OPERATIONS: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    accent: "bg-blue-600",
  },
  SALES: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    accent: "bg-emerald-600",
  },
  LOGISTICS: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    accent: "bg-amber-600",
  },
  FINANCIAL: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    accent: "bg-purple-600",
  },
};

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TeamTab({
  organization,
  selectedBranch = "all",
  setActiveTab,
}) {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalStaff: 0,
    onDutyCount: 0,
    completedShiftCount: 0,
    offDutyCount: 0,
    onLeaveCount: 0,
    reportsTodayCount: 0,
    pendingLeavesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [branchOverride, setBranchOverride] = useState(null);

  // Derive current branch without setState in effect
  const currentBranchId = branchOverride !== null ? branchOverride : (selectedBranch || "all");

  // Modal Dossier State
  const [dossierEmployee, setDossierEmployee] = useState(null);
  const [dossierData, setDossierData] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierTab, setDossierTab] = useState("submissions"); // "submissions" | "attendance" | "leaves"

  // Leave Review Modal
  const [reviewingLeave, setReviewingLeave] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch staff roster
  const fetchEmployees = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (currentBranchId && currentBranchId !== "all") {
        params.append("branchId", currentBranchId);
      }
      if (selectedDept && selectedDept !== "ALL") {
        params.append("department", selectedDept);
      }

      const res = await fetch(`/api/owner/employees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setStats(
          data.stats || {
            totalStaff: 0,
            onDutyCount: 0,
            completedShiftCount: 0,
            offDutyCount: 0,
            onLeaveCount: 0,
            reportsTodayCount: 0,
            pendingLeavesCount: 0,
          }
        );
      }
    } catch (err) {
      console.error("Failed to load team roster:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (currentBranchId && currentBranchId !== "all") {
          params.append("branchId", currentBranchId);
        }
        if (selectedDept && selectedDept !== "ALL") {
          params.append("department", selectedDept);
        }
        const res = await fetch(`/api/owner/employees?${params.toString()}`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setEmployees(data.employees || []);
          setStats(data.stats || {});
        }
      } catch (e) {
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 20000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentBranchId, selectedDept]);

  // Open Dossier
  const handleOpenDossier = async (emp) => {
    setDossierEmployee(emp);
    setDossierTab("submissions");
    setDossierLoading(true);
    try {
      const res = await fetch(`/api/owner/employees/${emp.id}/dossier`);
      if (res.ok) {
        const data = await res.json();
        setDossierData(data);
      }
    } catch (e) {
      console.error("Dossier load error:", e);
    } finally {
      setDossierLoading(false);
    }
  };

  // Handle Leave Review
  const handleReviewLeaveAction = async (action) => {
    if (!reviewingLeave) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/owner/leaves/${reviewingLeave.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewNotes: reviewNotes.trim(),
        }),
      });

      if (res.ok) {
        setReviewingLeave(null);
        setReviewNotes("");
        fetchEmployees();
        if (dossierEmployee) {
          handleOpenDossier(dossierEmployee);
        }
      }
    } catch (err) {
      console.error("Review leave error:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filtered staff list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Status filter
      if (selectedStatus !== "ALL" && emp.dutyStatus !== selectedStatus) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = emp.name?.toLowerCase().includes(q);
        const matchEmail = emp.email?.toLowerCase().includes(q);
        const matchPhone = emp.phoneNumber?.toLowerCase().includes(q);
        const matchPost = emp.postTitle?.toLowerCase().includes(q) || emp.postLevel?.toLowerCase().includes(q);
        const matchWork = emp.workDescription?.toLowerCase().includes(q);
        const matchBranch = emp.branchName?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchPost && !matchWork && !matchBranch) {
          return false;
        }
      }

      return true;
    });
  }, [employees, selectedStatus, searchQuery]);

  const branchList = Array.isArray(organization?.branchList) ? organization.branchList : [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Staff & Team Operations
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Live staff attendance, department assignments, shift status, and daily task reporting.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchEmployees(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-purple-600" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Live"}</span>
          </button>

          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab("approval")}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-purple-600/20"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pending Approvals</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Approved Staff
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {stats.totalStaff || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Registered & active team members
          </p>
        </div>

        {/* Currently On Duty */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200/90 shadow-xs relative overflow-hidden bg-gradient-to-br from-emerald-50/40 via-white to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              Live On Duty
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
              {stats.onDutyCount || 0}
            </p>
            {stats.onDutyCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Shift
              </span>
            )}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {stats.completedShiftCount > 0
              ? `${stats.completedShiftCount} completed shift today`
              : "Currently punched in"}
          </p>
        </div>

        {/* Daily Reports Today */}
        <div className="bg-white rounded-3xl p-5 border border-blue-200/90 shadow-xs relative overflow-hidden bg-gradient-to-br from-blue-50/40 via-white to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800">
              Reports Submitted
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-950 mt-2 font-mono">
            {stats.reportsTodayCount || 0}
          </p>
          <p className="text-[11px] text-blue-700 font-medium mt-1">
            Work summaries logged today
          </p>
        </div>

        {/* Leaves Status */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200/90 shadow-xs relative overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
              Leaves & Absences
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
              {stats.onLeaveCount || 0}
            </p>
            {stats.pendingLeavesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                {stats.pendingLeavesCount} to review
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            Staff on approved leave today
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, post title, phone, or responsibility..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Branch Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Branch:</span>
            <select
              value={currentBranchId}
              onChange={(e) => setBranchOverride(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Branches (Consolidated)</option>
              {branchList.map((b) => (
                <option key={b.branchId} value={b.branchId}>
                  {b.name || `Branch #${b.branchNumber}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Department & Status Pills */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Department Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 mr-1 shrink-0">
              Dept:
            </span>
            {DEPARTMENTS.map((dept) => {
              const active = selectedDept === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDept(dept.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    active
                      ? "bg-purple-600 text-white shadow-xs shadow-purple-600/30"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
                  }`}
                >
                  {dept.label}
                </button>
              );
            })}
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 mr-1 shrink-0">
              Shift:
            </span>
            {DUTY_STATUSES.map((status) => {
              const active = selectedStatus === status.id;
              return (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => setSelectedStatus(status.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
                  }`}
                >
                  {status.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff Roster Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Loading team operations roster...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-900">
            {employees.length === 0
              ? "No Approved Staff In Organization"
              : "No Staff Match Selected Filters"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            {employees.length === 0
              ? "New employees register under your company with their email or OTP and choose their branch & department. Review and approve incoming requests in the Approvals Desk."
              : "Try choosing 'All Departments' or 'All Statuses', or clear your search query."}
          </p>
          {employees.length === 0 && setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab("approval")}
              className="mt-5 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer inline-flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Check Pending Staff Approvals</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => {
            const deptStyle = DEPT_COLORS[emp.department] || DEPT_COLORS.OPERATIONS;
            const isOnDuty = emp.dutyStatus === "ON_DUTY";
            const isCompleted = emp.dutyStatus === "COMPLETED";
            const isOnLeave = emp.dutyStatus === "ON_LEAVE";

            return (
              <div
                key={emp.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header: Department badge + Branch + Live Duty Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}
                      >
                        {emp.department}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {emp.branchName}
                      </span>
                    </div>

                    {/* Live Duty Status Badge */}
                    {isOnDuty ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        ON DUTY
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-slate-400" />
                        COMPLETED ({formatDuration(emp.attendance?.durationMinutes)})
                      </span>
                    ) : isOnLeave ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        ON LEAVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold">
                        OFF DUTY
                      </span>
                    )}
                  </div>

                  {/* Profile info: Avatar + Name + Hierarchy Level & Title */}
                  <div className="flex items-center gap-3 mb-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs ${deptStyle.accent}`}
                    >
                      {emp.name?.charAt(0)?.toUpperCase() || "E"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-slate-900 truncate">
                        {emp.name}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 truncate mt-0.5">
                        <span className="uppercase text-purple-600 tracking-wider">
                          {emp.postLevel}
                        </span>{" "}
                        • {emp.postTitle}
                      </p>
                    </div>
                  </div>

                  {/* Contact Snippets */}
                  <div className="text-[11px] text-slate-500 space-y-1 mb-3 bg-slate-50/60 p-2.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{emp.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Doing What Work Box */}
                  <div className="mb-3.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Assigned Work & Responsibilities
                    </span>
                    <p className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70 leading-relaxed line-clamp-3">
                      {emp.workDescription}
                    </p>
                  </div>

                  {/* Shift Punch Activity Context */}
                  {isOnDuty && emp.attendance && (
                    <div className="mb-3 p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-900 text-xs">
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span>
                          {emp.attendance.shiftType.toLowerCase()} shift
                        </span>
                        <span className="font-mono">
                          Punched in:{" "}
                          {new Date(emp.attendance.punchIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {emp.attendance.punchInNotes && (
                        <p className="text-[10px] text-emerald-700 italic mt-1">
                          "{emp.attendance.punchInNotes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Today's Work Report Box */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Today's Work Report
                      </span>
                      {emp.submission && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                          {emp.submission.tasksCompleted?.length || 0} tasks logged
                        </span>
                      )}
                    </div>

                    {emp.submission ? (
                      <div className="p-2.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-slate-800">
                        <p className="font-bold text-blue-950 truncate">
                          "{emp.submission.title}"
                        </p>
                        {emp.submission.blockers && (
                          <div className="mt-1 flex items-start gap-1 text-[11px] text-amber-800 font-bold bg-amber-100/70 p-1.5 rounded-xl">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              Blocker: {emp.submission.blockers}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                        <span className="text-[11px] text-slate-400 font-medium">
                          No daily report submitted yet today
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pending Leave Notification for this Employee */}
                  {emp.pendingLeaves && emp.pendingLeaves.length > 0 && (
                    <div className="mb-3 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-black text-[11px] truncate">
                          {emp.pendingLeaves[0].totalDays === 0.5 ? "Half Day" : `${emp.pendingLeaves[0].totalDays}d`}{" "}
                          {emp.pendingLeaves[0].leaveType.toLowerCase()} leave
                          pending
                        </p>
                        <p className="text-[10px] text-amber-700 truncate">
                          {emp.pendingLeaves[0].startDate} to{" "}
                          {emp.pendingLeaves[0].endDate}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setReviewingLeave({
                            ...emp.pendingLeaves[0],
                            employeeName: emp.name,
                          })
                        }
                        className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black shrink-0 cursor-pointer shadow-xs"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Card Action: Full Dossier / Activity Log */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Joined: {new Date(emp.joinedAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenDossier(emp)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer group-hover:bg-purple-600 group-hover:text-white"
                  >
                    <span>View Activity Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dossier Modal / Drawer */}
      {dossierEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-purple-600/20">
                  {dossierEmployee.name?.charAt(0)?.toUpperCase() || "E"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {dossierEmployee.name}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 uppercase">
                      {dossierEmployee.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {dossierEmployee.postTitle} • {dossierEmployee.branchName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDossierEmployee(null);
                  setDossierData(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setDossierTab("submissions")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  dossierTab === "submissions"
                    ? "border-purple-600 text-purple-700 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  Daily Work Reports (
                  {dossierData?.submissions?.length || 0})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDossierTab("attendance")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  dossierTab === "attendance"
                    ? "border-purple-600 text-purple-700 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Shift Attendance (
                  {dossierData?.attendanceHistory?.length || 0})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDossierTab("leaves")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  dossierTab === "leaves"
                    ? "border-purple-600 text-purple-700 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Leaves History ({dossierData?.leaves?.length || 0})</span>
              </button>
            </div>

            {/* Dossier Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {dossierLoading ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">
                    Retrieving full activity records...
                  </p>
                </div>
              ) : dossierTab === "submissions" ? (
                /* Submissions Tab */
                <div className="space-y-4">
                  {(!dossierData?.submissions ||
                    dossierData.submissions.length === 0) ? (
                    <div className="py-10 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold">
                        No daily reports submitted by {dossierEmployee.name} yet.
                      </p>
                    </div>
                  ) : (
                    dossierData.submissions.map((sub) => (
                      <div
                        key={sub._id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-900">
                            {sub.title}
                          </h4>
                          <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-bold">
                            {sub.date}
                          </span>
                        </div>

                        {/* Completed Tasks Checklist */}
                        {sub.tasksCompleted && sub.tasksCompleted.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              Completed Tasks
                            </span>
                            <ul className="space-y-1">
                              {sub.tasksCompleted.map((task, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-slate-700 flex items-start gap-2"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Blockers */}
                        {sub.blockers && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                            <span className="font-black block text-[10px] uppercase tracking-wider text-amber-700">
                              Blocker / Owner Action Needed:
                            </span>
                            <p className="mt-0.5 font-medium">{sub.blockers}</p>
                          </div>
                        )}

                        {/* Summary */}
                        {sub.summary && (
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                            {sub.summary}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : dossierTab === "attendance" ? (
                /* Attendance History Tab */
                <div className="space-y-3">
                  {(!dossierData?.attendanceHistory ||
                    dossierData.attendanceHistory.length === 0) ? (
                    <div className="py-10 text-center text-slate-400">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold">
                        No attendance records logged yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Shift</th>
                            <th className="py-2.5 px-3">Punch In</th>
                            <th className="py-2.5 px-3">Punch Out</th>
                            <th className="py-2.5 px-3">Duration</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {dossierData.attendanceHistory.map((att) => (
                            <tr key={att._id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                {att.date}
                              </td>
                              <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-purple-700">
                                {att.shiftType}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {att.punchIn
                                  ? new Date(att.punchIn).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : "-"}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {att.punchOut
                                  ? new Date(att.punchOut).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : "Still working"}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold">
                                {formatDuration(att.durationMinutes)}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                    att.status === "COMPLETED"
                                      ? "bg-slate-100 text-slate-700"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {att.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* Leaves History Tab */
                <div className="space-y-3">
                  {(!dossierData?.leaves ||
                    dossierData.leaves.length === 0) ? (
                    <div className="py-10 text-center text-slate-400">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold">
                        No leave records recorded for this employee.
                      </p>
                    </div>
                  ) : (
                    dossierData.leaves.map((lv) => (
                      <div
                        key={lv._id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 uppercase">
                              {lv.leaveType} LEAVE
                            </span>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                lv.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : lv.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800"
                                  : lv.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {lv.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            <span className="font-bold text-slate-900">
                              {lv.totalDays === 0.5 ? "Half Day (0.5)" : `${lv.totalDays} Day${lv.totalDays === 1 ? "" : "s"}`}
                            </span>{" "}
                            ({lv.startDate} to {lv.endDate})
                          </p>
                          <p className="text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-100 mt-1">
                            Reason: "{lv.reason}"
                          </p>
                          {lv.reviewNotes && (
                            <p className="text-[11px] text-purple-700 font-bold mt-1">
                              Owner decision note: {lv.reviewNotes}
                            </p>
                          )}
                        </div>

                        {lv.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() =>
                              setReviewingLeave({
                                id: lv._id,
                                employeeName: dossierEmployee.name,
                                ...lv,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                          >
                            Decide
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/60">
              <button
                type="button"
                onClick={() => {
                  setDossierEmployee(null);
                  setDossierData(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Review Decision Modal */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Review Leave Application
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {reviewingLeave.employeeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingLeave(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
              <div className="flex items-center justify-between font-bold">
                <span className="uppercase text-purple-700">
                  {reviewingLeave.leaveType} Leave
                </span>
                <span className="font-mono text-slate-900">
                  {reviewingLeave.totalDays === 0.5 ? "Half Day (0.5)" : `${reviewingLeave.totalDays} Day(s)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Period: {reviewingLeave.startDate} to {reviewingLeave.endDate}
              </p>
              <div className="pt-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Employee's Stated Reason:
                </span>
                <p className="italic text-slate-800">
                  "{reviewingLeave.reason}"
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Review Notes / Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add optional notes for the employee..."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReviewingLeave(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={() => handleReviewLeaveAction("REJECT")}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Decline Leave
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={() => handleReviewLeaveAction("APPROVE")}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReview ? "Processing..." : "Approve Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
