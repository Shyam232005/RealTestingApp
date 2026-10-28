"use client";
import React from "react";
import { motion } from "framer-motion";
import { ScanLine, Sparkles, Layers } from "lucide-react";

/**
 * ScannerLaserSkeleton
 * Replaces circular spinners during the optical OCR processing phase.
 * Simulates a high-precision laser pass over a physical document with bounding box detection.
 */
export function ScannerLaserSkeleton({ label = "Extracting OCR Fields & Validating Math..." }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl">
      {/* Top Status Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ScanLine className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                AI Optical Engine Active
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                120 FPS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              initial={{ width: "15%" }}
              animate={{ width: ["15%", "85%", "45%", "95%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Document Optical Laser Scanner Viewport (Left 7 Cols) */}
        <div className="lg:col-span-7 relative h-72 sm:h-84 rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden p-6 flex flex-col justify-between">
          {/* Animated Laser Beam */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_4px_rgba(52,211,153,0.8)] z-20 pointer-events-none"
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Ambient Laser Glow Cone */}
          <motion.div
            className="absolute left-0 right-0 h-16 bg-gradient-to-b from-emerald-500/20 to-transparent z-10 pointer-events-none"
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "90%", "0%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Simulated Document Layout with Pulsing Text Blocks & Bounding Boxes */}
          <div className="space-y-4 opacity-75">
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-slate-800 animate-pulse" />
                <div className="h-3 w-48 rounded bg-slate-800/80 animate-pulse" />
              </div>
              <div className="w-16 h-8 rounded border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center">
                <div className="h-3 w-10 bg-emerald-400/40 rounded animate-pulse" />
              </div>
            </div>

            {/* Simulated Bounding Box 1: Vendor & GSTIN */}
            <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 relative">
              <span className="absolute -top-2 left-2 px-1 text-[9px] font-mono bg-slate-900 text-emerald-400 border border-emerald-500/40 rounded">
                TAX_ID_BLOCK
              </span>
              <div className="space-y-1.5 mt-1">
                <div className="h-3 w-3/4 rounded bg-slate-700 animate-pulse" />
                <div className="h-2.5 w-1/2 rounded bg-slate-800 animate-pulse" />
              </div>
            </div>

            {/* Simulated Table Line Items */}
            <div className="p-3 rounded-lg border border-teal-500/30 bg-slate-800/40 space-y-2">
              <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                <div className="h-2.5 w-20 rounded bg-slate-700" />
                <div className="h-2.5 w-12 rounded bg-slate-700" />
                <div className="h-2.5 w-16 rounded bg-slate-700" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-2 w-28 rounded bg-slate-700/80 animate-pulse" />
                <div className="h-2 w-8 rounded bg-slate-700/80 animate-pulse" />
                <div className="h-2 w-12 rounded bg-emerald-400/50 animate-pulse" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-2 w-32 rounded bg-slate-700/80 animate-pulse" />
                <div className="h-2 w-8 rounded bg-slate-700/80 animate-pulse" />
                <div className="h-2 w-12 rounded bg-emerald-400/50 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            <span>RES: 300 DPI OPTICAL</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> CONFIDENCE: 99.4%
            </span>
          </div>
        </div>

        {/* Live Extracted Fields Placeholder Drawer (Right 5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">Live Field Extraction</span>
            <div className="h-2 w-12 rounded-full bg-emerald-500/40 animate-pulse" />
          </div>

          {[
            { label: "Document Type", width: "w-24" },
            { label: "Invoice / Receipt No", width: "w-32" },
            { label: "Supplier GSTIN", width: "w-36" },
            { label: "Taxable Amount (₹)", width: "w-28" },
            { label: "CGST + SGST (₹)", width: "w-24" },
            { label: "Grand Total (₹)", width: "w-32" },
          ].map((field, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800"
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {field.label}
                </span>
                <div className={`h-3 ${field.width} rounded bg-slate-700 animate-pulse`} />
              </div>
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * TableSkeleton
 * Matching ledger, invoice, and stock tables.
 */
export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="h-4 w-36 rounded-md bg-slate-200 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-8 w-20 rounded-lg bg-slate-200 animate-pulse" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="px-6 py-4 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => {
              // Varying column widths
              const widths = ["w-20", "w-36", "w-28", "w-16", "w-24", "w-20"];
              const width = widths[cIdx % widths.length];
              return (
                <div
                  key={cIdx}
                  className={`h-3.5 ${width} rounded-md bg-slate-100 animate-pulse`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * MetricsCardsSkeleton
 * KPI metrics cards matching owner dashboard & financial stats.
 */
export function MetricsCardsSkeleton({ count = 4 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse" />
          </div>
          <div className="h-7 w-32 rounded-lg bg-slate-200 animate-pulse" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-3 w-14 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ChartSkeleton
 * Pulsing area/bar chart matching Recharts analytics.
 */
export function ChartSkeleton({ height = "h-72" }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-56 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-16 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-7 w-16 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </div>

      {/* Simulated Chart Area */}
      <div
        className={`${height} w-full rounded-2xl bg-gradient-to-b from-purple-50/50 via-slate-50 to-white flex items-end justify-between px-6 pb-4 pt-10 gap-3 border border-dashed border-slate-200`}
      >
        {[40, 65, 30, 85, 55, 95, 70, 80, 45, 90, 60, 75].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <motion.div
              className="w-full bg-purple-200/60 rounded-t-lg"
              initial={{ height: "15%" }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.08 }}
            />
            <div className="h-2 w-full rounded bg-slate-200/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * LedgerSplitViewSkeleton
 * Matches the split layout of /app/books/ledger
 */
export function LedgerSplitViewSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 4 Cols: Account List */}
      <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
            >
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-slate-200 animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
              </div>
              <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Right 8 Cols: T-Account Details Table */}
      <div className="lg:col-span-8 space-y-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-44 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-28 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-xl bg-purple-100 animate-pulse" />
          </div>
        </div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
}

/**
 * PageHeaderSkeleton
 * Breadcrumb, Title & Top Controls
 */
export function PageHeaderSkeleton({ title = "Loading Crownops..." }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-7 w-48 rounded-lg bg-slate-300 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-32 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-9 w-36 rounded-xl bg-slate-900/10 animate-pulse" />
      </div>
    </div>
  );
}
