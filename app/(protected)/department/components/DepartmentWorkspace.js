"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { DEPARTMENT_CONFIGS, TAB_ICON_MAP } from "./departmentConfig";
import OperationsDepartmentView from "./OperationsDepartmentView";
import SalesDepartmentView from "./SalesDepartmentView";
import LogisticsDepartmentView from "./LogisticsDepartmentView";
import FinancialDepartmentView from "./FinancialDepartmentView";
import { performClientLogout } from "@/lib/clientLogout";
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
  Check,
  X,
  ArrowUpRight,
  Send,
  ListTodo,
  Inbox,
  CheckSquare,
  MessageSquare,
  Eye,
  Users,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Award,
} from "lucide-react";

export default function DepartmentWorkspace({ currentDepartment = "OPERATIONS" }) {
  const router = useRouter();

  // Core Navigation State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("attendance"); // attendance | desk | assign-work | leaves | submissions | profile
  const [searchQuery, setSearchQuery] = useState("");

  // Employee & Company State
  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [profileData, setProfileData] = useState(null);

  // Corporate Hierarchy State
  const [hierarchyData, setHierarchyData] = useState({
    myRank: 1,
    isUpperRole: false,
    reportingTo: null,
    subordinates: [],
  });

  // Team Desk & Requests State
  const [teamRequests, setTeamRequests] = useState({
    subordinateLeaves: [],
    subordinateSubmissions: [],
    subordinateTasks: [],
    myAssignedTasks: [],
  });
  const [assignedByMeTasks, setAssignedByMeTasks] = useState([]);
  const [deskSubordinateTab, setDeskSubordinateTab] = useState("ALL"); // ALL | LEAVES | REPORTS | TASKS
  const [deskMyTasksFilter, setDeskMyTasksFilter] = useState("ALL"); // ALL | PENDING | IN_PROGRESS | SUBMITTED | APPROVED

  // Department Modules Config & Permitted Tabs
  const activeDepartmentKey = (employee?.department || currentDepartment || "OPERATIONS").toUpperCase();
  const activeDeptConfig = DEPARTMENT_CONFIGS[activeDepartmentKey] || DEPARTMENT_CONFIGS.OPERATIONS;

  const allowedDeptTabs = useMemo(() => {
    if (!activeDeptConfig || !employee?.postLevel) return [];
    return activeDeptConfig.tabs.filter((tab) => tab.allowedLevels.includes(employee.postLevel));
  }, [activeDeptConfig, employee]);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Daily Work Submission Form State
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    title: "",
    tasks: [""],
    blockers: "",
    summary: "",
  });

  // Work Delegation (Assign Work) Form State
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [submittingAssignTask, setSubmittingAssignTask] = useState(false);
  const [assignTaskForm, setAssignTaskForm] = useState({
    assignedToId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  // Task Execution & Submission State (for assignee)
  const [showSubmitTaskModal, setShowSubmitTaskModal] = useState(false);
  const [taskToSubmit, setTaskToSubmit] = useState(null);
  const [taskSubmissionNotes, setTaskSubmissionNotes] = useState("");
  const [submittingTaskWork, setSubmittingTaskWork] = useState(false);

  // Task Review State (for assigner supervisor)
  const [showReviewTaskModal, setShowReviewTaskModal] = useState(false);
  const [taskToReview, setTaskToReview] = useState(null);
  const [taskReviewAction, setTaskReviewAction] = useState("APPROVE"); // APPROVE | REQUEST_REVISION
  const [taskReviewFeedback, setTaskReviewFeedback] = useState("");
  const [submittingTaskReview, setSubmittingTaskReview] = useState(false);

  // Subordinate Leave Review Modal
  const [showReviewLeaveModal, setShowReviewLeaveModal] = useState(false);
  const [leaveToReview, setLeaveToReview] = useState(null);
  const [leaveReviewAction, setLeaveReviewAction] = useState("APPROVE");
  const [leaveReviewNotes, setLeaveReviewNotes] = useState("");
  const [submittingLeaveReview, setSubmittingLeaveReview] = useState(false);

  // Subordinate Submission Feedback Modal
  const [showReviewSubmissionModal, setShowReviewSubmissionModal] = useState(false);
  const [submissionToReview, setSubmissionToReview] = useState(null);
  const [submissionFeedback, setSubmissionFeedback] = useState("");
  const [submittingSubmissionFeedback, setSubmittingSubmissionFeedback] = useState(false);

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [profileDesc, setProfileDesc] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Feedback Banner
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const isPunchedIn = Boolean(todayAttendance?.isPunchedIn);
  const isShiftCompleted = Boolean(todayAttendance?.isCompleted);
  // Shift Gating: must punch in to access other tabs
  const effectiveTab = isPunchedIn ? activeTab : "attendance";

  // Live Timer for On-Duty Shift
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!isPunchedIn || !todayAttendance?.punchIn) return;
    const initialTimer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isPunchedIn, todayAttendance?.punchIn]);

  let formattedTimer = "00h 00m 00s";
  if (isPunchedIn && todayAttendance?.punchIn && now > 0) {
    const startMs = new Date(todayAttendance.punchIn).getTime();
    const elapsed = Math.max(0, Math.floor((now - startMs) / 1000));
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    formattedTimer = `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }

  // Trigger for refreshing workspace data
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshAllData = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    let isCancelled = false;

    async function loadWorkspaceData() {
      try {
        // High-Performance Consolidated Fetch: 1 single HTTP roundtrip instead of 9 separate calls
        const res = await fetch("/api/employee/workspace-data");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (isCancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to load workspace data");

        // Protection Gate: If employee is not yet approved
        if (!data.isApproved) {
          setEmployee(data.employee);
          setCompany(data.company);
          setLoading(false);
          if (data.employee?.approvalStatus === "PENDING_APPROVAL") {
            router.push("/department/pending-approval");
            return;
          }
          router.push("/department/onboarding");
          return;
        }

        // Hydrate all state in a single render cycle
        setEmployee(data.employee);
        setCompany(data.company);
        setTodayAttendance(data.todayAttendance || null);
        setAttendanceHistory(data.attendanceHistory || []);
        setLeavesList(data.leavesList || []);
        setSubmissionsList(data.submissionsList || []);
        setProfileData(data.profileData || null);
        setProfilePhone(data.profileData?.phoneNumber || "");
        setProfileDesc(data.profileData?.workDescription || "");
        setHierarchyData(
          data.hierarchy || {
            myRank: 1,
            isUpperRole: false,
            reportingTo: null,
            subordinates: [],
          }
        );
        setTeamRequests(
          data.teamRequests || {
            subordinateLeaves: [],
            subordinateSubmissions: [],
            subordinateTasks: [],
            myAssignedTasks: [],
          }
        );
        setAssignedByMeTasks(data.assignedByMeTasks || []);
        setNotifications(data.notifications || []);
        setUnreadNotificationsCount(data.unreadNotificationsCount || 0);
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

    loadWorkspaceData();

    return () => {
      isCancelled = true;
    };
  }, [router, refreshTrigger]);

  // TAB CLICK HANDLER: Gates other tabs unless actively punched in
  const handleTabClick = (tabId) => {
    if (!isPunchedIn && tabId !== "attendance") {
      setFeedback({
        type: "error",
        message:
          "Attendance punch-in required first! Please punch in to access this tab and begin working.",
      });
      return;
    }
    setActiveTab(tabId);
  };

  // PUNCH IN HANDLER: Sub-millisecond (0ms) Optimistic UI with background sync
  const handlePunchIn = async (e) => {
    e?.preventDefault();
    setPunchingIn(true);
    setFeedback({ type: "", message: "" });

    const nowIso = new Date().toISOString();
    const previousAttendance = todayAttendance;
    const noteToSend = punchInNote;

    // Optimistic Instant UI Update (0ms)
    setTodayAttendance({
      ...(todayAttendance || {}),
      isPunchedIn: true,
      isCompleted: false,
      punchIn: nowIso,
      shiftType,
      sessions: [...(todayAttendance?.sessions || []), { punchIn: nowIso }],
    });
    setPunchInNote("");
    setFeedback({ type: "success", message: "Punch In successful! Shift timer running." });

    try {
      const res = await fetch("/api/employee/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftType, punchInNotes: noteToSend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Punch in failed");

      // Server reconciliation
      setTodayAttendance({
        ...data.attendance,
        isPunchedIn: true,
        isCompleted: false,
      });
      setAttendanceHistory((prev) => {
        const todayDateStr = nowIso.split("T")[0];
        const existingIdx = prev.findIndex((item) => item.date === todayDateStr);
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = data.attendance;
          return copy;
        }
        return [data.attendance, ...prev];
      });
    } catch (err) {
      // Rollback on network failure
      setTodayAttendance(previousAttendance);
      setFeedback({ type: "error", message: err.message || "Punch in failed" });
    } finally {
      setPunchingIn(false);
    }
  };

  // PUNCH OUT HANDLER: Sub-millisecond (0ms) Optimistic UI with background sync
  const handlePunchOut = async () => {
    setPunchingOut(true);
    setFeedback({ type: "", message: "" });

    const previousAttendance = todayAttendance;
    const noteToSend = punchOutNote;
    const nowIso = new Date().toISOString();

    // Optimistic Instant UI Update (0ms)
    setTodayAttendance({
      ...(todayAttendance || {}),
      isPunchedIn: false,
      isCompleted: true,
      punchOut: nowIso,
    });
    setShowPunchOutModal(false);
    setPunchOutNote("");
    setActiveTab("attendance");
    setFeedback({
      type: "success",
      message: "Punch Out recorded! Shift logged. You can punch in again anytime.",
    });

    try {
      const res = await fetch("/api/employee/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ punchOutNotes: noteToSend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Punch out failed");

      setTodayAttendance({
        ...data.attendance,
        isPunchedIn: false,
        isCompleted: true,
      });
      setAttendanceHistory((prev) =>
        prev.map((item) => (item._id === data.attendance?._id ? data.attendance : item))
      );
    } catch (err) {
      // Rollback on network failure
      setTodayAttendance(previousAttendance);
      setFeedback({ type: "error", message: err.message || "Failed to record punch out" });
    } finally {
      setPunchingOut(false);
    }
  };

  // SUBMIT LEAVE APPLICATION: Sub-millisecond (0ms) Optimistic UI
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmittingLeave(true);
    setFeedback({ type: "", message: "" });

    const parsedDays = parseFloat(leaveForm.totalDays);
    if (!leaveForm.totalDays || isNaN(parsedDays) || parsedDays < 0.5) {
      setFeedback({
        type: "error",
        message: "Please enter a valid number of days (minimum 0.5 for half day).",
      });
      setSubmittingLeave(false);
      return;
    }

    // Optimistic Instant Append (0ms)
    const tempId = `temp-leave-${Date.now()}`;
    const optimisticLeave = {
      _id: tempId,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      totalDays: parsedDays,
      reason: leaveForm.reason,
      handoverNote: leaveForm.handoverNote,
      approverName: hierarchyData.reportingTo?.name || "Supervisor",
      approverRole: hierarchyData.reportingTo?.postTitle || "Upper Staff",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    setLeavesList((prev) => [optimisticLeave, ...prev]);
    setShowLeaveModal(false);
    const formPayload = { ...leaveForm, totalDays: parsedDays };
    setLeaveForm({
      leaveType: "CASUAL",
      startDate: "",
      endDate: "",
      totalDays: "1",
      reason: "",
      handoverNote: "",
    });
    setFeedback({
      type: "success",
      message: "Leave application submitted according to company hierarchy.",
    });

    try {
      const res = await fetch("/api/employee/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply for leave");

      // Replace temporary item with server document
      setLeavesList((prev) => prev.map((l) => (l._id === tempId ? data.leave : l)));
    } catch (err) {
      // Rollback on failure
      setLeavesList((prev) => prev.filter((l) => l._id !== tempId));
      setFeedback({ type: "error", message: err.message || "Failed to apply for leave" });
    } finally {
      setSubmittingLeave(false);
    }
  };

  // CANCEL LEAVE APPLICATION: Sub-millisecond (0ms) Optimistic UI
  const handleCancelLeave = async (leaveId) => {
    if (!confirm("Are you sure you want to cancel this pending leave application?")) return;

    // Optimistic status change (0ms)
    const previousStatus = leavesList.find((l) => l._id === leaveId)?.status;
    setLeavesList((prev) =>
      prev.map((l) => (l._id === leaveId ? { ...l, status: "CANCELLED" } : l))
    );
    setFeedback({ type: "success", message: "Leave application cancelled." });

    try {
      const res = await fetch(`/api/employee/leaves/${leaveId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel leave");
    } catch (err) {
      // Rollback on error
      setLeavesList((prev) =>
        prev.map((l) => (l._id === leaveId ? { ...l, status: previousStatus } : l))
      );
      setFeedback({ type: "error", message: err.message || "Failed to cancel leave" });
    }
  };

  // SUBMIT DAILY WORK REPORT: Sub-millisecond (0ms) Optimistic UI
  const handleDailySubmission = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    setFeedback({ type: "", message: "" });

    const tempId = `temp-sub-${Date.now()}`;
    const tasksList = submissionForm.tasks.filter((t) => t.trim().length > 0);
    const optimisticSub = {
      _id: tempId,
      date: new Date().toISOString().split("T")[0],
      title: submissionForm.title,
      tasksCompleted: tasksList,
      blockers: submissionForm.blockers,
      summary: submissionForm.summary,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };

    // Optimistic Instant Append (0ms)
    setSubmissionsList((prev) => [optimisticSub, ...prev]);
    setShowSubmissionModal(false);
    const payload = {
      title: submissionForm.title,
      tasksCompleted: tasksList,
      blockers: submissionForm.blockers,
      summary: submissionForm.summary,
    };
    setSubmissionForm({
      title: "",
      tasks: [""],
      blockers: "",
      summary: "",
    });
    setFeedback({
      type: "success",
      message: "Daily report submitted successfully according to company structure.",
    });

    try {
      const res = await fetch("/api/employee/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit daily report");

      // Replace temporary item with server document
      setSubmissionsList((prev) => prev.map((s) => (s._id === tempId ? data.submission : s)));
    } catch (err) {
      // Rollback on failure
      setSubmissionsList((prev) => prev.filter((s) => s._id !== tempId));
      setFeedback({ type: "error", message: err.message || "Failed to submit daily report" });
    } finally {
      setSubmittingReport(false);
    }
  };

  // ASSIGN WORK TO SUBORDINATE (Upper Employees Only): Sub-millisecond (0ms) Optimistic UI
  const handleAssignTask = async (e) => {
    e.preventDefault();
    setSubmittingAssignTask(true);
    setFeedback({ type: "", message: "" });

    const sub = hierarchyData.subordinates?.find((s) => s._id === assignTaskForm.assignedToId);
    const tempId = `temp-task-${Date.now()}`;
    const optimisticTask = {
      _id: tempId,
      title: assignTaskForm.title,
      description: assignTaskForm.description,
      priority: assignTaskForm.priority,
      dueDate: assignTaskForm.dueDate,
      assignedTo: assignTaskForm.assignedToId,
      assignedToName: sub?.name || "Staff",
      assignedToPost: sub?.postTitle || sub?.postLevel?.replace(/_/g, " ") || "Staff",
      assignedByName: employee?.name || "Supervisor",
      status: "ASSIGNED",
      createdAt: new Date().toISOString(),
    };

    // Optimistic Instant Append (0ms)
    setAssignedByMeTasks((prev) => [optimisticTask, ...prev]);
    setTeamRequests((prev) => ({
      ...prev,
      subordinateTasks: [optimisticTask, ...prev.subordinateTasks],
    }));
    setShowAssignTaskModal(false);
    const taskPayload = { ...assignTaskForm };
    setAssignTaskForm({
      assignedToId: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      dueDate: "",
    });
    setFeedback({
      type: "success",
      message: "Work successfully assigned to staff member!",
    });

    try {
      const res = await fetch("/api/employee/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign work");

      // Replace temporary item with server document
      setAssignedByMeTasks((prev) => prev.map((t) => (t._id === tempId ? data.task : t)));
      setTeamRequests((prev) => ({
        ...prev,
        subordinateTasks: prev.subordinateTasks.map((t) => (t._id === tempId ? data.task : t)),
      }));
    } catch (err) {
      // Rollback on failure
      setAssignedByMeTasks((prev) => prev.filter((t) => t._id !== tempId));
      setTeamRequests((prev) => ({
        ...prev,
        subordinateTasks: prev.subordinateTasks.filter((t) => t._id !== tempId),
      }));
      setFeedback({ type: "error", message: err.message || "Failed to assign work" });
    } finally {
      setSubmittingAssignTask(false);
    }
  };

  // START WORKING ON ASSIGNED TASK (Assignee): Sub-millisecond (0ms) Optimistic UI
  const handleStartTask = async (taskId) => {
    // Optimistic Status Update (0ms)
    setTeamRequests((prev) => ({
      ...prev,
      myAssignedTasks: prev.myAssignedTasks.map((t) =>
        t._id === taskId ? { ...t, status: "IN_PROGRESS" } : t
      ),
    }));
    setFeedback({ type: "success", message: "Task marked as In Progress." });

    try {
      const res = await fetch(`/api/employee/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");

      setTeamRequests((prev) => ({
        ...prev,
        myAssignedTasks: prev.myAssignedTasks.map((t) => (t._id === taskId ? data.task : t)),
      }));
    } catch (err) {
      // Rollback
      setTeamRequests((prev) => ({
        ...prev,
        myAssignedTasks: prev.myAssignedTasks.map((t) =>
          t._id === taskId ? { ...t, status: "ASSIGNED" } : t
        ),
      }));
      setFeedback({ type: "error", message: err.message || "Failed to update task" });
    }
  };

  // SUBMIT COMPLETED WORK ON ASSIGNED TASK (Assignee): Sub-millisecond (0ms) Optimistic UI
  const handleSubmitTaskWork = async (e) => {
    e.preventDefault();
    if (!taskToSubmit) return;
    setSubmittingTaskWork(true);
    setFeedback({ type: "", message: "" });

    const targetTaskId = taskToSubmit._id;
    const notes = taskSubmissionNotes;
    const prevTask = taskToSubmit;

    // Optimistic Status Update (0ms)
    setTeamRequests((prev) => ({
      ...prev,
      myAssignedTasks: prev.myAssignedTasks.map((t) =>
        t._id === targetTaskId ? { ...t, status: "SUBMITTED", submissionNotes: notes } : t
      ),
    }));
    setShowSubmitTaskModal(false);
    setTaskToSubmit(null);
    setTaskSubmissionNotes("");
    setFeedback({
      type: "success",
      message: "Work submitted for upper supervisor review and sign-off!",
    });

    try {
      const res = await fetch(`/api/employee/tasks/${targetTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT",
          submissionNotes: notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit task work");

      setTeamRequests((prev) => ({
        ...prev,
        myAssignedTasks: prev.myAssignedTasks.map((t) => (t._id === targetTaskId ? data.task : t)),
      }));
    } catch (err) {
      // Rollback
      setTeamRequests((prev) => ({
        ...prev,
        myAssignedTasks: prev.myAssignedTasks.map((t) => (t._id === targetTaskId ? prevTask : t)),
      }));
      setFeedback({ type: "error", message: err.message || "Failed to submit task work" });
    } finally {
      setSubmittingTaskWork(false);
    }
  };

  // REVIEW ASSIGNED TASK (Upper Supervisor): Sub-millisecond (0ms) Optimistic UI
  const handleReviewTask = async (e) => {
    e.preventDefault();
    if (!taskToReview) return;
    setSubmittingTaskReview(true);
    setFeedback({ type: "", message: "" });

    const targetTaskId = taskToReview._id;
    const action = taskReviewAction;
    const feedbackText = taskReviewFeedback;
    const prevTask = taskToReview;
    const newStatus = action === "APPROVE" ? "APPROVED" : "REVISION_REQUESTED";

    // Optimistic Status Update (0ms)
    const updateTaskInList = (list) =>
      list.map((t) =>
        t._id === targetTaskId ? { ...t, status: newStatus, reviewFeedback: feedbackText } : t
      );

    setAssignedByMeTasks((prev) => updateTaskInList(prev));
    setTeamRequests((prev) => ({
      ...prev,
      subordinateTasks: updateTaskInList(prev.subordinateTasks),
    }));
    setShowReviewTaskModal(false);
    setTaskToReview(null);
    setTaskReviewFeedback("");
    setFeedback({
      type: "success",
      message:
        action === "APPROVE" ? "Task signed off & approved!" : "Revision requested from staff.",
    });

    try {
      const res = await fetch(`/api/employee/tasks/${targetTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewFeedback: feedbackText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review task");

      setAssignedByMeTasks((prev) => prev.map((t) => (t._id === targetTaskId ? data.task : t)));
      setTeamRequests((prev) => ({
        ...prev,
        subordinateTasks: prev.subordinateTasks.map((t) => (t._id === targetTaskId ? data.task : t)),
      }));
    } catch (err) {
      // Rollback
      setAssignedByMeTasks((prev) => prev.map((t) => (t._id === targetTaskId ? prevTask : t)));
      setTeamRequests((prev) => ({
        ...prev,
        subordinateTasks: prev.subordinateTasks.map((t) => (t._id === targetTaskId ? prevTask : t)),
      }));
      setFeedback({ type: "error", message: err.message || "Failed to record task review" });
    } finally {
      setSubmittingTaskReview(false);
    }
  };

  // SUPERVISOR DECISION ON SUBORDINATE LEAVE: Sub-millisecond (0ms) Optimistic UI
  const handleReviewLeave = async (e) => {
    e.preventDefault();
    if (!leaveToReview) return;
    setSubmittingLeaveReview(true);
    setFeedback({ type: "", message: "" });

    const targetLeaveId = leaveToReview._id;
    const action = leaveReviewAction;
    const notes = leaveReviewNotes;
    const prevLeave = leaveToReview;
    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // Optimistic Status Update (0ms)
    setTeamRequests((prev) => ({
      ...prev,
      subordinateLeaves: prev.subordinateLeaves.map((l) =>
        l._id === targetLeaveId ? { ...l, status: newStatus, reviewNotes: notes } : l
      ),
    }));
    setShowReviewLeaveModal(false);
    setLeaveToReview(null);
    setLeaveReviewNotes("");
    setFeedback({
      type: "success",
      message: `Leave ${newStatus.toLowerCase()} successfully!`,
    });

    try {
      const res = await fetch("/api/employee/team-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "LEAVE",
          itemId: targetLeaveId,
          action,
          reviewNotes: notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review leave application");

      setTeamRequests((prev) => ({
        ...prev,
        subordinateLeaves: prev.subordinateLeaves.map((l) =>
          l._id === targetLeaveId ? data.leave : l
        ),
      }));
    } catch (err) {
      // Rollback
      setTeamRequests((prev) => ({
        ...prev,
        subordinateLeaves: prev.subordinateLeaves.map((l) =>
          l._id === targetLeaveId ? prevLeave : l
        ),
      }));
      setFeedback({ type: "error", message: err.message || "Failed to review leave application" });
    } finally {
      setSubmittingLeaveReview(false);
    }
  };

  // SUPERVISOR FEEDBACK ON SUBORDINATE DAILY SUBMISSION: Sub-millisecond (0ms) Optimistic UI
  const handleReviewSubmission = async (e) => {
    e.preventDefault();
    if (!submissionToReview) return;
    setSubmittingSubmissionFeedback(true);
    setFeedback({ type: "", message: "" });

    const targetSubId = submissionToReview._id;
    const feedbackText = submissionFeedback;
    const prevSub = submissionToReview;

    // Optimistic Status Update (0ms)
    setTeamRequests((prev) => ({
      ...prev,
      subordinateSubmissions: prev.subordinateSubmissions.map((s) =>
        s._id === targetSubId ? { ...s, status: "ACKNOWLEDGED", feedback: feedbackText } : s
      ),
    }));
    setShowReviewSubmissionModal(false);
    setSubmissionToReview(null);
    setSubmissionFeedback("");
    setFeedback({
      type: "success",
      message: "Work submission reviewed and feedback sent to employee!",
    });

    try {
      const res = await fetch("/api/employee/team-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "SUBMISSION",
          itemId: targetSubId,
          feedback: feedbackText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send feedback");

      setTeamRequests((prev) => ({
        ...prev,
        subordinateSubmissions: prev.subordinateSubmissions.map((s) =>
          s._id === targetSubId ? data.submission : s
        ),
      }));
    } catch (err) {
      // Rollback
      setTeamRequests((prev) => ({
        ...prev,
        subordinateSubmissions: prev.subordinateSubmissions.map((s) =>
          s._id === targetSubId ? prevSub : s
        ),
      }));
      setFeedback({ type: "error", message: err.message || "Failed to send feedback" });
    } finally {
      setSubmittingSubmissionFeedback(false);
    }
  };

  // MARK NOTIFICATIONS READ
  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch("/api/employee/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error("Mark read error:", err);
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

  // LOGOUT (Purges all cookies, tokens & client storage)
  const handleLogout = async () => {
    setLoggingOut(true);
    await performClientLogout();
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
          {employee?.approvalStatus === "PENDING_APPROVAL"
            ? "Awaiting Owner Approval"
            : "Setup Incomplete"}
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mt-2 mb-6 leading-relaxed">
          {employee?.approvalStatus === "PENDING_APPROVAL"
            ? `Your registration request is currently awaiting verification from your Business Owner (${
                company?.ownerName || "Founder"
              }). You cannot view department content until approved.`
            : "Please complete your branch and department onboarding setup first."}
        </p>
        <button
          onClick={() => {
            router.push(
              employee?.approvalStatus === "PENDING_APPROVAL"
                ? "/department/pending-approval"
                : "/department/onboarding"
            );
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

  // Pending subordinate requests count
  const pendingLeavesCount = teamRequests.subordinateLeaves.filter(
    (l) => l.status === "PENDING"
  ).length;
  const pendingSubmissionsCount = teamRequests.subordinateSubmissions.filter(
    (s) => s.status === "SUBMITTED"
  ).length;
  const pendingTaskReviewsCount = teamRequests.subordinateTasks.filter(
    (t) => t.status === "SUBMITTED"
  ).length;
  const totalSubordinateRequestsCount =
    pendingLeavesCount + pendingSubmissionsCount + pendingTaskReviewsCount;

  // Active tasks assigned to me count
  const activeAssignedToMeCount = teamRequests.myAssignedTasks.filter(
    (t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS" || t.status === "REVISION_REQUESTED"
  ).length;

  const handleModuleNotify = ({ type, message }) => {
    setFeedback({ type: type || "success", message });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* =========================================================================
          LEFT SIDEBAR NAVIGATION
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

        {/* User Mini Profile & Hierarchy Badge */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50/90 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-xs shrink-0">
              {employee?.name ? employee.name.charAt(0) : "E"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900 truncate">{employee?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-slate-600 truncate">
                  {employee?.postTitle || employee?.postLevel?.replace(/_/g, " ") || "Staff"}
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700 shrink-0">
                  Tier {hierarchyData.myRank}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span className="truncate">{employee?.branchName || "Main HQ"}</span>
            <span className="font-bold text-indigo-600 uppercase tracking-wider">
              {employee?.department || currentDepartment}
            </span>
          </div>

          {/* Reporting Manager Indicator */}
          {hierarchyData.reportingTo && (
            <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center gap-1">
              <span className="font-medium text-slate-400">Reports to:</span>
              <span className="font-bold text-slate-700 truncate">
                {hierarchyData.reportingTo.name}
              </span>
            </div>
          )}
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
                  effectiveTab === "attendance"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                On Duty
              </span>
            ) : isShiftCompleted ? (
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  effectiveTab === "attendance"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                Re-Punch
              </span>
            ) : (
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                  effectiveTab === "attendance"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                Required
              </span>
            )}
          </button>

          {/* 2. Team Desk & Requests Tab (Two-Sided Hub) */}
          <button
            onClick={() => handleTabClick("desk")}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              !isPunchedIn
                ? "text-slate-400 opacity-60 hover:bg-slate-50 cursor-pointer"
                : effectiveTab === "desk"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 cursor-pointer"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            }`}
            title={!isPunchedIn ? "Punch in attendance to unlock" : "Team Desk & Requests"}
          >
            <div className="flex items-center gap-3">
              <Inbox className="w-4 h-4" />
              <span>2. Desk & Requests</span>
            </div>
            {!isPunchedIn ? (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            ) : totalSubordinateRequestsCount > 0 ? (
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  effectiveTab === "desk" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                {totalSubordinateRequestsCount} req
              </span>
            ) : activeAssignedToMeCount > 0 ? (
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  effectiveTab === "desk" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"
                }`}
              >
                {activeAssignedToMeCount} tasks
              </span>
            ) : null}
          </button>

          {/* 3. Dedicated Assign Work Tab (Upper Roles ONLY) */}
          {hierarchyData.isUpperRole && (
            <button
              onClick={() => handleTabClick("assign-work")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                !isPunchedIn
                  ? "text-slate-400 opacity-60 hover:bg-slate-50 cursor-pointer"
                  : effectiveTab === "assign-work"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 cursor-pointer"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              }`}
              title={
                !isPunchedIn
                  ? "Punch in attendance to unlock"
                  : "Assign Work & Manage Subordinate Tasks"
              }
            >
              <div className="flex items-center gap-3">
                <ListTodo className="w-4 h-4" />
                <span>3. Assign Work</span>
              </div>
              {!isPunchedIn ? (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    effectiveTab === "assign-work"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {hierarchyData.subordinates?.length || 0} staff
                </span>
              )}
            </button>
          )}

          {/* 4. Leaves Tab */}
          <button
            onClick={() => handleTabClick("leaves")}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              !isPunchedIn
                ? "text-slate-400 opacity-60 hover:bg-slate-50 cursor-pointer"
                : effectiveTab === "leaves"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 cursor-pointer"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            }`}
            title={!isPunchedIn ? "Punch in attendance to unlock" : "My Leaves"}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4" />
              <span>{hierarchyData.isUpperRole ? "4. Leaves" : "3. Leaves"}</span>
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

          {/* 5. Submissions Tab */}
          <button
            onClick={() => handleTabClick("submissions")}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
              !isPunchedIn
                ? "text-slate-400 opacity-60 hover:bg-slate-50 cursor-pointer"
                : effectiveTab === "submissions"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 cursor-pointer"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            }`}
            title={!isPunchedIn ? "Punch in attendance to unlock" : "Daily Work Submissions"}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-4 h-4" />
              <span>{hierarchyData.isUpperRole ? "5. Submissions" : "4. Submissions"}</span>
            </div>
            {!isPunchedIn && <Lock className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Department Modules (Strictly restricted by Employee postLevel) */}
          {allowedDeptTabs.length > 0 && (
            <div className="pt-3 pb-1 border-t border-slate-100 my-2">
              <div className="px-3.5 pb-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {activeDeptConfig.name} Modules
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {employee?.postLevel?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="space-y-1">
                {allowedDeptTabs.map((tab) => {
                  const IconComponent = TAB_ICON_MAP[tab.id] || Layers;
                  const isActive = effectiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        !isPunchedIn
                          ? "text-slate-400 opacity-60 hover:bg-slate-50 cursor-pointer"
                          : isActive
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 cursor-pointer"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                      }`}
                      title={!isPunchedIn ? "Punch in attendance to unlock" : tab.title}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <span className="truncate">{tab.title}</span>
                      </div>
                      {!isPunchedIn && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Profile Tab */}
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
            <span>Staff Portal</span>
            <span className="font-mono text-slate-700 font-bold">{company?.code || "CROWN"}</span>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loggingOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN WORKSPACE
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10">
          {/* Search Bar */}
          <div className="relative w-72 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shifts, tasks, leaves..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          {/* Shift Status, Quick Action & Notifications */}
          <div className="flex items-center gap-3">
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
                Shift Ended
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

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-900">
                      Notifications ({unreadNotificationsCount} unread)
                    </span>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n._id}
                          className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                            n.isRead
                              ? "bg-slate-50/50 border-slate-100 text-slate-600"
                              : "bg-indigo-50/40 border-indigo-100 text-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[11px] truncate">{n.title}</span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Header Quick Sign Out Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Sign Out of Crown Ecosystems"
            >
              {loggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Sign Out</span>
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

        {/* Main Content Viewport */}
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
                      Today's Daily Shift •{" "}
                      {new Date().toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
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
                        ? `You punched in at ${new Date(
                            todayAttendance.punchIn
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}. When your work or shift is over, punch out to inform the owner.`
                        : isShiftCompleted
                        ? `You previously logged out at ${
                            todayAttendance?.punchOut
                              ? new Date(todayAttendance.punchOut).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "earlier"
                          } (${Math.floor(
                            (todayAttendance?.durationMinutes || 0) / 60
                          )}h ${(todayAttendance?.durationMinutes || 0) % 60}m worked total today). You can punch in again now to begin a new shift session or make additional entries.`
                        : "Punch in to start your work timer and unlock your department's desk, leave, and reporting tabs."}
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
                      <form
                        onSubmit={handlePunchIn}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                      >
                        <select
                          value={shiftType}
                          onChange={(e) => setShiftType(e.target.value)}
                          className="px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden"
                        >
                          <option value="GENERAL">General Shift (9AM - 6PM)</option>
                          <option value="MORNING">Morning Shift</option>
                          <option value="EVENING">Evening Shift</option>
                          <option value="NIGHT">Night Shift</option>
                        </select>
                        <input
                          type="text"
                          value={punchInNote}
                          onChange={(e) => setPunchInNote(e.target.value)}
                          placeholder="Optional check-in note..."
                          className="px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-hidden sm:w-56"
                        />
                        <button
                          type="submit"
                          disabled={punchingIn}
                          className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          {punchingIn ? "Punching In..." : isShiftCompleted ? "Punch In Again" : "Punch In Now"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance History Section */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Attendance Log & History</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your daily verified punch records recorded for payroll and business owner review.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {attendanceHistory.length} Days Recorded
                  </span>
                </div>

                {attendanceHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">No attendance records yet.</p>
                    <p className="text-[11px] text-slate-400">
                      Punch in today to begin recording your work timeline.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                          <th className="pb-3 pl-2">Date</th>
                          <th className="pb-3">Shift</th>
                          <th className="pb-3">Punch In</th>
                          <th className="pb-3">Punch Out</th>
                          <th className="pb-3">Duration</th>
                          <th className="pb-3">Sessions</th>
                          <th className="pb-3 pr-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceHistory.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 pl-2 font-bold text-slate-800">{item.date}</td>
                            <td className="py-3 font-semibold text-slate-600">{item.shiftType || "GENERAL"}</td>
                            <td className="py-3 font-mono text-slate-700">
                              {item.punchIn
                                ? new Date(item.punchIn).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                            <td className="py-3 font-mono text-slate-700">
                              {item.punchOut
                                ? new Date(item.punchOut).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : item.isPunchedIn
                                ? "In Progress"
                                : "—"}
                            </td>
                            <td className="py-3 font-semibold text-slate-800">
                              {item.durationMinutes
                                ? `${Math.floor(item.durationMinutes / 60)}h ${
                                    item.durationMinutes % 60
                                  }m`
                                : item.isPunchedIn
                                ? "Active"
                                : "—"}
                            </td>
                            <td className="py-3 font-medium text-slate-500">
                              {item.sessions?.length || 1} session
                              {(item.sessions?.length || 1) > 1 ? "s" : ""}
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  item.isPunchedIn
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.status === "PRESENT"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {item.isPunchedIn ? "Active" : item.status || "PRESENT"}
                              </span>
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
              TAB 2: TEAM DESK & REQUESTS (Two-Sided Hub)
              Left Side: Requests from lower staff (Leaves, Daily reports, Task sign-offs)
              Right Side: Works assigned from upper management (Tasks, status, deliverables)
             ========================================================================= */}
          {effectiveTab === "desk" && (
            <div className="space-y-6">
              {/* Desk Header Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300">
                      Corporate Workflow & Delegation Desk
                    </span>
                    <h2 className="text-2xl font-black tracking-tight mt-1">
                      {hierarchyData.isUpperRole
                        ? "Team Operations & Multi-Tier Desk"
                        : "Operational Tasks & Directives"}
                    </h2>
                    <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                      {hierarchyData.isUpperRole
                        ? "Manage lower staff requests on the left, and track works assigned to you from upper management on the right."
                        : `Track directives assigned to you by your supervisor (${
                            hierarchyData.reportingTo?.name || "Business Owner"
                          }), start tasks, and submit your completion notes.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={refreshAllData}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer backdrop-blur-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refresh Desk
                    </button>
                    {hierarchyData.isUpperRole && (
                      <button
                        onClick={() => setShowAssignTaskModal(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Assign Work
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Two-Sided Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* -------------------------------------------------------------------
                    SIDE 1: REQUESTS FROM LOWER STAFF
                   ------------------------------------------------------------------- */}
                <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          Requests from Lower Staff
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {hierarchyData.isUpperRole
                          ? "Direct subordinates routing requests to you as supervisor."
                          : "Lower staff requests desk"}
                      </p>
                    </div>

                    {totalSubordinateRequestsCount > 0 && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {totalSubordinateRequestsCount} Action Required
                      </span>
                    )}
                  </div>

                  {/* If employee is lowest tier (e.g. Assistant or Other) */}
                  {!hierarchyData.isUpperRole ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        Frontline Role ({employee?.postLevel?.replace(/_/g, " ") || "Assistant"})
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                        As a frontline staff member, your work submissions and leaves route directly up
                        to your departmental supervisor (
                        <span className="font-bold text-slate-700">
                          {hierarchyData.reportingTo?.name || "Business Owner"}
                        </span>
                        ). You do not manage subordinate requests.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Filter tabs for subordinate requests */}
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
                        {[
                          { id: "ALL", label: "All Items" },
                          { id: "LEAVES", label: `Leaves (${pendingLeavesCount})` },
                          { id: "REPORTS", label: `Reports (${pendingSubmissionsCount})` },
                          { id: "TASKS", label: `Task Reviews (${pendingTaskReviewsCount})` },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setDeskSubordinateTab(t.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer transition-colors ${
                              deskSubordinateTab === t.id
                                ? "bg-indigo-600 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Zero State if nothing pending */}
                      {totalSubordinateRequestsCount === 0 &&
                      deskSubordinateTab === "ALL" &&
                      teamRequests.subordinateLeaves.length === 0 &&
                      teamRequests.subordinateSubmissions.length === 0 &&
                      teamRequests.subordinateTasks.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">All Clear!</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            No pending leave requests or submissions from staff under your supervision.
                          </p>
                        </div>
                      ) : null}

                      {/* SUBORDINATE LEAVES */}
                      {(deskSubordinateTab === "ALL" || deskSubordinateTab === "LEAVES") && (
                        <div className="space-y-3">
                          {teamRequests.subordinateLeaves.map((l) => (
                            <div
                              key={l._id}
                              className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-200 transition-all space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900">
                                      {l.employeeName}
                                    </span>
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {l.leaveType}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {l.startDate} to {l.endDate} • {l.totalDays} day
                                    {l.totalDays > 1 ? "s" : ""}
                                  </p>
                                </div>

                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    l.status === "PENDING"
                                      ? "bg-amber-100 text-amber-800"
                                      : l.status === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {l.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                "{l.reason}"
                              </p>

                              {l.status === "PENDING" ? (
                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => {
                                      setLeaveToReview(l);
                                      setLeaveReviewAction("REJECT");
                                      setShowReviewLeaveModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => {
                                      setLeaveToReview(l);
                                      setLeaveReviewAction("APPROVE");
                                      setShowReviewLeaveModal(true);
                                    }}
                                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold shadow-xs cursor-pointer"
                                  >
                                    Approve Leave
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 text-right">
                                  Reviewed by {l.reviewedByName || "Supervisor"}
                                  {l.reviewNotes && ` • "${l.reviewNotes}"`}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* SUBORDINATE DAILY SUBMISSIONS */}
                      {(deskSubordinateTab === "ALL" || deskSubordinateTab === "REPORTS") && (
                        <div className="space-y-3">
                          {teamRequests.subordinateSubmissions.map((s) => (
                            <div
                              key={s._id}
                              className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-200 transition-all space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900">
                                      {s.employeeName}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      {s.date}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-800 mt-0.5">{s.title}</p>
                                </div>

                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    s.status === "SUBMITTED"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {s.status === "SUBMITTED" ? "Needs Review" : "Acknowledged"}
                                </span>
                              </div>

                              {s.tasksCompleted?.length > 0 && (
                                <ul className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  {s.tasksCompleted.map((task, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                      <span className="text-indigo-600 font-black">•</span>
                                      <span>{task}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {s.blockers && (
                                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                                  <span className="font-bold">Blocker:</span> {s.blockers}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-slate-400">
                                  {s.feedback ? `Feedback: "${s.feedback}"` : "No feedback yet"}
                                </span>
                                <button
                                  onClick={() => {
                                    setSubmissionToReview(s);
                                    setSubmissionFeedback(s.feedback || "");
                                    setShowReviewSubmissionModal(true);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold shadow-xs cursor-pointer"
                                >
                                  {s.status === "SUBMITTED" ? "Review & Feedback" : "Update Feedback"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* SUBORDINATE TASK SUBMISSIONS (Deliverables to Sign-Off) */}
                      {(deskSubordinateTab === "ALL" || deskSubordinateTab === "TASKS") && (
                        <div className="space-y-3">
                          {teamRequests.subordinateTasks.map((t) => (
                            <div
                              key={t._id}
                              className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-200 transition-all space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900">
                                      {t.assignedToName}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">
                                      ({t.assignedToPost || "Staff"})
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-800 mt-0.5">{t.title}</p>
                                </div>

                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    t.status === "SUBMITTED"
                                      ? "bg-amber-100 text-amber-800"
                                      : t.status === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : t.status === "IN_PROGRESS"
                                      ? "bg-blue-100 text-blue-800"
                                      : t.status === "REVISION_REQUESTED"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {t.status.replace(/_/g, " ")}
                                </span>
                              </div>

                              {t.submissionNotes && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                                  <span className="font-bold block text-slate-900 mb-0.5">
                                    Deliverable Notes:
                                  </span>
                                  {t.submissionNotes}
                                </div>
                              )}

                              {t.status === "SUBMITTED" && (
                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => {
                                      setTaskToReview(t);
                                      setTaskReviewAction("REQUEST_REVISION");
                                      setShowReviewTaskModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl border border-amber-200 text-amber-800 hover:bg-amber-50 text-[11px] font-bold cursor-pointer"
                                  >
                                    Request Revision
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTaskToReview(t);
                                      setTaskReviewAction("APPROVE");
                                      setShowReviewTaskModal(true);
                                    }}
                                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold shadow-xs cursor-pointer"
                                  >
                                    Approve & Sign Off
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* -------------------------------------------------------------------
                    SIDE 2: WORKS ASSIGNED FROM UPPER MANAGEMENT
                   ------------------------------------------------------------------- */}
                <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-purple-600" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          Works Assigned from Upper Management
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Directives and tasks assigned to you by your supervisor.
                      </p>
                    </div>

                    {activeAssignedToMeCount > 0 && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {activeAssignedToMeCount} In Hand
                      </span>
                    )}
                  </div>

                  {/* Tasks List */}
                  {teamRequests.myAssignedTasks.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center text-slate-400">
                      <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No Tasks Assigned</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        You do not have any pending tasks assigned from upper management right now.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamRequests.myAssignedTasks.map((task) => (
                        <div
                          key={task._id}
                          className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-200 transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900">
                                  {task.title}
                                </span>
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-md ${
                                    task.priority === "URGENT"
                                      ? "bg-rose-100 text-rose-800"
                                      : task.priority === "HIGH"
                                      ? "bg-amber-100 text-amber-800"
                                      : task.priority === "MEDIUM"
                                      ? "bg-indigo-100 text-indigo-800"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Assigned by:{" "}
                                <span className="font-bold text-slate-700">
                                  {task.assignedByName}
                                </span>{" "}
                                ({task.assignedByPost || "Supervisor"})
                                {task.dueDate && ` • Due: ${task.dueDate}`}
                              </p>
                            </div>

                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                task.status === "ASSIGNED"
                                  ? "bg-slate-100 text-slate-700"
                                  : task.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : task.status === "SUBMITTED"
                                  ? "bg-amber-100 text-amber-800"
                                  : task.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {task.status.replace(/_/g, " ")}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {task.description}
                            </p>
                          )}

                          {/* Supervisor Feedback / Revision Notes */}
                          {task.reviewFeedback && (
                            <div
                              className={`p-2.5 rounded-xl text-[11px] border ${
                                task.status === "REVISION_REQUESTED"
                                  ? "bg-rose-50 border-rose-200 text-rose-800"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
                              }`}
                            >
                              <span className="font-bold block mb-0.5">
                                Supervisor Note ({task.assignedByName}):
                              </span>
                              "{task.reviewFeedback}"
                            </div>
                          )}

                          {/* Action Buttons for Assignee */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {task.status === "ASSIGNED" && (
                              <button
                                onClick={() => handleStartTask(task._id)}
                                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <Play className="w-3 h-3 fill-white" />
                                Start Task
                              </button>
                            )}

                            {(task.status === "IN_PROGRESS" ||
                              task.status === "REVISION_REQUESTED") && (
                              <button
                                onClick={() => {
                                  setTaskToSubmit(task);
                                  setTaskSubmissionNotes(task.submissionNotes || "");
                                  setShowSubmitTaskModal(true);
                                }}
                                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <Send className="w-3 h-3" />
                                Submit Work
                              </button>
                            )}

                            {task.status === "SUBMITTED" && (
                              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Submitted • Awaiting Supervisor Sign-off
                              </span>
                            )}

                            {task.status === "APPROVED" && (
                              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Signed Off & Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: ASSIGN WORK (Upper Staff ONLY: Coordinator, Analyst, Supervisor, Manager, Director, Chief Officer)
              Lowest-most employees (Assistant, Other) do NOT have this tab
             ========================================================================= */}
          {effectiveTab === "assign-work" && hierarchyData.isUpperRole && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wider block mb-1">
                    Department Delegation • Tier {hierarchyData.myRank} Authority
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Assign Work to Staff
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    Delegate operational tasks to subordinates under your supervision in{" "}
                    <span className="font-bold text-slate-700">
                      {employee?.department || currentDepartment}
                    </span>
                    . Lowest-tier employees only receive work; as an upper team member, you assign and sign off.
                  </p>
                </div>

                <button
                  onClick={() => setShowAssignTaskModal(true)}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Assign New Task
                </button>
              </div>

              {/* Subordinates Quick Overview Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Subordinate Staff in Your Department ({hierarchyData.subordinates?.length || 0})
                </h3>

                {hierarchyData.subordinates?.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">No Subordinates Found</p>
                    <p className="text-[11px] text-slate-500">
                      When lower-ranking staff register and are approved in your branch and department,
                      they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {hierarchyData.subordinates.map((sub) => (
                      <div
                        key={sub._id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{sub.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                            {sub.postTitle || sub.postLevel?.replace(/_/g, " ")} • {sub.branchName}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setAssignTaskForm({
                              ...assignTaskForm,
                              assignedToId: sub._id,
                            });
                            setShowAssignTaskModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] cursor-pointer"
                        >
                          + Assign
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Assignments Table */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Tasks Delegated by You</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monitor progress, review submitted deliverables, and request revisions.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {assignedByMeTasks.length} Tasks Created
                  </span>
                </div>

                {assignedByMeTasks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <ListTodo className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">No tasks delegated yet.</p>
                    <p className="text-[11px] text-slate-400">
                      Click "+ Assign New Task" to delegate operational work to lower staff.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                          <th className="pb-3 pl-2">Task Title</th>
                          <th className="pb-3">Assigned To</th>
                          <th className="pb-3">Priority</th>
                          <th className="pb-3">Due Date</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 pr-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assignedByMeTasks.map((task) => (
                          <tr key={task._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 pl-2">
                              <p className="font-bold text-slate-900">{task.title}</p>
                              {task.description && (
                                <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </td>
                            <td className="py-3 font-semibold text-slate-800">
                              {task.assignedToName}
                              <span className="block text-[10px] text-slate-400">
                                {task.assignedToPost || "Staff"}
                              </span>
                            </td>
                            <td className="py-3">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  task.priority === "URGENT"
                                    ? "bg-rose-100 text-rose-800"
                                    : task.priority === "HIGH"
                                    ? "bg-amber-100 text-amber-800"
                                    : task.priority === "MEDIUM"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-slate-600">{task.dueDate || "—"}</td>
                            <td className="py-3">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  task.status === "ASSIGNED"
                                    ? "bg-slate-100 text-slate-700"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-blue-100 text-blue-800"
                                    : task.status === "SUBMITTED"
                                    ? "bg-amber-100 text-amber-800 animate-pulse"
                                    : task.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {task.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-3 pr-2 text-right">
                              {task.status === "SUBMITTED" ? (
                                <button
                                  onClick={() => {
                                    setTaskToReview(task);
                                    setTaskReviewAction("APPROVE");
                                    setShowReviewTaskModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] shadow-xs cursor-pointer"
                                >
                                  Review Deliverable
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setTaskToReview(task);
                                    setTaskReviewAction(
                                      task.status === "APPROVED" ? "REQUEST_REVISION" : "APPROVE"
                                    );
                                    setShowReviewTaskModal(true);
                                  }}
                                  className="text-slate-500 hover:text-slate-800 text-[11px] font-bold cursor-pointer"
                                >
                                  View / Notes
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
              TAB 4: LEAVES (Common Tab with Corporate Hierarchy Routing)
             ========================================================================= */}
          {effectiveTab === "leaves" && (
            <div className="space-y-6">
              {/* Header Action Card */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">
                      Leaves Desk
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Routes to: {hierarchyData.reportingTo?.name || "Business Owner"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Leave Applications
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    In accordance with company hierarchy, your request will be reviewed by{" "}
                    <span className="font-bold text-slate-700">
                      {hierarchyData.reportingTo?.name || "Business Owner"}
                    </span>{" "}
                    ({hierarchyData.reportingTo?.postTitle || "Enterprise Head"}).
                  </p>
                </div>

                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Apply for Leave
                </button>
              </div>

              {/* Leaves History Table */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-900">Your Leave History</h3>
                  <span className="text-xs font-bold text-slate-500">
                    {leavesList.length} Total Requests
                  </span>
                </div>

                {leavesList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">No leave applications filed.</p>
                    <p className="text-[11px] text-slate-400">
                      When you apply for a planned or emergency leave, its status will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-black">
                          <th className="pb-3 pl-2">Leave Type</th>
                          <th className="pb-3">Duration</th>
                          <th className="pb-3">Dates</th>
                          <th className="pb-3">Reason</th>
                          <th className="pb-3">Approver</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 pr-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {leavesList.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 pl-2 font-bold text-slate-900">{item.leaveType}</td>
                            <td className="py-3 font-semibold text-slate-700">
                              {item.totalDays} Day{item.totalDays > 1 ? "s" : ""}
                            </td>
                            <td className="py-3 font-mono text-slate-600">
                              {item.startDate} → {item.endDate}
                            </td>
                            <td className="py-3 font-medium text-slate-700 max-w-xs truncate">
                              {item.reason}
                            </td>
                            <td className="py-3 font-medium text-slate-600">
                              {item.approverName || "Supervisor"}
                              <span className="block text-[10px] text-slate-400">
                                {item.approverRole || "Upper Staff"}
                              </span>
                            </td>
                            <td className="py-3">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  item.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.status === "PENDING"
                                    ? "bg-amber-100 text-amber-800"
                                    : item.status === "CANCELLED"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 pr-2 text-right">
                              {item.status === "PENDING" ? (
                                <button
                                  onClick={() => handleCancelLeave(item._id)}
                                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {item.reviewedByName ? `Signed by ${item.reviewedByName}` : "—"}
                                </span>
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
              TAB 5: SUBMISSIONS (Common Tab with Corporate Hierarchy Routing)
             ========================================================================= */}
          {effectiveTab === "submissions" && (
            <div className="space-y-6">
              {/* Header Action Card */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">
                      Work Log Submissions
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Reports to: {hierarchyData.reportingTo?.name || "Business Owner"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Daily Reports & Milestones
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    Submit what tasks you accomplished today. Your report routes to{" "}
                    <span className="font-bold text-slate-700">
                      {hierarchyData.reportingTo?.name || "Business Owner"}
                    </span>{" "}
                    for team accountability and feedback.
                  </p>
                </div>

                <button
                  onClick={() => setShowSubmissionModal(true)}
                  className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Submit Today's Report
                </button>
              </div>

              {/* Submissions List */}
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-900">Your Past Submissions</h3>
                  <span className="text-xs font-bold text-slate-500">
                    {submissionsList.length} Reports Logged
                  </span>
                </div>

                {submissionsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">No work submissions logged yet.</p>
                    <p className="text-[11px] text-slate-400">
                      Submit your first daily log at the end of your shift today.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissionsList.map((sub) => (
                      <div
                        key={sub._id}
                        className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-600 block">
                              Report • {sub.date}
                            </span>
                            <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                              {sub.title}
                            </h4>
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              sub.status === "ACKNOWLEDGED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>

                        {sub.tasksCompleted?.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-700 block">
                              Completed Tasks:
                            </span>
                            <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                              {sub.tasksCompleted.map((t, idx) => (
                                <li key={idx}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {sub.blockers && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                            <span className="font-bold">Blockers Reported:</span> {sub.blockers}
                          </div>
                        )}

                        {sub.feedback && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                            <span className="font-bold">
                              Supervisor Feedback ({sub.acknowledgedByName || "Supervisor"}):
                            </span>{" "}
                            "{sub.feedback}"
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
              DEPARTMENT MODULES VIEWPORT (Operations, Sales, Logistics, Financial)
             ========================================================================= */}
          {allowedDeptTabs.some((t) => t.id === effectiveTab) && (
            <div className="space-y-6">
              {/* Active Department Header / Role Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 px-6 py-4 rounded-2xl shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                    {(() => {
                      const ActiveIcon = TAB_ICON_MAP[effectiveTab] || Layers;
                      return <ActiveIcon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                        {activeDeptConfig.name} • {activeDeptConfig.subtitle}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        Clearance: {employee?.postLevel?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900">
                      {allowedDeptTabs.find((t) => t.id === effectiveTab)?.title}
                    </h2>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Authorized Role
                  </span>
                  <span className="text-xs font-black text-slate-700">
                    {activeDeptConfig.rolesByLevel[employee?.postLevel]?.title || employee?.postTitle || "Authorized Staff"}
                  </span>
                </div>
              </div>

              {/* Render Department-Specific View Engine */}
              {activeDepartmentKey === "OPERATIONS" && (
                <OperationsDepartmentView
                  tabId={effectiveTab}
                  employee={employee}
                  company={company}
                  onNotify={handleModuleNotify}
                />
              )}

              {activeDepartmentKey === "SALES" && (
                <SalesDepartmentView
                  tabId={effectiveTab}
                  employee={employee}
                  company={company}
                  onNotify={handleModuleNotify}
                />
              )}

              {activeDepartmentKey === "LOGISTICS" && (
                <LogisticsDepartmentView
                  tabId={effectiveTab}
                  employee={employee}
                  company={company}
                  onNotify={handleModuleNotify}
                />
              )}

              {activeDepartmentKey === "FINANCIAL" && (
                <FinancialDepartmentView
                  tabId={effectiveTab}
                  employee={employee}
                  company={company}
                  onNotify={handleModuleNotify}
                />
              )}
            </div>
          )}

          {/* Security Clearance Fallback: Restricted Tab Access */}
          {activeDeptConfig.tabs.some((t) => t.id === effectiveTab) &&
            !allowedDeptTabs.some((t) => t.id === effectiveTab) && (
              <div className="rounded-3xl bg-white border border-rose-200 p-8 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Access Restricted</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Your current post level (<strong>{employee?.postLevel?.replace(/_/g, " ")}</strong>) does not have clearance to view this module. Contact your department head or Director for elevated access.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
                >
                  Return to Attendance
                </button>
              </div>
          )}

          {/* =========================================================================
              TAB 6: PROFILE & HIERARCHY DETAILS
             ========================================================================= */}
          {effectiveTab === "profile" && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md">
                      {employee?.name ? employee.name.charAt(0) : "E"}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {employee?.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-600">
                          {employee?.postTitle || employee?.postLevel?.replace(/_/g, " ") || "Staff"}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                          Hierarchy Tier {hierarchyData.myRank}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => setEditingProfile(!editingProfile)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {editingProfile ? "Cancel" : "Edit Profile"}
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {loggingOut ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>

                {/* Profile Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Department
                    </span>
                    <p className="text-sm font-black text-slate-900">
                      {employee?.department || currentDepartment}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Assigned Branch
                    </span>
                    <p className="text-sm font-black text-slate-900">
                      {employee?.branchName || "Main HQ"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Reporting Supervisor
                    </span>
                    <p className="text-sm font-black text-slate-900">
                      {hierarchyData.reportingTo?.name || "Business Owner"}
                      <span className="block text-[11px] font-medium text-slate-500">
                        ({hierarchyData.reportingTo?.postTitle || "Enterprise Head"})
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Email Address
                    </span>
                    <p className="text-sm font-bold text-slate-700 font-mono">
                      {employee?.email || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Phone Number
                    </span>
                    <p className="text-sm font-bold text-slate-700">
                      {profileData?.phoneNumber || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Approval Status
                    </span>
                    <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {employee?.approvalStatus || "APPROVED"}
                    </span>
                  </div>
                </div>

                {/* Work Description */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Work Description & Duties
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {profileData?.workDescription ||
                      "No custom work description provided. You are assigned to the departmental workforce."}
                  </p>
                </div>

                {/* Edit Form */}
                {editingProfile && (
                  <form
                    onSubmit={handleSaveProfile}
                    className="mt-6 pt-6 border-t border-slate-100 space-y-4 max-w-xl"
                  >
                    <h3 className="text-sm font-black text-slate-900">Edit Contact Details</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Work Description
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
              for your business owner. You can punch in again anytime if you need to resume work.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Shift Handoff / Summary Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={punchOutNote}
                onChange={(e) => setPunchOutNote(e.target.value)}
                placeholder="e.g. Completed morning batch dispatch, all register items closed..."
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
          MODAL: ASSIGN WORK TO SUBORDINATE (Upper Employees Only)
         ========================================================================= */}
      {showAssignTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assign Work to Staff</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Delegate tasks to subordinates in your department.
                </p>
              </div>
              <button
                onClick={() => setShowAssignTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Assign To (Subordinate Staff)
                </label>
                <select
                  required
                  value={assignTaskForm.assignedToId}
                  onChange={(e) =>
                    setAssignTaskForm({ ...assignTaskForm, assignedToId: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="">Select subordinate staff member...</option>
                  {hierarchyData.subordinates?.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.postTitle || sub.postLevel?.replace(/_/g, " ")}) —{" "}
                      {sub.branchName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete inventory tally for Section B"
                  value={assignTaskForm.title}
                  onChange={(e) =>
                    setAssignTaskForm({ ...assignTaskForm, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Instructions & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail step-by-step instructions or expectations..."
                  value={assignTaskForm.description}
                  onChange={(e) =>
                    setAssignTaskForm({ ...assignTaskForm, description: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Priority Level
                  </label>
                  <select
                    value={assignTaskForm.priority}
                    onChange={(e) =>
                      setAssignTaskForm({ ...assignTaskForm, priority: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Immediate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={assignTaskForm.dueDate}
                    onChange={(e) =>
                      setAssignTaskForm({ ...assignTaskForm, dueDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignTask}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingAssignTask ? "Assigning..." : "Assign Task to Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SUBMIT COMPLETED WORK (Assignee)
         ========================================================================= */}
      {showSubmitTaskModal && taskToSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Submit Completed Work</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Task: <span className="font-bold text-slate-800">{taskToSubmit.title}</span>
                </p>
              </div>
              <button
                onClick={() => setShowSubmitTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTaskWork} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Deliverable Notes & Summary
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the deliverable, actions taken, or where files/records are stored..."
                  value={taskSubmissionNotes}
                  onChange={(e) => setTaskSubmissionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitTaskModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTaskWork}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingTaskWork ? "Submitting..." : "Send to Supervisor for Sign-off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REVIEW SUBORDINATE TASK (Supervisor Sign-off or Revision)
         ========================================================================= */}
      {showReviewTaskModal && taskToReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Review Deliverable</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Staff: <span className="font-bold text-slate-800">{taskToReview.assignedToName}</span> • Task: "{taskToReview.title}"
                </p>
              </div>
              <button
                onClick={() => setShowReviewTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {taskToReview.submissionNotes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-bold block text-slate-900 mb-1">
                  Submitted Deliverable Notes:
                </span>
                "{taskToReview.submissionNotes}"
              </div>
            )}

            <form onSubmit={handleReviewTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Review Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTaskReviewAction("APPROVE")}
                    className={`p-3 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                      taskReviewAction === "APPROVE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ✓ Sign Off & Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskReviewAction("REQUEST_REVISION")}
                    className={`p-3 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                      taskReviewAction === "REQUEST_REVISION"
                        ? "bg-amber-50 border-amber-500 text-amber-800 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ↺ Request Revision
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Supervisor Feedback / Notes (Sent to Staff)
                </label>
                <textarea
                  rows={3}
                  value={taskReviewFeedback}
                  onChange={(e) => setTaskReviewFeedback(e.target.value)}
                  placeholder={
                    taskReviewAction === "APPROVE"
                      ? "Great job! Deliverable verified and logged."
                      : "Please correct section 3 figures and resubmit..."
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewTaskModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTaskReview}
                  className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50 ${
                    taskReviewAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {submittingTaskReview
                    ? "Recording..."
                    : taskReviewAction === "APPROVE"
                    ? "Confirm Approval"
                    : "Send Revision Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REVIEW SUBORDINATE LEAVE (Supervisor Approve / Reject)
         ========================================================================= */}
      {showReviewLeaveModal && leaveToReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Review Leave Request</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Staff: <span className="font-bold text-slate-800">{leaveToReview.employeeName}</span>
                </p>
              </div>
              <button
                onClick={() => setShowReviewLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <p>
                <span className="font-bold">Leave:</span> {leaveToReview.leaveType} ({leaveToReview.totalDays} day
                {leaveToReview.totalDays > 1 ? "s" : ""})
              </p>
              <p>
                <span className="font-bold">Period:</span> {leaveToReview.startDate} to {leaveToReview.endDate}
              </p>
              <p>
                <span className="font-bold">Reason:</span> "{leaveToReview.reason}"
              </p>
            </div>

            <form onSubmit={handleReviewLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLeaveReviewAction("APPROVE")}
                    className={`p-3 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                      leaveReviewAction === "APPROVE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ✓ Approve Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveReviewAction("REJECT")}
                    className={`p-3 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                      leaveReviewAction === "REJECT"
                        ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ✕ Reject Leave
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Supervisor Note (Optional)
                </label>
                <input
                  type="text"
                  value={leaveReviewNotes}
                  onChange={(e) => setLeaveReviewNotes(e.target.value)}
                  placeholder="e.g. Approved, coverage confirmed with Ramesh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewLeaveModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeaveReview}
                  className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50 ${
                    leaveReviewAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submittingLeaveReview ? "Saving..." : `Confirm ${leaveReviewAction === "APPROVE" ? "Approval" : "Rejection"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FEEDBACK ON SUBORDINATE DAILY SUBMISSION
         ========================================================================= */}
      {showReviewSubmissionModal && submissionToReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Review Work Report</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Staff: <span className="font-bold text-slate-800">{submissionToReview.employeeName}</span> • "{submissionToReview.title}"
                </p>
              </div>
              <button
                onClick={() => setShowReviewSubmissionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Supervisor Feedback & Guidance
                </label>
                <textarea
                  rows={4}
                  required
                  value={submissionFeedback}
                  onChange={(e) => setSubmissionFeedback(e.target.value)}
                  placeholder="e.g. Good progress on dispatch. Will follow up with vendor regarding the machine spare belt."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewSubmissionModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSubmissionFeedback}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingSubmissionFeedback ? "Saving..." : "Send Feedback to Staff"}
                </button>
              </div>
            </form>
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
              <div>
                <h3 className="text-lg font-black text-slate-900">Apply for Leave</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Request will route to:{" "}
                  <span className="font-bold text-slate-800">
                    {hierarchyData.reportingTo?.name || "Business Owner"}
                  </span>
                </p>
              </div>
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
                  placeholder="e.g. Task handover details..."
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
                  {submittingLeave ? "Submitting..." : "Submit to Supervisor"}
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
              <div>
                <h3 className="text-lg font-black text-slate-900">Today's Work Report</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Reports to:{" "}
                  <span className="font-bold text-slate-800">
                    {hierarchyData.reportingTo?.name || "Business Owner"}
                  </span>
                </p>
              </div>
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
                    onClick={() =>
                      setSubmissionForm({ ...submissionForm, tasks: [...submissionForm.tasks, ""] })
                    }
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    + Add Another Task
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Blockers / Needs Attention (Optional)
                </label>
                <input
                  type="text"
                  value={submissionForm.blockers}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, blockers: e.target.value })}
                  placeholder="e.g. Machine 2 requires spare belt, vendor contact needed"
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
                  {submittingReport ? "Submitting..." : "Send Report to Supervisor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
