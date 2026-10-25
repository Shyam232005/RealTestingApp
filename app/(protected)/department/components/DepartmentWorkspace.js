"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Calendar,
  ClipboardList,
  User,
  LogOut,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Layers,
  FileText,
  Play,
  Square,
  Plus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  Lock,
} from "lucide-react";

export default function DepartmentWorkspace({ currentDepartment = "OPERATIONS" }) {
  const router = useRouter();

  // Core State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("attendance"); // attendance | leaves | submissions | profile
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [profileData, setProfileData] = useState(null);

  // Punch Action States
  const [punchingIn, setPunchingIn] = useState(false);
  const [punchingOut, setPunchingOut] = useState(false);
  const [punchInNote, setPunchInNote] = useState("");
  const [shiftType, setShiftType] = useState("GENERAL");
  const [punchOutNote, setPunchOutNote] = useState("");
  const [showPunchOutModal, setShowPunchOutModal] = useState(false);

  // Leave Form State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "CASUAL",
    startDate: "",
    endDate: "",
    totalDays: "1",
    reason: "",
    handoverNote: "",
  });

  // Submission Form State
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    title: "",
    tasks: [""],
    blockers: "",
    summary: "",
  });

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [profileDesc, setProfileDesc] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Feedback Banners
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const isPunchedIn = Boolean(todayAttendance?.isPunchedIn);
  const isShiftCompleted = Boolean(todayAttendance?.isCompleted);
  const effectiveTab = isPunchedIn ? activeTab : "attendance";

  // Live Timer for On-Duty Shift
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isPunchedIn || !todayAttendance?.punchIn) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isPunchedIn, todayAttendance?.punchIn]);

  let formattedTimer = "00h 00m 00s";
  if (isPunchedIn && todayAttendance?.punchIn) {
    const startMs = new Date(todayAttendance.punchIn).getTime();
    const elapsed = Math.max(0, Math.floor((now - startMs) / 1000));
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    formattedTimer = `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const statusRes = await fetch("/api/employee/status");
        if (statusRes.status === 401) {
          router.push("/login");
          return;
        }
        const statusData = await statusRes.json();
        if (isCancelled) return;
        if (!statusRes.ok) throw new Error(statusData.error || "Failed to load employee status");

        if (!statusData.employee?.isApproved) {
          setEmployee(statusData.employee);
          setCompany(statusData.company);
          setLoading(false);
          if (statusData.employee?.approvalStatus === "PENDING_APPROVAL") {
            window.location.href = "/department/pending-approval";
            return;
          }
          window.location.href = "/department/onboarding";
          return;
        }

        setEmployee(statusData.employee);
        setCompany(statusData.company);
        setTodayAttendance(statusData.todayAttendance);

        const [attRes, leaveRes, subRes, profRes] = await Promise.all([
          fetch("/api/employee/attendance"),
          fetch("/api/employee/leaves"),
          fetch("/api/employee/submissions"),
          fetch("/api/employee/profile"),
        ]);

        if (isCancelled) return;

        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendanceHistory(attData.history || []);
          if (attData.today) setTodayAttendance(attData.today);
        }
        if (leaveRes.ok) {
          const leaveData = await leaveRes.json();
          setLeavesList(leaveData.leaves || []);
        }
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubmissionsList(subData.submissions || []);
        }
        if (profRes.ok) {
          const profData = await profRes.json();
          setProfileData(profData.profile);
          setProfilePhone(profData.profile?.phoneNumber || "");
          setProfileDesc(profData.profile?.workDescription || "");
        }
      } catch (err) {
        if (!isCancelled) {
          setFeedback({ type: "error", message: err.message });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  // PUNCH IN HANDLER
  const handlePunchIn = async (e) => {
    e?.preventDefault();
    setPunchingIn(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/employee/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftType, punchInNotes: punchInNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Punch in failed");

      setTodayAttendance({
        ...data.attendance,
        isPunchedIn: true,
        isCompleted: false,
      });
      setFeedback({ type: "success", message: "Punch In successful! Shift started." });
      setPunchInNote("");
      // Refresh attendance history
      const attRes = await fetch("/api/employee/attendance");
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendanceHistory(attData.history || []);
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setPunchingIn(false);
    }
  };

  // PUNCH OUT HANDLER
  const handlePunchOut = async () => {
    setPunchingOut(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/employee/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ punchOutNotes: punchOutNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Punch out failed");

      setTodayAttendance({
        ...data.attendance,
        isPunchedIn: false,
        isCompleted: true,
      });
      setShowPunchOutModal(false);
      setPunchOutNote("");
      setActiveTab("attendance");
      setFeedback({ type: "success", message: "Punch Out recorded! Shift logged for the owner. You can punch in again anytime." });
      // Refresh attendance history
      const attRes = await fetch("/api/employee/attendance");
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendanceHistory(attData.history || []);
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setPunchingOut(false);
    }
  };

  // TAB CLICK HANDLER: Gates other tabs unless actively punched in
  const handleTabClick = (tabId) => {
    if (!isPunchedIn && tabId !== "attendance") {
      setFeedback({
        type: "error",
        message: "Attendance punch-in required first! Please punch in to access this tab and begin working.",
      });
      return;
    }
    setActiveTab(tabId);
  };

  // SUBMIT LEAVE
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmittingLeave(true);
    setFeedback({ type: "", message: "" });

    try {
      const parsedDays = parseFloat(leaveForm.totalDays);
      if (!leaveForm.totalDays || isNaN(parsedDays) || parsedDays < 0.5) {
        throw new Error("Please enter a valid number of days (minimum 0.5 for half day).");
      }

      const res = await fetch("/api/employee/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leaveForm,
          totalDays: parsedDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply for leave");

      setLeavesList([data.leave, ...leavesList]);
      setShowLeaveModal(false);
      setLeaveForm({
        leaveType: "CASUAL",
        startDate: "",
        endDate: "",
        totalDays: "1",
        reason: "",
        handoverNote: "",
      });
      setFeedback({ type: "success", message: "Leave application submitted to owner for review." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmittingLeave(false);
    }
  };

  // CANCEL LEAVE
  const handleCancelLeave = async (leaveId) => {
    if (!confirm("Are you sure you want to cancel this pending leave application?")) return;

    try {
      const res = await fetch(`/api/employee/leaves/${leaveId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel leave");

      setLeavesList(leavesList.map((l) => (l._id === leaveId ? { ...l, status: "CANCELLED" } : l)));
      setFeedback({ type: "success", message: "Leave application cancelled." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // SUBMIT DAILY REPORT
  const handleDailySubmission = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/employee/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: submissionForm.title,
          tasksCompleted: submissionForm.tasks.filter((t) => t.trim().length > 0),
          blockers: submissionForm.blockers,
          summary: submissionForm.summary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit daily report");

      setSubmissionsList([data.submission, ...submissionsList]);
      setShowSubmissionModal(false);
      setSubmissionForm({
        title: "",
        tasks: [""],
        blockers: "",
        summary: "",
      });
      setFeedback({ type: "success", message: "Daily report submitted successfully to business owner." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmittingReport(false);
    }
  };

  // SAVE PROFILE
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/employee/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: profilePhone,
          workDescription: profileDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setProfileData({
        ...profileData,
        phoneNumber: profilePhone,
        workDescription: profileDesc,
      });
      setEditingProfile(false);
      setFeedback({ type: "success", message: "Profile updated successfully." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading your department workspace...</p>
      </div>
    );
  }

  // Strict Protection Gate: Unapproved employees NEVER see department content
  if (!employee?.isApproved) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800 mb-2">
          {employee?.approvalStatus === "PENDING_APPROVAL" ? "Awaiting Owner Approval" : "Setup Incomplete"}
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mt-2 mb-6 leading-relaxed">
          {employee?.approvalStatus === "PENDING_APPROVAL"
            ? `Your registration request is currently awaiting verification from your Business Owner (${company?.ownerName || "Founder"}). You cannot view department content until approved.`
            : "Please complete your branch and department onboarding setup first."}
        </p>
        <button
          onClick={() => {
            window.location.href =
              employee?.approvalStatus === "PENDING_APPROVAL"
                ? "/department/pending-approval"
                : "/department/onboarding";
          }}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm cursor-pointer"
        >
          {employee?.approvalStatus === "PENDING_APPROVAL"
            ? "Go to Approval Status Screen"
            : "Complete Profile Setup"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* =========================================================================
          LEFT SIDEBAR (Template from Uploaded Image)
         ========================================================================= */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 sticky top-0 h-screen z-20">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">Crown</span>
              <span className="font-extrabold text-indigo-600 ml-1 text-base">Ecosystems</span>
            </div>
          </div>
        </div>

        {/* User Mini Profile (from uploaded template design) */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50/90 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-xs shrink-0">
              {employee?.name ? employee.name.charAt(0) : "E"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900 truncate">{employee?.name}</p>
              <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                {employee?.postTitle || employee?.postLevel?.replace(/_/g, " ") || "Staff"}
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span className="truncate">{employee?.branchName || "Main HQ"}</span>
            <span className="font-bold text-indigo-600 uppercase tracking-wider">
              {employee?.department || currentDepartment}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {/* 1. Attendance Tab */}
          <button
            onClick={() => handleTabClick("attendance")}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              effectiveTab === "attendance"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4" />
              <span>1. Attendance</span>
            </div>
            {isPunchedIn ? (
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  effectiveTab === "attendance" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                On Duty
              </span>
            ) : isShiftCompleted ? (
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  effectiveTab === "attendance" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                Re-Punch In
              </span>
            ) : (
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  effectiveTab === "attendance" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                Required
              </span>
            )}
          </button>

          {/* 2. Leaves Tab */}
          <button
            onClick={() => handleTabClick("leaves")}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              !isPunchedIn
                ? "text-slate-400 opacity-60 hover:bg-slate-50 cursor-pointer"
                : effectiveTab === "leaves"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 cursor-pointer"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            }`}
            title={!isPunchedIn ? "Punch in attendance to unlock" : "Leaves Desk"}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4" />
              <span>2. Leaves</span>
            </div>
            {!isPunchedIn ? (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            ) : leavesList.some((l) => l.status === "PENDING") ? (
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  effectiveTab === "leaves" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                Pending
              </span>
            ) : null}
          </button>

          {/* 3. Submissions Tab */}
          <button
            onClick={() => handleTabClick("submissions")}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              !isPunchedIn
                ? "text-slate-400 opacity-60 hover:bg-slate-50 cursor-pointer"
                : effectiveTab === "submissions"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 cursor-pointer"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            }`}
            title={!isPunchedIn ? "Punch in attendance to unlock" : "Daily Submissions"}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-4 h-4" />
              <span>3. Submissions</span>
            </div>
            {!isPunchedIn && <Lock className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* 4. Profile Tab */}
          <button
            onClick={() => handleTabClick("profile")}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              !isPunchedIn
                ? "text-slate-400 opacity-60 hover:bg-slate-50 cursor-pointer"
                : effectiveTab === "profile"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 cursor-pointer"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            }`}
            title={!isPunchedIn ? "Punch in attendance to unlock" : "Employee Profile"}
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" />
              <span>Employee Profile</span>
            </div>
            {!isPunchedIn && <Lock className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </nav>

        {/* Bottom Profile / Logout Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Logged in as Staff</span>
            <span className="font-mono text-slate-700 font-bold">{company?.code || "BIZ"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN WORKSPACE
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10">
          {/* Search Bar (matching uploaded UI design) */}
          <div className="relative w-72 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shifts, leaves, reports..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          {/* Shift Status & Quick Action in Header */}
          <div className="flex items-center gap-4">
            {isPunchedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span>On Duty:</span>
                  <span className="font-mono font-black">{formattedTimer}</span>
                </div>
                <button
                  onClick={() => setShowPunchOutModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  Punch Out
                </button>
              </div>
            ) : isShiftCompleted ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Shift Ended for Today
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Attendance Pending
                </div>
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                  Punch In Now
                </button>
              </div>
            )}

            <button
              className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Feedback Banner */}
        {feedback.message && (
          <div
            className={`mx-6 sm:mx-8 mt-4 p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold ${
              feedback.type === "error"
                ? "bg-rose-50 border border-rose-200 text-rose-800"
                : "bg-emerald-50 border border-emerald-200 text-emerald-800"
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback({ type: "", message: "" })}
              className="text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Content Area */}
        <main className="p-6 sm:p-8 space-y-6">
          {/* =========================================================================
              TAB 1: ATTENDANCE
             ========================================================================= */}
          {effectiveTab === "attendance" && (
            <div className="space-y-6">
              {/* Shift Hero Action Card */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider block mb-1">
                      Today's Daily Shift • {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {isPunchedIn
                        ? "Shift Currently Active & Recorded"
                        : isShiftCompleted
                        ? "Shift Completed Earlier • Ready to Punch In Again?"
                        : "Ready to Start Today's Shift?"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
                      {isPunchedIn
                        ? `You punched in at ${new Date(todayAttendance.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. When your work is done, punch out to inform the owner.`
                        : isShiftCompleted
                        ? `You previously logged out at ${todayAttendance?.punchOut ? new Date(todayAttendance.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "earlier"} (${Math.floor((todayAttendance?.durationMinutes || 0) / 60)}h ${(todayAttendance?.durationMinutes || 0) % 60}m worked total today). You can punch in again now to begin a new shift session or make additional entries.`
                        : "Punch in to start your work timer and unlock your department's leave, reporting, and profile tabs."}
                    </p>
                  </div>

                  {/* Punch Button Action */}
                  <div className="shrink-0 flex items-center gap-3">
                    {isPunchedIn ? (
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="text-center sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Active Time
                          </span>
                          <span className="text-xl font-black text-slate-900 font-mono">
                            {formattedTimer}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowPunchOutModal(true)}
                          className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <Square className="w-4 h-4 fill-white" />
                          Punch Out / End Shift
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handlePunchIn} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <select
                          value={shiftType}
                          onChange={(e) => setShiftType(e.target.value)}
                          className="px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-hidden"
                        >
                          <option value="GENERAL">General Shift</option>
                          <option value="MORNING">Morning Shift</option>
                          <option value="EVENING">Evening Shift</option>
                          <option value="FIELD">Field Duty</option>
                        </select>
                        <input
                          type="text"
                          value={punchInNote}
                          onChange={(e) => setPunchInNote(e.target.value)}
                          placeholder={isShiftCompleted ? "Note for new session (e.g. Session #2, Overtime)..." : "Note (e.g. Counter #1, Plant Floor)..."}
                          className="px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-medium w-full sm:w-56 focus:outline-hidden"
                        />
                        <button
                          type="submit"
                          disabled={punchingIn}
                          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {punchingIn ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 fill-white" />
                          )}
                          {isShiftCompleted ? "Punch In Again" : "Punch In Now"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Past Attendance History */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Attendance Log History</h3>
                    <p className="text-xs text-slate-500">Your past recorded punch in and punch out records</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {attendanceHistory.length} Days Recorded
                  </span>
                </div>

                {attendanceHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">Zero Attendance Records</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Your daily punch-in logs and shift hours will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Shift Type</th>
                          <th className="py-3 px-3">Punch In</th>
                          <th className="py-3 px-3">Punch Out</th>
                          <th className="py-3 px-3">Total Time</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Shift Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {attendanceHistory.map((item) => {
                          const hrs = Math.floor((item.durationMinutes || 0) / 60);
                          const mins = (item.durationMinutes || 0) % 60;

                          return (
                            <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-3 font-extrabold text-slate-900">{item.date}</td>
                              <td className="py-3.5 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  {item.shiftType || "GENERAL"}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 font-mono text-slate-700">
                                {item.punchIn
                                  ? new Date(item.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : "—"}
                              </td>
                              <td className="py-3.5 px-3 font-mono text-slate-700">
                                {item.punchOut
                                  ? new Date(item.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : "Still On Duty"}
                              </td>
                              <td className="py-3.5 px-3 font-bold text-slate-900">
                                {item.punchOut ? `${hrs}h ${mins}m` : "In Progress"}
                              </td>
                              <td className="py-3.5 px-3">
                                {item.punchOut ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                                    Completed
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-black text-[10px] uppercase">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-slate-500 max-w-xs truncate">
                                {item.punchOutNotes || item.punchInNotes || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: LEAVES
             ========================================================================= */}
          {effectiveTab === "leaves" && (
            <div className="space-y-6">
              {/* Leaves Header Card */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Leave Requests & Time Off
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Apply for planned, casual, or emergency leaves directly to your business owner.
                  </p>
                </div>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Apply for Leave
                </button>
              </div>

              {/* Leaves Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Applied</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{leavesList.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70">
                  <span className="text-[10px] font-bold uppercase text-amber-700">Pending Review</span>
                  <p className="text-xl font-black text-amber-950 mt-1">
                    {leavesList.filter((l) => l.status === "PENDING").length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Approved</span>
                  <p className="text-xl font-black text-emerald-950 mt-1">
                    {leavesList.filter((l) => l.status === "APPROVED").length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/70">
                  <span className="text-[10px] font-bold uppercase text-rose-700">Declined</span>
                  <p className="text-xl font-black text-rose-950 mt-1">
                    {leavesList.filter((l) => l.status === "REJECTED").length}
                  </p>
                </div>
              </div>

              {/* Leaves History Table */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900">Your Leave History</h3>
                  <span className="text-xs font-bold text-slate-500">{leavesList.length} Requests</span>
                </div>

                {leavesList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">Zero Leave Requests</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      You haven't submitted any leave applications yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-3 px-3">Type</th>
                          <th className="py-3 px-3">Date Range</th>
                          <th className="py-3 px-3">Days</th>
                          <th className="py-3 px-3">Reason</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {leavesList.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] uppercase">
                                {item.leaveType}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-slate-800">
                              {item.startDate} to {item.endDate}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-slate-900">
                              {item.totalDays === 0.5
                                ? "Half Day (0.5)"
                                : `${item.totalDays} ${item.totalDays === 1 ? "day" : "days"}`}
                            </td>
                            <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">
                              {item.reason}
                            </td>
                            <td className="py-3.5 px-3">
                              {item.status === "PENDING" && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black text-[10px] uppercase">
                                  Pending Owner
                                </span>
                              )}
                              {item.status === "APPROVED" && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                                  Approved
                                </span>
                              )}
                              {item.status === "REJECTED" && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-[10px] uppercase">
                                  Declined
                                </span>
                              )}
                              {item.status === "CANCELLED" && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-black text-[10px] uppercase">
                                  Cancelled
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              {item.status === "PENDING" && (
                                <button
                                  onClick={() => handleCancelLeave(item._id)}
                                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: SUBMISSIONS (Daily Work Reporting)
             ========================================================================= */}
          {effectiveTab === "submissions" && (
            <div className="space-y-6">
              {/* Submissions Header Card */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Daily Work Submissions & Reports
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Report the tasks and milestones you completed today directly to the business owner.
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmissionModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Submit Today's Report
                </button>
              </div>

              {/* Submissions History */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900">Your Past Submissions</h3>
                  <span className="text-xs font-bold text-slate-500">{submissionsList.length} Reports</span>
                </div>

                {submissionsList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">Zero Daily Submissions</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Submit your end-of-day work log to keep the business owner informed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissionsList.map((sub) => (
                      <div
                        key={sub._id}
                        className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:shadow-xs transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-extrabold text-xs">
                              {sub.date}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm">{sub.title}</h4>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {sub.status || "Submitted"}
                          </span>
                        </div>

                        {sub.tasksCompleted && sub.tasksCompleted.length > 0 && (
                          <div className="space-y-1 pl-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Completed Tasks:
                            </span>
                            <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5 font-medium">
                              {sub.tasksCompleted.map((t, idx) => (
                                <li key={idx}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {sub.blockers && (
                          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 font-medium">
                            <strong>Note for Owner:</strong> {sub.blockers}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: PROFILE
             ========================================================================= */}
          {effectiveTab === "profile" && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                      {employee?.name ? employee.name.charAt(0) : "E"}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{employee?.name}</h2>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {employee?.postTitle || employee?.postLevel?.replace(/_/g, " ")} • {employee?.department}
                      </p>
                      <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 mt-1.5">
                        Verified Staff Member
                      </span>
                    </div>
                  </div>

                  {!editingProfile ? (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Edit Contact & Description
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Profile Details Grid */}
                {!editingProfile ? (
                  <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold text-[11px]">Email Address</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{employee?.email}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold text-[11px]">Phone Number</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{profileData?.phoneNumber || employee?.phoneNumber}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold text-[11px]">Assigned Branch</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {profileData?.branchName || employee?.branchName || "Main HQ"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{profileData?.branchLocation}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold text-[11px]">Branch Staff Capacity</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {profileData?.branchCapacity ? `${profileData.branchCapacity} Allowed Positions` : "Standard Limit"}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold text-[11px]">Post Seniority Level</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {employee?.postLevel?.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold text-[11px]">Company / Business Code</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{company?.code || "BIZ"}</p>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block font-semibold text-[11px] mb-1">
                        Work Responsibilities & Description
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        {profileData?.workDescription || employee?.workDescription || "No description provided."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="pt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Work Responsibilities Description
                      </label>
                      <textarea
                        rows={4}
                        value={profileDesc}
                        onChange={(e) => setProfileDesc(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODAL: PUNCH OUT CONFIRMATION
         ========================================================================= */}
      {showPunchOutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">End Shift / Punch Out</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you ready to end your shift? Your total working hours will be calculated and logged
              for your business owner.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Shift Handoff / Summary Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={punchOutNote}
                onChange={(e) => setPunchOutNote(e.target.value)}
                placeholder="e.g. Cleared all pending invoices, counter cash reconciled..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPunchOutModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Continue Working
              </button>
              <button
                type="button"
                onClick={handlePunchOut}
                disabled={punchingOut}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {punchingOut ? "Recording..." : "Confirm Punch Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: APPLY FOR LEAVE
         ========================================================================= */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Apply for Leave</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick / Medical Leave</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="PLANNED">Planned Vacation</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const newEnd = leaveForm.endDate || newStart;
                      let days = leaveForm.totalDays;
                      if (newStart && newEnd) {
                        const s = new Date(newStart);
                        const eDate = new Date(newEnd);
                        const diff = Math.round((eDate - s) / (1000 * 3600 * 24)) + 1;
                        if (diff >= 1 && (leaveForm.totalDays === "1" || !leaveForm.totalDays)) {
                          days = String(diff);
                        }
                      }
                      setLeaveForm({ ...leaveForm, startDate: newStart, endDate: newEnd, totalDays: days });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      let days = leaveForm.totalDays;
                      if (leaveForm.startDate && newEnd) {
                        const s = new Date(leaveForm.startDate);
                        const eDate = new Date(newEnd);
                        const diff = Math.round((eDate - s) / (1000 * 3600 * 24)) + 1;
                        if (diff >= 1) {
                          days = String(diff);
                        }
                      }
                      setLeaveForm({ ...leaveForm, endDate: newEnd, totalDays: days });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Number of Days
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    Use 0.5 for Half Day
                  </span>
                </div>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g. 0.5 for half day, 1, 2, 5"
                  value={leaveForm.totalDays}
                  onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                {/* Quick Selection Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {[
                    { label: "0.5 (Half Day)", val: "0.5" },
                    { label: "1 Day", val: "1" },
                    { label: "2 Days", val: "2" },
                    { label: "3 Days", val: "3" },
                    { label: "5 Days", val: "5" },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setLeaveForm({ ...leaveForm, totalDays: preset.val })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        String(leaveForm.totalDays) === preset.val
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Leave (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Explain why you are requesting leave..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Handover Note / Duty Coverage (Optional)
                </label>
                <input
                  type="text"
                  value={leaveForm.handoverNote}
                  onChange={(e) => setLeaveForm({ ...leaveForm, handoverNote: e.target.value })}
                  placeholder="e.g. Ramesh will cover morning register dispatch"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingLeave ? "Submitting..." : "Submit to Owner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DAILY WORK SUBMISSION
         ========================================================================= */}
      {showSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Today's Work Report</h3>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDailySubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Report Title / Heading
                </label>
                <input
                  type="text"
                  required
                  value={submissionForm.title}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                  placeholder="e.g. Daily Dispatch & Floor Production Log"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Completed Tasks (Add Bullet Points)
                </label>
                <div className="space-y-2">
                  {submissionForm.tasks.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={t}
                        onChange={(e) => {
                          const updated = [...submissionForm.tasks];
                          updated[idx] = e.target.value;
                          setSubmissionForm({ ...submissionForm, tasks: updated });
                        }}
                        placeholder={`Task #${idx + 1}...`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                      />
                      {submissionForm.tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = submissionForm.tasks.filter((_, i) => i !== idx);
                            setSubmissionForm({ ...submissionForm, tasks: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 text-xs font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSubmissionForm({ ...submissionForm, tasks: [...submissionForm.tasks, ""] })}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    + Add Another Task
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Blockers / Urgent Requests for Owner (Optional)
                </label>
                <input
                  type="text"
                  value={submissionForm.blockers}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, blockers: e.target.value })}
                  placeholder="e.g. Machine 2 requires spare belt, vendor payment pending"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingReport ? "Submitting..." : "Send Report to Owner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
