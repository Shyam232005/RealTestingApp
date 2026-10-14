"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

const REALTIME_ACTIVITIES = [
  { city: "Surat", event: "Gujarat Precision", action: "Matched GRN with INV #892", amount: "₹1,47,500", status: "Balanced" },
  { city: "Ahmedabad", event: "Apex Engineering", action: "GSTR-2B ITC 100% Claimed", amount: "₹82,400", status: "Verified" },
  { city: "Rajkot", event: "Saurashtra Castings", action: "MCA Audit Trail Locked", amount: "₹3,15,000", status: "Immutable" },
  { city: "Vadodara", event: "Baroda Polymers", action: "Sec 43B(h) Dues Cleared (Day 12)", amount: "₹94,200", status: "Compliant" },
  { city: "Mumbai", event: "Western Steels", action: "WhatsApp Bill Auto-Mapped", amount: "₹2,68,000", status: "Processed" },
  { city: "Pune", event: "Kalyani Industrial", action: "Zero-Suspense Journal Posted", amount: "₹5,40,000", status: "Dr = Cr" },
];

export default function LiveComplianceTicker({ variant = "full" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % REALTIME_ACTIVITIES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const current = REALTIME_ACTIVITIES[currentIndex];

  if (variant === "header" || variant === "badge") {
    return (
      <div className="hidden lg:inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50/90 px-3.5 py-1 text-xs font-semibold text-emerald-900 shadow-xs backdrop-blur-xs transition-all">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-bold text-emerald-700 tracking-wide uppercase">Live Compliance:</span>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-950"
          >
            <span className="font-semibold">{current.event}</span>
            <span className="text-emerald-600 font-mono text-[11px]">({current.status})</span>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border-y border-slate-800/80 py-2.5 px-4 overflow-hidden text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Live Ecosystem Network
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
        </div>

        <div className="flex items-center gap-3 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-center gap-2.5"
            >
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                {current.city}
              </span>
              <span className="font-semibold text-white">{current.event}</span>
              <span className="text-slate-400 hidden md:inline">{current.action}</span>
              <span className="font-mono font-bold text-emerald-400">{current.amount}</span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {current.status}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-400">
          <span>Active Ledgers: <strong>1,842</strong></span>
          <span>ITC Preserved: <strong className="text-emerald-400">₹4.8 Cr+</strong></span>
        </div>
      </div>
    </div>
  );
}
