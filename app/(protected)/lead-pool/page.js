"use client";
import React, { Suspense } from "react";
import { LeadPoolPage } from "@/components/sales";
import { PageHeaderSkeleton, MetricsCardsSkeleton } from "@/components/ui/CrownSkeletonLoader";

function LeadPoolLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeaderSkeleton title="Loading Lead Pool & Telecalling Hub..." />
        <MetricsCardsSkeleton count={4} />
      </div>
    </div>
  );
}

export default function LeadPoolRoutePage() {
  return (
    <Suspense fallback={<LeadPoolLoadingFallback />}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <LeadPoolPage />
        </div>
      </div>
    </Suspense>
  );
}
