"use client";
import React, { Suspense } from "react";
import { CounterDeskPage as CounterDeskLayout } from "@/components/sales";
import { PageHeaderSkeleton, MetricsCardsSkeleton } from "@/components/ui/CrownSkeletonLoader";

function SalesOrdersLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeaderSkeleton title="Loading Sales Orders & Counter Desk..." />
        <MetricsCardsSkeleton count={4} />
      </div>
    </div>
  );
}

export default function SalesOrdersRoutePage() {
  return (
    <Suspense fallback={<SalesOrdersLoadingFallback />}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <CounterDeskLayout />
        </div>
      </div>
    </Suspense>
  );
}
