"use client";
import React from "react";
import { useStaff } from "@/components/staff/StaffContext";
import StaffWorkspaceView from "@/components/staff/StaffWorkspaceView";
import {
  StaffAssignedClientsView,
  StaffLedgerAuditView,
  StaffDiscrepanciesView,
  StaffReconciliationView,
  StaffDraftReportsView,
} from "@/components/staff/StaffOtherViews";
import { motion, AnimatePresence } from "framer-motion";

export default function StaffPortalMainPage() {
  const { activeTab } = useStaff();

  const renderActiveView = () => {
    switch (activeTab) {
      case "my-workspace":
        return <StaffWorkspaceView key="my-workspace" />;
      case "assigned-clients":
        return <StaffAssignedClientsView key="assigned-clients" />;
      case "ledger-audit":
        return <StaffLedgerAuditView key="ledger-audit" />;
      case "discrepancies":
        return <StaffDiscrepanciesView key="discrepancies" />;
      case "reconciliation":
        return <StaffReconciliationView key="reconciliation" />;
      case "draft-reports":
        return <StaffDraftReportsView key="draft-reports" />;
      default:
        return <StaffWorkspaceView key="default-workspace" />;
    }
  };

  return (
    <div className="w-full pb-16">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderActiveView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
