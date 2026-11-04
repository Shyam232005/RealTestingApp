"use client";
import React, { useState } from "react";
import { X, AlertTriangle, RotateCcw, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function LogisticsExceptionModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  initialData = null,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    awbNumber: initialData?.awbNumber || "",
    orderReference: initialData?.orderReference || "",
    customerName: initialData?.customerName || "",
    customerPhone: initialData?.customerPhone || "+91 98200 44321",
    deliveryPinCode: initialData?.deliveryPinCode || "400001",
    destinationCity: initialData?.destinationCity || "Mumbai",
    carrier: initialData?.carrier || "BlueDart Express",
    exceptionType: initialData?.exceptionType || "NDR_CUSTOMER_UNAVAILABLE",
    actionTaken: initialData?.actionTaken || "REATTEMPT_SCHEDULED",
    coordinatorNotes: initialData?.coordinatorNotes || "",
  });

  if (!isOpen) return null;

  const isRtoAction = formData.actionTaken === "RTO_APPROVED_BY_COORDINATOR";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.awbNumber || !formData.orderReference) {
      toast.error("AWB Number and Order Reference are mandatory.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logistics/outbound/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log delivery exception.");
      }

      if (isRtoAction) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        } catch {}
        toast.warning(`RTO Approved for AWB #${formData.awbNumber}!`, {
          description: "Consignment flagged for return to warehouse godown disposition.",
        });
      } else {
        toast.success(`Exception Action Updated: ${formData.actionTaken}`, {
          description: `AWB #${formData.awbNumber} re-attempt scheduled with courier notes.`,
        });
      }

      if (onSuccess) {
        onSuccess(data.exception);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update exception");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">
                NDR Exception Management & RTO Approval
              </h3>
              <p className="text-[11px] text-slate-400">
                Tier 2 Coordinator Action • Non-Delivery Resolution Desk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* AWB & Order Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                AWB / Tracking Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AWB-BD-88410291"
                value={formData.awbNumber}
                onChange={(e) => setFormData({ ...formData, awbNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Order Reference *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SO-CRW-2026-9041"
                value={formData.orderReference}
                onChange={(e) => setFormData({ ...formData, orderReference: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-amber-500 bg-white"
              />
            </div>
          </div>

          {/* Customer & Carrier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Customer or Firm Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                3PL Carrier
              </label>
              <select
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
              >
                <option value="BlueDart Express">BlueDart Express</option>
                <option value="Delhivery Logistics">Delhivery Logistics</option>
                <option value="V-Trans Heavy Freight">V-Trans Heavy Freight</option>
                <option value="TCI Express">TCI Express</option>
              </select>
            </div>
          </div>

          {/* Exception Type & Action Taken */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                NDR Exception Reason *
              </label>
              <select
                value={formData.exceptionType}
                onChange={(e) => setFormData({ ...formData, exceptionType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden bg-white"
              >
                <option value="NDR_CUSTOMER_UNAVAILABLE">Customer Unavailable / Door Closed</option>
                <option value="NDR_INCOMPLETE_ADDRESS">Incomplete Address / Landmark Missing</option>
                <option value="NDR_CUSTOMER_REFUSED">Customer Refused Delivery / Cancelled</option>
                <option value="NDR_ENTRY_RESTRICTED">Entry Restricted / Industrial Gate Closed</option>
                <option value="NDR_PHONE_UNREACHABLE">Customer Phone Unreachable</option>
                <option value="RTO_REQUESTED_BY_BUYER">Direct RTO Requested by Buyer</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Coordinator Action Disposition *
              </label>
              <select
                value={formData.actionTaken}
                onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden bg-white"
              >
                <option value="REATTEMPT_SCHEDULED">Schedule Re-attempt (Next Day)</option>
                <option value="ADDRESS_UPDATED_REATTEMPT">Address Updated + Re-attempt</option>
                <option value="RTO_APPROVED_BY_COORDINATOR">Approve RTO (Return to Origin Godown)</option>
                <option value="PENDING_COORDINATOR_ACTION">Under Investigation (Hold)</option>
              </select>
            </div>
          </div>

          {/* Warning Banner if RTO is chosen */}
          {isRtoAction && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-black uppercase text-xs">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Return to Origin (RTO) Authorization</span>
              </div>
              <p className="text-slate-600">
                Approving RTO instructs the carrier to terminate delivery attempts and reverse-freight the parcel back to Crown Ecosystems godown. Reverse logistics charges apply.
              </p>
            </div>
          )}

          {/* Coordinator Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Coordinator Resolution Notes / Call Log
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Spoke to client receiving manager. Gate re-opens at 10 AM. Re-attempt confirmed."
              value={formData.coordinatorNotes}
              onChange={(e) => setFormData({ ...formData, coordinatorNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 ${
                isRtoAction ? "bg-rose-600 hover:bg-rose-500" : "bg-amber-600 hover:bg-amber-500"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? "Processing..." : isRtoAction ? "Authorize RTO Return" : "Update Exception Action"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
