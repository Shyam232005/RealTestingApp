"use client";
import React from "react";
import { SalesFlowProvider } from "@/context/SalesFlowContext";
import DealTabs from "./DealTabs";

/**
 * DealsPage - Parent Layout Component for Deals & Quotations
 * Deduplicated: Renders the dynamic module header with icons and notification counts directly,
 * sitting flush without redundant static wrappers or awkward spacing.
 */
export default function DealsPage({
  ownerName = "Main HQ",
  className = "",
}) {
  return (
    <SalesFlowProvider>
      <div className={`w-full ${className}`}>
        <DealTabs ownerName={ownerName} />
      </div>
    </SalesFlowProvider>
  );
}
