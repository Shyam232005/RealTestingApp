"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSignature,
  Handshake,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldAlert,
  Percent,
  CheckCircle2,
  Calendar,
  DollarSign,
  Building2,
  X,
  FileText,
  Lock,
  Sparkles,
} from "lucide-react";

export default function DealsZeroState({
  currentMonthTarget = 500000,
  currentBooked = 0,
  ownerName = "Main HQ",
  onDraftEstimate,
  className = "",
}) {
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftForm, setDraftForm] = useState({
    clientName: "",
    dealValue: "",
    category: "FINISHED_GOODS",
    expectedCloseDate: "",
    marginPercent: "22",
  });
  const [toastMessage, setToastMessage] = useState("");

  const percentAchieved =
    currentMonthTarget > 0
      ? Math.min(100, (currentBooked / currentMonthTarget) * 100).toFixed(1)
      : "0.0";

  const handleEstimateSubmit = (e) => {
    e.preventDefault();
    if (typeof onDraftEstimate === "function") {
      onDraftEstimate(draftForm);
    }
    setToastMessage(`Draft estimate created for ${draftForm.clientName || "Client"}!`);
    setShowDraftModal(false);
    setDraftForm({
      clientName: "",
      dealValue: "",
      category: "FINISHED_GOODS",
      expectedCloseDate: "",
      marginPercent: "22",
    });
    setTimeout(() => setToastMessage(""), 4500);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded-md">
              Pipeline Updated
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
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-b from-purple-500/15 via-indigo-500/10 to-transparent blur-3xl opacity-75" />

        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border bg-purple-50/80 text-purple-700 border-purple-200 mb-6 shadow-2xs">
            <Handshake className="w-3.5 h-3.5 text-purple-600" />
            <span>CRM Deals &amp; Quotations Pipeline</span>
          </div>

          {/* Animated Lucide Icon Container */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-purple-500/25 bg-purple-50/80 text-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/10 mb-6 relative group"
          >
            <div className="absolute inset-0 rounded-3xl bg-purple-400/20 blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
            <FileSignature className="w-10 h-10 sm:w-11 sm:h-11 relative z-10 text-purple-600" />
          </motion.div>

          {/* Primary Copy */}
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
            No active deals in your pipeline.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mb-6">
            You currently have no negotiation proposals or quotation estimates in stage qualification. Draft a fresh proposal to start tracking deal value towards your monthly revenue quota.
          </p>

          {/* Hierarchy / Owner Connection: Progress Bar & Target Metric Widget */}
          <div className="w-full rounded-2xl bg-slate-50/90 border border-slate-200/90 p-5 mb-6 text-left shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span className="text-xs font-black text-slate-800">
                  Current Month Target:{" "}
                  <span className="font-mono text-purple-950 font-black">
                    ₹{Number(currentBooked).toLocaleString("en-IN")} / ₹{Number(currentMonthTarget).toLocaleString("en-IN")}
                  </span>
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                (Set by <strong className="text-slate-800">{ownerName}</strong>)
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
                style={{ width: `${Math.max(2, parseFloat(percentAchieved))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>{percentAchieved}% Quota Attainment</span>
              <span className="font-mono">Remaining: ₹{Number(Math.max(0, currentMonthTarget - currentBooked)).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Actionable CTA & Guidelines Link */}
          <div className="flex flex-col items-center gap-3 w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setShowDraftModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-black transition-all shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>+ Draft New Estimate</span>
            </motion.button>

            {/* Quick Link to Minimum Margin Guidelines */}
            <button
              type="button"
              onClick={() => setShowGuidelinesModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 underline decoration-purple-300 underline-offset-4 transition-colors cursor-pointer pt-1"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Review Minimum Margin Guidelines set by Owner &rarr;</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* DRAFT NEW ESTIMATE MODAL */}
      <AnimatePresence>
        {showDraftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Draft New Quotation / Estimate</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Enter deal parameters complying with {ownerName} guidelines
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEstimateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Client MSME / Business Entity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Textiles Pvt Ltd"
                    value={draftForm.clientName}
                    onChange={(e) => setDraftForm({ ...draftForm, clientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Estimated Deal Value (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 75000"
                      value={draftForm.dealValue}
                      onChange={(e) => setDraftForm({ ...draftForm, dealValue: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Target Gross Margin (%)
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={draftForm.marginPercent}
                      onChange={(e) => setDraftForm({ ...draftForm, marginPercent: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Min 18% floor enforced</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Product Category
                    </label>
                    <select
                      value={draftForm.category}
                      onChange={(e) => setDraftForm({ ...draftForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-purple-600 cursor-pointer"
                    >
                      <option value="FINISHED_GOODS">Finished Manufactured Goods</option>
                      <option value="BULK_RAW_MATERIALS">Bulk Raw Materials</option>
                      <option value="TRADED_ACCESSORIES">Traded Merchandise</option>
                      <option value="CUSTOM_ORDER">Custom Fabrication / Job-work</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Expected Close Date
                    </label>
                    <input
                      type="date"
                      value={draftForm.expectedCloseDate}
                      onChange={(e) => setDraftForm({ ...draftForm, expectedCloseDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDraftModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Deal &amp; Lock Margin</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MINIMUM MARGIN GUIDELINES MODAL */}
      <AnimatePresence>
        {showGuidelinesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Pricing &amp; Margin Directives
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Mandatory baseline established by {ownerName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuidelinesModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Rule 1 */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    18%
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-950">Minimum Gross Margin Floor</h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Quotations must carry at least an 18% gross margin above landed cost. Any quote below 18% requires manual owner sign-off in the Founder Approval Desk.
                    </p>
                  </div>
                </div>

                {/* Rule 2 */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    5%
                  </div>
                  <div>
                    <h4 className="font-black text-indigo-950">Maximum Spot Discount</h4>
                    <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                      Sales assistants are authorized to offer up to 5.0% spot discount against standard catalog prices to close on-the-spot orders.
                    </p>
                  </div>
                </div>

                {/* Rule 3 */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    50%
                  </div>
                  <div>
                    <h4 className="font-black text-amber-950">Advance Payment Condition</h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      A minimum 50% advance via UPI/Bank transfer is mandatory before generating a production work-order or reserving physical stock in the godown.
                    </p>
                  </div>
                </div>

                {/* Rule 4: Ledger Integration */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-slate-900">Dual-Entry Ledger Posting</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Approved estimates convert directly into GST invoices, debiting Sundry Debtors and crediting Sales Account in real time.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGuidelinesModal(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                  >
                    Acknowledged &amp; Return to Deals Desk
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
