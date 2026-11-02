"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { CaProvider, useCa } from "@/components/ca/CaContext";
import CaTopHeader from "@/components/ca/CaTopHeader";
import CaPageBanner from "@/components/ca/CaPageBanner";
import CaSidebar from "@/components/ca/CaSidebar";

function CaLayoutShell({ children }) {
  const pathname = usePathname();
  const { loading } = useCa();
  const isSetupRoute = pathname?.startsWith("/ca/setup");

  // Standalone Onboarding Page (Requirement 1)
  if (isSetupRoute) {
    return <>{children}</>;
  }

  // Ban on circular spinners: Pulsing gradient skeleton screen during initial DB profile load
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F5FA] flex flex-col font-sans">
        {/* Header Skeleton */}
        <div className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-40 h-4 bg-slate-200 rounded-md animate-pulse" />
              <div className="w-28 h-3 bg-slate-100 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-8 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="w-24 h-8 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Body Skeleton */}
        <div className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="w-56 h-8 bg-slate-200 rounded-xl animate-pulse" />
            <div className="w-28 h-8 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          <div className="flex gap-6 items-start">
            <div className="w-64 h-[550px] bg-white rounded-3xl border border-slate-200/80 p-4 space-y-3 shrink-0">
              <div className="w-full h-11 bg-slate-200 rounded-2xl animate-pulse" />
              <div className="w-full h-10 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="w-full h-10 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="w-full h-10 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-36 bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-2xl animate-pulse" />
                    <div className="w-20 h-7 bg-slate-200 rounded-md animate-pulse" />
                    <div className="w-28 h-3 bg-slate-100 rounded-md animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Requirement 2: Dynamic Main Application Layout matching reference screenshot DNA
  return (
    <div className="min-h-screen bg-[#F0F5FA] flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <CaTopHeader />
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <CaPageBanner />
        <div className="flex flex-1 gap-6 items-start">
          <CaSidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function CaPortalLayout({ children }) {
  return (
    <CaProvider>
      <CaLayoutShell>{children}</CaLayoutShell>
    </CaProvider>
  );
}
