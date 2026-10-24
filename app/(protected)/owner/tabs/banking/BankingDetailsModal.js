"use client";
import React, { useState } from "react";
import {
  Landmark,
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ExternalLink,
} from "lucide-react";

export default function BankingDetailsModal({ organization, isOpen, onClose }) {
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  if (!isOpen || !organization) return null;

  const rawAccNo = organization.AccNo || "Not Configured";
  const maskedAccNo =
    rawAccNo.length > 4
      ? "•".repeat(Math.max(4, rawAccNo.length - 4)) + " " + rawAccNo.slice(-4)
      : rawAccNo;

  const handleCopy = (text, fieldName) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(""), 2000);
    }
  };

  const handleCopyAll = () => {
    const fullText = `COMMERCIAL BANKING CREDENTIALS
Entity Name: ${organization.RegisterName}
Bank Name: ${organization.BankName}
Account Number: ${rawAccNo}
IFSC Code: ${organization.IFSC}
Branch / Location: ${organization.location}
Account Type: Commercial Current Account
GSTIN: ${organization.GST}`;

    handleCopy(fullText, "all");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Commercial Banking Details
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official banking credentials for {organization.RegisterName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banking Credential Cards */}
        <div className="space-y-3.5 text-xs">
          {/* Account Holder Name */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Account Holder / Registered Entity
              </span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                {organization.RegisterName}
              </p>
            </div>
            <button
              onClick={() => handleCopy(organization.RegisterName, "name")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              {copiedField === "name" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Bank Name & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Bank Name
              </span>
              <p className="font-extrabold text-slate-900 mt-0.5 text-xs">
                {organization.BankName}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Account Type
              </span>
              <p className="font-extrabold text-purple-700 mt-0.5 text-xs">
                Commercial Current Account
              </p>
            </div>
          </div>

          {/* Account Number with Reveal & Copy */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                Current Account Number
              </span>
              <p className="font-mono font-black text-slate-900 text-sm sm:text-base mt-0.5 tracking-wider">
                {showFullAccount ? rawAccNo : maskedAccNo}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowFullAccount(!showFullAccount)}
                className="w-7 h-7 rounded-lg bg-white hover:bg-purple-100/80 border border-purple-200 flex items-center justify-center text-purple-700 transition-all cursor-pointer"
                title={showFullAccount ? "Mask Number" : "Reveal Number"}
              >
                {showFullAccount ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(rawAccNo, "acc")}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100/80 border border-purple-200 text-purple-700 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedField === "acc" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* IFSC Code & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  IFSC Code
                </span>
                <p className="font-mono font-extrabold text-slate-900 mt-0.5">
                  {organization.IFSC}
                </p>
              </div>
              <button
                onClick={() => handleCopy(organization.IFSC, "ifsc")}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedField === "ifsc" ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Branch / Location
              </span>
              <p className="font-extrabold text-slate-900 mt-0.5 truncate">
                {organization.location}
              </p>
            </div>
          </div>

          {/* Statutory Verification Status */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5 text-[11px] text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Directly linked with GSTIN <strong className="font-mono font-bold">{organization.GST}</strong> for statutory payments, vendor transfers, and MCA audit compliance.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleCopyAll}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            {copiedField === "all" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied Full Banking Details!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Full Banking Details
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
