"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DepartmentIndexPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function routeToAssignedDepartment() {
      try {
        const res = await fetch("/api/employee/workspace-data");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await res.json();
        if (isCancelled) return;

        if (!res.ok) {
          throw new Error(data.error || "Failed to resolve employee department");
        }

        if (!data.isApproved) {
          if (data.employee?.approvalStatus === "PENDING_APPROVAL") {
            router.replace("/department/pending-approval");
            return;
          }
          router.replace("/department/onboarding");
          return;
        }

        const dept = (data.employee?.department || "OPERATIONS").toLowerCase();
        router.replace(`/department/${dept}`);
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || "Failed to load assigned department");
        }
      }
    }

    routeToAssignedDepartment();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm font-bold text-rose-600 mb-2">Error Accessing Department</p>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button
          onClick={() => router.replace("/login")}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
      <p className="text-sm font-semibold text-slate-600">
        Routing to your assigned department workspace...
      </p>
    </div>
  );
}
