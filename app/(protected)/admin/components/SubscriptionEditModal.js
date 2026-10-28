"use client";
import React, { useState } from "react";
import {
  X,
  Zap,
} from "lucide-react";

const PLAN_OPTIONS = [
  {
    id: "Free Trial",
    label: "Free Trial",
    price: "₹0 / 30 Days",
    seats: "2 Users",
  },
  {
    id: "MSME Starter",
    label: "MSME Starter",
    price: "₹1,499 / mo",
    seats: "3 Users",
  },
  {
    id: "Manufacturing & Growth",
    label: "Manufacturing & Growth",
    price: "₹3,499 / mo",
    seats: "10 Users",
  },
  {
    id: "Enterprise Multi-Unit",
    label: "Enterprise Multi-Unit",
    price: "₹6,999 / mo",
    seats: "Unlimited Users",
  },
];

export default function SubscriptionEditModal({
  subscriber,
  onClose,
  onSave,
  isSaving,
}) {
  const [planName, setPlanName] = useState(subscriber?.planName || "Manufacturing & Growth");
  const [cycle, setCycle] = useState(subscriber?.cycle || "annual");
  const [status, setStatus] = useState(subscriber?.status || "active");
  const [paymentStatus, setPaymentStatus] = useState(subscriber?.paymentStatus || "paid");
  const [extendDays, setExtendDays] = useState(0);

  if (!subscriber) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ownerId: subscriber.ownerId,
      planName,
      cycle,
      status,
      paymentStatus,
      extendDays: Number(extendDays) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-3xl max-w-xl w-full border border-purple-500/40 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Modify & Upgrade Subscription Plan
              </h3>
              <p className="text-xs text-slate-400">
                {subscriber.organizationName} • {subscriber.ownerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Plan Tier Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Select Subscription Tier *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PLAN_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPlanName(opt.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    planName === opt.id
                      ? "bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/20"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs">{opt.label}</span>
                    <span className="text-[10px] font-mono text-purple-300">{opt.price}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">{opt.seats} Included</span>
                </button>
              ))}
            </div>
          </div>

          {/* Billing Cycle & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Billing Cycle
              </label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="annual">Annual (12 Months)</option>
                <option value="monthly">Monthly</option>
                <option value="trial">Evaluation Trial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Subscription Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="active">Active (Full Access)</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due (Payment Pending)</option>
                <option value="expired">Expired (Grace Period)</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>

          {/* Payment Status & Validity Extension */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Payment State
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="paid">Paid (Verified)</option>
                <option value="trialing">Trialing (No Charge)</option>
                <option value="overdue">Overdue / Action Needed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Extend Validity Period
              </label>
              <select
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value={0}>Keep Existing Dates</option>
                <option value={30}>+30 Days Extension</option>
                <option value={90}>+90 Days Extension (Quarter)</option>
                <option value={180}>+180 Days (Half Year)</option>
                <option value={365}>+365 Days (1 Full Year)</option>
              </select>
            </div>
          </div>

          {/* Current Dates Info */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Current Expiry:</span>
              <strong className="text-white font-mono">
                {subscriber.endDate ? new Date(subscriber.endDate).toLocaleDateString() : "No Expiry Date Set"}
              </strong>
            </div>
            {extendDays > 0 && (
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>Validity Extension:</span>
                <span className="font-mono">
                  +{extendDays} days added to contract
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Apply & Sync Subscription"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
