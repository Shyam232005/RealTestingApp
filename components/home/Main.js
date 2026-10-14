"use client"
import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import FinOpsHeroPreview from '@/components/dynamic/FinOpsHeroPreview'
import StakeholderShowcase from '@/components/dynamic/StakeholderShowcase'
import InteractivePlatformTour from '@/components/dynamic/InteractivePlatformTour'
import AntigravityPlayground from '@/components/dynamic/AntigravityPlayground'
import RoiComplianceCalculator from '@/components/dynamic/RoiComplianceCalculator'

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const fadeDown = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const Main = () => {
    return (
        <main className="relative w-full overflow-hidden">
            {/* 1. HERO SECTION WITH DYNAMIC LIVE PREVIEW */}
            <section id="overview" className="relative border-b border-slate-200/60 bg-white px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-28">
                <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>

                <motion.div
                    className="mx-auto max-w-5xl text-center"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <motion.div variants={fadeDown} className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm transition-all hover:bg-emerald-100">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                        </span>
                        Universal Financial Operations for Growing MSMEs & CAs
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.15]">
                        Replace Outdated Desktop Ledgers with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600">Cloud FinOps</span>
                    </motion.h1>

                    <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl font-medium">
                        No more single-computer access locks or end-of-quarter auditing scrambles.
                        Crown Ecosystems unifies invoice capture, executive approvals, and balanced double-entry accounting.
                    </motion.p>

                    {/* Preserving exact link destinations */}
                    <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href="/contact" className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl cursor-pointer">
                            Request a Product Demo
                            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </Link>
                        <Link href="who" className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-8 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 cursor-pointer">
                            Explore Modules
                        </Link>
                    </motion.div>

                    {/* DYNAMIC LIVE FINOPS PREVIEW EMBEDDED */}
                    <motion.div variants={fadeUp}>
                        <FinOpsHeroPreview />
                    </motion.div>

                    {/* Stat Badges */}
                    <motion.div variants={fadeUp} className="mx-auto mt-16 max-w-4xl rounded-2xl border border-slate-200/80 bg-white/60 p-2 shadow-sm backdrop-blur-lg">
                        <div className="grid grid-cols-2 divide-y divide-slate-200/80 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                            {[
                                { title: 'Debit = Credit', sub: 'Always-balanced journals' },
                                { title: 'Zero Data Entry', sub: 'Automated invoice mapping' },
                                { title: 'Direct CA Portal', sub: 'Read-only audit workspace' },
                                { title: 'MCA Compliant', sub: 'Audit trail & GST ready' },
                            ].map((stat, i) => (
                                <div key={i} className="p-4 sm:p-6 text-center">
                                    <p className="text-lg font-extrabold text-slate-900 sm:text-xl">{stat.title}</p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">{stat.sub}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* 2. DYNAMIC STAKEHOLDERS SECTION */}
            <section id="stakeholders" className="bg-[#FAFAFA] py-20 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-700">Unified Architecture</h2>
                        <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Designed for the Entire Financial Ecosystem
                        </p>
                        <p className="mt-4 text-lg text-slate-600 font-medium">
                            A single source of truth where stakeholders get exactly what they need, without the clutter of what they don't.
                        </p>
                    </motion.div>

                    {/* Dynamic Interactive Stakeholder Showcase */}
                    <StakeholderShowcase />
                </div>
            </section>

            {/* 3. DYNAMIC CORE PLATFORM CAPABILITIES */}
            <section id="core-platform" className="border-t border-slate-200/60 bg-white py-20 sm:py-28">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        className="text-center mb-10"
                    >
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Platform Capabilities</h2>
                        <p className="mt-4 text-lg text-slate-600 font-medium">End-to-end financial operations from intake to balance sheet.</p>
                    </motion.div>

                    {/* Interactive Platform Tour with Live Scanner & Ledger Equalizer */}
                    <InteractivePlatformTour />
                </div>
            </section>

            {/* 4. ANTIGRAVITY FINOPS PHYSICS PLAYGROUND */}
            <section className="bg-slate-50/50 py-16 border-t border-slate-200/60">
                <AntigravityPlayground />
            </section>

            {/* 5. DYNAMIC ROI & COMPLIANCE CALCULATOR */}
            <RoiComplianceCalculator />

            {/* 6. BOTTOM CONVERSION CTA */}
            <section id="contact" className="py-20 sm:py-32 overflow-hidden bg-white">
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        className="relative rounded-[2.5rem] bg-emerald-950 px-6 py-20 text-center shadow-2xl sm:px-12"
                    >
                        <div className="absolute left-1/2 top-1/2 -z-10 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/30 blur-[100px] animate-pulse-soft"></div>

                        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Bring Your Business and Auditors Onto One Secure Platform
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg text-emerald-100/80 font-medium">
                            Experience strictly-balanced cloud FinOps, zero manual data entry, and an audit-ready CA portal.
                        </p>

                        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                            <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-emerald-950 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-500/30 cursor-pointer">
                                Book an MSME & CA Demo
                            </Link>
                            <Link href="overview" className="inline-flex items-center justify-center rounded-xl border border-emerald-700 bg-emerald-900/50 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-800 cursor-pointer">
                                Back to Overview
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}

export default Main
