"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Crown,
  Zap,
  ShieldCheck,
  Users,
  Building2,
  Briefcase,
  Activity,
  Database,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Key,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  TrendingUp,
  Truck,
  DollarSign,
  FileText,
  Lock,
  X,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Server,
  Cpu,
  Download,
  AlertCircle,
  Eye,
  Settings,
  BarChart3,
  CreditCard,
  Paperclip,
  Check,
  Boxes,
  FileCheck,
  Calendar,
  Flame,
} from "lucide-react";
import { performClientLogout } from "@/lib/clientLogout";
import UserProfileModal from "./components/UserProfileModal";
import PlansTab from "./components/PlansTab";
import SubscriptionEditModal from "./components/SubscriptionEditModal";
import SuperClearDatabaseModal from "./components/SuperClearDatabaseModal";
import CrownZeroState from "@/components/ui/CrownZeroState";

const USER_ROLES_FILTER = [
  { id: "ALL", label: "All Users" },
  { id: "OWNER", label: "Business Owners" },
  { id: "EMPLOYEE", label: "Staff & Employees" },
  { id: "CA", label: "Chartered Accountants" },
];

const DEPARTMENTS = [
  { id: "ALL", label: "All Depts" },
  { id: "OPERATIONS", label: "Operations" },
  { id: "SALES", label: "Sales" },
  { id: "LOGISTICS", label: "Logistics" },
  { id: "FINANCIAL", label: "Financial" },
];

const PLAN_TIERS = [
  "Free Trial",
  "MSME Starter",
  "Manufacturing & Growth",
  "Enterprise Multi-Unit",
];

