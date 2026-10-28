"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  ScanLine,
  BookOpen,
  Warehouse,
  FileText,
  Users,
  ShieldCheck,
  TrendingUp,
  SearchX,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const PRESETS = {
  ocr_scanner: {
    icon: ScanLine,
    glowColor: "from-emerald-500/20 via-teal-500/10 to-transparent",
    iconBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "AI Vision Engine Ready",
    title: "Zero Documents Scanned Yet",
    description:
      "Drop any GST Tax Invoice, Delivery Challan, E-Way Bill, or Lorry Receipt (Bilty). Crown AI automatically extracts every line item, HSN code, and tax breakdown with zero typing required.",
    defaultActionText: "Scan First Document",
  },
  ledger: {
    icon: BookOpen,
    glowColor: "from-indigo-500/20 via-purple-500/10 to-transparent",
    iconBg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    badge: "Ledger Books Clean",
    title: "No Journal Entries Recorded",
    description:
      "Your double-entry general ledger is currently empty. Record starting balances or post a debit/credit voucher to generate instant T-accounts.",
    defaultActionText: "Record Starting Balance",
  },
  financial_statements: {
    icon: TrendingUp,
    glowColor: "from-purple-500/20 via-pink-500/10 to-transparent",
    iconBg: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    badge: "Real-Time Aggregation",
    title: "Awaiting Financial Movements",
    description:
      "Balance Sheet and Profit & Loss statements calculate automatically in microsecond time once inward bills, sales, or banking transactions are booked.",
    defaultActionText: "View Chart of Accounts",
  },
  warehouse: {
    icon: Warehouse,
    glowColor: "from-amber-500/20 via-orange-500/10 to-transparent",
    iconBg: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badge: "Warehouse Bay Clear",
    title: "No Inventory Records or Challans",
    description:
      "No inward stock receipts or dispatch dockets currently logged. Scan supplier invoices or create dispatch challans to track real-time stock valuation.",
    defaultActionText: "Create Stock Entry",
  },
  invoices: {
    icon: FileText,
    glowColor: "from-blue-500/20 via-indigo-500/10 to-transparent",
    iconBg: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "Billing Desk Open",
    title: "No Invoices or Vouchers",
    description:
      "Generate GST-compliant tax invoices, proforma bills, or scan purchase invoices to populate your receivables and payables ledgers automatically.",
    defaultActionText: "Draft New Invoice",
  },
  team: {
    icon: Users,
    glowColor: "from-violet-500/20 via-purple-500/10 to-transparent",
    iconBg: "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
    badge: "Team Management",
    title: "No Team Members Added",
    description:
      "Invite branch managers, warehouse supervisors, and accountants to collaborate with zero data leaks and department-level workspace isolation.",
    defaultActionText: "Invite Team Member",
  },
  ca_hub: {
    icon: ShieldCheck,
    glowColor: "from-teal-500/20 via-emerald-500/10 to-transparent",
    iconBg: "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400",
    badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
    badge: "Statutory & Audit",
    title: "CA Audit Portal Ready",
    description:
      "No pending audit reviews or compliance flags. Connect your external Chartered Accountant to enable read-only verification of GSTR-1, GSTR-3B, and trial balances.",
    defaultActionText: "Grant CA Access",
  },
  search: {
    icon: SearchX,
    glowColor: "from-slate-500/20 via-gray-500/10 to-transparent",
    iconBg: "bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400",
    badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
    badge: "Filter Active",
    title: "No Matching Records Found",
    description:
      "We couldn't find any entries matching your current search parameters. Try clearing your filters or selecting a different date range.",
    defaultActionText: "Reset Filters",
  },
};

/**
 * CrownZeroState - High-craft, luxurious empty state component
 * Designed for Indian MSMEs & enterprise workflows with zero circular spinners.
 */
export default function CrownZeroState({
  variant = "ocr_scanner",
  icon: CustomIcon,
  title,
  description,
  badge,
  actionText,
  onAction,
  actionIcon: ActionIcon = ArrowRight,
  secondaryActionText,
  onSecondaryAction,
  className = "",
  compact = false,
}) {
  const preset = PRESETS[variant] || PRESETS.ocr_scanner;
  const DisplayIcon = CustomIcon || preset.icon;
  const finalTitle = title || preset.title;
  const finalDescription = description || preset.description;
  const finalBadge = badge || preset.badge;
  const finalActionText = actionText || (onAction ? preset.defaultActionText : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-8 sm:p-12 text-center shadow-xl shadow-slate-100/60 ${className}`}
    >
      {/* Ambient background glow orb */}
      <div
        className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-b ${preset.glowColor} blur-3xl opacity-70`}
      />

      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
        {/* Soft Badge */}
        {finalBadge && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border mb-6 ${preset.badgeBg}`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{finalBadge}</span>
          </div>
        )}

        {/* Large Soft-Glowing Icon Container */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 flex items-center justify-center shadow-2xl mb-6 relative group ${preset.iconBg}`}
        >
          <div className="absolute inset-0 rounded-3xl bg-current opacity-10 blur-xl group-hover:opacity-20 transition-opacity" />
          <DisplayIcon className="w-10 h-10 sm:w-12 sm:h-12 relative z-10" />
        </motion.div>

        {/* Headline */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">
          {finalTitle}
        </h3>

        {/* Subtext */}
        <p
          className={`text-slate-600 leading-relaxed max-w-md ${
            compact ? "text-xs" : "text-sm"
          } mb-8`}
        >
          {finalDescription}
        </p>

        {/* Call-to-action buttons */}
        {(finalActionText || secondaryActionText) && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {finalActionText && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAction}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
              >
                <span>{finalActionText}</span>
                {ActionIcon && <ActionIcon className="w-4 h-4" />}
              </motion.button>
            )}

            {secondaryActionText && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSecondaryAction}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-200 transition-colors border border-slate-200/60"
              >
                <span>{secondaryActionText}</span>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
