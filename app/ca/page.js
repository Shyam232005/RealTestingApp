"use client";
import React from "react";
import { useCa } from "@/components/ca/CaContext";
import CaDashboardView from "@/components/ca/CaDashboardView";
import CaClientFirmsView from "@/components/ca/CaClientFirmsView";
import AuditSignOffsView from "@/components/ca/AuditSignOffsView";
import CaDataAccessTab from "@/components/ca/CaDataAccessTab";
import {
  CaTeamView,
  CaEscalationsView,
  CaReconciliationView,
  CaReportsView,
  CaSettingsView,
} from "@/components/ca/CaOtherViews";
import { motion, AnimatePresence } from "framer-motion";

export default function CaPortalMainPage() {
  const { activeTab } = useCa();

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
      case "my-workspace":
        return <CaDashboardView key="dashboard" />;
      case "data-requests":
      case "owner-approvals":
        return <CaDataAccessTab key="data-requests" />;
      case "clients":
      case "assigned-clients":
        return <CaClientFirmsView key="clients" />;
      case "audit-signoffs":
      case "ledger-audit":
        return <AuditSignOffsView key="audit" />;
      case "team":
        return <CaTeamView key="team" />;
      case "escalations":
      case "discrepancies":
        return <CaEscalationsView key="escalations" />;
      case "reconciliation":
        return <CaReconciliationView key="reconciliation" />;
      case "reports":
      case "draft-reports":
        return <CaReportsView key="reports" />;
      case "settings":
        return <CaSettingsView key="settings" />;
      default:
        return <CaDashboardView key="default-dashboard" />;
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