export default function SuperAdminDashboard() {
  const router = useRouter();
  // Navigation
  const [activeTab, setActiveTab] = useState("command"); // command | users | organizations | departments | system

  // Metrics State
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Users State
  const [users, setUsers] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState("ALL");
  const [userDeptFilter, setUserDeptFilter] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");

  // Organizations State
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    userType: "OWNER",
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    // Owner
    companyName: "",
    planName: "Manufacturing & Growth",
    // Employee
    companyId: "",
    department: "OPERATIONS",
    postLevel: "MANAGER",
    postTitle: "Operations / Plant Manager",
    branchName: "Main HQ",
    // CA
    firmName: "",
    icaiNumber: "",
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Edit / Reset Password Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    department: "",
    postLevel: "",
    postTitle: "",
    planName: "",
    newPassword: "",
  });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Delete User Modal
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Plan Details Modal for Owners
  const [selectedOwnerPlanUser, setSelectedOwnerPlanUser] = useState(null);
  const [quickPlanTier, setQuickPlanTier] = useState("");
  const [isUpdatingOwnerPlan, setIsUpdatingOwnerPlan] = useState(false);

  // Generated Data Audit Modal
  const [auditUser, setAuditUser] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [loadingAuditData, setLoadingAuditData] = useState(false);
  const [auditSubTab, setAuditSubTab] = useState("overview");

  // Feedback Notification Banner
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // System Controls
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // User Profile Deep Dive Modal
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfileData, setLoadingProfileData] = useState(false);

  // Subscriptions & Plans State
  const [subscriptionsData, setSubscriptionsData] = useState(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [editingSubscriptionOwner, setEditingSubscriptionOwner] = useState(null);
  const [isSavingSubscription, setIsSavingSubscription] = useState(false);

  // Super Clear Database Modal State
  const [showClearDbModal, setShowClearDbModal] = useState(false);

  // 1. Fetch Metrics
  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/metrics");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to load admin metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // 2. Fetch Users
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userTypeFilter !== "ALL") params.append("type", userTypeFilter);
      if (userDeptFilter !== "ALL") params.append("department", userDeptFilter);
      if (userSearch.trim()) params.append("search", userSearch.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setCompaniesList(data.companies || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 2b. Fetch Subscriptions & Plans
  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubscriptionsData(data);
      }
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  // Open Full User Profile Modal
  const handleOpenProfile = async (targetUser) => {
    setSelectedProfileUser(targetUser);
    setProfileData(null);
    setLoadingProfileData(true);
    try {
      const res = await fetch(`/api/admin/users/${targetUser._id}?type=${targetUser.userType || "OWNER"}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user profile details:", err);
    } finally {
      setLoadingProfileData(false);
    }
  };

  // Handle Save Subscription Upgrade
  const handleSaveSubscription = async (formData) => {
    setIsSavingSubscription(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${formData.ownerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update subscription");

      setFeedbackMsg(data.message || "Subscription updated successfully!");
      setEditingSubscriptionOwner(null);
      fetchSubscriptions();
      fetchUsers();
      fetchMetrics();
      fetchOrganizations();
      setTimeout(() => setFeedbackMsg(""), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingSubscription(false);
    }
  };

  // 3. Fetch Organizations
  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/admin/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setLoadingOrgs(false);
          setLoadingSubscriptions(false);
    }
  };

  // Combined Load & Filter Effect
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [mRes, uRes, oRes, sRes] = await Promise.all([
          fetch("/api/admin/metrics"),
          fetch(`/api/admin/users?type=${userTypeFilter}&department=${userDeptFilter}`),
          fetch("/api/admin/organizations"),
          fetch("/api/admin/subscriptions"),
        ]);
        if (ignore) return;
        if (mRes.status === 401 || mRes.status === 403) {
          router.push("/login");
          return;
        }
        if (mRes.ok) setMetrics(await mRes.json());
        if (uRes.ok) {
          const u = await uRes.json();
          setUsers(u.users || []);
          setCompaniesList(u.companies || []);
        }
        if (oRes.ok) {
          const o = await oRes.json();
          setOrganizations(o.organizations || []);
        }
        if (sRes.ok) {
          setSubscriptionsData(await sRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) {
          setLoadingMetrics(false);
          setLoadingUsers(false);
          setLoadingOrgs(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [userTypeFilter, userDeptFilter, router]);

  // Open Data Generated Audit Modal
  const handleOpenAudit = async (targetUser) => {
    setAuditUser(targetUser);
    setAuditData(null);
    setAuditSubTab("overview");
    setLoadingAuditData(true);
    try {
      const res = await fetch(`/api/admin/users/${targetUser._id}/data`);
      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
      } else {
        const err = await res.json();
        setFeedbackMsg(err.error || "Failed to load generated data audit");
        setTimeout(() => setFeedbackMsg(""), 5000);
      }
    } catch (e) {
      console.error("Failed to load audit:", e);
      setFeedbackMsg("Network error loading user audit data");
      setTimeout(() => setFeedbackMsg(""), 5000);
    } finally {
      setLoadingAuditData(false);
    }
  };

  // Export Audit JSON
  const handleExportAuditJson = () => {
    if (!auditData) return;
    const jsonStr = JSON.stringify(auditData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `user-data-audit-${(auditUser?.name || "user").replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick Plan Change for Owner from Plan Modal
  const handleQuickPlanChange = async (ownerId, newPlan) => {
    setIsUpdatingOwnerPlan(true);
    try {
      const res = await fetch(`/api/admin/users/${ownerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType: "OWNER",
          planName: newPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update plan");
      setFeedbackMsg(`Plan tier updated to ${newPlan}!`);
      setTimeout(() => setFeedbackMsg(""), 5000);
      fetchUsers();
      fetchOrganizations();
      setSelectedOwnerPlanUser((prev) =>
        prev
          ? {
              ...prev,
              planName: newPlan,
              planDetails: {
                ...prev.planDetails,
                planName: newPlan,
              },
            }
          : null
      );
    } catch (err) {
      console.error(err);
      setFeedbackMsg(err.message || "Plan update failed");
      setTimeout(() => setFeedbackMsg(""), 5000);
    } finally {
      setIsUpdatingOwnerPlan(false);
    }
  };

  // Handle Create User
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setFeedbackMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setShowCreateModal(false);
      setFeedbackMsg(data.message || "User created successfully!");
      fetchUsers();
      fetchMetrics();
      fetchOrganizations();
      setTimeout(() => setFeedbackMsg(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to create user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      department: user.department || "OPERATIONS",
      postLevel: user.postLevel || "ASSISTANT",
      postTitle: user.postTitle || "",
      planName: user.planName || "Manufacturing & Growth",
      newPassword: "",
    });
  };

  // Handle Edit User Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    setFeedbackMsg("");
    try {
      const res = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType: editingUser.userType,
          ...editForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      setEditingUser(null);
      setFeedbackMsg(data.message || "User updated successfully!");
      fetchUsers();
      fetchOrganizations();
      setTimeout(() => setFeedbackMsg(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to update user");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Handle Delete User Submit
  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    setIsDeletingUser(true);
    setFeedbackMsg("");
    try {
      const res = await fetch(
        `/api/admin/users/${deletingUser._id}?type=${deletingUser.userType}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setDeletingUser(null);
      setFeedbackMsg(data.message || "User permanently deleted.");
      fetchUsers();
      fetchMetrics();
      fetchOrganizations();
      setTimeout(() => setFeedbackMsg(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to delete user");
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Export Users as JSON
  const handleExportUsers = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `Platform_Users_Registry_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Top SuperAdmin Executive Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Shyam Sangani</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
                  SuperAdmin
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              shyamsangani23@gmail.com • +91 9723386344
            </p>
          </div>
        </div>

        {/* System Health Indicators & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">
              {metrics?.system?.dbStatus === "Connected"
                ? "MongoDB Connected"
                : "System Live"}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-purple-400">
              {metrics?.system?.memoryUsageMb || 45}MB
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchMetrics();
              fetchUsers();
              fetchOrganizations();
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Refresh System Data"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingMetrics ? "animate-pulse" : ""}`}
            />
          </button>

          {/* Super Clear Entire Database Button */}
          <button
            type="button"
            onClick={() => setShowClearDbModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-rose-950/20"
            title="Super Clear Entire Database (Factory Reset)"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Super Clear DB</span>
          </button>

          <button
            type="button"
            onClick={performClientLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Real-time Feedback Banner */}
        {feedbackMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg("")}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SuperAdmin Primary Navigation Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
          {[
            { id: "command", label: "Executive Command Center", icon: Crown },
            {
              id: "users",
              label: "Universal User Management",
              icon: Users,
              count: users.length,
            },
            {
              id: "plans",
              label: "Plans & Subscriptions",
              icon: Zap,
              count: subscriptionsData?.subscribers?.length || 0,
            },
            {
              id: "organizations",
              label: "Organizations Directory",
              icon: Building2,
              count: organizations.length,
            },
            {
              id: "departments",
              label: "Department Telemetry",
              icon: Layers,
            },
            {
              id: "system",
              label: "System Controls & DB Inspector",
              icon: Database,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            TAB 1: COMMAND CENTER (Metrics, Live Telemetry & Audit Stream)
           ========================================================================= */}
        {activeTab === "command" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Total Businesses
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">
                  {metrics?.stats?.totalOwners || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Registered companies & owners
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Active Staff Roster
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">
                  {metrics?.stats?.totalEmployees || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enrolled department employees
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Live On Duty Staff
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {metrics?.stats?.liveOnDutyStaff || 0}
                  </p>
                  {(metrics?.stats?.liveOnDutyStaff || 0) > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active Shifts
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Currently punched in right now
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Audited Work Vault
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">
                  {metrics?.stats?.totalSubmissions || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {metrics?.stats?.submissionsWithFiles || 0} with attached proof files
                </p>
              </div>
            </div>

            {/* Department Breakdown & Quick Launcher */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department Distribution */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Departmental Staff Distribution
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Platform headcount across the 4 key operational branches
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    {metrics?.stats?.totalEmployees || 0} Total Staff
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      dept: "OPERATIONS",
                      label: "Operations",
                      count: metrics?.stats?.departmentDistribution?.OPERATIONS || 0,
                      color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                    },
                    {
                      dept: "SALES",
                      label: "Sales",
                      count: metrics?.stats?.departmentDistribution?.SALES || 0,
                      color: "border-blue-500/40 bg-blue-500/10 text-blue-400",
                    },
                    {
                      dept: "LOGISTICS",
                      label: "Logistics",
                      count: metrics?.stats?.departmentDistribution?.LOGISTICS || 0,
                      color: "border-amber-500/40 bg-amber-500/10 text-amber-400",
                    },
                    {
                      dept: "FINANCIAL",
                      label: "Financial",
                      count: metrics?.stats?.departmentDistribution?.FINANCIAL || 0,
                      color: "border-purple-500/40 bg-purple-500/10 text-purple-400",
                    },
                  ].map((d) => (
                    <div
                      key={d.dept}
                      className={`p-4 rounded-2xl border ${d.color} flex flex-col justify-between`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {d.label}
                      </span>
                      <p className="text-2xl font-black text-white mt-3 font-mono">
                        {d.count}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Assigned active staff
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SuperAdmin Quick Action Launcher */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Quick Command Actions</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Execute high-privilege system operations
                  </p>

                  <div className="mt-4 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateForm({
                          userType: "OWNER",
                          name: "",
                          email: "",
                          phoneNumber: "",
                          password: "",
                          companyName: "",
                          planName: "Manufacturing & Growth",
                          companyId: "",
                          department: "OPERATIONS",
                          postLevel: "MANAGER",
                          postTitle: "",
                          branchName: "Main HQ",
                          firmName: "",
                          icaiNumber: "",
                        });
                        setShowCreateModal(true);
                      }}
                      className="w-full p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-between cursor-pointer shadow-lg shadow-purple-600/20"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Add New User (Any Role)</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("users")}
                      className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer border border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>Manage / Remove Users</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      type="button"
                      onClick={handleExportUsers}
                      className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer border border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>Export Users Registry (JSON)</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowClearDbModal(true)}
                      className="w-full p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer shadow-sm shadow-rose-950/40"
                    >
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-400" />
                        <span>Super Clear Entire Database</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800 text-[10px] text-slate-400 font-mono">
                  <span>Root Access: </span>
                  <span className="text-emerald-400 font-bold">Unrestricted</span>
                </div>
              </div>
            </div>

            {/* Platform Recent Activity Stream */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Owners */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span>Recent Registered Companies</span>
                </h4>
                <div className="divide-y divide-slate-800">
                  {(metrics?.recentActivity?.owners || []).map((o) => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{o.name}</p>
                        <p className="text-[11px] text-slate-400">{o.email} • {o.phone}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                        {o.plan}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Staff Activity */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Recent Enrolled Employees</span>
                </h4>
                <div className="divide-y divide-slate-800">
                  {(metrics?.recentActivity?.employees || []).map((e) => (
                    <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{e.name}</p>
                        <p className="text-[11px] text-slate-400">{e.post} • {e.phone}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono uppercase">
                        {e.department}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: UNIVERSAL USER MANAGEMENT (All User Types - Add, Edit, Delete)
           ========================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Header Toolbar */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>Universal User Directory</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View, edit credentials, change permissions, or permanently remove any user from MongoDB.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportUsers}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateForm({
                      userType: "OWNER",
                      name: "",
                      email: "",
                      phoneNumber: "",
                      password: "",
                      companyName: "",
                      planName: "Manufacturing & Growth",
                      companyId: companiesList[0]?.id || "",
                      department: "OPERATIONS",
                      postLevel: "MANAGER",
                      postTitle: "Operations / Plant Manager",
                      branchName: "Main HQ",
                      firmName: "",
                      icaiNumber: "",
                    });
                    setShowCreateModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create User</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, email, or role title..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchUsers();
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchUsers}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Search
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                {/* User Type Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
                    User Type:
                  </span>
                  {USER_ROLES_FILTER.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setUserTypeFilter(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        userTypeFilter === r.id
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Department Pills (when employees are shown) */}
                {(userTypeFilter === "ALL" || userTypeFilter === "EMPLOYEE") && (
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
                      Dept:
                    </span>
                    {DEPARTMENTS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setUserDeptFilter(d.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          userDeptFilter === d.id
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] font-black">
                      <th className="py-4 pl-6">User & Identity</th>
                      <th className="py-4 px-4">Role / Type</th>
                      <th className="py-4 px-4">Department & Post</th>
                      <th className="py-4 px-4">Plan & Subscription</th>
                      <th className="py-4 px-4">Contact Details</th>
                      <th className="py-4 px-4">Created Date</th>
                      <th className="py-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-500">
                          <Users className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                          <p className="font-bold text-sm text-slate-400">
                            No users found
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Try adjusting your search criteria or add a new user.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const typeColors = {
                          OWNER: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                          EMPLOYEE: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                          CA: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                        }[u.userType] || "bg-slate-800 text-slate-300 border-slate-700";

                        return (
                          <tr
                            key={u._id}
                            className="hover:bg-slate-800/40 transition-colors"
                          >
                            {/* User & Identity */}
                            <td className="py-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-white font-black text-sm flex items-center justify-center shrink-0">
                                  {u.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-black text-white truncate">
                                    {u.name}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Role / Type */}
                            <td className="py-4 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${typeColors}`}
                              >
                                {u.userType}
                              </span>
                            </td>

                            {/* Department & Post */}
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-200 truncate max-w-[180px]">
                                {u.postTitle || u.postLevel}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">
                                {u.department || u.companyName || "N/A"}
                              </span>
                            </td>

                            {/* Plan & Subscription */}
                            <td className="py-4 px-4">
                              {u.userType === "OWNER" ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                        u.planDetails?.badgeColor ||
                                        "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                      }`}
                                    >
                                      {u.planDetails?.planName || u.planName || "Free Trial"}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                                        u.planDetails?.status === "active"
                                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                          : u.planDetails?.status === "expired"
                                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                      }`}
                                    >
                                      {u.planDetails?.status || "active"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="capitalize">{u.planDetails?.cycle || "annual"} cycle</span>
                                    <span>•</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedOwnerPlanUser(u);
                                        setQuickPlanTier(u.planDetails?.planName || u.planName || "Manufacturing & Growth");
                                      }}
                                      className="text-purple-400 hover:text-purple-300 underline font-bold flex items-center gap-0.5 cursor-pointer"
                                      title="View complete plan details, branch allocations, and features"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Full Details</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-slate-800 text-slate-300 border-slate-700">
                                    {u.planDetails?.planName || (u.userType === "CA" ? "Auditor Partner" : "Corporate Seat")}
                                  </span>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    {u.userType === "CA" ? "Audit Bridge" : "Staff Account"}
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* Contact Details */}
                            <td className="py-4 px-4 font-mono text-slate-300">
                              {u.phoneNumber || "N/A"}
                            </td>

                            {/* Created Date */}
                            <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString()
                                : "N/A"}
                            </td>

                            {/* Actions */}
                            <td className="py-4 pr-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenProfile(u)}
                                  className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                                  title="View complete detailed profile"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Profile</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAudit(u)}
                                  className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                                  title="View all data generated by this user from day 1 till current used"
                                >
                                  <BarChart3 className="w-3.5 h-3.5" />
                                  <span>Data Audit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(u)}
                                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                                  title="Edit details or reset password"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingUser(u)}
                                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer"
                                  title="Permanently remove user from database"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: PLANS & SUBSCRIPTIONS (Dedicated Plans Governance & Metrics)
           ========================================================================= */}
        {activeTab === "plans" && (
          <PlansTab
            subscriptionsData={subscriptionsData}
            loading={loadingSubscriptions}
            onRefresh={fetchSubscriptions}
            onModifyPlan={(subscriber) => setEditingSubscriptionOwner(subscriber)}
            onViewProfile={(u) => handleOpenProfile(u)}
          />
        )}

        {/* =========================================================================
            TAB 3: ORGANIZATIONS & COMPANIES
           ========================================================================= */}
        {activeTab === "organizations" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <span>Client Organizations & Subscriptions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Corporate accounts, active branches, subscription tiers, and company lifecycle governance.
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {organizations.length} Organizations Enrolled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <div
                  key={org._id}
                  className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-purple-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {org.plan}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {org.branchCount} Branch{org.branchCount > 1 ? "es" : ""}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-white mb-1">
                      {org.name}
                    </h4>

                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800 text-xs space-y-1 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Owner:</span>
                        <span className="font-bold text-white">{org.ownerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-mono text-slate-300 truncate max-w-[160px]">
                          {org.ownerEmail}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-mono text-slate-300">
                          {org.ownerPhone}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                        <span className="text-slate-400">Team Size:</span>
                        <span className="font-black text-emerald-400">
                          {org.employeeCount} Staff Members
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Joined: {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearch(org.ownerName);
                        setActiveTab("users");
                      }}
                      className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage Users</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: DEPARTMENT TELEMETRY
           ========================================================================= */}
        {activeTab === "departments" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Multi-Tenant Department Telemetry</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregate real-time data across Operations, Sales, Logistics, and Financials platform-wide.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider block">
                  Operations & Plant
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  {metrics?.stats?.departmentDistribution?.OPERATIONS || 0} Operators
                </p>
                <p className="text-[11px] text-slate-400">
                  Shop-floor fabrication, assembly & QC gate
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-blue-950/20 border border-blue-500/30 text-blue-300 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider block">
                  Sales & CRM
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  {metrics?.stats?.departmentDistribution?.SALES || 0} Account Execs
                </p>
                <p className="text-[11px] text-slate-400">
                  Lead pipeline, quotes & sales orders
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 text-amber-300 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider block">
                  Logistics & Fleet
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  {metrics?.stats?.departmentDistribution?.LOGISTICS || 0} Dispatch Staff
                </p>
                <p className="text-[11px] text-slate-400">
                  Procurement POs, GRN stock & carrier delivery
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-purple-950/20 border border-purple-500/30 text-purple-300 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider block">
                  Financial & Treasury
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  {metrics?.stats?.departmentDistribution?.FINANCIAL || 0} Accountants
                </p>
                <p className="text-[11px] text-slate-400">
                  GST invoices, vendor bills & general ledger
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: SYSTEM CONTROLS & DB INSPECTOR
           ========================================================================= */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>MongoDB Collections & System Controls</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Deep telemetry into live MongoDB collections, server runtime, and platform configurations.
              </p>
            </div>

            {/* Collections Inspector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "owners", label: "Owners / Companies", count: metrics?.collections?.owners || 0 },
                { name: "employees", label: "Employees / Staff", count: metrics?.collections?.employees || 0 },
                { name: "organizations", label: "Organizations", count: metrics?.collections?.organizations || 0 },
                { name: "attendances", label: "Attendance Logs", count: metrics?.collections?.attendances || 0 },
                { name: "submissions", label: "Work Submissions", count: metrics?.collections?.submissions || 0 },
                { name: "taskassignments", label: "Task Directives", count: metrics?.collections?.taskAssignments || 0 },
                { name: "leaves", label: "Leave Requests", count: metrics?.collections?.leaves || 0 },
                { name: "cas", label: "CA Auditors", count: metrics?.collections?.cas || 0 },
              ].map((c) => (
                <div
                  key={c.name}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm"
                >
                  <span className="text-[10px] font-mono text-purple-400 uppercase">
                    db.{c.name}
                  </span>
                  <p className="text-2xl font-black text-white mt-1 font-mono">
                    {c.count.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {/* SuperAdmin Identity Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    SuperAdmin Master Credentials
                  </h4>
                  <p className="text-xs text-slate-400">
                    Dedicated identity configured for root access
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Name:</span>
                  <span className="text-white font-bold">Shyam Sangani</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Email:</span>
                  <span className="text-white font-bold">shyamsangani23@gmail.com</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Phone Number:</span>
                  <span className="text-white font-bold">9723386344</span>
                </div>
              </div>
            </div>

            {/* Danger Zone: Super Clear Database */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-red-950/30 to-slate-900 border border-rose-500/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-black">
                    <Flame className="w-6 h-6 text-rose-500 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">
                        Super Database Purge Engine (Factory Reset)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black uppercase tracking-wider">
                        Irreversible
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                      Permanently wipe all records across all collections in MongoDB to 0. Protected by root authorization key.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClearDbModal(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Flame className="w-4 h-4" />
                  <span>Super Clear Database to 0</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: CREATE USER (OWNER, EMPLOYEE, CA)
         ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Create New User Record
                  </h3>
                  <p className="text-xs text-slate-400">
                    Instantly provision an Owner, Employee, or CA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* User Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  User Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "OWNER", label: "Business Owner" },
                    { id: "EMPLOYEE", label: "Staff Employee" },
                    { id: "CA", label: "CA Auditor" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, userType: t.id })}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all ${
                        createForm.userType === t.id
                          ? "bg-purple-600 text-white border-purple-500 shadow-md"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Mehta"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={createForm.phoneNumber}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phoneNumber: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@company.com"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Set temporary or permanent password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Owner Specific Fields */}
              {createForm.userType === "OWNER" && (
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">
                      Organization / Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Manufacturing Industries"
                      value={createForm.companyName}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, companyName: e.target.value })
                      }
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">
                      Subscription Plan
                    </label>
                    <select
                      value={createForm.planName}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, planName: e.target.value })
                      }
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                    >
                      {PLAN_TIERS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Employee Specific Fields */}
              {createForm.userType === "EMPLOYEE" && (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-indigo-300 mb-1">
                      Assign to Company / Owner *
                    </label>
                    <select
                      required
                      value={createForm.companyId}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, companyId: e.target.value })
                      }
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                    >
                      <option value="">Select Employer Business...</option>
                      {companiesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-indigo-300 mb-1">
                        Department
                      </label>
                      <select
                        value={createForm.department}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, department: e.target.value })
                        }
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                      >
                        <option value="OPERATIONS">Operations</option>
                        <option value="SALES">Sales</option>
                        <option value="LOGISTICS">Logistics</option>
                        <option value="FINANCIAL">Financial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-indigo-300 mb-1">
                        Hierarchy Level
                      </label>
                      <select
                        value={createForm.postLevel}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, postLevel: e.target.value })
                        }
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                      >
                        <option value="CHIEF_OFFICER">Chief Officer</option>
                        <option value="DIRECTOR">Director</option>
                        <option value="MANAGER">Manager</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="ANALYST">Analyst</option>
                        <option value="COORDINATOR">Coordinator</option>
                        <option value="ASSISTANT">Assistant</option>
                        <option value="OTHER">Other / Staff</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-300 mb-1">
                      Official Role Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Production Supervisor"
                      value={createForm.postTitle}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, postTitle: e.target.value })
                      }
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* CA Specific Fields */}
              {createForm.userType === "CA" && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      CA Firm Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sharma & Associates Chartered Accountants"
                      value={createForm.firmName}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, firmName: e.target.value })
                      }
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      ICAI Membership / Reg Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ICAI-409182"
                      value={createForm.icaiNumber}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, icaiNumber: e.target.value })
                      }
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingUser ? "Creating User..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT USER & RESET PASSWORD
         ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  Edit User Details
                </h3>
                <p className="text-xs text-slate-400">
                  Update profile or reset password for {editingUser.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phoneNumber: e.target.value })
                    }
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Reset Field */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Reset User Password (Optional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (leave blank to keep unchanged)"
                  value={editForm.newPassword}
                  onChange={(e) =>
                    setEditForm({ ...editForm, newPassword: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-850 border border-amber-500/30 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Employee updates */}
              {editingUser.userType === "EMPLOYEE" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={editForm.department}
                      onChange={(e) =>
                        setEditForm({ ...editForm, department: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                    >
                      <option value="OPERATIONS">Operations</option>
                      <option value="SALES">Sales</option>
                      <option value="LOGISTICS">Logistics</option>
                      <option value="FINANCIAL">Financial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Post Title
                    </label>
                    <input
                      type="text"
                      value={editForm.postTitle}
                      onChange={(e) =>
                        setEditForm({ ...editForm, postTitle: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Owner updates */}
              {editingUser.userType === "OWNER" && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Subscription Plan Tier
                  </label>
                  <select
                    value={editForm.planName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, planName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    {PLAN_TIERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingUser ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: OWNER PLAN DETAILS INTELLIGENCE MODAL
         ========================================================================= */}
{selectedOwnerPlanUser && (
  <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
    <div className="bg-slate-900 rounded-3xl max-w-2xl w-full border border-purple-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100 flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                Owner Subscription & Plan Intelligence
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {selectedOwnerPlanUser.planDetails?.status || "active"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {selectedOwnerPlanUser.name} • {selectedOwnerPlanUser.companyName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelectedOwnerPlanUser(null)}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
        {/* Plan Header Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/40 via-slate-800/60 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
              Current Active Tier
            </span>
            <h4 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
              <span>{selectedOwnerPlanUser.planDetails?.planName || selectedOwnerPlanUser.planName || "Free Trial"}</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-white/10 text-slate-300 capitalize">
                {selectedOwnerPlanUser.planDetails?.cycle || "annual"} cycle
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Payment Status:{" "}
              <strong className="text-emerald-400 capitalize">
                {selectedOwnerPlanUser.planDetails?.paymentStatus || "paid"}
              </strong>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Branch Allocation
            </span>
            <p className="text-sm font-black text-white font-mono mt-0.5">
              {selectedOwnerPlanUser.planDetails?.branchesConfigured || 1} / {selectedOwnerPlanUser.planDetails?.branchesAllowed || "1 Unit"}
            </p>
            <span className="text-[10px] text-purple-400">
              Active Multi-Branch Scale
            </span>
          </div>
        </div>

        {/* Subscription Dates & Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[10px] font-bold uppercase text-slate-400">Start Date</span>
            <p className="text-xs font-black text-white mt-1 font-mono">
              {selectedOwnerPlanUser.planDetails?.startDate
                ? new Date(selectedOwnerPlanUser.planDetails.startDate).toLocaleDateString()
                : "Day 1"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[10px] font-bold uppercase text-slate-400">Valid Until</span>
            <p className="text-xs font-black text-purple-300 mt-1 font-mono">
              {selectedOwnerPlanUser.planDetails?.endDate
                ? new Date(selectedOwnerPlanUser.planDetails.endDate).toLocaleDateString()
                : "Active Subscription"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[10px] font-bold uppercase text-slate-400">Trial Used</span>
            <p className="text-xs font-black text-white mt-1">
              {selectedOwnerPlanUser.planDetails?.hasUsedTrial ? "Yes" : "No"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-[10px] font-bold uppercase text-slate-400">Account Type</span>
            <p className="text-xs font-black text-emerald-400 mt-1">Production SaaS</p>
          </div>
        </div>

        {/* Business Legal & Banking Context */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
          <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Organization & Financial Ledger</span>
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 block">GST Number</span>
              <span className="font-mono font-bold text-white">{selectedOwnerPlanUser.planDetails?.gstNumber || "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Industry</span>
              <span className="font-bold text-white">{selectedOwnerPlanUser.planDetails?.industry || "Manufacturing"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Location</span>
              <span className="font-bold text-white truncate block">{selectedOwnerPlanUser.planDetails?.location || "Headquarters"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Bank Name</span>
              <span className="font-bold text-white">{selectedOwnerPlanUser.planDetails?.bankName || "State Bank of India"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">IFSC Code</span>
              <span className="font-mono font-bold text-white">{selectedOwnerPlanUser.planDetails?.ifsc || "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Bank Account No.</span>
              <span className="font-mono font-bold text-white">{selectedOwnerPlanUser.planDetails?.accNo || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Feature Entitlements */}
        <div className="space-y-3">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Plan Entitlements & Included Capabilities</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(selectedOwnerPlanUser.planDetails?.features || []).map((feat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-200"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SuperAdmin Quick Upgrade Action */}
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h6 className="text-xs font-black text-purple-200 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Modify / Upgrade Owner Plan Tier</span>
            </h6>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Change subscription tier directly as SuperAdmin
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={quickPlanTier || selectedOwnerPlanUser.planDetails?.planName || "Manufacturing & Growth"}
              onChange={(e) => setQuickPlanTier(e.target.value)}
              className="p-2 rounded-xl bg-slate-900 border border-purple-500/40 text-xs text-white focus:outline-none"
            >
              {PLAN_TIERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isUpdatingOwnerPlan}
              onClick={() =>
                handleQuickPlanChange(
                  selectedOwnerPlanUser._id,
                  quickPlanTier || selectedOwnerPlanUser.planDetails?.planName
                )
              }
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingOwnerPlan ? "Updating..." : "Apply Plan"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end shrink-0">
        <button
          type="button"
          onClick={() => setSelectedOwnerPlanUser(null)}
          className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {/* =========================================================================
          MODAL 5: USER GENERATED DATA & ACTIVITY AUDIT MODAL
         ========================================================================= */}
{auditUser && (
  <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-150">
    <div className="bg-slate-900 rounded-3xl max-w-5xl w-full border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100 flex flex-col max-h-[92vh]">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                User Lifecycle & Generated Data Audit
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {auditUser.userType}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              <strong className="text-slate-200">{auditUser.name}</strong> • {auditUser.email} • {auditUser.phoneNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {auditData && (
            <button
              type="button"
              onClick={handleExportAuditJson}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Download entire generated data records as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAuditUser(null)}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loadingAuditData ? (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-800/60 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
          <div className="h-44 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-800" />
        </div>
      ) : !auditData ? (
        <div className="p-6">
          <CrownZeroState
            compact
            variant="search"
            title="No Generated Data Found"
            description="Unable to compile activity logs for this user."
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Lifetime Stats Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40 shrink-0 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  Member Since:{" "}
                  <strong className="text-white">
                    {new Date(auditData.user?.startDate || auditUser.createdAt).toLocaleDateString()}
                  </strong>
                </span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {auditData.summary?.totalDaysActive || 1} Days on Platform
              </span>
            </div>

            {/* Metric KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {auditUser.userType === "OWNER" ? (
                <>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Employees</span>
                    <p className="text-xl font-black text-white font-mono mt-0.5">
                      {auditData.summary?.totalEmployeesHired || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Submissions</span>
                    <p className="text-xl font-black text-white font-mono mt-0.5">
                      {auditData.summary?.totalSubmissionsGenerated || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Files Delivered</span>
                    <p className="text-xl font-black text-purple-400 font-mono mt-0.5">
                      {auditData.summary?.totalFilesUploaded || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Logged Hours</span>
                    <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                      {auditData.summary?.totalHoursLogged || 0} hrs
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Branches</span>
                    <p className="text-xl font-black text-white font-mono mt-0.5">
                      {auditData.summary?.totalBranchesConfigured || 1}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasks Workflow</span>
                    <p className="text-xl font-black text-blue-400 font-mono mt-0.5">
                      {auditData.summary?.totalTasksOrchestrated || 0}
                    </p>
                  </div>
                </>
              ) : auditUser.userType === "EMPLOYEE" ? (
                <>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Submissions</span>
                    <p className="text-xl font-black text-white font-mono mt-0.5">
                      {auditData.summary?.totalSubmissionsGenerated || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Files Uploaded</span>
                    <p className="text-xl font-black text-purple-400 font-mono mt-0.5">
                      {auditData.summary?.totalFilesUploaded || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Duty Hours</span>
                    <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                      {auditData.summary?.totalHoursLogged || 0} hrs
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Punch Shifts</span>
                    <p className="text-xl font-black text-white font-mono mt-0.5">
                      {auditData.summary?.totalShiftSessions || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Leaves Applied</span>
                    <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
                      {auditData.summary?.totalLeavesApplied || 0} ({auditData.summary?.totalLeavesDays || 0}d)
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasks Assigned</span>
                    <p className="text-xl font-black text-blue-400 font-mono mt-0.5">
                      {auditData.summary?.tasksAssignedToMeCount || 0}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 col-span-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Linked Client Businesses</span>
                    <p className="text-2xl font-black text-white font-mono mt-0.5">
                      {auditData.summary?.totalClientsLinked || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 col-span-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Vault Sync Bridges</span>
                    <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                      {auditData.summary?.activeVaultSyncs || 0}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
              {[
                { id: "overview", label: "Audit Overview" },
                { id: "submissions", label: `Submissions (${auditData.submissions?.length || 0})` },
                { id: "attendance", label: `Attendance Punches (${auditData.attendances?.length || 0})` },
                { id: "leaves", label: `Leave Records (${auditData.leaves?.length || 0})` },
                { id: "tasks", label: `Tasks & Workflow (${(auditData.tasks || auditData.tasksAssignedToMe)?.length || 0})` },
                ...(auditUser.userType === "OWNER"
                  ? [{ id: "assets", label: "Inventory & CRM" }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAuditSubTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    auditSubTab === tab.id
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Tab Content Body */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* SUBTAB: OVERVIEW */}
            {auditSubTab === "overview" && (
              <div className="space-y-4">
                {auditUser.userType === "OWNER" && (
                  <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span>Company Staff & Department Footprint</span>
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(auditData.summary?.deptDistribution || {}).map(([dept, count]) => (
                        <div key={dept} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400">{dept}</span>
                          <p className="text-lg font-black text-white font-mono mt-0.5">{count} staff</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2 text-xs">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Lifecycle Summary & Data Generation Index</span>
                  </h5>
                  <p className="text-slate-300 leading-relaxed">
                    This user registered on <strong className="text-white">{new Date(auditData.user?.startDate).toLocaleDateString()}</strong> and has been active for <strong className="text-white">{auditData.summary?.totalDaysActive} days</strong>.
                    Over this timeframe, a total of <strong className="text-white">{auditData.summary?.totalSubmissionsGenerated || 0} daily submission records</strong> and <strong className="text-purple-300">{auditData.summary?.totalFilesUploaded || 0} deliverable files</strong> were created.
                  </p>
                </div>
              </div>
            )}

            {/* SUBTAB: SUBMISSIONS */}
            {auditSubTab === "submissions" && (
              <div className="space-y-3">
                {(!auditData.submissions || auditData.submissions.length === 0) ? (
                  <div className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-400">No submissions found</p>
                    <p className="text-xs text-slate-500">User has not created any daily work reports yet.</p>
                  </div>
                ) : (
                  auditData.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-black text-white text-sm">{sub.title}</h5>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                              {sub.department || "Operations"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            By {sub.employeeName || auditUser.name} • Date: {sub.date} • Created: {new Date(sub.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 w-max">
                          {sub.status || "SUBMITTED"}
                        </span>
                      </div>

                      {sub.summary && (
                        <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          {sub.summary}
                        </p>
                      )}

                      {/* Attached files deliverables */}
                      {sub.files && sub.files.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <Paperclip className="w-3 h-3 text-purple-400" />
                            <span>Attached Files ({sub.files.length}):</span>
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {sub.files.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2"
                              >
                                <span className="font-medium truncate max-w-[200px]">{file.name || "Attachment"}</span>
                                {file.size ? (
                                  <span className="text-[10px] font-mono text-purple-400">
                                    ({Math.round(file.size / 1024)} KB)
                                  </span>
                                ) : null}
                                {file.dataUrl && (
                                  <a
                                    href={file.dataUrl}
                                    download={file.name || "deliverable"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                                    title="Download File"
                                  >
                                    <Download className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUBTAB: ATTENDANCE */}
            {auditSubTab === "attendance" && (
              <div className="space-y-3">
                {(!auditData.attendances || auditData.attendances.length === 0) ? (
                  <div className="py-12 text-center text-slate-500">
                    <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-400">No attendance records</p>
                    <p className="text-xs text-slate-500">No shift punches recorded in the system.</p>
                  </div>
                ) : (
                  auditData.attendances.map((att) => (
                    <div
                      key={att.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-white text-sm font-mono">{att.date}</span>
                        <span className="text-slate-400 text-[11px]">{att.branchName || "Main HQ"}</span>
                      </div>
                      <div className="divide-y divide-slate-800 pt-1">
                        {(att.sessions || []).map((sess, sIdx) => (
                          <div key={sIdx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                            <div>
                              <span className="font-bold text-slate-200">Session #{sess.index || sIdx + 1}</span>
                              <span className="text-slate-400 text-[11px] ml-2 font-mono">
                                In: {sess.punchIn ? new Date(sess.punchIn).toLocaleTimeString() : "--"} | Out: {sess.punchOut ? new Date(sess.punchOut).toLocaleTimeString() : "Live On Duty"}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold w-max">
                              {sess.durationMinutes ? `${Math.round((sess.durationMinutes / 60) * 10) / 10} hrs` : "In Progress"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUBTAB: LEAVES */}
            {auditSubTab === "leaves" && (
              <div className="space-y-3">
                {(!auditData.leaves || auditData.leaves.length === 0) ? (
                  <div className="py-12 text-center text-slate-500">
                    <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-400">No leave requests</p>
                    <p className="text-xs text-slate-500">No leave applications found for this user.</p>
                  </div>
                ) : (
                  auditData.leaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            {leave.leaveType || "CASUAL"}
                          </span>
                          <span className="font-bold text-white font-mono">
                            {leave.startDate} to {leave.endDate} ({leave.totalDays} days)
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">
                          Reason: <strong className="text-white font-normal">{leave.reason}</strong>
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold w-max ${
                          leave.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : leave.status === "REJECTED"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {leave.status || "PENDING"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUBTAB: TASKS */}
            {auditSubTab === "tasks" && (
              <div className="space-y-3">
                {((auditData.tasks || auditData.tasksAssignedToMe || []).length === 0) ? (
                  <div className="py-12 text-center text-slate-500">
                    <Briefcase className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-400">No tasks orchestrated</p>
                    <p className="text-xs text-slate-500">No workflow assignments recorded.</p>
                  </div>
                ) : (
                  (auditData.tasks || auditData.tasksAssignedToMe || []).map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <h6 className="font-black text-white text-sm">{task.title}</h6>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Assigned: {task.assignedByName || "Admin"} → {task.assignedToName || "Staff"} • Due: {task.dueDate || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono uppercase">
                          {task.priority || "MEDIUM"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {task.status || "PENDING"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUBTAB: ASSETS (Owner only) */}
            {auditSubTab === "assets" && auditUser.userType === "OWNER" && (
              <div className="space-y-4">
                {/* Branches */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                  <h6 className="text-xs font-black uppercase text-slate-300">
                    Active Multi-Branch Network ({auditData.organizationDetails?.branches?.length || 1})
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(auditData.organizationDetails?.branches || []).map((br, bIdx) => (
                      <div key={bIdx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{br.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-400">
                            {br.status || "active"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{br.location || "Branch Unit"}</p>
                        <p className="text-[10px] text-purple-400 font-mono">
                          {br.stockItemsCount} stock items • {br.customersCount} CRM customers
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Catalog */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                  <h6 className="text-xs font-black uppercase text-slate-300">
                    Stock Catalog Items ({auditData.organizationDetails?.stockCatalog?.length || 0})
                  </h6>
                  <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
                    {(auditData.organizationDetails?.stockCatalog || []).map((item, iIdx) => (
                      <div key={iIdx} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <span className="text-[10px] text-slate-400">{item.category}</span>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-purple-300">{item.quantity} {item.unit}</p>
                          <span className="text-[10px] text-slate-400">₹{item.unitPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end shrink-0">
        <button
          type="button"
          onClick={() => setAuditUser(null)}
          className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {/* =========================================================================
          MODAL: USER PROFILE IN DETAILS
         ========================================================================= */}
      {selectedProfileUser && (
        <UserProfileModal
          user={selectedProfileUser}
          profileData={profileData}
          loading={loadingProfileData}
          onClose={() => setSelectedProfileUser(null)}
          onEdit={(u) => {
            setSelectedProfileUser(null);
            handleOpenEdit(u);
          }}
          onDelete={(u) => {
            setSelectedProfileUser(null);
            setDeletingUser(u);
          }}
          onAudit={(u) => {
            setSelectedProfileUser(null);
            handleOpenAudit(u);
          }}
          onOpenPlanDetails={(u) => {
            setSelectedProfileUser(null);
            setEditingSubscriptionOwner({
              ownerId: u._id,
              ownerName: u.name,
              organizationName:
                u.companyName ||
                u.organization?.RegisterName ||
                u.organization?.name ||
                u.name + "'s Organization",
              planName:
                u.subscription?.planName ||
                u.planDetails?.planName ||
                u.planName ||
                "Manufacturing & Growth",
              cycle:
                u.subscription?.cycle ||
                u.planDetails?.cycle ||
                "annual",
              status:
                u.subscription?.status ||
                u.planDetails?.status ||
                "active",
              paymentStatus:
                u.subscription?.paymentStatus ||
                u.planDetails?.paymentStatus ||
                "paid",
              endDate:
                u.subscription?.endDate ||
                u.planDetails?.endDate ||
                null,
            });
          }}
        />
      )}

      {/* =========================================================================
          MODAL: UPGRADE & MODIFY SUBSCRIPTION
         ========================================================================= */}
      {editingSubscriptionOwner && (
        <SubscriptionEditModal
          key={editingSubscriptionOwner.ownerId}
          subscriber={editingSubscriptionOwner}
          onClose={() => setEditingSubscriptionOwner(null)}
          onSave={handleSaveSubscription}
          isSaving={isSavingSubscription}
        />
      )}

      {/* =========================================================================
          MODAL 3: PERMANENT USER DELETION
         ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full border border-rose-500/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="p-5 border-b border-rose-500/20 bg-rose-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-300">
                    Permanently Delete User
                  </h3>
                  <p className="text-xs text-rose-400/80">
                    MongoDB Database Purge
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-black text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Permanent Root Action</span>
                </div>
                <p className="leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-white">{deletingUser.name}</strong> (
                  {deletingUser.userType})?
                </p>
                <p className="text-[11px] text-rose-400/80">
                  This action will delete the document from the MongoDB database immediately. All associated data will be removed. This cannot be undone.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1">
                <p className="font-bold text-white">{deletingUser.name}</p>
                <p className="text-slate-400 text-[11px]">
                  {deletingUser.email} • {deletingUser.phoneNumber}
                </p>
                <p className="text-purple-400 text-[10px] uppercase font-mono">
                  {deletingUser.userType} • {deletingUser.department || deletingUser.postTitle || "User"}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={handleDeleteSubmit}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingUser ? "Deleting..." : "Permanently Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: SUPER CLEAR DATABASE (FACTORY RESET)
         ========================================================================= */}
      <SuperClearDatabaseModal
        isOpen={showClearDbModal}
        onClose={() => setShowClearDbModal(false)}
        onSuccess={(result) => {
          setFeedbackMsg(
            `Database Cleared! Purged ${result.totalDeletedCount || 0} records across ${result.collectionsWipedCount || 0} collections to 0.`
          );
          fetchMetrics();
          fetchUsers();
          fetchOrganizations();
        }}
      />
    </div>
  );
}
