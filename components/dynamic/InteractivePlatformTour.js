"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scan, CheckCircle2, FileText, ArrowRight, ShieldCheck, 
  Layers, Lock, Download, Database, Check
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function InteractivePlatformTour() {
  const [activeTab, setActiveTab] = useState("ingestion");

  // Ingestion Simulator State
  const [selectedIntakeFormat, setSelectedIntakeFormat] = useState("whatsapp");
  const [isScanning, setIsScanning] = useState(false);

  // Ledger Simulator State
  const [ledgerAmount, setLedgerAmount] = useState(150000);
  const [includeTds, setIncludeTds] = useState(true);

  // Math for Ledger
  const cgst = ledgerAmount * 0.09;
  const sgst = ledgerAmount * 0.09;
  const tds = includeTds ? ledgerAmount * 0.001 : 0;
  const payableToVendor = ledgerAmount + cgst + sgst - tds;

  const handleSimulateScan = (format) => {
    setSelectedIntakeFormat(format);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast.success(`${format.toUpperCase()} invoice cleansed & tax math verified!`);
    }, 600);
  };

  const handleDownloadSample = () => {
    toast.success("Downloading Trial Balance formatted to ICAI & Sec 44AB schedules...");
  };

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 shadow-inner max-w-full overflow-x-auto">
          {[
            { id: "ingestion", label: "1. Smart Bill Intake" },
            { id: "ledger", label: "2. Native Ledger Engine" },
            { id: "portal", label: "3. CA Auditor Portal" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-5 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5 font-extrabold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl lg:grid lg:grid-cols-12 min-h-[480px]">
        {/* Left Column: Explanatory Content */}
        <div className="p-8 sm:p-12 lg:col-span-5 lg:border-r lg:border-slate-200 lg:bg-white flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeTab === "ingestion" && (
              <motion.div
                key="ingestion-desc"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Scan className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Forgiving Invoice Ingestion</h3>
                <p className="text-sm leading-relaxed text-slate-600 font-medium">
                  Vendor invoices arrive in messy formats: WhatsApp phone snaps, slanted PDFs, and handwritten challans.
                  Crown Ecosystems normalizes this data instantly, auto-verifying GSTIN validity on the live portal.
                </p>
                <ul className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automatic Tax ID (GSTIN/PAN) Verification</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Auto-detection of CGST/SGST/IGST rates</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Duplicate bill shield prevents double payouts</li>
                </ul>
              </motion.div>
            )}

            {activeTab === "ledger" && (
              <motion.div
                key="ledger-desc"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Native Double-Entry Ledger</h3>
                <p className="text-sm leading-relaxed text-slate-600 font-medium">
                  No third-party accounting sync or desktop bridge required. When a bill is approved by the founder, the system mathematically writes standard journal vouchers instantly.
                </p>
                <ul className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Enforced Debit = Credit Equations</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Automatic TDS u/s 194Q & 194C deduction</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Real-time Trial Balance synchronization</li>
                </ul>
              </motion.div>
            )}

            {activeTab === "portal" && (
              <motion.div
                key="portal-desc"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Dedicated Auditor Workspace</h3>
                <p className="text-sm leading-relaxed text-slate-600 font-medium">
                  Give your CA a specialized, read-only login. They can review vouchers, check Section 43B(h) compliance, and export statutory workbooks without disturbing factory staff.
                </p>
                <ul className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> 1-Click Voucher PDF Traceability</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Section 44AB Tax Audit Workbooks</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Zero risk of accidental operational edits</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-8 border-t border-slate-100 mt-6">
            <Link
              href="/who"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Explore Detailed Modules Workflow <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Dynamic Interactive Sandbox */}
        <div className="p-6 sm:p-10 lg:col-span-7 bg-[#F8FAFC] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* Interactive Tab 1 Sandbox */}
            {activeTab === "ingestion" && (
              <motion.div
                key="sandbox-ingestion"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Interactive Ingestion Test
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { id: "whatsapp", label: "WhatsApp Photo" },
                      { id: "pdf", label: "Scanned PDF" },
                      { id: "excel", label: "Supplier CSV" },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => handleSimulateScan(fmt.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                          selectedIntakeFormat === fmt.id
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Ingestion Document with animated Scanner */}
                <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs space-y-2 overflow-hidden">
                  {isScanning && (
                    <motion.div
                      initial={{ top: "-10%" }}
                      animate={{ top: "110%" }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 shadow-md shadow-emerald-400/50 z-20"
                    />
                  )}

                  <div className="flex justify-between items-center text-slate-500 pb-1 border-b border-slate-200/70">
                    <span>Source: {selectedIntakeFormat.toUpperCase()}_SCAN.dat</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                      GSTIN VERIFIED: ACTIVE
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-800 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Party</span>
                      <span className="font-bold">Gujarat Precision Castings LLP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taxable Value</span>
                      <span>₹1,50,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CGST (9%) + SGST (9%)</span>
                      <span>₹27,000.00</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-1">
                      <span>Total Invoice</span>
                      <span className="text-emerald-700">₹1,77,000.00</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <Check className="w-3.5 h-3.5" /> 3-Way Order & PO Match 100% Passed
                  </span>
                  <span>Click options above to test formats</span>
                </div>
              </motion.div>
            )}

            {/* Interactive Tab 2 Sandbox */}
            {activeTab === "ledger" && (
              <motion.div
                key="sandbox-ledger"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Journal Equalizer
                  </span>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTds}
                      onChange={(e) => setIncludeTds(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    Include TDS 194Q (0.1%)
                  </label>
                </div>

                {/* Amount Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Preset:</span>
                  {[75000, 150000, 300000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setLedgerAmount(amt)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        ledgerAmount === amt
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      ₹{(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>

                {/* Real-time Balanced Ledger Entries */}
                <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-white space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Dr. Machinery Spares A/c</span>
                    <span className="text-emerald-400 font-bold">Dr. ₹{ledgerAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Dr. CGST + SGST Input A/c (18%)</span>
                    <span className="text-emerald-400 font-bold">Dr. ₹{(cgst + sgst).toLocaleString("en-IN")}</span>
                  </div>
                  {includeTds && (
                    <div className="flex justify-between text-slate-300 pl-4">
                      <span>Cr. TDS Payable u/s 194Q (0.1%)</span>
                      <span className="text-amber-400 font-bold">Cr. ₹{tds.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-100 border-t border-slate-800 pt-2 font-bold pl-4">
                    <span>Cr. Sundry Creditors A/c</span>
                    <span className="text-amber-400">Cr. ₹{payableToVendor.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-center text-xs font-mono font-black text-emerald-800">
                  Total Dr (₹{(ledgerAmount + cgst + sgst).toLocaleString("en-IN")}) = Total Cr (₹{(payableToVendor + tds).toLocaleString("en-IN")})
                </div>
              </motion.div>
            )}

            {/* Interactive Tab 3 Sandbox */}
            {activeTab === "portal" && (
              <motion.div
                key="sandbox-portal"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Auditor Terminal (FY 2026-27)
                  </span>
                  <span className="rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5">
                    READ-ONLY MODE
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">General Ledger Balance:</span>
                    <span className="font-bold text-emerald-600">100% Verified (0 Suspense)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">GSTR-2B ITC Matching:</span>
                    <span className="font-bold text-emerald-600">100% Eligible Claims</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Sec 43B(h) MSME Exposure:</span>
                    <span className="font-bold text-emerald-600">0 Overdue Dues</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleDownloadSample}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Export Trial Balance (.xlsx)
                  </button>
                  <Link
                    href="/demo/ca"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Launch Live CA Sandbox →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
