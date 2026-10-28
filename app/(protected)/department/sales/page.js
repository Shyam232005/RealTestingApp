"use client";
import React, { Suspense } from "react";
import DepartmentWorkspace from "../components/DepartmentWorkspace";
import { Loader2 } from "lucide-react";

function WorkspaceLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
      <p className="text-sm font-semibold text-slate-600">Loading Sales Workspace...</p>
    </div>
  );
}

export default function SalesDepartmentPage() {
  return (
    <Suspense fallback={<WorkspaceLoadingFallback />}>
      <DepartmentWorkspace currentDepartment="SALES" />
    </Suspense>
  );
}
