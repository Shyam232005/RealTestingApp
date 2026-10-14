'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThreeWayMatchSimulator from '@/components/dynamic/ThreeWayMatchSimulator';

// Refined Framer Motion Animations
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

export default function OverviewPage() {
    return (
        <div className="relative w-full bg-[#FAFAFA] pb-24 pt-12 sm:pt-20 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24">

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
                        Comprehensive Product Guide
                    </motion.div>

                    <motion.h1 variants={fadeUp} className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                        What is Crown Ecosystems?
                    </motion.h1>

                    <motion.p variants={fadeUp} className="mx-auto text-lg leading-relaxed text-slate-600 sm:text-xl max-w-3xl font-medium">
                        A standalone, cloud-native Financial Operations (FinOps) and Core ERP platform designed specifically for Indian MSMEs. We bridge the gap between daily operations and statutory accounting, replacing fragile desktop packages and complex foreign software.
                    </motion.p>
                </motion.section>

                {/* THE PROBLEM SECTION */}
                <motion.section
                    className="relative"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <motion.div variants={fadeUp} className="text-center mb-12">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">The Ground Reality</h2>
                        <h3 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Why Indian MSMEs Struggle with Cash Outflow</h3>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Crisis 1 */}
                        <motion.div variants={fadeUp} className="group relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/30 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-rose-100/50 hover:-translate-y-1">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-600 border border-rose-200/50">
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-black text-slate-900">Crisis 1: The "Dirty Data" Leak</h4>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600 font-medium">
                                Vendor bills arrive via WhatsApp, skewed PDFs, and handwritten challans. Because data is manually re-typed:
                            </p>
                            <ul className="mt-6 space-y-4 text-sm font-medium text-slate-700">
                                <li className="flex items-start gap-3"><span className="text-rose-500 font-black mt-0.5">✕</span> Invoices get paid twice due to typos.</li>
                                <li className="flex items-start gap-3"><span className="text-rose-500 font-black mt-0.5">✕</span> Vendors bill higher rates than the PO.</li>
                                <li className="flex items-start gap-3"><span className="text-rose-500 font-black mt-0.5">✕</span> Ineligible GST input tax credits (ITC) trigger notices and 18% penalties.</li>
                            </ul>
                        </motion.div>

                        {/* Crisis 2 */}
                        <motion.div variants={fadeUp} className="group relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-b from-white to-amber-50/30 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-amber-100/50 hover:-translate-y-1">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600 border border-amber-200/50">
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-black text-slate-900">Crisis 2: The Desktop Bottleneck</h4>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600 font-medium">
                                Accounts departments rely on legacy software installed on a single office PC:
                            </p>
                            <ul className="mt-6 space-y-4 text-sm font-medium text-slate-700">
                                <li className="flex items-start gap-3"><span className="text-amber-500 font-black mt-0.5">✕</span> Founders cannot approve bills when traveling.</li>
                                <li className="flex items-start gap-3"><span className="text-amber-500 font-black mt-0.5">✕</span> Data corrupts during power cuts or updates.</li>
                                <li className="flex items-start gap-3"><span className="text-amber-500 font-black mt-0.5">✕</span> CAs receive data only at year-end, causing massive tax-filing scrambles.</li>
                            </ul>
                        </motion.div>
                    </div>
                </motion.section>

                {/* THE SOLUTION SECTION */}
                <motion.section
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <motion.div variants={fadeUp} className="text-center mb-12">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600">The Solution</h2>
                        <h3 className="mt-2 text-3xl font-black text-slate-900">From Vendor Invoice to Audit-Ready Ledger</h3>
                        <p className="mt-3 text-lg text-slate-600 font-medium">Every step is automated to eliminate data entry while maintaining rigorous checks.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {[
                            {
                                step: "01",
                                title: "Smart Intake & Data Cleansing",
                                desc: "Upload bills in any format. The system reads vendor names, GSTINs, line items, and tax rates. It automatically verifies GSTIN status and ensures tax math (CGST + SGST) adds up correctly.",
                                benefit: "No manual voucher typing; duplicate bills caught instantly."
                            },
                            {
                                step: "02",
                                title: "Automated 3-Way Matching",
                                desc: "Before approval, the system compares the Purchase Order (PO), Goods Receipt Note (GRN), and Vendor Tax Invoice. Any discrepancy in rates or quantities is immediately flagged.",
                                benefit: "You never overpay for unreceived goods or unauthorized rate increases."
                            },
                            {
                                step: "03",
                                title: "Mobile Payout Decision Board",
                                desc: "Founders see clean summary cards on their phones showing Vendor Name, Amount, Due Date, and Trust Badges. Approve, Hold, or Reject with one tap.",
                                benefit: "Control company cash flow from anywhere, without paper files."
                            },
                            {
                                step: "04",
                                title: "Native Ledger & Live CA Audit",
                                desc: "Upon approval, the system instantly generates a strictly balanced double-entry journal (Debits = Credits). Your GL and Trial Balance update in real-time for your CA.",
                                benefit: "Full MCA-compliant audit trail with original PDF attachments."
                            }
                        ].map((item, index) => (
                            <motion.div variants={fadeUp} key={index} className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 sm:p-10 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1">
                                <div className="absolute -top-6 -right-4 text-[120px] font-black text-slate-50 leading-none select-none pointer-events-none">{item.step}</div>
                                <div className="relative z-10">
                                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white mb-6 shadow-sm">
                                        {item.step}
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900">{item.title}</h4>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">{item.desc}</p>
                                    <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                                        <p className="text-sm font-medium text-indigo-900">
                                            <span className="font-black">Result:</span> {item.benefit}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* DYNAMIC 3-WAY MATCHING SIMULATOR */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <ThreeWayMatchSimulator />
                </motion.section>

                {/* ARCHITECTURE COMPARISON TABLE */}
                <motion.section
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <motion.div variants={fadeUp} className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-900">Architectural Comparison</h2>
                    </motion.div>

                    <motion.div variants={fadeUp} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/80">
                                    <tr>
                                        <th className="p-6 font-black text-slate-900 border-b border-slate-200 whitespace-nowrap">Capability</th>
                                        <th className="p-6 font-bold text-slate-500 border-b border-slate-200 whitespace-nowrap">Legacy Desktop</th>
                                        <th className="p-6 font-bold text-slate-500 border-b border-slate-200 whitespace-nowrap">Foreign Cloud ERPs</th>
                                        <th className="p-6 font-black text-indigo-700 bg-indigo-50/80 border-b border-indigo-100 whitespace-nowrap">Crown Ecosystems</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        ['Platform Access', 'Single office PC; no mobile', 'Complex Web/Cloud', '100% Cloud; Mobile-native'],
                                        ['Bill Ingestion', '100% manual typing', 'Requires expensive plugins', 'Built-in smart PDF/CSV intake'],
                                        ['Order Matching', 'Manual paper comparison', 'Rigid; requires full-time operator', 'Automated 3-way match'],
                                        ['Indian Statutory', 'Basic; manual 2B matching', 'Poorly configured for GST/TDS', 'Native 43B(h), 194Q & 2B ITC'],
                                        ['Audit Trail', 'Can be disabled or corrupted', 'Complex, costly add-on', 'Built-in immutable MCA log'],
                                        ['CA Access', 'Zip files emailed at year-end', 'Requires extra paid licenses', 'Free, dedicated CA Portal']
                                    ].map((row, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6 font-bold text-slate-900 whitespace-nowrap">{row[0]}</td>
                                            <td className="p-6 text-slate-500 font-medium">{row[1]}</td>
                                            <td className="p-6 text-slate-500 font-medium">{row[2]}</td>
                                            <td className="p-6 font-bold text-indigo-900 bg-indigo-50/30 group-hover:bg-indigo-50/80 transition-colors">{row[3]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </motion.section>

                {/* TESTIMONIAL / CASE STUDY */}
                <motion.section
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-16 sm:px-12 sm:py-24 shadow-2xl"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 sm:gap-16">

                        <motion.div variants={fadeUp} className="flex-1 space-y-6 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-300 backdrop-blur-sm">
                                Real-World Impact
                            </div>
                            <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl tracking-tight">
                                ₹12 Cr Turnover Precision Engineering Firm
                            </h2>
                            <p className="text-lg leading-relaxed text-slate-400 font-medium">
                                Before Crown Ecosystems, their accounts clerk spent 3 hours daily typing 180 supplier bills. At year-end, their CA found <span className="text-indigo-300 font-bold">₹3.4 Lakhs in blocked ITC</span> due to suspended vendor GSTINs. Now, that entire workflow is automated and verified instantly.
                            </p>
                        </motion.div>

                        <motion.div variants={staggerContainer} className="grid w-full flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                            <motion.div variants={fadeUp} className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md shadow-lg transition-transform hover:-translate-y-1">
                                <p className="text-5xl font-black text-indigo-400 tracking-tighter">100%</p>
                                <p className="mt-3 text-sm font-bold text-slate-300">ITC preserved with live 2B matching</p>
                            </motion.div>
                            <motion.div variants={fadeUp} className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md shadow-lg transition-transform hover:-translate-y-1">
                                <p className="text-5xl font-black text-indigo-400 tracking-tighter">0</p>
                                <p className="mt-3 text-sm font-bold text-slate-300">Duplicate payments eliminated</p>
                            </motion.div>
                            <motion.div variants={fadeUp} className="sm:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-md text-center shadow-lg transition-transform hover:-translate-y-1">
                                <p className="text-5xl font-black text-indigo-400 tracking-tighter">15 Mins</p>
                                <p className="mt-3 text-sm font-bold text-slate-300">Daily founder payment review time</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* CTA SECTION */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 sm:p-10 shadow-xl shadow-slate-200/40"
                >
                    <div className="text-center sm:text-left">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ready to align operations and accounting?</h3>
                        <p className="mt-2 text-sm font-medium text-slate-500">Explore tailored workflows or view our transparent pricing.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
                        <Link
                            href="/who"
                            className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                        >
                            Read Who It's For
                        </Link>
                        <Link
                            href="/purchase"
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5"
                        >
                            View Pricing Plans
                        </Link>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}