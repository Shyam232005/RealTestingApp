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
  Paperclip,
  Download,
  Eye,
  Plus,
  ListTodo,
  FolderArchive,
  FileSpreadsheet,
  ImageIcon,
  Crown,
  FileCheck,
  UserCog,
  ArrowRightLeft,
  Trash2,
  UserMinus,
} from "lucide-react";

const DEPARTMENTS = [
  { id: "ALL", label: "All Departments" },
  { id: "OPERATIONS", label: "Operations" },
  { id: "SALES", label: "Sales" },
  { id: "LOGISTICS", label: "Logistics" },
  { id: "FINANCIAL", label: "Financial" },
  { id: "RETAIL", label: "Retail & Counter POS" },
];

const DEPARTMENT_ROLES = {
  OPERATIONS: [
    { level: "CHIEF_OFFICER", defaultTitle: "Chief Operating Officer (COO)" },
    { level: "DIRECTOR", defaultTitle: "Director of Operations / Operations Head" },
    { level: "MANAGER", defaultTitle: "Operations / Plant Manager" },
    { level: "SUPERVISOR", defaultTitle: "Production Supervisor / Floor Team Lead" },
    { level: "ANALYST", defaultTitle: "Operations Analyst / QC Inspector" },
    { level: "COORDINATOR", defaultTitle: "Operations Coordinator" },
    { level: "ASSISTANT", defaultTitle: "Operations Assistant / Floor Clerk" },
    { level: "OTHER", defaultTitle: "Maintenance Tech & Plant Staff" },
  ],
  SALES: [
    { level: "CHIEF_OFFICER", defaultTitle: "Chief Sales Officer (CSO / CRO)" },
    { level: "DIRECTOR", defaultTitle: "Sales Director / Sales & Marketing Head" },
    { level: "MANAGER", defaultTitle: "Sales Manager" },
    { level: "SUPERVISOR", defaultTitle: "Field Sales Lead / Account Executive (AE)" },
    { level: "ANALYST", defaultTitle: "Sales Ops Analyst / Digital Marketing Exec" },
    { level: "COORDINATOR", defaultTitle: "Sales Coordinator / SDR & BDR" },
    { level: "ASSISTANT", defaultTitle: "Counter Sales / Billing Desk Assistant" },
    { level: "OTHER", defaultTitle: "Telecaller / Outbound Support" },
  ],
  LOGISTICS: [
    { level: "CHIEF_OFFICER", defaultTitle: "Chief Logistics Officer (CLO / CSCO)" },
    { level: "DIRECTOR", defaultTitle: "Director of Logistics / Supply Chain Head" },
    { level: "MANAGER", defaultTitle: "Logistics & Supply Chain Manager" },
    { level: "SUPERVISOR", defaultTitle: "Warehouse In-charge / Fleet Supervisor" },
    { level: "ANALYST", defaultTitle: "Logistics Analyst / Procurement Exec" },
    { level: "COORDINATOR", defaultTitle: "Order & Dispatch Coordinator" },
    { level: "ASSISTANT", defaultTitle: "Logistics Clerk / Dock Assistant" },
    { level: "OTHER", defaultTitle: "Material Handler / Loader / Driver" },
  ],
  FINANCIAL: [
    { level: "CHIEF_OFFICER", defaultTitle: "Chief Financial Officer (CFO)" },
    { level: "DIRECTOR", defaultTitle: "Director of Finance / Financial Controller" },
    { level: "MANAGER", defaultTitle: "Finance & Accounts Manager" },
    { level: "SUPERVISOR", defaultTitle: "Senior Accountant / Billing Supervisor" },
    { level: "ANALYST", defaultTitle: "Financial Analyst / Cost Accountant" },
    { level: "COORDINATOR", defaultTitle: "Accounts Payable (AP) & Receivable (AR) Clerk" },
    { level: "ASSISTANT", defaultTitle: "Cashier / Vouchers Data Entry Assistant" },
    { level: "OTHER", defaultTitle: "Tax Auditor / Statutory Compliance Assistant" },
  ],
  RETAIL: [
    { level: "CHIEF_OFFICER", defaultTitle: "Chief Retail Officer (CRO) / Head of Retail" },
    { level: "DIRECTOR", defaultTitle: "Director of Retail Store Operations" },
    { level: "MANAGER", defaultTitle: "Store / Supermarket Manager" },
    { level: "SUPERVISOR", defaultTitle: "POS & Billing Counter Supervisor" },
    { level: "ANALYST", defaultTitle: "Retail & Basket Analyst" },
    { level: "COORDINATOR", defaultTitle: "Counter Stock & Shelf Replenisher" },
    { level: "ASSISTANT", defaultTitle: "Cashier & Counter Billing Operator" },
    { level: "OTHER", defaultTitle: "Store Associate & Counter Sweets Clerk" },
  ],
};

