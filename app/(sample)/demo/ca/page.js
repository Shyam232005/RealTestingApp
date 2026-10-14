'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LiveComplianceTicker from '@/components/dynamic/LiveComplianceTicker';

// --- PREMIUM ANIMATION VARIANTS ---
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

export default function CaDemoPage() {
    const [activeTab, setActiveTab] = useState('vouchers'); // 'vouchers' | 'trial_balance' | 'tax_audit'
    const [selectedClient, setSelectedClient] = useState('Crown Fabrics Unit (Surat)');
    const [exportNotification, setExportNotification] = useState('');

    const handleExport = (reportName) => {
        setExportNotification(`Generating ${reportName}... Formatted to strict ICAI & Sec 44AB schedules.`);
        setTimeout(() => setExportNotification(''), 4000);
    };

    return (
        <div className="relative min-h-screen w-full bg-[#F8FAFC] pb-24 font-sans text-slate-900 selection:bg-cyan-200 selection:text-cyan-900 overflow-hidden">
            <LiveComplianceTicker />
            <div className="overflow-hidden whitespace-nowrap bg-amber-100 border-b border-amber-300 py-1 relative z-20">
                <p className="animate-marquee text-red-600 font-bold text-lg inline-block px-6">
                    ⚠️ This is only a sample view — the original dashboard may look different
                </p>
            </div>

            {/* Institutional Background with CSS Pulse */}
            <div className="pointer-events-none absolute right-0 top-0 -z-10 h-[500px] w-[800px] -translate-y-1/2 translate-x-1/4 rounded-full bg-cyan-600/10 blur-[120px] animate-pulse-soft"></div>

            {/* Floating Toast Notification via Framer Motion */}
            <AnimatePresence>
                {exportNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 50, x: "-50%" }}
                        transition={{ type: "spring", bounce: 0.3 }}
                        className="fixed bottom-8 left-1/2 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-6 py-4 shadow-2xl shadow-emerald-900/10"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        </div>
                        <p className="text-sm font-bold text-slate-800">{exportNotification}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">

                {/* 1. Header & Navigation (Staggered Intro) */}
                <motion.div
                    initial="hidden" animate="visible" variants={staggerContainer}
                    className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/80 pb-6"
                >
                    <motion.div variants={fadeUp}>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-800 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-600"></span>
                            </span>
                            Live CA Auditor Terminal
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Auditor Workspace
                        </h1>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                            Inspect balanced vouchers, verify GSTR-2B ITC, and export statutory audit workbooks.
                        </p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="flex items-center gap-3">
                        <Link
                            href="/demo/owner"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                            Switch to Founder View
                        </Link>
                    </motion.div>
                </motion.div>

                {/* 2. Global Context Bar (Client & Read-Only Status) */}
                <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex w-full sm:w-auto items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" /></svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Client Context</p>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full truncate bg-transparent text-sm font-extrabold text-slate-900 focus:outline-none cursor-pointer hover:text-cyan-700 transition-colors"
                            >
                                <option value="Crown Fabrics Unit (Surat)">Crown Fabrics Unit (Surat) - GSTIN: 24AAACG1234E1Z6</option>
                                <option value="Gujarat Precision Castings (Rajkot)">Gujarat Precision Castings (Rajkot)</option>
                                <option value="Surat Textile Machinery LLP">Surat Textile Machinery LLP</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex w-full sm:w-auto items-center justify-end gap-3 border-t border-slate-100 sm:border-none pt-3 sm:pt-0">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs font-bold text-slate-700">
                            FY 2026-27
                        </span>
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                            Read-Only Terminal
                        </div>
                    </div>
                </motion.div>

                {/* 3. Statutory Audit Health Dashboard */}
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {/* Health Card 1 */}
                    <motion.div variants={fadeUp} className="flex flex-col justify-between rounded-3xl border border-emerald-200/60 bg-gradient-to-b from-white to-emerald-50/30 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">General Ledger Status</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="font-mono text-2xl font-black text-slate-900">100% Balanced</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">Debits mathematically equal Credits</p>
                        </div>
                    </motion.div>

                    {/* Health Card 2 */}
                    <motion.div variants={fadeUp} className="flex flex-col justify-between rounded-3xl border border-cyan-200/60 bg-gradient-to-b from-white to-cyan-50/30 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-800">Sec 43B(h) MSME Exposure</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="font-mono text-2xl font-black text-slate-900">0 Days Overdue</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">Zero risk of income tax disallowances</p>
                        </div>
                    </motion.div>

                    {/* Health Card 3 */}
                    <motion.div variants={fadeUp} className="flex flex-col justify-between rounded-3xl border border-indigo-200/60 bg-gradient-to-b from-white to-indigo-50/30 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-800">GSTR-2B Reconciled ITC</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="font-mono text-2xl font-black text-slate-900">₹1,44,200 <span className="text-sm text-slate-500 font-sans font-medium">Eligible</span></p>
                            <p className="mt-1 text-xs font-medium text-slate-500">100% matched against portal statements</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* 4. Tab Navigation (Animated Layout Pill) */}
                <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex justify-center mt-4">
                    <div className="inline-flex rounded-xl bg-slate-200/60 p-1.5 shadow-inner overflow-x-auto max-w-full relative">
                        {[
                            { id: 'vouchers', label: '1. Voucher Inspection' },
                            { id: 'trial_balance', label: '2. Live Trial Balance' },
                            { id: 'tax_audit', label: '3. Tax Audit Exports' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative z-10 rounded-lg px-4 py-2.5 text-xs font-bold transition-colors sm:px-6 whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-cyan-900'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div layoutId="activeCaDemoTab" className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* 5. TAB CONTENT (Crossfading with AnimatePresence) */}
                <div className="mt-8">
                    <AnimatePresence mode="wait">

                        {/* TAB 1: BALANCED PURCHASE VOUCHER */}
                        {activeTab === 'vouchers' && (
                            <motion.div
                                key="vouchers"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                                className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/40"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-extrabold text-slate-900">Purchase Voucher</h3>
                                            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600">#PV-2026-092</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500">Auto-generated double-entry posting from verified tax invoice.</p>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Equilibrium Verified
                                    </div>
                                </div>

                                {/* Standard Accounting Ledger Table */}
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left font-mono text-[13px]">
                                            <thead className="border-b-2 border-slate-200 bg-slate-50 font-sans font-bold text-slate-700">
                                                <tr>
                                                    <th className="p-4">Account Head</th>
                                                    <th className="p-4">Classification</th>
                                                    <th className="p-4 text-right">Debit (Dr)</th>
                                                    <th className="p-4 text-right">Credit (Cr)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-bold text-slate-900">Dr. Raw Materials Consumed A/c</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Direct Expense</td>
                                                    <td className="p-4 text-right font-semibold text-slate-900">1,25,000.00</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-bold text-slate-900">Dr. Input CGST A/c (9%)</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Current Asset</td>
                                                    <td className="p-4 text-right font-semibold text-slate-900">11,250.00</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-bold text-slate-900">Dr. Input SGST A/c (9%)</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Current Asset</td>
                                                    <td className="p-4 text-right font-semibold text-slate-900">11,250.00</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-bold text-slate-900 pl-8">Cr. TDS Payable u/s 194Q (0.1%)</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Current Liability</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                    <td className="p-4 text-right font-semibold text-amber-700">125.00</td>
                                                </tr>
                                                <tr className="bg-slate-50/80">
                                                    <td className="p-4 font-bold text-slate-900 pl-8">Cr. Gujarat Precision Castings (Vendor)</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Sundry Creditor (AP)</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                    <td className="p-4 text-right font-extrabold text-slate-900">1,47,375.00</td>
                                                </tr>
                                            </tbody>
                                            {/* Accounting Standard Double Bottom Border for Totals */}
                                            <tfoot className="border-b-[3px] border-t-[3px] border-double border-slate-300 bg-slate-100/50 font-black text-slate-900">
                                                <tr>
                                                    <td colSpan={2} className="p-4 font-sans uppercase tracking-widest text-xs text-slate-500 text-right">Total Balance Check</td>
                                                    <td className="p-4 text-right text-emerald-700">₹1,47,500.00</td>
                                                    <td className="p-4 text-right text-emerald-700">₹1,47,500.00</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Source Document Attachment */}
                                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.06.35-.444 1.35-.444-.939.001-1.256-.516-1.256-1.22zm10.246-11.692H2C.895 3 0 3.895 0 5v14c0 1.105.895 2 2 2h20c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zM6.253 18.067c-.636 0-1.272-.089-1.908-.248v-4.048c.636-.159 1.272-.254 1.908-.254 1.551 0 2.503.733 2.503 2.274 0 1.545-.964 2.276-2.503 2.276zm5.323-.272c-.52 0-1.111-.065-1.52-.165v-4.096c.491-.125 1.054-.184 1.568-.184 1.586 0 2.532.745 2.532 2.226 0 1.48-.916 2.219-2.58 2.219zm3.87 0v-1.74h1.727v-1.024h-1.727v-1.066h1.94v-1.018h-3.327v4.848h1.387z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">Source Document Verified</p>
                                            <p className="font-mono text-[11px] text-slate-500">GPC_Tax_Invoice_084.pdf (1.2 MB)</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleExport('Audit_Voucher_PV_092.pdf')}
                                        className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors w-full sm:w-auto justify-center"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                        Inspect Original PDF
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 2: TRIAL BALANCE */}
                        {activeTab === 'trial_balance' && (
                            <motion.div
                                key="trial_balance"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                                className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/40"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-900">Hierarchical Trial Balance</h3>
                                        <p className="text-xs font-medium text-slate-500 mt-1">Calculated directly from immutable double-entry vouchers.</p>
                                    </div>
                                    <button
                                        onClick={() => handleExport('Trial_Balance_FY26-27.xlsx')}
                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-sm transition-all"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                        Download Excel (.xlsx)
                                    </button>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left font-mono text-[13px]">
                                            <thead className="border-b-2 border-slate-200 bg-slate-50 font-sans font-bold text-slate-700">
                                                <tr>
                                                    <th className="p-4 w-2/5">Ledger Name</th>
                                                    <th className="p-4">Classification Group</th>
                                                    <th className="p-4 text-right">Debit Balance (₹)</th>
                                                    <th className="p-4 text-right">Credit Balance (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-4 font-bold text-slate-900">Current Bank Account (ICICI)</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Bank Accounts</td>
                                                    <td className="p-4 text-right font-semibold">18,42,500.00</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-4 font-bold text-slate-900">Sundry Debtors (Receivables)</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Current Assets</td>
                                                    <td className="p-4 text-right font-semibold">14,20,000.00</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-4 font-bold text-slate-900">Input Tax Credit (GST)</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Duties & Taxes</td>
                                                    <td className="p-4 text-right font-semibold">1,44,200.00</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-4 font-bold text-slate-900 pl-8">Sundry Creditors (Payables)</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Current Liabilities</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                    <td className="p-4 text-right font-semibold">9,85,600.00</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-4 font-bold text-slate-900 pl-8">Share Capital / Partner A/c</td>
                                                    <td className="p-4 font-sans text-slate-500 text-xs">Capital Account</td>
                                                    <td className="p-4 text-right text-slate-300">—</td>
                                                    <td className="p-4 text-right font-semibold">24,21,100.00</td>
                                                </tr>
                                            </tbody>
                                            <tfoot className="border-b-[3px] border-t-[3px] border-double border-slate-300 bg-slate-100/50 font-black text-slate-900">
                                                <tr>
                                                    <td colSpan={2} className="p-4 font-sans uppercase tracking-widest text-xs text-slate-500 text-right">Trial Balance Zero Suspense:</td>
                                                    <td className="p-4 text-right text-emerald-700">₹34,06,700.00</td>
                                                    <td className="p-4 text-right text-emerald-700">₹34,06,700.00</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB 3: 1-CLICK TAX AUDIT EXPORTS */}
                        {activeTab === 'tax_audit' && (
                            <motion.div
                                key="tax_audit"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-xl font-extrabold text-slate-900">Audit & Compliance Reports</h3>
                                    <p className="text-sm font-medium text-slate-500">Formatted to ICAI requirements.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {/* Zip Export Card */}
                                    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
                                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-110">
                                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Form 3CD Schedule</span>
                                            <h4 className="mt-1 text-lg font-bold text-slate-900">Sec 44AB Tax Audit Pack</h4>
                                            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                                                Complete archive of depreciation schedules, creditor ageings, and attachments.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleExport('Section_44AB_Tax_Audit_Pack.zip')}
                                            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-slate-800"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            Export Archive (.zip)
                                        </button>
                                    </div>

                                    {/* Excel Export Card 1 */}
                                    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
                                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110">
                                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25m0-5.25C18 5.004 17.496 4.5 16.875 4.5H7.125M18 10.875V7.125m0 3.75c0 .621-.504 1.125-1.125 1.125h-1.5m2.625 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 10.875v5.25m0-5.25c0-.621.504-1.125 1.125-1.125h1.5m-2.625 2.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M18 16.125v-5.25m0 5.25c0 .621-.504 1.125-1.125 1.125h-1.5M18 16.125c0-.621.504-1.125 1.125-1.125h1.5m-2.625 2.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125" /></svg>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Income Tax Mandate</span>
                                            <h4 className="mt-1 text-lg font-bold text-slate-900">Sec 43B(h) MSME Report</h4>
                                            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                                                Detailed tracking of dues to Micro and Small Enterprises ensuring zero disallowance.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleExport('Section_43Bh_MSME_Schedule.xlsx')}
                                            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            Export Schedule (.xlsx)
                                        </button>
                                    </div>

                                    {/* Excel Export Card 2 */}
                                    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
                                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 transition-transform group-hover:scale-110">
                                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">GST Compliance</span>
                                            <h4 className="mt-1 text-lg font-bold text-slate-900">GSTR-2B Statement</h4>
                                            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                                                Automated reconciliation of purchase register against live portal GSTR-2B ITC entries.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleExport('GSTR_2B_Reconciliation_FY26.xlsx')}
                                            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            Export Summary (.xlsx)
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 6. Partner Conversion Banner */}
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
                    className="mt-12 rounded-[2.5rem] bg-cyan-900 px-6 py-12 text-center shadow-2xl sm:px-12 sm:py-16 relative overflow-hidden"
                >
                    <div className="absolute left-1/2 top-0 h-[200px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/30 blur-[80px] animate-pulse-soft"></div>

                    <h3 className="relative z-10 text-2xl font-extrabold text-white sm:text-3xl">
                        Become a Crown Ecosystems Audit Partner
                    </h3>
                    <p className="relative z-10 mx-auto mt-4 max-w-2xl text-sm text-cyan-100 sm:text-base">
                        Manage all your MSME client books with zero software licensing costs for your firm. Get complimentary access to your clients' read-only portals today.
                    </p>

                    <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="/contact"
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-cyan-500 px-8 py-3.5 text-sm font-bold text-cyan-950 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-cyan-500/30"
                        >
                            Apply for ICAI Partner Access
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-600 bg-slate-800/50 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800"
                        >
                            Back to Home
                        </Link>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}