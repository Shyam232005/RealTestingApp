"use client";
import React, { useState } from "react";
import { Calculator, TrendingUp, Clock, ShieldCheck, IndianRupee, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RoiComplianceCalculator() {
  const [billVolume, setBillVolume] = useState(250);
  const [turnoverCrores, setTurnoverCrores] = useState(15);
  const [currentStack, setCurrentStack] = useState("tally");

  // Calculations based on Indian MSME market benchmarks
  // 1 bill manual entry = ~12 mins (typing, checking PO, filing challan) = 0.2 hours
  const hoursSavedMonthly = Math.round(billVolume * 0.18);
  
  // Typical blocked ITC without automated 2B reconciliation: ~2-3% of tax component (~0.3% of total turnover)
  const itcPreservedAnnually = Math.round(turnoverCrores * 10000000 * 0.0035);
  
  // Potential duplicate payment risk prevented (0.5% of total purchasing)
  const duplicatePrevented = Math.round(billVolume * 350);

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
            <Calculator className="w-3.5 h-3.5" />
            Interactive Value Calculator
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Calculate Your Return on Switching to Cloud FinOps
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            See the exact hours, tax savings, and compliance safety Crown Ecosystems unlocks for your factory or firm.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls Column */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
            {/* Slider 1: Monthly Bills */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-300">Monthly Purchase Invoices</span>
                <span className="font-mono font-black text-emerald-400 text-base">{billVolume} bills/mo</span>
              </div>
              <input
                type="range"
                min="30"
                max="1000"
                step="10"
                value={billVolume}
                onChange={(e) => setBillVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>30 bills</span>
                <span>500 bills</span>
                <span>1,000+ bills</span>
              </div>
            </div>

            {/* Slider 2: Turnover */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-300">Annual Business Turnover</span>
                <span className="font-mono font-black text-emerald-400 text-base">₹{turnoverCrores} Crores</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={turnoverCrores}
                onChange={(e) => setTurnoverCrores(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>₹1 Cr</span>
                <span>₹50 Cr</span>
                <span>₹100 Cr+</span>
              </div>
            </div>

            {/* Current Software Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Setup
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "tally", label: "Tally Desktop" },
                  { id: "busy", label: "Busy / Offline" },
                  { id: "excel", label: "Excel Sheets" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentStack(item.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      currentStack === item.id
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Estimated Value Delivered
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Metric 1 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Monthly Time Saved
                </div>
                <p className="font-mono text-3xl font-black text-white">
                  {hoursSavedMonthly} <span className="text-base font-normal text-slate-400">hrs</span>
                </p>
                <p className="text-[11px] text-slate-500">Manual voucher typing eliminated</p>
              </div>

              {/* Metric 2 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  GSTR-2B ITC Preserved
                </div>
                <p className="font-mono text-3xl font-black text-emerald-400">
                  ₹{(itcPreservedAnnually / 100000).toFixed(1)} <span className="text-base font-normal text-slate-400">Lakhs/yr</span>
                </p>
                <p className="text-[11px] text-slate-500">Saved from inactive vendor GSTINs</p>
              </div>

              {/* Metric 3 */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Sec 43B(h) MSME Disallowance Risk
                </div>
                <p className="font-mono text-2xl font-black text-white">
                  0 Disallowances <span className="text-xs font-normal text-emerald-400 font-sans">(100% 15/45-Day Alerting)</span>
                </p>
                <p className="text-[11px] text-slate-500">Guaranteed statutory tax deductions for micro & small supplier payments</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/contact"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-emerald-400 transition-all hover:scale-[1.01]"
              >
                Claim This ROI for Your Business
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
