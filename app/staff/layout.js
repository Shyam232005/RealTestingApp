"use client";
import React from "react";
import { StaffProvider, useStaff } from "@/components/staff/StaffContext";
import StaffTopHeader from "@/components/staff/StaffTopHeader";
import StaffSidebar from "@/components/staff/StaffSidebar";

function StaffLayoutShell({ children }) {
  const { loading } = useStaff();

  // Pulsing gradient skeleton screen during initial profile load (zero circular spinners)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F5FA] flex flex-col font-sans">
        {/* Header Skeleton */}
        <div className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="w-48 h-4 bg-slate-200 rounded-md animate-pulse" />
              <div className="w-32 h-3 bg-slate-100 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40 h-9 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="w-24 h-9 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Body Skeleton */}
        <div className="flex flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 gap-6">
          <div className="w-64 h-[600px] bg-white rounded-3xl border border-slate-200/80 p-4 space-y-3">
            <div className="w-full h-12 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="w-full h-10 bg-slate-200 rounded-2xl animate-pulse" />
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
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F5FA] flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <StaffTopHeader />
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <StaffSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function StaffPortalLayout({ children }) {
  return (
    <StaffProvider>
      <StaffLayoutShell>{children}</StaffLayoutShell>
    </StaffProvider>
  );
}
