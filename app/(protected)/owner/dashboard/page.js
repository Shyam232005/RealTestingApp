"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

// Sub-components
import OwnerHeader from "../components/OwnerHeader";
import OwnerSidebar from "../components/OwnerSidebar";
import BranchDashboardView from "../components/BranchDashboardView";
import { performClientLogout } from "@/lib/clientLogout";

// Tab Sub-modules
import {
  OverviewTab,
  ApprovalTab,
  TeamTab,
  BankingTab,
  CaHubTab,
  FinancialTab,
  PurchaseTab,
  SalesTab,
  TaxReportsTab,
  ProfileSettingsTab,
} from "../tabs";

export default function OwnerDashboard() {
  const router = useRouter();

  // App & Auth States
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState(null);
  const [organization, setOrganization] = useState(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState("dashboard");

  // Selected Branch (Default: "all" for consolidated data)
  const [selectedBranch, setSelectedBranch] = useState("all");

  // Pending Approvals (live sync with Approval Desk & Sidebar)
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // Notifications & Toast
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Profile Settings Form State
  const [settingsForm, setSettingsForm] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Load Owner & Organization Data
  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const res = await fetch("/api/owner/organization");

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const data = await res.json();

        // If organization setup is NOT complete, route to setup wizard
        if (!data.isSetupComplete || !data.organization) {
          router.push("/owner/setup");
          return;
        }

        setOwner(data.owner);
        setOrganization(data.organization);

        // Fetch live pending approvals for sidebar and desks
        try {
          const appRes = await fetch("/api/owner/approvals");
          if (appRes.ok) {
            const appData = await appRes.json();
            setPendingApprovals(appData.pending || []);
          }
        } catch (e) {}

        // Pre-fill profile settings form with organization data
        setSettingsForm({
          RegisterName: data.organization.RegisterName || "",
          GST: data.organization.GST || "",
          location: data.organization.location || "",
          industry: data.organization.industry || "",
          branches: data.organization.branches || 1,
          employeeCount:
            data.organization.employeeCount ||
            data.organization.branchList?.[0]?.staffCount ||
            0,
          BankName: data.organization.BankName || "",
          IFSC: data.organization.IFSC || "",
          AccNo: data.organization.AccNo || "",
          primaryWarehouse: data.organization.primaryWarehouse || "",
          activeDepartments: data.organization.activeDepartments || [],
          openingBalance: data.organization.openingBalance ?? 0,
          openingCash: data.organization.openingCash ?? 0,
          currentStockValue: data.organization.currentStockValue ?? 0,
          monthlyRevenueTarget: data.organization.monthlyRevenueTarget ?? 0,
          monthlyProductionTarget: data.organization.monthlyProductionTarget ?? 0,
          defaultCreditDays: data.organization.defaultCreditDays ?? 30,
          poApprovalLimit: data.organization.poApprovalLimit ?? 25000,
          maxDiscountPercent: data.organization.maxDiscountPercent ?? 10,
          minCashReserveAlert: data.organization.minCashReserveAlert ?? 100000,
          lowStockThresholdPercent: data.organization.lowStockThresholdPercent ?? 15,
          inventoryValuationMethod: data.organization.inventoryValuationMethod || "lot_wise",
          mcaAuditLog: data.organization.mcaAuditLog !== undefined ? data.organization.mcaAuditLog : true,
        });
      } catch (err) {
        console.error("Dashboard initialization error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkspace();

    const handleStaffUpdate = () => {
      fetchWorkspace();
    };
    window.addEventListener("owner-staff-updated", handleStaffUpdate);

    return () => {
      window.removeEventListener("owner-staff-updated", handleStaffUpdate);
    };
  }, [router]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleLogout = async () => {
    await performClientLogout();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);

    try {
      const res = await fetch("/api/owner/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update organization details.");
      }

      setOrganization(result.organization);
      showToast("Organization settings saved successfully!");
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch (err) {}
    } catch (err) {
      showToast(err.message || "Failed to save settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#FAF9FD] flex flex-col items-center justify-center text-slate-800">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
        <p className="text-sm font-bold tracking-wide text-slate-600">
          Loading Owner Crown Ecosystems Workspace...
        </p>
      </div>
    );
  }

  if (!organization) return null;

  // Tabs definitions in plain, friendly business language
  const TABS = [
    { id: "dashboard", label: "Overview" },
    { id: "approval", label: "Approvals" },
    { id: "team", label: "Staff & Team" },
    { id: "banking", label: "Bank & Cash" },
    { id: "ca-hub", label: "CA-Hub" },
    { id: "financial", label: "Books & Balances" },
    { id: "purchase", label: "Purchases" },
    { id: "sales", label: "Sales" },
    { id: "tax-reports", label: "GST & Tax" },
    { id: "settings", label: "Settings" },
  ];

  const totalCalculatedBalance =
    Number(organization.openingBalance || 0) +
    Number(organization.openingCash || 0);

  return (
    <div className="min-h-screen w-full bg-[#FAF9FD] text-slate-900 font-sans flex flex-col selection:bg-purple-200 selection:text-purple-900">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar with Dynamic Branch Dropdown */}
      <OwnerHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={TABS}
        owner={owner}
        organization={organization}
        setOrganization={setOrganization}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        notificationsOpen={notificationsOpen}
        setNotificationsOpen={setNotificationsOpen}
        onLogout={handleLogout}
      />

      {/* Main Full-Screen Layout */}
      <div className="w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Sidebar (Team & CA + Current Raised Approvals + Plan) */}
          <OwnerSidebar
            owner={owner}
            organization={organization}
            selectedBranch={selectedBranch}
            setActiveTab={setActiveTab}
            pendingApprovals={pendingApprovals}
          />

          {/* Right Content Column (Dynamic Tab Modules) */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-7">
            {activeTab === "dashboard" &&
              (selectedBranch === "all" ? (
                <OverviewTab
                  owner={owner}
                  organization={organization}
                  selectedBranch={selectedBranch}
                  setSelectedBranch={setSelectedBranch}
                  totalCalculatedBalance={totalCalculatedBalance}
                  setActiveTab={setActiveTab}
                />
              ) : (
                <BranchDashboardView
                  organization={organization}
                  selectedBranchId={selectedBranch}
                  onOrganizationUpdate={setOrganization}
                  showToast={showToast}
                />
              ))}

            {activeTab === "approval" && (
              <ApprovalTab
                organization={organization}
                selectedBranch={selectedBranch}
                setSelectedBranch={setSelectedBranch}
              />
            )}

            {activeTab === "team" && (
              <TeamTab
                organization={organization}
                selectedBranch={selectedBranch}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "banking" && (
              <BankingTab
                organization={organization}
                selectedBranch={selectedBranch}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "ca-hub" && (
              <CaHubTab
                owner={owner}
                organization={organization}
                showToast={showToast}
              />
            )}

            {activeTab === "financial" && (
              <FinancialTab
                organization={organization}
                selectedBranch={selectedBranch}
              />
            )}

            {activeTab === "purchase" && (
              <PurchaseTab
                organization={organization}
                selectedBranch={selectedBranch}
              />
            )}

            {activeTab === "sales" && (
              <SalesTab
                organization={organization}
                selectedBranch={selectedBranch}
              />
            )}

            {activeTab === "tax-reports" && (
              <TaxReportsTab
                organization={organization}
                selectedBranch={selectedBranch}
              />
            )}

            {activeTab === "settings" && (
              <ProfileSettingsTab
                settingsForm={settingsForm}
                setSettingsForm={setSettingsForm}
                handleSaveSettings={handleSaveSettings}
                isSavingSettings={isSavingSettings}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
