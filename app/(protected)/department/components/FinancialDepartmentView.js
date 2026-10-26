"use client";
import React, { useState } from "react";
import {
  DollarSign,
  Receipt,
  CreditCard,
  BookOpen,
  FileCheck2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Landmark,
  Scale,
} from "lucide-react";
import { DEPARTMENT_CONFIGS } from "./departmentConfig";

export default function FinancialDepartmentView({
  tabId = "cfo_dashboard",
  employee,
  company,
  onNotify = () => {},
}) {
  const deptConfig = DEPARTMENT_CONFIGS.FINANCIAL;
  const currentTab = deptConfig.tabs.find((t) => t.id === tabId) || deptConfig.tabs[0];
  const [activeSubView, setActiveSubView] = useState(currentTab.subViews[0]?.id);

  // Financial State (Zero-State Driven)
  const [gstInvoices, setGstInvoices] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: "",
    taxableValue: "",
    gstRate: "18",
    buyerGstin: "",
    paymentStatus: "UNPAID",
  });

  const [vendorBills, setVendorBills] = useState([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({
    vendorName: "",
    poRef: "",
    grnRef: "",
    billAmount: "",
    dueDate: "",
  });

  const [journalVouchers, setJournalVouchers] = useState([]);
  const [showJvModal, setShowJvModal] = useState(false);
  const [jvForm, setJvForm] = useState({
    debitAccount: "",
    creditAccount: "",
    amount: "",
    narration: "",
  });

  // Handlers
  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const taxable = Number(invoiceForm.taxableValue) || 0;
    const rate = Number(invoiceForm.gstRate) || 18;
    const gstAmt = (taxable * rate) / 100;
    const total = taxable + gstAmt;

    const newInvoice = {
      id: `INV-${Date.now().toString().slice(-5)}`,
      ...invoiceForm,
      gstAmount: gstAmt.toFixed(2),
      grandTotal: total.toFixed(2),
      date: new Date().toLocaleDateString(),
    };
    setGstInvoices([newInvoice, ...gstInvoices]);
    setShowInvoiceModal(false);
    setInvoiceForm({
      customerName: "",
      taxableValue: "",
      gstRate: "18",
      buyerGstin: "",
      paymentStatus: "UNPAID",
    });
    onNotify("GST Tax Invoice generated & posted to AR ledger!");
  };

  const handleCreateBill = (e) => {
    e.preventDefault();
    const newBill = {
      id: `BILL-${Date.now().toString().slice(-5)}`,
      ...billForm,
      threeWayMatched: true,
      status: "APPROVED_FOR_PAYOUT",
      loggedDate: new Date().toLocaleDateString(),
    };
    setVendorBills([newBill, ...vendorBills]);
    setShowBillModal(false);
    setBillForm({
      vendorName: "",
      poRef: "",
      grnRef: "",
      billAmount: "",
      dueDate: "",
    });
    onNotify("Vendor bill verified via 3-way match & approved!");
  };

  const handleCreateJv = (e) => {
    e.preventDefault();
    const newJv = {
      id: `JV-${Date.now().toString().slice(-5)}`,
      ...jvForm,
      postedBy: employee?.name || "Senior Accountant",
      date: new Date().toLocaleDateString(),
    };
    setJournalVouchers([newJv, ...journalVouchers]);
    setShowJvModal(false);
    setJvForm({
      debitAccount: "",
      creditAccount: "",
      amount: "",
      narration: "",
    });
    onNotify("Journal Voucher posted to General Ledger!");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-purple-600 uppercase tracking-wider">
              Financial • {deptConfig.rolesByLevel[employee?.postLevel]?.title || "Financial"}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-100">
              {employee?.branchName || "Main HQ"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentTab.title}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            {deptConfig.rolesByLevel[employee?.postLevel]?.tasks ||
              "Manage capital structure, general ledger, tax compliance, and payroll."}
          </p>
        </div>

        {/* Sub-view Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/80 overflow-x-auto self-start md:self-auto">
          {currentTab.subViews.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubView(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeSubView === sub.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: CFO_DASHBOARD (CFO & Treasury Dashboard)
         ========================================================================= */}
      {tabId === "cfo_dashboard" && (
        <div className="space-y-6">
          {activeSubView === "cash_runway" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Cash & Bank Balance", val: "₹ 62.4 L", sub: "Liquid Treasury", color: "purple" },
                  { label: "Accounts Receivable (AR)", val: "₹ 24.8 L", sub: "Incoming from clients", color: "blue" },
                  { label: "Accounts Payable (AP)", val: "₹ 16.2 L", sub: "Vendor obligations", color: "amber" },
                  { label: "Estimated Runway", val: "11.4 Months", sub: "Net cash burn buffer", color: "emerald" },
                ].map((stat, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      {stat.label}
                    </span>
                    <p className="text-2xl font-black text-slate-900 font-mono">{stat.val}</p>
                    <span className="text-[11px] font-bold text-slate-500 mt-1 block">{stat.sub}</span>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase">Working Capital Health</h3>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block mb-1">Treasury Liquidity Ratio</span>
                  Current Ratio: 2.14 • Quick Ratio: 1.68 • Net Working Capital: +₹ 46.2 L
                </div>
              </div>
            </div>
          )}

          {activeSubView === "budget_vs_actuals" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Corporate Budget Variance (FY 2026-27)</h3>
              <p className="text-xs text-slate-500">Departmental expenditure vs board approved budget limits.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Operations & Raw Materials</span>
                  Budget: ₹ 35.0 L • Actual Spend: ₹ 31.4 L (9.7% Favorable Variance)
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Logistics & Freight</span>
                  Budget: ₹ 10.0 L • Actual Spend: ₹ 8.5 L (15.0% Favorable Variance)
                </div>
              </div>
            </div>
          )}

          {activeSubView === "financial_ratios" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase">Financial Ratios & Corporate ROI</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 block mb-1">Return on Equity (ROE)</span>
                  <p className="text-lg font-black text-purple-700">22.4%</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 block mb-1">EBITDA Margin</span>
                  <p className="text-lg font-black text-emerald-600">18.6%</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 block mb-1">Debt-to-Equity</span>
                  <p className="text-lg font-black text-slate-900">0.24</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: BILLING_AR (Billing & Receivables Desk AR)
         ========================================================================= */}
      {tabId === "billing_ar" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">GST Invoices & Accounts Receivable (AR)</h3>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Generate Tax Invoice
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {gstInvoices.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No tax invoices generated yet.</p>
                <p className="text-[11px] text-slate-400">Convert dispatched Delivery Challans into GST Tax Invoices here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                      <th className="pb-3 pl-2">Invoice #</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">GSTIN</th>
                      <th className="pb-3">Taxable</th>
                      <th className="pb-3">GST</th>
                      <th className="pb-3">Grand Total</th>
                      <th className="pb-3 pr-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gstInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="py-3 pl-2 font-bold text-slate-900">{inv.id}</td>
                        <td className="py-3 font-semibold text-slate-800">{inv.customerName}</td>
                        <td className="py-3 font-mono text-slate-500">{inv.buyerGstin || "Unregistered"}</td>
                        <td className="py-3 font-mono text-slate-700">₹ {inv.taxableValue}</td>
                        <td className="py-3 font-mono text-slate-500">₹ {inv.gstAmount} ({inv.gstRate}%)</td>
                        <td className="py-3 font-mono font-black text-slate-900">₹ {inv.grandTotal}</td>
                        <td className="py-3 pr-2 text-right">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PAYABLES_AP (Payables & Payroll AP)
         ========================================================================= */}
      {tabId === "payables_ap" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Vendor Bills (3-Way Match) & Payroll (AP)</h3>
            <button
              onClick={() => setShowBillModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Log Vendor Bill
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {vendorBills.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No vendor bills awaiting payout.</p>
                <p className="text-[11px] text-slate-400">Match incoming vendor invoices against Purchase Orders and GRNs before disbursement.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vendorBills.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{b.id} • {b.vendorName}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          3-Way Matched
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">PO: {b.poRef} • GRN: {b.grnRef} • Due: {b.dueDate || "Net 30"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900 font-mono">₹ {b.billAmount}</p>
                      <span className="text-[10px] font-bold text-purple-700">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: GENERAL_LEDGER (General Ledger & Banking)
         ========================================================================= */}
      {tabId === "general_ledger" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">General Ledger & Double-Entry Journals</h3>
            <button
              onClick={() => setShowJvModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Post Journal Voucher (JV)
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {journalVouchers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No manual journal vouchers posted.</p>
                <p className="text-[11px] text-slate-400">Post debit/credit journal vouchers, adjustments, and depreciation entries here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                      <th className="pb-3 pl-2">JV Number</th>
                      <th className="pb-3">Debit Ledger</th>
                      <th className="pb-3">Credit Ledger</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Narration</th>
                      <th className="pb-3 pr-2 text-right">Posted By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journalVouchers.map((jv) => (
                      <tr key={jv.id} className="hover:bg-slate-50/60">
                        <td className="py-3 pl-2 font-bold text-slate-900">{jv.id}</td>
                        <td className="py-3 font-semibold text-emerald-800">Dr. {jv.debitAccount}</td>
                        <td className="py-3 font-semibold text-blue-800">Cr. {jv.creditAccount}</td>
                        <td className="py-3 font-mono font-black text-slate-900">₹ {jv.amount}</td>
                        <td className="py-3 text-slate-600">{jv.narration}</td>
                        <td className="py-3 pr-2 text-right text-slate-500">{jv.postedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: TAX_AUDIT_PORTAL (Tax & CA Audit Portal)
         ========================================================================= */}
      {tabId === "tax_audit_portal" && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Statutory Audit & Tally Export Portal</h3>
                <p className="text-xs text-slate-500">Immutable ledger audit trail, tax reconciliation, and Tally export.</p>
              </div>
              <button
                onClick={() => onNotify("Exporting Tally-compatible XML/JSON ledger export...")}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Tally XML / JSON
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-500 block mb-1">GSTR-1 & 3B Reconciliation</span>
                <p className="text-sm font-black text-emerald-700">Matched with Books</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-500 block mb-1">TDS 194C / 194J Liability</span>
                <p className="text-sm font-black text-slate-900">Deposited on Time</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-500 block mb-1">Accounting Period Status</span>
                <p className="text-sm font-black text-blue-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Locked for Previous Quarter
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. Tax Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Generate GST Tax Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Customer / Buyer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Builders Ltd"
                  value={invoiceForm.customerName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Buyer GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={invoiceForm.buyerGstin}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, buyerGstin: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Taxable Value (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 100000"
                    value={invoiceForm.taxableValue}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, taxableValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">GST Rate</label>
                  <select
                    value={invoiceForm.gstRate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, gstRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="18">18% (Standard GST)</option>
                    <option value="12">12% GST</option>
                    <option value="5">5% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Issue Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Vendor Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Log Vendor Bill (3-Way Match)</h3>
            <form onSubmit={handleCreateBill} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Vendor / Supplier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliable Polymers Corp"
                  value={billForm.vendorName}
                  onChange={(e) => setBillForm({ ...billForm, vendorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">PO Number Ref</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-89012"
                    value={billForm.poRef}
                    onChange={(e) => setBillForm({ ...billForm, poRef: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">GRN Ref Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GRN-1002"
                    value={billForm.grnRef}
                    onChange={(e) => setBillForm({ ...billForm, grnRef: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Bill Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 220000"
                  value={billForm.billAmount}
                  onChange={(e) => setBillForm({ ...billForm, billAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Approve for Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Journal Voucher Modal */}
      {showJvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Post Journal Voucher (JV)</h3>
            <form onSubmit={handleCreateJv} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Debit Account (Dr.)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Factory Rent Account"
                    value={jvForm.debitAccount}
                    onChange={(e) => setJvForm({ ...jvForm, debitAccount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Credit Account (Cr.)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bank Account"
                    value={jvForm.creditAccount}
                    onChange={(e) => setJvForm({ ...jvForm, creditAccount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={jvForm.amount}
                  onChange={(e) => setJvForm({ ...jvForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Narration</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly rent paid via RTGS for Plot 45"
                  value={jvForm.narration}
                  onChange={(e) => setJvForm({ ...jvForm, narration: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJvModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
