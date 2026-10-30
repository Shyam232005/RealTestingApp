"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PhoneForwarded,
  Headset,
  Plus,
  Send,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Target,
  BellRing,
  User,
  Phone,
  Tag,
  FileText,
} from "lucide-react";

// Zod Schema for Indian MSME Inquiries
const walkinInquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Prospect name must be at least 2 characters" })
    .max(80, { message: "Name cannot exceed 80 characters" }),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, {
      message: "Enter a valid 10-digit Indian mobile number (starts with 6-9)",
    }),
  inquiryType: z
    .string()
    .min(1, { message: "Please select an inquiry category" }),
  notes: z
    .string()
    .trim()
    .max(300, { message: "Notes cannot exceed 300 characters" })
    .optional(),
});

export default function LeadPoolZeroState({
  ownerName = "Main HQ",
  dailyTarget = 50,
  callsCompleted = 0,
  onLogLead,
  onPingManager,
  className = "",
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pingSent, setPingSent] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(walkinInquirySchema),
    defaultValues: {
      name: "",
      phone: "",
      inquiryType: "WALK_IN_RETAIL",
      notes: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      if (typeof onLogLead === "function") {
        await onLogLead(data);
      }
      setFeedbackToast(`Inquiry for "${data.name}" logged successfully!`);
      reset();
      setModalOpen(false);
      setTimeout(() => setFeedbackToast(""), 4500);
    } catch (err) {
      console.error("Failed to log inquiry:", err);
    }
  };

  const handlePing = () => {
    setPingSent(true);
    if (typeof onPingManager === "function") {
      onPingManager();
    }
    setFeedbackToast(`⚡ Lead request ping transmitted to ${ownerName}!`);
    setTimeout(() => {
      setPingSent(false);
      setFeedbackToast("");
    }, 4500);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackToast}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md">
              HQ Sync Active
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Empty State Container */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-8 sm:p-12 text-center shadow-xl shadow-slate-100/60"
      >
        {/* Soft Ambient Radial Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-b from-blue-500/15 via-indigo-500/10 to-transparent blur-3xl opacity-75" />

        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border bg-blue-50/80 text-blue-700 border-blue-200 mb-6 shadow-2xs">
            <Headset className="w-3.5 h-3.5 text-blue-600" />
            <span>Telecalling Queue • Zero Unassigned Leads</span>
          </div>

          {/* Animated Gentle Pulse Icon Container */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-blue-500/25 bg-blue-50/80 text-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/10 mb-6 relative group"
          >
            <div className="absolute inset-0 rounded-3xl bg-blue-400/20 blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
            <PhoneForwarded className="w-10 h-10 sm:w-11 sm:h-11 relative z-10 text-blue-600" />
          </motion.div>

          {/* Primary Copy */}
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
            Your telecalling queue is currently empty.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mb-6">
            All inbound prospect records have been dialed or assigned. Log manual inquiries as walk-ins occur, or ping your branch manager to release fresh lead batches.
          </p>

          {/* Hierarchy / Owner Connection Informational Card */}
          <div className="w-full rounded-2xl bg-slate-50/90 border border-slate-200/90 p-4 sm:p-5 mb-8 text-left shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      Hierarchy Directive
                    </span>
                    <span className="text-xs text-slate-400 font-medium">• Daily Quota</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    Awaiting new lead allocations from{" "}
                    <span className="text-indigo-950 font-black underline decoration-indigo-300">
                      {ownerName}
                    </span>
                    . Your daily outreach target is{" "}
                    <span className="text-slate-900 font-black">{dailyTarget} calls</span>.
                  </p>
                </div>
              </div>

              {/* Mini Target Tracker */}
              <div className="sm:text-right shrink-0 bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Today&apos;s Outreach
                </span>
                <span className="text-sm font-black font-mono text-slate-900">
                  {callsCompleted} / {dailyTarget}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block">Calls Completed</span>
              </div>
            </div>
          </div>

          {/* Actionable CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-black transition-all shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Manually Log Walk-in Inquiry</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={pingSent}
              onClick={handlePing}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                pingSent
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 shadow-2xs"
              }`}
            >
              {pingSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ping Transmitted ✓</span>
                </>
              ) : (
                <>
                  <BellRing className="w-4 h-4 text-slate-500" />
                  <span>Ping Manager for Leads</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* REACT HOOK FORM + ZOD MODAL FOR MANUAL LOGGING */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Log Walk-in / Inbound Inquiry
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Enter prospect coordinates to insert directly into lead pool
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Prospect / Business Contact Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel / Gayatri Fabrics"
                      {...register("name")}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-600 transition-colors ${
                        errors.name ? "border-rose-400 bg-rose-50/20" : "border-slate-200 bg-white"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    10-Digit Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      placeholder="e.g. 9825012345"
                      maxLength={10}
                      {...register("phone")}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 transition-colors ${
                        errors.phone ? "border-rose-400 bg-rose-50/20" : "border-slate-200 bg-white"
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Inquiry Type */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Inquiry Category / Product Interest <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      {...register("inquiryType")}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer ${
                        errors.inquiryType ? "border-rose-400 bg-rose-50/20" : "border-slate-200 bg-white"
                      }`}
                    >
                      <option value="WALK_IN_RETAIL">Counter / Store Walk-in Customer</option>
                      <option value="WHOLESALE_BULK">Wholesale B2B / Bulk Order</option>
                      <option value="PRODUCT_CATALOGUE">Catalogue &amp; Price List Request</option>
                      <option value="PRICE_ESTIMATE">Custom Estimate / Rate Inquire</option>
                      <option value="DEALERSHIP_INQUIRY">Regional Dealership / Agency</option>
                    </select>
                  </div>
                  {errors.inquiryType && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.inquiryType.message}
                    </p>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Customer Specifics / Requirements (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specific items requested, payment method preference, delivery location..."
                    {...register("notes")}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-600 resize-none"
                  />
                  {errors.notes && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1">
                      {errors.notes.message}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Logging Inquiry..." : "Log to Lead Queue"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
