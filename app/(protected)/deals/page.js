"use client";
import React, { Suspense } from "react";
import { DealsPage as DealsLayout } from "@/components/sales";
import { PageHeaderSkeleton, MetricsCardsSkeleton } from "@/components/ui/CrownSkeletonLoader";

function DealsLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeaderSkeleton title="Loading Deals & Quotations Workspace..." />
        <MetricsCardsSkeleton count={4} />
      </div>
    </div>
  );
}

export default function DealsRoutePage() {
  return (
    <Suspense fallback={<DealsLoadingFallback />}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <DealsLayout />
        </div>
      </div>
    </Suspense>
  );
}
