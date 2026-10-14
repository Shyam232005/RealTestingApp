"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileCheck2, CheckCircle2, ShieldCheck, ArrowRight, 
  Sparkles, RefreshCw, Zap, TrendingUp, Layers, Eye
} from "lucide-react";
import confetti from "canvas-confetti";

const SAMPLE_BILLS = [
  {
    id: "INV-902",
    vendor: "Gujarat Precision Castings LLP",
    gstin: "24AAACG1234E1Z6",
    status: "Active GSTIN",
    taxable: 150000,
    cgst: 13500,
    sgst: 13500,
    total: 177000,
    poNumber: "PO-2026-441",
    matchScore: "100% 3-Way Match",
    debitLedger: "Dr. Spares & Castings A/c",
    creditLedger: "Cr. Gujarat Precision (Creditor)"
  },
  {
    id: "INV-781",
    vendor: "Surat Textile Machinery Corp",
    gstin: "24AABCS5542F1Z8",
    status: "Active GSTIN",
    taxable: 320000,
    cgst: 28800,
    sgst: 28800,
    total: 377600,
    poNumber: "PO-2026-389",
    matchScore: "100% 3-Way Match",
    debitLedger: "Dr. Plant & Machinery A/c",
    creditLedger: "Cr. Surat Textile Mach (Creditor)"
  },
  {
    id: "INV-612",
    vendor: "Ankleshwar Chemical Synthetics",
    gstin: "24AACCA9918M1ZQ",
    status: "Active GSTIN",
    taxable: 85000,
    cgst: 7650,
    sgst: 7650,
    total: 100300,
    poNumber: "PO-2026-512",
    matchScore: "100% 3-Way Match",
    debitLedger: "Dr. Raw Materials A/c",
    creditLedger: "Cr. Ankleshwar Chemical (Creditor)"
  }
];

export default function FinOpsHeroPreview() {
  const [selectedBillIndex, setSelectedBillIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const bill = SAMPLE_BILLS[selectedBillIndex];

  const handleSimulateScan = () => {
    setIsScanning(true);
    setIsApproved(false);
    setTimeout(() => {
      setIsScanning(false);
      setSelectedBillIndex((prev) => (prev + 1) % SAMPLE_BILLS.length);
    }, 800);
  };

  const handleApprove = () => {
    setIsApproved(true);
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // Ignore if browser restricts
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl mt-12 rounded-3xl border border-slate-200/90 bg-white/90 p-4 sm:p-6 shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-3 gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-400"></span>
            <span className="h-3 w-3 rounded-full bg-amber-400"></span>
            <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            crown-finops://engine/live-stream
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateScan}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-emerald-600" : ""}`} />
            {isScanning ? "Processing Ingestion..." : "Switch Sample Bill"}
          </button>

          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Engine
          </span>
        </div>
      </div>

      {/* Main Grid Preview */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Intake Card */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-extrabold text-slate-800">
              {bill.id}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {bill.status}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vendor Entity
            </p>
            <h4 className="text-sm font-black text-slate-900 leading-snug">
              {bill.vendor}
            </h4>
            <p className="font-mono text-[11px] text-slate-500">{bill.gstin}</p>
          </div>

          {/* Scanned Amounts Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Goods</span>
              <span>₹{bill.taxable.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CGST (9%) + SGST (9%)</span>
              <span>₹{(bill.cgst + bill.sgst).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1 text-sm font-extrabold text-slate-900">
              <span>Total Invoice Amount</span>
              <span className="text-emerald-700">₹{bill.total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>PO Reference: <strong className="text-slate-700 font-mono">{bill.poNumber}</strong></span>
            <span className="text-emerald-600 font-bold">✓ {bill.matchScore}</span>
          </div>
        </div>

        {/* Center Arrow / Transition */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <ArrowRight className="w-5 h-5 hidden lg:block" />
            <Sparkles className="w-5 h-5 lg:hidden" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 text-center">
            Zero Data Entry
          </span>
          <span className="text-[9px] text-slate-400 text-center">
            Auto-Balanced Journal
          </span>
        </div>

        {/* Right Column: Native Double-Entry Ledger Voucher */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                General Ledger Posting
              </span>
            </div>
            <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              MCA Audit Ready
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="truncate pr-2">{bill.debitLedger}</span>
              <span className="text-emerald-400 font-bold shrink-0">Dr. ₹{bill.taxable.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Dr. Input CGST & SGST A/c</span>
              <span className="text-emerald-400 font-bold shrink-0">Dr. ₹{(bill.cgst + bill.sgst).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-slate-200 border-t border-slate-800 pt-2 font-bold">
              <span className="truncate pr-2">{bill.creditLedger}</span>
              <span className="text-amber-400 shrink-0">Cr. ₹{bill.total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3 text-center">
            <p className="text-[11px] font-mono font-bold text-emerald-400">
              Equilibrium: Total Debits (₹{bill.total.toLocaleString("en-IN")}) = Total Credits (₹{bill.total.toLocaleString("en-IN")})
            </p>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleApprove}
            className={`w-full rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isApproved
                ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {isApproved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Voucher Posted & Synced to CA Portal
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Click to Approve & Auto-Post Voucher
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
