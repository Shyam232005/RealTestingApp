"use client";
import React, { useState } from "react";
import {
  Flame,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
  Copy,
  Check,
  Database,
  ArrowRight,
} from "lucide-react";

const MASTER_CLEAR_KEY = "Shyam@Sangani#Clear@Databased#23072005@2026";

export default function SuperClearDatabaseModal({
  isOpen,
  onClose,
  onSuccess = () => {},
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [purgeResult, setPurgeResult] = useState(null);

  if (!isOpen) return null;

  const isPasswordCorrect = password.trim() === MASTER_CLEAR_KEY;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(MASTER_CLEAR_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleExecutePurge = async (e) => {
    e?.preventDefault();
    if (!confirmed) {
      setErrorMsg("You must check the confirmation box before proceeding.");
      return;
    }

    if (!isPasswordCorrect) {
      setErrorMsg("Invalid Super Clear Password. Operation locked.");
      return;
    }

    setIsPurging(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/clear-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ superPassword: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to purge database.");
      }

      setPurgeResult(data);
      onSuccess(data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to clear database.");
    } finally {
      setIsPurging(false);
    }
  };

  const handleModalClose = () => {
    if (isPurging) return;
    setPassword("");
    setConfirmed(false);
    setErrorMsg("");
    setPurgeResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-3xl max-w-xl w-full border border-rose-500/40 shadow-2xl shadow-rose-950/50 overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100 relative">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 px-6 py-4 flex items-center justify-between border-b border-rose-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center font-black shadow-inner">
              <Flame className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Super Clear Entire Database
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-300 border border-rose-400/30 text-[9px] font-black uppercase tracking-wider">
                  Factory Reset
                </span>
              </div>
              <p className="text-[11px] text-rose-200/80">
                Wipe all MongoDB collections to 0 documents
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isPurging}
            onClick={handleModalClose}
            className="w-8 h-8 rounded-full bg-rose-950/80 hover:bg-rose-900 text-rose-300 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Post-Purge Success View */}
          {purgeResult ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-white">
                  Database Cleared to 0 Successfully!
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  All collections in MongoDB have been completely purged. Total records deleted:{" "}
                  <strong className="text-emerald-400 font-mono">
                    {purgeResult.totalDeletedCount || 0}
                  </strong>{" "}
                  across{" "}
                  <strong className="text-emerald-400 font-mono">
                    {purgeResult.collectionsWipedCount || 0}
                  </strong>{" "}
                  collections.
                </p>
              </div>

              {/* Collections breakdown */}
              {purgeResult.summary && purgeResult.summary.length > 0 && (
                <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Purged Collections Status (All Remaining: 0)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {purgeResult.summary.map((col) => (
                      <div
                        key={col.collection}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px]"
                      >
                        <p className="font-mono font-bold text-slate-300 truncate">
                          {col.collection}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>Wiped: {col.beforeCount}</span>
                          <span className="text-emerald-400 font-black font-mono">
                            Now: 0
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleModalClose}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                Close & View Clean Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleExecutePurge} className="space-y-4">
              {/* Critical Alert Warning */}
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-black uppercase tracking-wider text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Permanent Irreversible Data Purge</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Executing this command will wipe <strong>every single document</strong> across all database collections:
                </p>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-rose-900/40">
                  <span>• Registered Companies</span>
                  <span>• Employees & Staff</span>
                  <span>• Shift Attendances</span>
                  <span>• Daily Work Submissions</span>
                  <span>• Tasks & Directives</span>
                  <span>• Leave Applications</span>
                  <span>• Organizations & Bins</span>
                  <span>• CA Auditors & Logs</span>
                </div>
                <p className="text-[11px] text-amber-300 font-semibold">
                  After execution, every collection count in the database will be strictly 0.
                </p>
              </div>

              {/* Master Password Input Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Enter Super Clear Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Copy Required Key"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied Key!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="Enter Master Super Password..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Live Validation Status */}
                <div className="flex items-center justify-between text-[11px]">
                  {password.length === 0 ? (
                    <span className="text-slate-500">
                      Required key:{" "}
                      <code className="text-slate-400 font-mono">
                        Shyam@Sangani#Clear@Databased#23072005@2026
                      </code>
                    </span>
                  ) : isPasswordCorrect ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Master Password Verified
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold">
                      ✕ Password Mismatch
                    </span>
                  )}
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confirm-purge-checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded-md accent-rose-600 cursor-pointer"
                />
                <label
                  htmlFor="confirm-purge-checkbox"
                  className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none"
                >
                  I, <strong className="text-white">Shyam Sangani (SuperAdmin)</strong>, confirm that I want to wipe all records across all database collections to 0. I understand this action cannot be undone.
                </label>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isPurging}
                  onClick={handleModalClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel / Keep Safe
                </button>
                <button
                  type="submit"
                  disabled={!isPasswordCorrect || !confirmed || isPurging}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg ${
                    isPasswordCorrect && confirmed && !isPurging
                      ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30 cursor-pointer"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                  }`}
                >
                  {isPurging ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Purging All Collections...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>Wipe Entire Database to 0</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
