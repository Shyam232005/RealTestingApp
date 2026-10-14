"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, Briefcase, FileCheck, ArrowRight, CheckCircle2, 
  XCircle, Smartphone, Calculator, ShieldCheck 
} from "lucide-react";
import Link from "next/link";

const STAKEHOLDERS = [
  {
    id: "owner",
    role: "Business Owners & Founders",
    badge: "Executive Cash Visibility",
    color: "emerald",
    borderColor: "hover:border-emerald-400",
    icon: Building2,
    tagline: "Total Cash Outflow Visibility",
    beforeProblem: "Approving RTGS transfers blind without knowing if raw materials reached the factory. Duplicate supplier bills paid via WhatsApp.",
    afterBenefit: "Mobile decision board with verified trust badges. Swipe to approve, hold, or prevent duplicate vendor payments in 2 minutes daily.",
    bulletPoints: [
      "Mobile 1-Tap Payout Approvals",
      "Automated Duplicate Bill Blocking",
      "Real-time Bank Balance Forecasts"
    ],
    demoLink: "/demo/owner",
    demoText: "Try Founder Demo"
  },
  {
    id: "finance",
    role: "In-House Finance & Accounts",
    badge: "Zero Repetitive Typing",
    color: "blue",
    borderColor: "hover:border-blue-400",
    icon: Briefcase,
    tagline: "Zero Manual Ledger Keying",
    beforeProblem: "Spending half the workday re-typing identical vendor bills into offline software and manually splitting CGST/SGST on desk calculators.",
    afterBenefit: "Smart OCR and Excel mappers auto-extract data. Approved bills auto-generate balanced double-entry vouchers without manual keying.",
    bulletPoints: [
      "Forgiving WhatsApp & PDF Ingestion",
      "Automated 3-Way PO & Bill Matching",
      "Instant GST Slab & TDS Calculations"
    ],
    demoLink: "/who",
    demoText: "Explore Finance Flow"
  },
  {
    id: "ca",
    role: "Chartered Accountants & Auditors",
    badge: "Audit-Ready Daily",
    color: "purple",
    borderColor: "hover:border-purple-400",
    icon: FileCheck,
    tagline: "Statutory Equilibrium on Demand",
    beforeProblem: "Receiving damaged database backup files in September, discovering blocked ITC and severe Section 43B(h) late payment penalties.",
    afterBenefit: "Free dedicated read-only auditor workspace. Inspect balanced books year-round with original invoice PDF attachments.",
    bulletPoints: [
      "Enforced Double-Entry Equation (Dr = Cr)",
      "Section 43B(h) 15/45-Day Safeguard",
      "1-Click ICAI & Sec 44AB Excel Exports"
    ],
    demoLink: "/demo/ca",
    demoText: "Launch CA Terminal"
  }
];

export default function StakeholderShowcase() {
  const [activeViews, setActiveViews] = useState({
    owner: "solution",
    finance: "solution",
    ca: "solution"
  });

  const toggleView = (id, view) => {
    setActiveViews((prev) => ({ ...prev, [id]: view }));
  };

  return (
    <div className="mt-16 grid gap-8 md:grid-cols-3">
      {STAKEHOLDERS.map((item) => {
        const Icon = item.icon;
        const currentView = activeViews[item.id];

        return (
          <div
            key={item.id}
            className={`group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 ${item.borderColor}`}
          >
            <div>
              {/* Header Icon + Badge */}
              <div className="flex items-center justify-between mb-6">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                    item.color === "emerald"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.color === "blue"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <span
                  className={`text-[10px] font-black uppercase tracking-wider rounded-full px-3 py-1 border ${
                    item.color === "emerald"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : item.color === "blue"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  {item.badge}
                </span>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {item.role}
              </div>
              <h3 className="mt-1 text-xl font-black text-slate-900">
                {item.tagline}
              </h3>

              {/* View Toggle Pill */}
              <div className="my-5 inline-flex rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
                <button
                  onClick={() => toggleView(item.id, "solution")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    currentView === "solution"
                      ? "bg-white text-slate-900 shadow-xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  With Crown
                </button>
                <button
                  onClick={() => toggleView(item.id, "problem")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    currentView === "problem"
                      ? "bg-white text-rose-700 shadow-xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Old Way (Risk)
                </button>
              </div>

              {/* Dynamic Content Switch */}
              <div className="min-h-[90px] border-b border-slate-100 pb-5">
                {currentView === "solution" ? (
                  <p className="text-sm leading-relaxed text-slate-600 font-medium">
                    {item.afterBenefit}
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed text-rose-700/90 font-medium bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    {item.beforeProblem}
                  </p>
                )}
              </div>

              {/* Feature Checklist */}
              <ul className="mt-5 space-y-2.5 text-xs font-semibold text-slate-700">
                {item.bulletPoints.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-center gap-2">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        item.color === "emerald"
                          ? "text-emerald-500"
                          : item.color === "blue"
                          ? "text-blue-500"
                          : "text-purple-500"
                      }`}
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Link (Strictly keeping target intact) */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <Link
                href={item.demoLink}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition-all hover:bg-slate-800 hover:shadow-md cursor-pointer"
              >
                {item.demoText}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
