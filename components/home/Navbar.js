"use client"
import Link from 'next/link';
import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';


const NAV_LINKS = [
    { name: 'Overview', href: '/overview' },
    { name: 'Who It’s For', href: '/who' },
    { name: 'Benefits', href: '/benefits' },
    { name: 'Software-Purchase/Pricing', href: '/purchase' },
    { name: 'Contact', href: '/contact' },
];

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname(); // Tracks the current active route

    // Scroll listener for dynamic glassmorphism effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-40 w-full animate-fade-in delay-300 transition-all duration-500 ${scrolled
                ? 'border-b border-slate-200/80 bg-white/80 backdrop-brightness-0 shadow-sm'
                : 'bg-transparent border-transparent'
                }`}>
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="group flex items-center gap-2 text-2xl font-extrabold tracking-tighter transition-all animate-slide-down"
                >
                    <span className="text-slate-900 transition-colors group-hover:text-slate-700">Crown</span>
                    <span className="text-emerald-600 transition-colors group-hover:text-emerald-500">Ecosystems</span>
                </Link>
                <nav className="hidden md:absolute md:left-1/2 md:flex md:-translate-x-1/2 md:items-center md:gap-1 animate-slide-down delay-100">
                    {NAV_LINKS.map((link) => {
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`relative px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-md
                                  ${isActive
                                        ? 'text-emerald-700 bg-emerald-50/50'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }
                                `}
                            >
                                {link.name}
                                {/* Active Indicator Underline */}
                                {isActive && (
                                    <span className="absolute bottom-1 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-emerald-600 animate-scale-in" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <div className="hidden items-center gap-4 md:flex animate-slide-down delay-200">
                    <Link
                        href="/login"
                        className="relative px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-md hover:bg-slate-50 w-25 h-8 text-center pt-1"
                    >
                        Sign In
                    </Link>

                    <Link
                        href="demo/owner"
                        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-800 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-900/30 active:translate-y-0"
                    >
                        <LayoutDashboard size={20} />
                        Demo
                    </Link>
                </div>
                <div className="flex md:hidden animate-slide-down delay-100">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="group inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>
            <div
                className={`absolute inset-x-0 top-full origin-top transform border-b border-slate-200 bg-white px-4 pb-6 pt-2 shadow-xl transition-all duration-300 md:hidden ${mobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
                    }`}
            >
                <nav className="flex flex-col space-y-1">
                    {NAV_LINKS.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block rounded-lg px-4 py-3 text-base font-semibold transition-all ${isActive
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}

                    <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-slate-100">
                        <Link
                            href="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex w-full items-center justify-center rounded-lg border-2 border-slate-200 bg-transparent px-4 py-3 text-base font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/owner"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-800"
                        >
                            <LayoutDashboard />
                            Demo
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    )
}

export default Navbar
