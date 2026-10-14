'use client';
import React, { useState } from 'react';
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

export default function OwnerDemoPage() {
    const INITIAL_BALANCE = 1842500;
    const [bankBalance, setBankBalance] = useState(INITIAL_BALANCE);
    const [previousBalance, setPreviousBalance] = useState(INITIAL_BALANCE); // To determine scroll direction

    const initialBills = [
        {
            id: 'BILL-01',
            vendor: 'Surat Industrial Packaging',
            invoiceNo: 'SIP-9921',
            dueDate: '19 Sep 2026',
            amount: 53100,
            badge: 'Matches Order & Delivery',
            status: 'pending', // 'pending' | 'cleared' | 'held'
            isVerified: true,
        },
        {
            id: 'BILL-02',
            vendor: 'Gujarat Precision Castings',
            invoiceNo: 'GPC-084',
            dueDate: '22 Sep 2026',
            amount: 147500,
            badge: 'Matches Order & Delivery',
            status: 'pending',
            isVerified: true,
        },
        {
            id: 'BILL-03',
            vendor: 'Rajkot Tools & Hardware',
            invoiceNo: 'RTH-1104',
            dueDate: '25 Sep 2026',
            amount: 45000,
            badge: 'Matches Order & Delivery',
            status: 'pending',
            isVerified: true,
        },
        {
            id: 'BILL-04',
            vendor: 'Apex Electricals & Spares',
            invoiceNo: 'AE-301',
            dueDate: '14 Sep 2026',
            amount: 88500,
            badge: 'Rate Discrepancy Flagged',
            status: 'held',
            isVerified: false,
        },
    ];

    const [bills, setBills] = useState(initialBills);

    const handleApprove = (id, amount) => {
        setBills((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: 'cleared' } : b))
        );
        setPreviousBalance(bankBalance);
        setBankBalance((prev) => prev - amount);
    };

    const handleHold = (id) => {
        setBills((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: 'held' } : b))
        );
    };

    const handleRevert = (id, amount, currentStatus) => {
        setBills((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: 'pending' } : b))
        );
        if (currentStatus === 'cleared') {
            setPreviousBalance(bankBalance);
            setBankBalance((prev) => prev + amount);
        }
    };

    const handleReset = () => {
        setPreviousBalance(bankBalance);
        setBankBalance(INITIAL_BALANCE);
        setBills(initialBills);
    };

    // Metrics
    const pendingBills = bills.filter((b) => b.status === 'pending');
    const clearedBills = bills.filter((b) => b.status === 'cleared');

    const pendingSum = pendingBills.reduce((acc, b) => acc + b.amount, 0);
    const clearedSum = clearedBills.reduce((acc, b) => acc + b.amount, 0);

    // Determines if numbers should scroll up or down based on value change
    const balanceDirection = bankBalance > previousBalance ? -20 : 20;

    return (
        <div className="relative min-h-screen w-full bg-[#F8FAFC] pb-24 font-sans text-slate-900 selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">
            <LiveComplianceTicker />
            <div className="overflow-hidden whitespace-nowrap bg-amber-100 border-b border-amber-300 py-1 relative z-20">
                <p className="animate-marquee text-red-600 font-bold text-lg inline-block px-6">
                    ⚠️ This is only a sample view — the original dashboard may look different
                </p>
            </div>

            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 relative z-10 mt-6">

                {/* 1. Header & Navigation */}
                <motion.div
                    initial="hidden" animate="visible" variants={staggerContainer}
                    className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/80 pb-6"
                >
                    <motion.div variants={fadeUp}>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-800 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                            </span>
                            Live Interactive Demo
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Founder Payout Board
                        </h1>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                            Experience 1-click approvals. Watch your cash flow update in real-time.
                        </p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="flex items-center gap-3">
                        <Link
                            href="/demo/ca"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-cyan-800 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                            Switch to CA View
                        </Link>
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                            Reset
                        </button>
                    </motion.div>
                </motion.div>

                {/* 2. Financial Command Center (Metrics) */}
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 gap-4 lg:grid-cols-12">

                    {/* Bank Balance Hero Card */}
                    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl lg:col-span-6">
                        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                            Available Bank Balance
                        </span>
                        <div className="mt-4 flex items-baseline gap-2 overflow-hidden py-1">
                            <span className="text-3xl font-semibold text-slate-400">₹</span>
                            {/* Animated Number Ticker */}
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={bankBalance}
                                    initial={{ opacity: 0, y: balanceDirection }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -balanceDirection }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="font-mono text-5xl font-black tracking-tight text-white sm:text-6xl inline-block"
                                >
                                    {bankBalance.toLocaleString('en-IN')}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            Updates dynamically based on your approvals below
                        </div>
                    </motion.div>

                    {/* Pending & Cleared Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-6">
                        {/* Pending Liability */}
                        <motion.div variants={fadeUp} className="flex flex-col justify-between rounded-[2rem] border border-amber-200/60 bg-gradient-to-b from-white to-amber-50/30 p-8 shadow-sm overflow-hidden">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Awaiting Sign-Off</span>
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={pendingBills.length}
                                            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800"
                                        >
                                            {pendingBills.length}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                                <div className="mt-4 flex items-baseline gap-1.5 text-amber-900 overflow-hidden py-1">
                                    <span className="text-xl font-semibold opacity-70">₹</span>
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={pendingSum}
                                            initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                                            className="font-mono text-4xl font-extrabold tracking-tight inline-block"
                                        >
                                            {pendingSum.toLocaleString('en-IN')}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-amber-700/70 mt-4">Total unapproved vendor liability</p>
                        </motion.div>

                        {/* Cleared / Scheduled */}
                        <motion.div variants={fadeUp} className="flex flex-col justify-between rounded-[2rem] border border-emerald-200/60 bg-gradient-to-b from-white to-emerald-50/30 p-8 shadow-sm overflow-hidden">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Scheduled Payouts</span>
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={clearedBills.length}
                                            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800"
                                        >
                                            {clearedBills.length}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                                <div className="mt-4 flex items-baseline gap-1.5 text-emerald-900 overflow-hidden py-1">
                                    <span className="text-xl font-semibold opacity-70">₹</span>
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={clearedSum}
                                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                                            className="font-mono text-4xl font-extrabold tracking-tight inline-block"
                                        >
                                            {clearedSum.toLocaleString('en-IN')}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-emerald-700/70 mt-4">Automated for bank disbursement</p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* 3. Interactive Approval Queue */}
                <div className="space-y-6 pt-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h2 className="text-lg font-extrabold text-slate-900">
                            Action Required: Vendor Invoices
                        </h2>
                    </div>

                    {/* Layout prop allows cards to smoothly resize/recolor when their state changes */}
                    <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" layout>
                        <AnimatePresence>
                            {bills.map((bill) => {
                                const isCleared = bill.status === 'cleared';
                                const isHeld = bill.status === 'held';

                                return (
                                    <motion.div
                                        key={bill.id}
                                        layout // <--- This enables the smooth background/border transition
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4 }}
                                        className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-colors duration-500 ${isCleared
                                            ? 'border-emerald-500 bg-emerald-50 shadow-emerald-500/20 shadow-lg'
                                            : isHeld
                                                ? 'border-slate-200 bg-slate-100 opacity-70 grayscale-[30%]'
                                                : 'border-slate-200 bg-white shadow-sm hover:border-emerald-300 hover:shadow-xl'
                                            }`}
                                    >
                                        {/* Content Section */}
                                        <div className="relative z-10">
                                            <div className="mb-6">
                                                {bill.isVerified ? (
                                                    <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-100/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                                                        {bill.badge}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-800">
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                        {bill.badge}
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{bill.vendor}</h3>
                                            <p className="mt-1 font-mono text-[11px] text-slate-500">INV: {bill.invoiceNo}</p>

                                            <div className="mt-6 mb-4">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Payable</span>
                                                <p className={`mt-0.5 font-mono text-3xl font-extrabold tracking-tight transition-colors ${isCleared ? 'text-emerald-700' : 'text-slate-900'}`}>
                                                    ₹{bill.amount.toLocaleString('en-IN')}
                                                </p>
                                                <p className="mt-1 text-[11px] font-medium text-slate-500">Due: {bill.dueDate}</p>
                                            </div>
                                        </div>

                                        {/* Action Footers with smooth crossfading */}
                                        <div className="relative z-10 mt-auto pt-4 border-t border-slate-100 min-h-[64px]">
                                            <AnimatePresence mode="wait">

                                                {/* Pending State */}
                                                {bill.status === 'pending' && (
                                                    <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex gap-2">
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleApprove(bill.id, bill.amount)}
                                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-600 hover:shadow-emerald-500/30"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                            Approve
                                                        </motion.button>
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleHold(bill.id)}
                                                            className="flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                                                            title="Put on Hold"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </motion.button>
                                                    </motion.div>
                                                )}

                                                {/* Cleared State */}
                                                {isCleared && (
                                                    <motion.div key="cleared" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-100/50 px-4 py-3">
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Scheduled
                                                        </span>
                                                        <button
                                                            onClick={() => handleRevert(bill.id, bill.amount, 'cleared')}
                                                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-900 transition-colors"
                                                        >
                                                            Undo
                                                        </button>
                                                    </motion.div>
                                                )}

                                                {/* Held State */}
                                                {isHeld && (
                                                    <motion.div key="held" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Paused
                                                        </span>
                                                        <button
                                                            onClick={() => handleRevert(bill.id, bill.amount, 'held')}
                                                            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
                                                        >
                                                            Review Again
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Success Watermark (Visible only when cleared) */}
                                        <AnimatePresence>
                                            {isCleared && (
                                                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute -bottom-6 -right-6 text-emerald-500/10">
                                                    <svg className="h-40 w-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* 4. Conversion Banner */}
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
                    className="mt-12 rounded-[2.5rem] bg-slate-900 px-6 py-12 text-center shadow-2xl sm:px-12 sm:py-16 relative overflow-hidden"
                >
                    <div className="absolute left-1/2 top-0 h-[200px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[80px] animate-pulse-soft"></div>

                    <h3 className="relative z-10 text-2xl font-extrabold text-white sm:text-3xl">
                        Ready to command your company's cash flow?
                    </h3>
                    <p className="relative z-10 mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
                        Stop waiting on manual spreadsheets. With Crown Ecosystems, what you just did updates your General Ledger, Trial Balance, and CA audit portal instantly.
                    </p>

                    <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="/purchase"
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-500/30"
                        >
                            View Subscription Plans
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-600 bg-slate-800 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-700"
                        >
                            Book a Full Demo
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-600 bg-slate-800 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-700"
                        >
                            Go To Home
                        </Link>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}