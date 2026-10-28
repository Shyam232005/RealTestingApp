"use client";
import React, { Suspense } from "react";
import DepartmentWorkspace from "../components/DepartmentWorkspace";
import { PageHeaderSkeleton, MetricsCardsSkeleton, TableSkeleton } from "@/components/ui/CrownSkeletonLoader";

function WorkspaceLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeaderSkeleton title="Loading Operations Workspace..." />
        <MetricsCardsSkeleton count={4} />
        <TableSkeleton rows={5} cols={5} />
      </div>
    </div>
  );
}

export default function OperationsDepartmentPage() {
  return (
    <Suspense fallback={<WorkspaceLoadingFallback />}>
      <DepartmentWorkspace currentDepartment="OPERATIONS" />
    </Suspense>
  );
}
