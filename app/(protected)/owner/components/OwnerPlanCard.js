"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Zap,
  Users,
  ShieldCheck,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";

const PLAN_DETAILS_MAP = {
  "MSME Starter": {
    badge: "MSME Starter",
    subtitle: "Small Trading & Service Units",
    price: "₹1,499 / mo",
    users: "Up to 3 Team Users",
    invoices: "150 Invoices / Month",
    caPortals: "1 Dedicated CA Portal",
    features: [
      "Native Double-Entry General Ledger",
      "Founder PO & Bill Approval Flow",
      "Basic GSTR-2B ITC Verification",
      "MCA Statutory Audit Trail",
    ],
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    accentColor: "text-purple-600",
  },
  "Manufacturing & Growth": {
    badge: "Manufacturing & Growth",
    subtitle: "Manufacturing Units & Distributors",
    price: "₹3,499 / mo",
    users: "Up to 10 Team Users",
    invoices: "Unlimited Bill Ingestion (PDF & CSV)",
    caPortals: "2 Dedicated CA Portals",
    features: [
      "Full 3-Way Matching (PO, GRN & Bill)",
      "Section 43B(h) 45-Day Dues Tracker",
      "Automated TDS (194C, 194J, 194Q)",
      "Godown Low-Stock Auto-Alerts",
    ],
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    accentColor: "text-emerald-600",
  },
  "Enterprise Multi-Unit": {
    badge: "Enterprise Multi-Unit",
    subtitle: "Multi-Branch & Multi-GSTIN Units",
    price: "₹6,999 / mo",
    users: "Unlimited Custom RBAC Roles",
    invoices: "High-Volume & API Integration",
    caPortals: "Priority CA Concierge",
    features: [
      "Multi-Branch & Multi-GSTIN Support",
      "Immutable Cloud Audit Trail Engine",
      "Custom Approval Hierarchies",
      "Dedicated FinOps Account Manager",
    ],
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    accentColor: "text-indigo-600",
  },
  "Free Trial": {
    badge: "30-Day Free Trial",
    subtitle: "Full FinOps Evaluation",
    price: "Free Access",
    users: "Up to 2 Team Users",
    invoices: "50 Bills Trial Quota",
    caPortals: "1 CA Portal Login",
    features: [
      "Always-Balanced Double Entry",
      "3-Way Order Matching Engine",
      "Section 43B(h) Policy Monitor",
    ],
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    accentColor: "text-amber-600",
  },
};

export default function OwnerPlanCard({ owner, organization, setActiveTab }) {
  const [expanded, setExpanded] = useState(false);

  const rawPlanName = organization?.planName || owner?.subscription?.planName || "MSME Starter";
  const planInfo =
    PLAN_DETAILS_MAP[rawPlanName] ||
    (rawPlanName.includes("Manufacturing")
      ? PLAN_DETAILS_MAP["Manufacturing & Growth"]
      : rawPlanName.includes("Enterprise")
      ? PLAN_DETAILS_MAP["Enterprise Multi-Unit"]
      : rawPlanName.includes("Trial")
      ? PLAN_DETAILS_MAP["Free Trial"]
      : PLAN_DETAILS_MAP["MSME Starter"]);

  const cycle = (organization?.billingCycle || owner?.subscription?.cycle || "annual").toUpperCase();
  const paymentStatus = (organization?.paymentStatus || owner?.subscription?.status || "paid").toUpperCase();

  // Expiry date formatting
  const expiryDate = owner?.subscription?.endDate || owner?.subscriptionExpiry;
  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Active (Renews Annually)";

  return (
    <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">Current Plan</h3>
        </div>

        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            paymentStatus === "PAID" || paymentStatus === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {paymentStatus}
        </span>
      </div>

      {/* Main Plan Card Box */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-50/80 via-slate-50 to-indigo-50/60 p-4 border border-purple-100/70 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${planInfo.badgeColor}`}
            >
              {planInfo.badge}
            </span>
            <p className="text-xs font-semibold text-slate-500 mt-1.5">{planInfo.subtitle}</p>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-slate-900 font-mono block">
              {planInfo.price}
            </span>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">
              {cycle}
            </span>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100/70 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="font-semibold truncate">{planInfo.users}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold truncate">{planInfo.caPortals}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-slate-600 pt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] font-medium">Valid Till: </span>
            <span className="text-[10px] font-bold text-slate-800">{formattedExpiry}</span>
          </div>
        </div>
      </div>

      {/* Expandable Features List */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-purple-700 py-1 transition-all cursor-pointer"
        >
          <span>Plan Inclusions & Quota</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expanded && (
          <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
            {planInfo.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Quota: {planInfo.invoices}</span>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade / Change Plan Link */}
      <Link
        href="/purchase"
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
      >
        <span>Upgrade / Change Tier</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-purple-300" />
      </Link>
    </div>
  );
}
