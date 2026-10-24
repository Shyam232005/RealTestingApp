"use client";
import React from "react";
import OwnerTeamAndCaCard from "./OwnerTeamAndCaCard";
import OwnerApprovalsCard from "./OwnerApprovalsCard";
import OwnerPlanCard from "./OwnerPlanCard";

export default function OwnerSidebar({
  owner,
  organization,
  selectedBranch,
  setActiveTab,
  pendingApprovals = [],
}) {
  return (
    <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
      {/* 1. Team & CA Partners Card (Replaces User Profile Card) */}
      <OwnerTeamAndCaCard
        owner={owner}
        organization={organization}
        setActiveTab={setActiveTab}
      />

      {/* 2. Current Raised Approvals Card (Replaces Accounts Card) */}
      <OwnerApprovalsCard
        organization={organization}
        selectedBranch={selectedBranch}
        setActiveTab={setActiveTab}
        pendingApprovals={pendingApprovals}
      />

      {/* 3. Subscription Plan Card */}
      <OwnerPlanCard
        owner={owner}
        organization={organization}
        setActiveTab={setActiveTab}
      />
    </aside>
  );
}
