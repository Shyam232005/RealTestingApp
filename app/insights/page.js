"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import BusinessInsightsDashboard from "@/components/accounting/BusinessInsightsDashboard";
import { PageHeaderSkeleton, MetricsCardsSkeleton, ChartSkeleton } from "@/components/ui/CrownSkeletonLoader";

export default function InsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("all");

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await fetch("/api/owner/organization");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data.organization) {
          router.push("/owner/setup");
          return;
        }
        setOrganization(data.organization);
      } catch (err) {
        console.error("Failed to load organization:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FD] p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <PageHeaderSkeleton title="Loading Enterprise Business Insights..." />
          <MetricsCardsSkeleton count={4} />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="min-h-screen bg-[#FAF9FD] text-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/owner/dashboard"
            prefetch={true}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Owner Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              Company: <span className="text-slate-900 font-black">{organization.RegisterName}</span>
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Branches (Consolidated)</option>
              {(organization.branchList || []).map((b) => (
                <option key={b.branchId || b._id} value={b.branchId || b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Business Insights Dashboard */}
        <BusinessInsightsDashboard
          organization={organization}
          selectedBranch={selectedBranch}
        />
      </div>
    </div>
  );
}
