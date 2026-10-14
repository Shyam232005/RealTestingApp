import React from 'react'
import Link from 'next/link'

const footerLinks = {
    platform: [
        { name: 'Platform Overview', href: '/overview' },
        { name: 'Core Capabilities', href: '/benefits' },
        { name: 'Pricing & Plans', href: '/purchase' },
        { name: 'Request Demo', href: '/demo/owner' },
    ],
    solutions: [
        { name: 'For MSME Founders', href: '/who' },
        { name: 'For Finance Teams', href: '/who' },
        { name: 'For Chartered Accountants', href: '/who' },
        { name: 'CA Auditor Portal', href: '/demo/ca' },
    ],
    company: [
        { name: 'Contact Advisory Desk', href: '/contact' },
        { name: 'Partner Registration', href: '/login' },
        { name: 'System Status', href: '/benefits' },
    ],
    legal: [
        { name: 'Privacy Policy', href: '/policy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Data Security', href: '/security' },
    ]
};

const Footer = () => {
    return (
        <footer className="bg-slate-950 pt-20 pb-10 font-sans text-slate-300 border-t border-slate-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 border-b border-slate-800/60 pb-16">

                    {/* Brand Column (Takes up 4 cols on large screens) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link href="/" className="flex items-center gap-1.5 text-2xl font-extrabold tracking-tighter transition-opacity hover:opacity-90">
                            <span className="text-white">Crown</span>
                            <span className="text-emerald-500">Ecosystems</span>
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-400 pr-4">
                            Standalone Cloud FinOps & Core ERP. We bridge the gap between daily MSME factory operations and strict statutory accounting, eliminating manual data entry.
                        </p>

                        {/* Trust Badges */}
                        <div className="flex flex-col gap-3 pt-2">
                            <div className="inline-flex items-center gap-2">
                                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="text-xs font-semibold text-slate-300">100% MCA Audit Trail Compliant</span>
                            </div>
                            <div className="inline-flex items-center gap-2">
                                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                <span className="text-xs font-semibold text-slate-300">256-bit SSL Encrypted Cloud</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Columns (Take up 8 cols on large screens) */}
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:pl-10">
                        {/* Platform Links */}
                        <div>
                            <h3 className="text-sm font-bold tracking-wider text-white uppercase mb-5">Platform</h3>
                            <ul className="space-y-3.5 text-sm">
                                {footerLinks.platform.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href} className="text-slate-400 transition-colors hover:text-emerald-400">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Solutions Links */}
                        <div>
                            <h3 className="text-sm font-bold tracking-wider text-white uppercase mb-5">Solutions</h3>
                            <ul className="space-y-3.5 text-sm">
                                {footerLinks.solutions.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href} className="text-slate-400 transition-colors hover:text-emerald-400">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company Links */}
                        <div className="col-span-2 sm:col-span-1">
                            <h3 className="text-sm font-bold tracking-wider text-white uppercase mb-5">Company</h3>
                            <ul className="space-y-3.5 text-sm">
                                {footerLinks.company.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href} className="text-slate-400 transition-colors hover:text-emerald-400">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
                    <p className="text-xs font-medium text-slate-500 text-center sm:text-left">
                        © 2026 Crown Ecosystems Private Limited. All rights reserved. <br className="sm:hidden" />
                        <span className="hidden sm:inline"> | </span>
                        Engineered in Surat & Ahmedabad, India.
                    </p>

                    <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-medium">
                        {footerLinks.legal.map((link) => (
                            <li key={link.name}>
                                <Link href={link.href} className="text-slate-500 transition-colors hover:text-slate-300">
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    )
}

export default Footer