DEPARTMENT_ROLES.RETAIL_POS = DEPARTMENT_ROLES.RETAIL;

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
  RETAIL: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    accent: "bg-rose-600",
  },
  RETAIL_POS: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    accent: "bg-rose-600",
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

  // Sub-section Navigation
  const [currentSubSection, setCurrentSubSection] = useState("ROSTER"); // "ROSTER" | "ASSIGN_TASKS" | "SUBMITTED_FILES" | "MAINTAIN_STAFF"

  // Maintain & Transfer State
  const [maintainDeptFilter, setMaintainDeptFilter] = useState("ALL");
  const [maintainSearch, setMaintainSearch] = useState("");
  const [transferModalEmployee, setTransferModalEmployee] = useState(null);
  const [transferForm, setTransferForm] = useState({
    department: "OPERATIONS",
    postLevel: "ASSISTANT",
    postTitle: "",
    branchId: "",
    branchName: "",
  });
  const [isTransferring, setIsTransferring] = useState(false);

  // Delete / Remove Modal State
  const [deleteModalEmployee, setDeleteModalEmployee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenTransferModal = (emp) => {
    setTransferModalEmployee(emp);
    const targetDept = emp.department || "OPERATIONS";
    const targetLevel = emp.postLevel || "ASSISTANT";
    const defaultTitle =
      DEPARTMENT_ROLES[targetDept]?.find((r) => r.level === targetLevel)?.defaultTitle ||
      emp.postTitle ||
      "";

    setTransferForm({
      department: targetDept,
      postLevel: targetLevel,
      postTitle: emp.postTitle || defaultTitle,
      branchId: emp.branchId || "branch-1",
      branchName: emp.branchName || "Main HQ",
    });
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferModalEmployee) return;
    setIsTransferring(true);
    setTaskFeedbackMsg("");
    try {
      const res = await fetch(`/api/owner/employees/${transferModalEmployee._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to transfer employee");

      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === transferModalEmployee._id
            ? {
                ...emp,
                department: data.employee.department,
                postLevel: data.employee.postLevel,
                postTitle: data.employee.postTitle,
                branchId: data.employee.branchId,
                branchName: data.employee.branchName,
              }
            : emp
        )
      );

      setTransferModalEmployee(null);
      setTaskFeedbackMsg(data.message || "Employee transferred successfully!");
      setTimeout(() => setTaskFeedbackMsg(""), 5000);
      fetchOwnerTasks();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("owner-staff-updated", {
            detail: { action: "TRANSFER" },
          })
        );
      }
    } catch (err) {
      alert(err.message || "Failed to transfer employee");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteModalEmployee) return;
    setIsDeleting(true);
    setTaskFeedbackMsg("");
    try {
      const res = await fetch(`/api/owner/employees/${deleteModalEmployee._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete employee");

      setEmployees((prev) => prev.filter((emp) => emp._id !== deleteModalEmployee._id));
      setStats((prev) => ({
        ...prev,
        totalStaff: Math.max(0, (prev.totalStaff || 1) - 1),
      }));

      setDeleteModalEmployee(null);
      setTaskFeedbackMsg(data.message || "Employee permanently removed from database.");
      setTimeout(() => setTaskFeedbackMsg(""), 5000);
      fetchOwnerTasks();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("owner-staff-updated", {
            detail: { action: "DELETE" },
          })
        );
      }
    } catch (err) {
      alert(err.message || "Failed to delete employee");
    } finally {
      setIsDeleting(false);
    }
  };

  // Owner Task Delegation State
  const [ownerTasks, setOwnerTasks] = useState([]);
  const [topDepartmentHeads, setTopDepartmentHeads] = useState([]);
  const [approvedStaffList, setApprovedStaffList] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    assignedToId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
  });
  const [assigningTask, setAssigningTask] = useState(false);
  const [taskFeedbackMsg, setTaskFeedbackMsg] = useState("");

  // Submitted Work Files State
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [filesSummary, setFilesSummary] = useState({
    totalFiles: 0,
    pdfCount: 0,
    imageCount: 0,
    spreadsheetCount: 0,
    otherCount: 0,
  });
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileCategoryFilter, setFileCategoryFilter] = useState("ALL"); // ALL | PDF | IMAGE | SPREADSHEET | DOCUMENT
  const [fileDeptFilter, setFileDeptFilter] = useState("ALL");
  const [fileSearch, setFileSearch] = useState("");
  const [previewFile, setPreviewFile] = useState(null);

  // Fetch Owner Tasks & Top Department Leaders
  const fetchOwnerTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/owner/tasks");
      if (res.ok) {
        const data = await res.json();
        setOwnerTasks(data.tasks || []);
        setTopDepartmentHeads(data.topDepartmentHeads || []);
        setApprovedStaffList(data.approvedEmployees || []);
      }
    } catch (err) {
      console.error("Failed to fetch owner tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Assign Task to Top Department Leader
  const handleAssignTask = async (e) => {
    e.preventDefault();
    setAssigningTask(true);
    setTaskFeedbackMsg("");
    try {
      const res = await fetch("/api/owner/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign task");

      setOwnerTasks((prev) => [data.task, ...prev]);
      setShowAssignModal(false);
      setAssignForm({
        assignedToId: "",
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
      });
      setTaskFeedbackMsg(data.message || "Task assigned successfully!");
      setTimeout(() => setTaskFeedbackMsg(""), 4000);
    } catch (err) {
      alert(err.message || "Failed to assign task");
    } finally {
      setAssigningTask(false);
    }
  };

  // Fetch Submitted Work Files Vault
  const fetchSubmittedFiles = async () => {
    setLoadingFiles(true);
    try {
      const params = new URLSearchParams();
      if (currentBranchId && currentBranchId !== "all") {
        params.append("branchId", currentBranchId);
      }
      if (fileDeptFilter && fileDeptFilter !== "ALL") {
        params.append("department", fileDeptFilter);
      }
      if (fileSearch.trim()) {
        params.append("search", fileSearch.trim());
      }
      const res = await fetch(`/api/owner/submissions/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubmittedFiles(data.files || []);
        setFilesSummary(data.summary || {});
      }
    } catch (err) {
      console.error("Failed to load submitted files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

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

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setShowAssignModal(true);
              fetchOwnerTasks();
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>+ Assign Task to Dept Head</span>
          </button>

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

      {/* Global Task Feedback Alert */}
      {taskFeedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{taskFeedbackMsg}</span>
          </div>
          <button onClick={() => setTaskFeedbackMsg("")} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Team Operations Sub-Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setCurrentSubSection("ROSTER")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            currentSubSection === "ROSTER"
              ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Roster & Duty Shifts</span>
          <span
            className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
              currentSubSection === "ROSTER"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {employees.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentSubSection("ASSIGN_TASKS");
            fetchOwnerTasks();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            currentSubSection === "ASSIGN_TASKS"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Assign Tasks to Dept Heads</span>
          {ownerTasks.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                currentSubSection === "ASSIGN_TASKS"
                  ? "bg-white/20 text-white"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {ownerTasks.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentSubSection("SUBMITTED_FILES");
            fetchSubmittedFiles();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            currentSubSection === "SUBMITTED_FILES"
              ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          <span>Submitted Work Files & Vault</span>
          {filesSummary.totalFiles > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                currentSubSection === "SUBMITTED_FILES"
                  ? "bg-white/20 text-white"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {filesSummary.totalFiles}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentSubSection("MAINTAIN_STAFF")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            currentSubSection === "MAINTAIN_STAFF"
              ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>Maintain & Transfer Staff</span>
          <span
            className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
              currentSubSection === "MAINTAIN_STAFF"
                ? "bg-white/20 text-white"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {employees.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          SUB-SECTION 1: STAFF ROSTER & ATTENDANCE SHIFTS
         ========================================================================= */}
      {currentSubSection === "ROSTER" && (
        <div className="space-y-6">
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
                    className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200/70 hover:border-purple-600 text-xs font-bold flex items-center gap-1.5 transition-all duration-200 hover:shadow-md hover:shadow-purple-600/20 active:scale-95 cursor-pointer"
                  >
                    <span>View Activity Log</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* =========================================================================
          SUB-SECTION 2: ASSIGN DIRECT TASKS TO TOP DEPARTMENT LEADERS
         ========================================================================= */}
      {currentSubSection === "ASSIGN_TASKS" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase tracking-wider border border-indigo-400/20 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    Executive Directives
                  </span>
                  <span className="text-xs text-indigo-300 font-medium">
                    Owner Direct Line
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Direct Task Delegation to Department Heads
                </h3>
                <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl font-medium">
                  Assign high-priority tasks and strategic directives directly to the top-ranking officer of each department (Operations, Sales, Logistics, Financial). Tasks bypass intermediate managers and land directly in the leader's Desk & Requests workspace.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchOwnerTasks()}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer"
                  title="Refresh Tasks"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTasks ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssignForm({
                      assignedToId: topDepartmentHeads[0]?._id || approvedStaffList[0]?._id || "",
                      title: "",
                      description: "",
                      priority: "HIGH",
                      dueDate: "",
                    });
                    setShowAssignModal(true);
                  }}
                  className="px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black tracking-wide shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign New Directive</span>
                </button>
              </div>
            </div>
          </div>

          {/* Department Head Hierarchy Cards */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Department Leadership Roster
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Identified top-ranking officer in each department
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {topDepartmentHeads.length} of 4 Departments Headed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {["OPERATIONS", "SALES", "LOGISTICS", "FINANCIAL"].map((dept) => {
                const head = topDepartmentHeads.find((h) => h.department === dept);
                const colors = DEPT_COLORS[dept] || {
                  badge: "bg-slate-100 text-slate-700 border-slate-200",
                };

                return (
                  <div
                    key={dept}
                    className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                      head
                        ? "border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-md"
                        : "border-dashed border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${colors.badge}`}
                        >
                          {dept}
                        </span>
                        {head ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Head
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            Vacant
                          </span>
                        )}
                      </div>

                      {head ? (
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center shrink-0">
                              {head.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-sm font-black text-slate-900 truncate">
                                {head.name}
                              </h5>
                              <p className="text-[11px] font-black text-indigo-700 truncate">
                                {head.postLevel}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {head.postTitle}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Branch:</span>
                            <span className="font-bold text-slate-700 truncate max-w-[130px]">
                              {head.branchName || "Main"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center">
                          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-600">
                            No Head Assigned
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Approve or assign a staff member to {dept}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {head ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAssignForm({
                              assignedToId: head._id,
                              title: "",
                              description: "",
                              priority: "HIGH",
                              dueDate: "",
                            });
                            setShowAssignModal(true);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign Directive</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold opacity-60 cursor-not-allowed text-center"
                        >
                          Awaiting Head
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Directives History & Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-indigo-600" />
                  <span>Delegated Executive Directives</span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Track progress, review submissions, and manage owner-issued tasks
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-mono">
                  {ownerTasks.length} {ownerTasks.length === 1 ? "Directive" : "Directives"}
                </span>
              </div>
            </div>

            {/* Tasks Zero State */}
            {ownerTasks.length === 0 ? (
              <div className="py-16 px-4 text-center rounded-2xl bg-slate-50/70 border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow-inner mb-4">
                  <Crown className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  No Executive Directives Issued Yet
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto mt-1 mb-6">
                  You haven't assigned any direct tasks to department heads yet. Directly assigned tasks appear on top of their workspace and notify them instantly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAssignForm({
                      assignedToId: topDepartmentHeads[0]?._id || approvedStaffList[0]?._id || "",
                      title: "",
                      description: "",
                      priority: "HIGH",
                      dueDate: "",
                    });
                    setShowAssignModal(true);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign First Directive</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {ownerTasks.map((t) => {
                  const priorityColors = {
                    URGENT: "bg-rose-50 text-rose-700 border-rose-200",
                    HIGH: "bg-amber-50 text-amber-700 border-amber-200",
                    MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
                    LOW: "bg-slate-50 text-slate-700 border-slate-200",
                  }[t.priority] || "bg-slate-50 text-slate-700 border-slate-200";

                  const statusColors = {
                    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
                    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
                    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
                  }[t.status] || "bg-slate-50 text-slate-700 border-slate-200";

                  return (
                    <div
                      key={t._id}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${priorityColors}`}
                          >
                            {t.priority}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${statusColors}`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Issued: {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                          {t.dueDate && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {t.dueDate}
                            </span>
                          )}
                        </div>

                        <h5 className="text-sm font-black text-slate-900 break-words">
                          {t.title}
                        </h5>

                        <p className="text-xs text-slate-600 font-medium line-clamp-2">
                          {t.description}
                        </p>
                      </div>

                      {/* Assignee Card */}
                      <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Assigned To
                          </span>
                          <span className="text-xs font-black text-slate-900 block truncate max-w-[140px]">
                            {t.assignedTo?.name || "Dept Officer"}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 block">
                            {t.assignedTo?.department} • {t.assignedTo?.postLevel || t.assignedTo?.postTitle}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center">
                          {t.assignedTo?.name?.charAt(0)?.toUpperCase() || "D"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-SECTION 3: SUBMITTED WORK FILES & VAULT
         ========================================================================= */}
      {currentSubSection === "SUBMITTED_FILES" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-purple-900 via-purple-950 to-slate-950 rounded-3xl text-white shadow-xl relative overflow-hidden border border-purple-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase tracking-wider border border-purple-400/20 flex items-center gap-1.5">
                    <FolderArchive className="w-3.5 h-3.5 text-purple-300" />
                    Centralized Work Vault
                  </span>
                  <span className="text-xs text-purple-300 font-medium">
                    Daily Proofs & Attachments
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Employee Submitted Work Files
                </h3>
                <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl font-medium">
                  Review all documents, spreadsheets, daily QC sheets, invoices, and photo proofs uploaded by employees during daily work submissions across all 4 departments.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchSubmittedFiles()}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer"
                  title="Refresh Vault"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingFiles ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Total Vaulted Files
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <FolderArchive className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
                {filesSummary.totalFiles || 0}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                From daily end-of-shift reports
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-rose-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                  PDF Documents
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-950 mt-2 font-mono">
                {filesSummary.pdfCount || 0}
              </p>
              <p className="text-[11px] text-rose-700 font-medium mt-1">
                Invoices, challans, reports
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-blue-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                  Photo Proofs / Images
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-blue-950 mt-2 font-mono">
                {filesSummary.imageCount || 0}
              </p>
              <p className="text-[11px] text-blue-700 font-medium mt-1">
                QC photos, receipts, delivery slips
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-emerald-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Spreadsheets & Data
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-950 mt-2 font-mono">
                {filesSummary.spreadsheetCount || 0}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                CSV, Excel, production logs
              </p>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by file name or employee name..."
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchSubmittedFiles();
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Department Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={fileDeptFilter}
                  onChange={(e) => {
                    setFileDeptFilter(e.target.value);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="ALL">All Departments</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="SALES">Sales</option>
                  <option value="LOGISTICS">Logistics</option>
                  <option value="FINANCIAL">Financial</option>
                </select>

                <button
                  type="button"
                  onClick={() => fetchSubmittedFiles()}
                  className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
                Filter by Type:
              </span>
              {[
                { id: "ALL", label: "All Files" },
                { id: "PDF", label: "PDF Documents" },
                { id: "IMAGE", label: "Photos & Images" },
                { id: "SPREADSHEET", label: "Spreadsheets" },
                { id: "DOCUMENT", label: "Other Documents" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFileCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    fileCategoryFilter === cat.id
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Files Grid */}
          {(() => {
            const displayFiles = submittedFiles.filter((f) => {
              if (fileCategoryFilter === "ALL") return true;
              return f.category === fileCategoryFilter;
            });

            if (displayFiles.length === 0) {
              return (
                <div className="py-16 px-4 text-center rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center shadow-inner mb-4">
                    <FolderArchive className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    No Submitted Files in Vault
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto mt-1 mb-2">
                    When employees submit their daily end-of-shift reports with attached work documents, proofs, images, or spreadsheets, they will be archived here for owner review and instant download.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Zero files currently matching filters
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayFiles.map((file, idx) => {
                  const isImage =
                    file.category === "IMAGE" ||
                    file.fileType?.startsWith("image/") ||
                    file.fileData?.startsWith("data:image/");

                  const categoryIcons = {
                    PDF: { icon: FileText, color: "bg-rose-50 text-rose-700 border-rose-200" },
                    IMAGE: { icon: ImageIcon, color: "bg-blue-50 text-blue-700 border-blue-200" },
                    SPREADSHEET: { icon: FileSpreadsheet, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                    DOCUMENT: { icon: FileText, color: "bg-purple-50 text-purple-700 border-purple-200" },
                  };

                  const { icon: CatIcon, color: catColor } =
                    categoryIcons[file.category] || categoryIcons.DOCUMENT;

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Icon & Category */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border flex items-center gap-1.5 ${catColor}`}
                          >
                            <CatIcon className="w-3.5 h-3.5" />
                            {file.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : "File"}
                          </span>
                        </div>

                        {/* File Name & Preview Area */}
                        {isImage && file.fileData ? (
                          <div
                            onClick={() => setPreviewFile(file)}
                            className="w-full h-32 rounded-2xl bg-slate-100 overflow-hidden mb-3 border border-slate-200 cursor-pointer group relative"
                          >
                            <img
                              src={file.fileData}
                              alt={file.fileName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <Eye className="w-4 h-4" />
                              Click to Preview
                            </div>
                          </div>
                        ) : null}

                        <h5
                          title={file.fileName}
                          className="text-sm font-black text-slate-900 truncate"
                        >
                          {file.fileName}
                        </h5>

                        {/* Employee & Department info */}
                        <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800 truncate">
                              {file.employeeName}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 uppercase">
                              {file.department}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {file.employeePost} • {file.branchName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Report Date: {file.submissionDate || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            className="flex-1 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        )}
                        <a
                          href={file.fileData}
                          download={file.fileName}
                          className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-purple-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}


      {/* =========================================================================
          SUB-SECTION 4: MAINTAIN & TRANSFER EMPLOYEES
         ========================================================================= */}
      {currentSubSection === "MAINTAIN_STAFF" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-950 rounded-3xl text-white shadow-xl relative overflow-hidden border border-rose-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-black uppercase tracking-wider border border-rose-400/20 flex items-center gap-1.5">
                    <UserCog className="w-3.5 h-3.5 text-rose-300" />
                    Staff Directory & Lifecycle
                  </span>
                  <span className="text-xs text-rose-300 font-medium">
                    Owner Administration
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Maintain, Transfer & Remove Employees
                </h3>
                <p className="text-xs sm:text-sm text-rose-200/80 mt-1 max-w-2xl font-medium">
                  Easily reassign team members across departments (Operations, Sales, Logistics, Financial), modify hierarchy ranks and titles, or permanently offboard and remove employee records from the database.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchEmployees(true)}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all cursor-pointer"
                  title="Refresh Employees"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Department Breakdown Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {["OPERATIONS", "SALES", "LOGISTICS", "FINANCIAL"].map((dept) => {
              const count = employees.filter((e) => e.department === dept).length;
              const colors = DEPT_COLORS[dept] || {
                badge: "bg-slate-100 text-slate-700",
              };

              return (
                <div
                  key={dept}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${colors.badge}`}
                    >
                      {dept}
                    </span>
                    <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
                      {count}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {count === 1 ? "Assigned staff" : "Assigned staff members"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintainDeptFilter(dept)}
                    className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer transition-all"
                    title={`Filter by ${dept}`}
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, phone, email, or role title..."
                value={maintainSearch}
                onChange={(e) => setMaintainSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
                Department:
              </span>
              {[
                { id: "ALL", label: "All" },
                { id: "OPERATIONS", label: "Operations" },
                { id: "SALES", label: "Sales" },
                { id: "LOGISTICS", label: "Logistics" },
                { id: "FINANCIAL", label: "Financial" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setMaintainDeptFilter(d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    maintainDeptFilter === d.id
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Maintenance Table */}
          {(() => {
            const filtered = employees.filter((emp) => {
              if (maintainDeptFilter !== "ALL" && emp.department !== maintainDeptFilter) {
                return false;
              }
              if (maintainSearch.trim()) {
                const q = maintainSearch.toLowerCase().trim();
                const matchName = emp.name?.toLowerCase().includes(q);
                const matchPhone = emp.phoneNumber?.toLowerCase().includes(q);
                const matchEmail = emp.email?.toLowerCase().includes(q);
                const matchPost = emp.postTitle?.toLowerCase().includes(q);
                if (!matchName && !matchPhone && !matchEmail && !matchPost) {
                  return false;
                }
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="py-16 px-4 text-center rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center shadow-inner mb-4">
                    <UserCog className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    No Employees Matching Criteria
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto mt-1 mb-4">
                    Adjust your search query or department filters to locate staff members.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMaintainSearch("");
                      setMaintainDeptFilter("ALL");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              );
            }

            return (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase text-[10px] font-black">
                        <th className="py-3.5 pl-6">Employee Details</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4">Hierarchy & Post</th>
                        <th className="py-3.5 px-4">Branch</th>
                        <th className="py-3.5 px-4">Duty Status</th>
                        <th className="py-3.5 pr-6 text-right">Maintenance Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((emp) => {
                        const colors = DEPT_COLORS[emp.department] || {
                          badge: "bg-slate-100 text-slate-700 border-slate-200",
                        };

                        const statusBadge = {
                          ON_DUTY: {
                            label: "🟢 Live On Duty",
                            class: "bg-emerald-50 text-emerald-700 border-emerald-200",
                          },
                          COMPLETED: {
                            label: "⚪ Completed Shift",
                            class: "bg-slate-100 text-slate-700 border-slate-200",
                          },
                          OFF_DUTY: {
                            label: "⚪ Off Duty",
                            class: "bg-slate-50 text-slate-500 border-slate-200",
                          },
                          ON_LEAVE: {
                            label: "🏖️ On Leave",
                            class: "bg-amber-50 text-amber-800 border-amber-200",
                          },
                        }[emp.dutyStatus] || {
                          label: "Off Duty",
                          class: "bg-slate-50 text-slate-500 border-slate-200",
                        };

                        return (
                          <tr key={emp._id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Employee Info */}
                            <td className="py-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 font-black text-sm flex items-center justify-center shrink-0">
                                  {emp.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-black text-slate-900 truncate">
                                    {emp.name}
                                  </h5>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                    <span>{emp.phoneNumber}</span>
                                    {emp.email && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-[150px]">{emp.email}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Department */}
                            <td className="py-4 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${colors.badge}`}
                              >
                                {emp.department}
                              </span>
                            </td>

                            {/* Hierarchy & Post */}
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-900 truncate max-w-[200px]">
                                {emp.postTitle || emp.postLevel}
                              </p>
                              <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider">
                                {emp.postLevel}
                              </span>
                            </td>

                            {/* Branch */}
                            <td className="py-4 px-4">
                              <span className="font-medium text-slate-700">
                                {emp.branchName || "Main HQ"}
                              </span>
                            </td>

                            {/* Duty Status */}
                            <td className="py-4 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black border inline-flex items-center gap-1 ${statusBadge.class}`}
                              >
                                {statusBadge.label}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 pr-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenTransferModal(emp)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  title="Move to another department or role"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                  <span>Transfer Dept</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteModalEmployee(emp)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  title="Permanently remove employee from database"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
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
                Close Activity Log
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
      {/* Direct Task Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Assign Executive Directive
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Owner direct task to Department Head
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAssignTask} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign To Department Leader *
                </label>
                <select
                  required
                  value={assignForm.assignedToId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, assignedToId: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Select Department Leader...</option>
                  <optgroup label="Top Department Heads">
                    {topDepartmentHeads.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.department}: {h.name} ({h.postLevel} - {h.postTitle})
                      </option>
                    ))}
                  </optgroup>
                  {approvedStaffList.length > 0 && (
                    <optgroup label="All Approved Staff">
                      {approvedStaffList.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} — {emp.department} ({emp.postTitle})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Directive Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expedite Q4 Plant Maintenance or Review High-Value Sales Pipeline"
                  value={assignForm.title}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, title: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions & Scope *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide explicit instructions, operational expectations, deliverables..."
                  value={assignForm.description}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, description: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={assignForm.priority}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, priority: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={assignForm.dueDate}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, dueDate: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningTask}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {assigningTask ? "Assigning..." : "Issue Directive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="text-sm font-black text-slate-900 truncate">
                  {previewFile.fileName}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Uploaded by {previewFile.employeeName} ({previewFile.department})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-50">
              {previewFile.fileType?.startsWith("image/") || previewFile.fileData?.startsWith("data:image/") ? (
                <img
                  src={previewFile.fileData}
                  alt={previewFile.fileName}
                  className="max-h-[60vh] max-w-full rounded-2xl shadow-md object-contain border border-slate-200"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">
                    Preview not available directly in browser for this file type.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Download the file to view in your preferred application.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-xs text-slate-400 font-mono">
                {previewFile.fileSize ? `${(previewFile.fileSize / 1024).toFixed(1)} KB` : "File"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={previewFile.fileData}
                  download={previewFile.fileName}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Transfer & Role Reassignment Modal */}
      {transferModalEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Transfer & Reassign Employee
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Move between departments or reclassify post rank
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalEmployee(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Details Summary */}
            <div className="px-5 sm:px-6 pt-5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Current Assignment
                  </span>
                  <p className="font-black text-slate-900 mt-0.5">
                    {transferModalEmployee.name}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {transferModalEmployee.postTitle} ({transferModalEmployee.postLevel})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-purple-100 text-purple-700">
                    {transferModalEmployee.department}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {transferModalEmployee.branchName || "Main HQ"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleTransferSubmit} className="p-5 sm:p-6 space-y-4">
              {/* Target Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Department *
                </label>
                <select
                  required
                  value={transferForm.department}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    const defaultTitle =
                      DEPARTMENT_ROLES[newDept]?.find(
                        (r) => r.level === transferForm.postLevel
                      )?.defaultTitle || "";
                    setTransferForm({
                      ...transferForm,
                      department: newDept,
                      postTitle: defaultTitle || transferForm.postTitle,
                    });
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="OPERATIONS">Operations (Production, Plant & Quality)</option>
                  <option value="SALES">Sales (Revenue, CRM & Marketing)</option>
                  <option value="LOGISTICS">Logistics (Supply Chain, Procurement & Fleet)</option>
                  <option value="FINANCIAL">Financial (Treasury, Billing & General Ledger)</option>
                </select>
              </div>

              {/* Hierarchy Post Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hierarchy Post Level *
                </label>
                <select
                  required
                  value={transferForm.postLevel}
                  onChange={(e) => {
                    const newLevel = e.target.value;
                    const defaultTitle =
                      DEPARTMENT_ROLES[transferForm.department]?.find(
                        (r) => r.level === newLevel
                      )?.defaultTitle || "";
                    setTransferForm({
                      ...transferForm,
                      postLevel: newLevel,
                      postTitle: defaultTitle || transferForm.postTitle,
                    });
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="CHIEF_OFFICER">Level 1: Chief Officer (COO / CSO / CLO / CFO)</option>
                  <option value="DIRECTOR">Level 2: Director / Department Head</option>
                  <option value="MANAGER">Level 3: Department / Plant Manager</option>
                  <option value="SUPERVISOR">Level 4: Supervisor / Team Lead / AE</option>
                  <option value="ANALYST">Level 5: Analyst / QC Inspector / Specialist</option>
                  <option value="COORDINATOR">Level 6: Coordinator / Requisitions & Dispatch</option>
                  <option value="ASSISTANT">Level 7: Assistant / Clerk / Data Entry</option>
                  <option value="OTHER">Level 8: Other / Plant Staff / Tech Support</option>
                </select>
              </div>

              {/* Official Post Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Post Title *
                </label>
                <input
                  type="text"
                  required
                  value={transferForm.postTitle}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, postTitle: e.target.value })
                  }
                  placeholder="e.g. Operations Coordinator or Sales Manager"
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Branch Reassignment */}
              {Array.isArray(organization?.branchList) && organization.branchList.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Branch Location
                  </label>
                  <select
                    value={transferForm.branchId}
                    onChange={(e) => {
                      const branch = organization.branchList.find(
                        (b) => b.id === e.target.value
                      );
                      setTransferForm({
                        ...transferForm,
                        branchId: e.target.value,
                        branchName: branch ? branch.branchName || branch.name : "Main HQ",
                      });
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {organization.branchList.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName || branch.name || `Branch (${branch.id})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalEmployee(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isTransferring ? "Transferring..." : "Confirm Department Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanently Remove Employee Modal */}
      {deleteModalEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-950">
                    Permanently Remove Employee
                  </h3>
                  <p className="text-xs text-rose-700 font-medium">
                    Permanent deletion from database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalEmployee(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-rose-100 text-slate-600 flex items-center justify-center cursor-pointer border border-rose-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-rose-950">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Irreversible Database Action</span>
                </div>
                <p className="leading-relaxed">
                  Are you sure you want to permanently remove{" "}
                  <strong className="text-rose-950">{deleteModalEmployee.name}</strong> from{" "}
                  <strong className="text-rose-950">{deleteModalEmployee.department}</strong>?
                </p>
                <p className="text-[11px] text-rose-700 leading-normal">
                  This action will completely delete the employee document from the MongoDB database. Their access credentials will be revoked immediately and they will no longer be able to log in or access any company workspace.
                </p>
              </div>

              {/* Employee Summary Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900">{deleteModalEmployee.name}</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                    {deleteModalEmployee.department}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  {deleteModalEmployee.postTitle} ({deleteModalEmployee.postLevel})
                </p>
                <p className="text-slate-400 text-[10px] font-mono">
                  Phone: {deleteModalEmployee.phoneNumber} • Branch: {deleteModalEmployee.branchName || "Main HQ"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteModalEmployee(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteSubmit}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? "Deleting..." : "Confirm & Delete Employee"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
