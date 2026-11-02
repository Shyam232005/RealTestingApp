"use client";
import React from "react";
import { SalesFlowProvider } from "@/context/SalesFlowContext";
import LeadPoolTabs from "./LeadPoolTabs";

/**
 * LeadPoolPage - Parent Layout Component for Lead Pool & Telecalling Hub
 * Deduplicated: Renders the dynamic module header with icons and notification counts directly,
 * sitting flush without redundant static wrappers or awkward spacing.
 */
export default function LeadPoolPage({
  ownerName = "Main HQ",
  className = "",
}) {
  return (
    <SalesFlowProvider>
      <div className={`w-full ${className}`}>
        <LeadPoolTabs ownerName={ownerName} />
      </div>
    </SalesFlowProvider>
  );
}
