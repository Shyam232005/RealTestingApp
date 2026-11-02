import React, { Suspense } from "react";
import CoordinatorWorkspace from "@/components/coordinator/CoordinatorWorkspace";

export const metadata = {
  title: "Sales Coordinator Workspace | Crown Ecosystems",
  description: "Tier 2 Sales Coordinator Workspace - Commercial approvals, lead delegation, and freight fulfillment tracker.",
};

export default function CoordinatorPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Loading Coordinator Workspace...</div>}>
        <CoordinatorWorkspace />
      </Suspense>
    </div>
  );
}
