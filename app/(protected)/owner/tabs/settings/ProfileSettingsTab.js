"use client";
import React from "react";
import {
  Building2,
  Landmark,
  TrendingUp,
  ShieldCheck,
  Check,
  Sparkles,
  Lock,
} from "lucide-react";

export default function ProfileSettingsTab({
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  isSavingSettings,
}) {
  if (!settingsForm) return null;

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Organization Profile & Parameters</h2>
          <p className="text-xs text-slate-500 mt-1">
            Details configured during initial organization setup. Modify and save updates at any time.
          </p>
        </div>
        <button
          type="submit"
          form="settings-form"
          disabled={isSavingSettings}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          {isSavingSettings ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-300" />
              Saving Changes...
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Business Identity */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            1. Business Details (Name, GST, Location, Branches)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Registered Name</label>
              <input
                type="text"
                value={settingsForm.RegisterName}
                onChange={(e) => setSettingsForm({ ...settingsForm, RegisterName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                maxLength={15}
                value={settingsForm.GST}
                onChange={(e) => setSettingsForm({ ...settingsForm, GST: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Operating Location</label>
              <input
                type="text"
                value={settingsForm.location}
                onChange={(e) => setSettingsForm({ ...settingsForm, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Industry Sector</label>
              <input
                type="text"
                value={settingsForm.industry}
                onChange={(e) => setSettingsForm({ ...settingsForm, industry: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Number of Branches / Units</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={settingsForm.branches}
                onChange={(e) => setSettingsForm({ ...settingsForm, branches: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">Staff Capacity Limit (Main HQ)</label>
                <span className="text-[10px] text-purple-600 font-bold">(Fewer is OK)</span>
              </div>
              <input
                type="number"
                min="0"
                value={settingsForm.employeeCount ?? 0}
                onChange={(e) => setSettingsForm({ ...settingsForm, employeeCount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">Maximum allowed employees at HQ.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Banking & Warehouse */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
            <Landmark className="w-4 h-4" />
            2. Bank Account & Factory / Godown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={settingsForm.BankName}
                onChange={(e) => setSettingsForm({ ...settingsForm, BankName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                maxLength={11}
                value={settingsForm.IFSC}
                onChange={(e) => setSettingsForm({ ...settingsForm, IFSC: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                maxLength={18}
                value={settingsForm.AccNo}
                onChange={(e) => setSettingsForm({ ...settingsForm, AccNo: e.target.value.replace(/\D/g, "") })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Main Godown / Factory Name</label>
              <input
                type="text"
                value={settingsForm.primaryWarehouse}
                onChange={(e) => setSettingsForm({ ...settingsForm, primaryWarehouse: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Financial Balances & Periodic Targets */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            3. Starting Balances & Monthly Sales Goals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Opening Bank Balance (₹)</label>
              <input
                type="number"
                value={settingsForm.openingBalance}
                onChange={(e) => setSettingsForm({ ...settingsForm, openingBalance: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Opening Cash in Hand (₹)</label>
              <input
                type="number"
                value={settingsForm.openingCash}
                onChange={(e) => setSettingsForm({ ...settingsForm, openingCash: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Starting Stock Value in Godown (₹)</label>
              <input
                type="number"
                value={settingsForm.currentStockValue}
                onChange={(e) => setSettingsForm({ ...settingsForm, currentStockValue: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monthly Sales Target (₹)</label>
              <input
                type="number"
                value={settingsForm.monthlyRevenueTarget}
                onChange={(e) => setSettingsForm({ ...settingsForm, monthlyRevenueTarget: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monthly Production Goal (Units)</label>
              <input
                type="number"
                value={settingsForm.monthlyProductionTarget}
                onChange={(e) => setSettingsForm({ ...settingsForm, monthlyProductionTarget: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: FinOps Guardrails & Statutory Rules */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            4. Business Rules & Founder Approval Limits
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier Credit Days (MSME Rule)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={settingsForm.defaultCreditDays}
                onChange={(e) => setSettingsForm({ ...settingsForm, defaultCreditDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Order Approval Limit (₹)</label>
              <input
                type="number"
                value={settingsForm.poApprovalLimit}
                onChange={(e) => setSettingsForm({ ...settingsForm, poApprovalLimit: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Customer Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settingsForm.maxDiscountPercent}
                onChange={(e) => setSettingsForm({ ...settingsForm, maxDiscountPercent: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Minimum Cash Alert (₹)</label>
              <input
                type="number"
                value={settingsForm.minCashReserveAlert}
                onChange={(e) => setSettingsForm({ ...settingsForm, minCashReserveAlert: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Low Stock Warning Alert (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={settingsForm.lowStockThresholdPercent}
                onChange={(e) => setSettingsForm({ ...settingsForm, lowStockThresholdPercent: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Stock Costing Method</label>
              <select
                value={settingsForm.inventoryValuationMethod}
                onChange={(e) => setSettingsForm({ ...settingsForm, inventoryValuationMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 outline-none font-medium"
              >
                <option value="lot_wise">Lot-Wise (Batch Costing)</option>
                <option value="fifo">FIFO (First-In, First-Out)</option>
                <option value="weighted_average">Weighted Average</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-purple-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-purple-950">Protected Digital Audit Trail</p>
                <p className="text-[11px] text-slate-500">Lock edits to prevent accidental alteration of past records.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settingsForm.mcaAuditLog}
              onChange={(e) => setSettingsForm({ ...settingsForm, mcaAuditLog: e.target.checked })}
              className="w-5 h-5 accent-purple-600 cursor-pointer"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
