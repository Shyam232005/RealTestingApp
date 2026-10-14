"use client";
import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";

export default function ThreeWayMatchSimulator() {
  const [scenario, setScenario] = useState("match"); // "match" | "leak"

  return (
    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 sm:p-12 shadow-xl shadow-slate-200/50 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Interactive Verification Demo
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            How Crown's 3-Way Order Matching Protects Cash Outflow
          </h3>
        </div>

        {/* Scenario Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => setScenario("match")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              scenario === "match"
                ? "bg-white text-emerald-800 shadow-sm font-black"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Scenario 1: Verified Clean
          </button>
          <button
            onClick={() => setScenario("leak")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              scenario === "leak"
                ? "bg-rose-500 text-white shadow-sm font-black"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Scenario 2: Overbilling Leak
          </button>
        </div>
      </div>

      {/* 3 Pillars Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Document 1: PO */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-500 font-sans font-bold">
            <span>Doc 1: Purchase Order</span>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">PO-842</span>
          </div>
          <div className="space-y-1 text-slate-800">
            <p>Item: Grade 304 SS Rods</p>
            <p>Agreed Rate: <strong>₹450 / kg</strong></p>
            <p>Ordered Qty: <strong>1,000 kg</strong></p>
            <p className="border-t border-slate-200 pt-1 font-bold text-slate-900">Total: ₹4,50,000 + GST</p>
          </div>
        </div>

        {/* Document 2: GRN */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-500 font-sans font-bold">
            <span>Doc 2: Gate GRN (Store)</span>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">GRN-319</span>
          </div>
          <div className="space-y-1 text-slate-800">
            <p>Item: Grade 304 SS Rods</p>
            <p>Weighbridge Net: <strong>1,000 kg</strong></p>
            <p>Physical Condition: <strong>Inspected OK</strong></p>
            <p className="border-t border-slate-200 pt-1 font-bold text-slate-900">Received: 100% Intact</p>
          </div>
        </div>

        {/* Document 3: Vendor Invoice */}
        <div
          className={`rounded-2xl border p-5 space-y-3 font-mono text-xs transition-colors duration-300 ${
            scenario === "match"
              ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
              : "border-rose-200 bg-rose-50/60 text-rose-950"
          }`}
        >
          <div className="flex justify-between items-center font-sans font-bold">
            <span>Doc 3: Vendor Tax Invoice</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${scenario === "match" ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"}`}>
              INV-994
            </span>
          </div>
          <div className="space-y-1">
            <p>Item: Grade 304 SS Rods</p>
            <p>
              Billed Rate:{" "}
              {scenario === "match" ? (
                <strong>₹450 / kg (Matches PO)</strong>
              ) : (
                <strong className="text-rose-600 underline">₹480 / kg (+₹30/kg Overcharge!)</strong>
              )}
            </p>
            <p>Billed Qty: 1,000 kg</p>
            <p className="border-t border-slate-200/60 pt-1 font-bold">
              {scenario === "match" ? "Billed: ₹4,50,000 + GST" : "Billed: ₹4,80,000 (Overbilled by ₹30,000)"}
            </p>
          </div>
        </div>
      </div>

      {/* Outcome Status Banner */}
      <div
        className={`rounded-2xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          scenario === "match"
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-rose-50 border-rose-200 text-rose-900"
        }`}
      >
        <div className="flex items-center gap-3">
          {scenario === "match" ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0" />
          )}
          <div>
            <h4 className="font-bold text-sm sm:text-base">
              {scenario === "match"
                ? "Verification Passed: 100% 3-Way Match Verified"
                : "Crown Security Triggered: Rate Discrepancy Blocked"}
            </h4>
            <p className="text-xs mt-0.5 opacity-80 font-medium">
              {scenario === "match"
                ? "Rates, physical receipts, and vendor tax math agree. Bill routed with green trust badge for instant payout."
                : "Payment held automatically. Discrepancy flagged to purchase officer before owner releases funds. Cash saved: ₹35,400 (incl GST)."}
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 ${
            scenario === "match"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-rose-600 text-white shadow-sm"
          }`}
        >
          {scenario === "match" ? "Ready to Pay" : "Payment On Hold"}
        </span>
      </div>
    </div>
  );
}
