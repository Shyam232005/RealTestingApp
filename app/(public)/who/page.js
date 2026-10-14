'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Refined Spring Animations matching your SaaS theme
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

const fadeDown = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.05 }
    }
};

export default function WhoItsForPage() {
    return (
        <div className="relative w-full bg-[#FAFAFA] pb-24 pt-12 sm:pt-20 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24">

                {/* HEADER SECTION */}
                <motion.section
                    className="text-center max-w-4xl mx-auto space-y-6"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <motion.div variants={fadeDown} className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-700 shadow-sm backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600"></span>
                        </span>
                        Tailored Stakeholder Workspaces
                    </motion.div>
                    
                    <motion.h1 variants={fadeUp} className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                        Who Is Crown Ecosystems Built For?
                    </motion.h1>
                    
                    <motion.p variants={fadeUp} className="mx-auto text-lg leading-relaxed text-slate-600 sm:text-xl font-medium max-w-3xl">
                        Founders, in-house accountants, and external CAs often have conflicting priorities. We bring all three onto a single, cooperative cloud platform—without forcing anyone to change their fundamental workflows.
                    </motion.p>

                    {/* Quick Persona Navigation Bar */}
                    <motion.div variants={fadeUp} className="pt-4 flex flex-wrap justify-center gap-2">
                        <a
                            href="#persona-founders"
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                        >
                            1. Founders & Directors
                        </a>
                        <a
                            href="#persona-finance"
                            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors"
                        >
                            2. In-House Finance
                        </a>
                        <a
                            href="#persona-auditors"
                            className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100 transition-colors"
                        >
                            3. Chartered Accountants
                        </a>
                    </motion.div>
                </motion.section>

                {/* PERSONA 1: FOUNDERS */}
                <motion.section
                    id="persona-founders"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40"
                >
                    <div className="p-8 sm:p-12 lg:p-16">
                        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                            <div className="flex items-center gap-5">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-600 shadow-sm">
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-sm font-bold uppercase tracking-widest text-emerald-600">Persona 1: Executive Control</span>
                                    <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">MSME Founders & Directors</h2>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                                <span className="text-emerald-500 text-lg">🎯</span> Core Value: Peace of Mind & Cash Control
                            </div>
                        </motion.div>

                        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Frustrations */}
                            <motion.div variants={fadeUp} className="rounded-3xl border border-rose-100 bg-rose-50/30 p-8 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-rose-800 border-b border-rose-200/60 pb-4 mb-5">
                                    The Daily Frustrations
                                </h3>
                                <ul className="space-y-5 text-sm text-slate-700 font-medium">
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-700 font-black text-[10px] mt-0.5 border border-rose-200">✕</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Signing checks blind:</strong> Approving RTGS transfers or signing checks without knowing if the raw material actually arrived in the factory.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-700 font-black text-[10px] mt-0.5 border border-rose-200">✕</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Duplicate payment leaks:</strong> Paying an invoice twice because the supplier sent it on WhatsApp and later submitted a physical bill.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-700 font-black text-[10px] mt-0.5 border border-rose-200">✕</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">No remote visibility:</strong> Unable to know upcoming liabilities or bank balance while traveling, meeting clients, or visiting plants.</span>
                                    </li>
                                </ul>
                            </motion.div>

                            {/* Solutions */}
                            <motion.div variants={fadeUp} className="rounded-3xl border border-emerald-100 bg-emerald-50/30 p-8 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-800 border-b border-emerald-200/60 pb-4 mb-5">
                                    How We Solve It
                                </h3>
                                <ul className="space-y-5 text-sm text-slate-800 font-medium">
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-black text-[10px] mt-0.5 shadow-sm shadow-emerald-500/30">✓</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Mobile-First Decision Cards:</strong> Review bills on your smartphone with a verified trust badge showing that delivery and PO rates match.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-black text-[10px] mt-0.5 shadow-sm shadow-emerald-500/30">✓</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Duplicate Shield:</strong> The system automatically blocks duplicate invoice numbers from the same vendor.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-black text-[10px] mt-0.5 shadow-sm shadow-emerald-500/30">✓</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Clear Cash Outflow:</strong> See total bills ready for payment, bills on hold, and upcoming due dates in one clean dashboard.</span>
                                    </li>
                                </ul>
                            </motion.div>
                        </div>

                        {/* Story Card */}
                        <motion.div variants={fadeUp} className="mt-8 rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-10 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute -right-10 -top-10 opacity-[0.03] transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                                <svg className="h-64 w-64 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4">A Day in the Life</h4>
                            <p className="text-base sm:text-lg leading-relaxed text-slate-300 relative z-10 font-medium italic">
                                "You open the app on your phone at 10:00 AM. Three supplier bills are waiting for sign-off. Bill #1 is a regular steel delivery; the system displays a green badge: <span className="inline-block bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md text-emerald-300 not-italic font-bold text-sm mx-1">Matches Order & Delivery</span>. You tap <strong className="text-white">Approve</strong>. Bill #2 has a price discrepancy (billed ₹450 vs PO ₹410); you tap <strong className="text-white">Put on Hold</strong> with a quick voice-to-text note for your purchase manager. Total review time: under 2 minutes."
                            </p>
                        </motion.div>
                    </div>
                </motion.section>

                {/* PERSONA 2: OPERATIONS */}
                <motion.section
                    id="persona-finance"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40"
                >
                    <div className="p-8 sm:p-12 lg:p-16">
                        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                            <div className="flex items-center gap-5">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-600 shadow-sm">
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zM12 8.25h.008v.008H12v-.008zm0 2.25h.008v.008H12v-.008zm0 2.25h.008v.008H12v-.008zm0 2.25h.008v.008H12v-.008zm0 2.25h.008v.008H12v-.008zM15.75 8.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Persona 2: Operations Team</span>
                                    <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">In-House Accounts & Finance</h2>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                                <span className="text-blue-500 text-lg">⚡</span> Core Value: Zero Data Entry & Clean Books
                            </div>
                        </motion.div>

                        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Frustrations */}
                            <motion.div variants={fadeUp} className="rounded-3xl border border-rose-100 bg-rose-50/30 p-8 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-rose-800 border-b border-rose-200/60 pb-4 mb-5">
                                    The Daily Frustrations
                                </h3>
                                <ul className="space-y-5 text-sm text-slate-700 font-medium">
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-700 font-black text-[10px] mt-0.5 border border-rose-200">✕</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Typing vouchers all day:</strong> Re-keying identical invoice data, vendor addresses, HSN codes, and tax values line by line.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-700 font-black text-[10px] mt-0.5 border border-rose-200">✕</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Caught in the middle:</strong> Facing constant calls from vendors asking for payment status while waiting for the owner to sign paper slips.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-700 font-black text-[10px] mt-0.5 border border-rose-200">✕</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Manual TDS & GST math:</strong> Calculating TDS u/s 194Q, 194C on calculators and manually splitting CGST/SGST.</span>
                                    </li>
                                </ul>
                            </motion.div>

                            {/* Solutions */}
                            <motion.div variants={fadeUp} className="rounded-3xl border border-blue-100 bg-blue-50/30 p-8 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-800 border-b border-blue-200/60 pb-4 mb-5">
                                    How We Solve It
                                </h3>
                                <ul className="space-y-5 text-sm text-slate-800 font-medium">
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-black text-[10px] mt-0.5 shadow-sm shadow-blue-500/30">✓</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Forgiving Invoice Mapper:</strong> Drop in PDF bills or supplier Excel exports; the engine maps columns and auto-extracts data.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-black text-[10px] mt-0.5 shadow-sm shadow-blue-500/30">✓</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Automatic Tax Calculations:</strong> Built-in tax engines handle GST slab splits and automatically compute statutory TDS deductions.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-black text-[10px] mt-0.5 shadow-sm shadow-blue-500/30">✓</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Automated Voucher Creation:</strong> Approved bills automatically generate balanced purchase vouchers without re-typing.</span>
                                    </li>
                                </ul>
                            </motion.div>
                        </div>

                        {/* Story Card Unified Design */}
                        <motion.div variants={fadeUp} className="mt-8 rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-10 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute -right-10 -top-10 opacity-[0.03] transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                                <svg className="h-64 w-64 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4">A Day in the Life</h4>
                            <p className="text-base sm:text-lg leading-relaxed text-slate-300 relative z-10 font-medium italic">
                                "Instead of spending half your workday typing bills into an offline desktop software, you drag a batch of 15 supplier invoices into Crown Ecosystems. The system highlights 14 clean bills and flags 1 bill with an expired GSTIN. You review the mapped numbers, click <strong className="text-white">Route to Approvals</strong>, and your work is done. You are free to focus on actual vendor reconciliation."
                            </p>
                        </motion.div>
                    </div>
                </motion.section>

                {/* PERSONA 3: AUDITORS */}
                <motion.section
                    id="persona-auditors"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40"
                >
                    <div className="p-8 sm:p-12 lg:p-16">
                        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                            <div className="flex items-center gap-5">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-600 shadow-sm">
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-sm font-bold uppercase tracking-widest text-purple-600">Persona 3: Statutory Audit</span>
                                    <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Chartered Accountants & Auditors</h2>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                                <span className="text-purple-500 text-lg">🛡️</span> Core Value: 100% Audit Readiness
                            </div>
                        </motion.div>

                        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Frustrations */}
                            <motion.div variants={fadeUp} className="rounded-3xl border border-rose-100 bg-rose-50/30 p-8 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-rose-800 border-b border-rose-200/60 pb-4 mb-5">
                                    The Daily Frustrations
                                </h3>
                                <ul className="space-y-5 text-sm text-slate-700 font-medium">
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-700 font-black text-[10px] mt-0.5 border border-rose-200">✕</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Corrupted backup files:</strong> Waiting until September for clients to send backup files, only to find missing entries and broken balances.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-700 font-black text-[10px] mt-0.5 border border-rose-200">✕</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Section 43B(h) compliance traps:</strong> Discovering late payments to micro & small suppliers beyond 45 days, causing severe tax disallowances.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200/50 text-rose-700 font-black text-[10px] mt-0.5 border border-rose-200">✕</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Missing audit trails:</strong> MCA audit log requirements being breached because client software lacks an immutable edit log.</span>
                                    </li>
                                </ul>
                            </motion.div>

                            {/* Solutions */}
                            <motion.div variants={fadeUp} className="rounded-3xl border border-purple-100 bg-purple-50/30 p-8 hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-purple-800 border-b border-purple-200/60 pb-4 mb-5">
                                    How We Solve It
                                </h3>
                                <ul className="space-y-5 text-sm text-slate-800 font-medium">
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white font-black text-[10px] mt-0.5 shadow-sm shadow-purple-500/30">✓</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Free Dedicated CA Portal:</strong> Read-only workspace accessible year-round; no waiting for client backup zips.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white font-black text-[10px] mt-0.5 shadow-sm shadow-purple-500/30">✓</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Voucher-Level PDF Verification:</strong> Click any journal entry to inspect the original signed tax invoice PDF attached to the record.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white font-black text-[10px] mt-0.5 shadow-sm shadow-purple-500/30">✓</span>
                                        <span className="leading-relaxed"><strong className="text-slate-900">Statutory Tax Packs:</strong> Export Trial Balances, Creditors Ageing, and Section 44AB Tax Audit workbooks straight into Excel.</span>
                                    </li>
                                </ul>
                            </motion.div>
                        </div>

                        {/* Story Card Unified Design */}
                        <motion.div variants={fadeUp} className="mt-8 rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-10 text-white relative overflow-hidden group shadow-xl">
                            <div className="absolute -right-10 -top-10 opacity-[0.03] transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                                <svg className="h-64 w-64 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-4">A Day in the Life</h4>
                            <p className="text-base sm:text-lg leading-relaxed text-slate-300 relative z-10 font-medium italic">
                                "You log into your CA Auditor Portal in August, weeks ahead of the tax audit deadline. The General Ledger is mathematically balanced. You verify GSTR-2B Input Tax Credit matches with zero discrepancy, check that no MSME dues exceed 45 days, and download the full Section 44AB workbook formatted to ICAI standards. Zero stress, zero last-minute firefighting."
                            </p>
                        </motion.div>
                    </div>
                </motion.section>

                {/* BOTTOM CTA SECTION */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-20 text-center shadow-2xl sm:px-12"
                >
                    {/* Ambient Glow */}
                    <div className="absolute left-1/2 top-1/2 -z-10 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none"></div>

                    <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                        A Single Platform Where Everyone Succeeds
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 font-medium">
                        The founder gets control over cash; the accounts executive is relieved of manual typing; and the Chartered Accountant receives mathematically balanced, audit-compliant books.
                    </p>

                    <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="/demo/owner"
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
                        >
                            Experience Founder Approvals
                        </Link>
                        <Link
                            href="/demo/ca"
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-slate-700 hover:border-slate-600 backdrop-blur-sm"
                        >
                            Explore CA Portal
                        </Link>
                        <Link
                            href="/purchase"
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-slate-700 hover:border-slate-600 backdrop-blur-sm"
                        >
                            View Subscription Plans
                        </Link>
                    </div>
                </motion.section>

            </div>
        </div>
    );
}