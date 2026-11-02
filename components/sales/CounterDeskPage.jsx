"use client";
import React from "react";
import { SalesFlowProvider } from "@/context/SalesFlowContext";
import CounterDeskTabs from "./CounterDeskTabs";

/**
 * CounterDeskPage - Parent Layout Component for Sales Orders & Counter Desk
 * Deduplicated: Renders the dynamic module header with icons and notification counts directly,
 * sitting flush without redundant static wrappers or awkward spacing.
 */
export default function CounterDeskPage({
  hqWarehouseName = "Main (HQ) Warehouse",
  className = "",
}) {
  return (
    <SalesFlowProvider>
      <div className={`w-full ${className}`}>
        <CounterDeskTabs hqWarehouseName={hqWarehouseName} />
      </div>
    </SalesFlowProvider>
  );
}
