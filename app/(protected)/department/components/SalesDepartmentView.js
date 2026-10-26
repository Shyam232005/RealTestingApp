"use client";
import React, { useState } from "react";
import {
  TrendingUp,
  PhoneCall,
  Handshake,
  ShoppingCart,
  Megaphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  User,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Send,
  Eye,
  Check,
  X,
} from "lucide-react";
import { DEPARTMENT_CONFIGS } from "./departmentConfig";

export default function SalesDepartmentView({
  tabId = "sales_dashboard",
  employee,
  company,
  onNotify = () => {},
}) {
  const deptConfig = DEPARTMENT_CONFIGS.SALES;
  const currentTab = deptConfig.tabs.find((t) => t.id === tabId) || deptConfig.tabs[0];
  const [activeSubView, setActiveSubView] = useState(currentTab.subViews[0]?.id);

  // Sales State (Zero-State Driven)
  const [leads, setLeads] = useState([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    contactName: "",
    companyName: "",
    phone: "",
    productInterest: "",
    source: "INBOUND_WEB",
  });

  const [deals, setDeals] = useState([]);
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealForm, setDealForm] = useState({
    clientName: "",
    dealValue: "",
    stage: "QUALIFIED",
    expectedCloseDate: "",
    assignedAE: employee?.name || "Account Exec",
  });

  const [salesOrders, setSalesOrders] = useState([]);
  const [showSoModal, setShowSoModal] = useState(false);
  const [soForm, setSoForm] = useState({
    clientName: "",
    itemsSummary: "",
    totalAmount: "",
    paymentTerms: "NET_30",
    deliveryBranch: employee?.branchName || "Main HQ",
  });

  // Handlers
  const handleCreateLead = (e) => {
    e.preventDefault();
    const newLead = {
      id: `LEAD-${Date.now().toString().slice(-5)}`,
      ...leadForm,
      status: "NEW",
      createdAt: new Date().toLocaleDateString(),
    };
    setLeads([newLead, ...leads]);
    setShowLeadModal(false);
    setLeadForm({
      contactName: "",
      companyName: "",
      phone: "",
      productInterest: "",
      source: "INBOUND_WEB",
    });
    onNotify("New sales inquiry logged in lead pool!");
  };

  const handleCreateDeal = (e) => {
    e.preventDefault();
    const newDeal = {
      id: `DEAL-${Date.now().toString().slice(-5)}`,
      ...dealForm,
      createdAt: new Date().toLocaleDateString(),
    };
    setDeals([newDeal, ...deals]);
    setShowDealModal(false);
    setDealForm({
      clientName: "",
      dealValue: "",
      stage: "QUALIFIED",
      expectedCloseDate: "",
      assignedAE: employee?.name || "Account Exec",
    });
    onNotify("Deal entered into pipeline!");
  };

  const handleCreateSo = (e) => {
    e.preventDefault();
    const newSo = {
      id: `SO-${Date.now().toString().slice(-5)}`,
      ...soForm,
      status: "CONFIRMED",
      createdAt: new Date().toLocaleDateString(),
    };
    setSalesOrders([newSo, ...salesOrders]);
    setShowSoModal(false);
    setSoForm({
      clientName: "",
      itemsSummary: "",
      totalAmount: "",
      paymentTerms: "NET_30",
      deliveryBranch: employee?.branchName || "Main HQ",
    });
    onNotify("Confirmed Sales Order (SO) booked!");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
              Sales • {deptConfig.rolesByLevel[employee?.postLevel]?.title || "Sales"}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
              {employee?.branchName || "Main HQ"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentTab.title}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            {deptConfig.rolesByLevel[employee?.postLevel]?.tasks ||
              "Drive revenue growth, CRM deal pipelines, and client orders."}
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
          TAB 1: SALES_DASHBOARD (Revenue & Quota Dashboard)
         ========================================================================= */}
      {tabId === "sales_dashboard" && (
        <div className="space-y-6">
          {activeSubView === "quota_actuals" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Branch Monthly Target", val: "₹ 45.0 L", sub: "Month Quota", color: "blue" },
                  { label: "Booked Revenue", val: "₹ 38.6 L", sub: "85.7% Attainment", color: "emerald" },
                  { label: "Pipeline Value", val: "₹ 18.2 L", sub: "Weighted Forecast", color: "purple" },
                  { label: "Avg Deal Cycle", val: "14 Days", sub: "Lead to Invoice", color: "amber" },
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
                <h3 className="text-sm font-black text-slate-900 uppercase">Sales Target Progress Bar</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Current Branch Revenue Quota</span>
                    <span className="text-emerald-700 font-mono">85.7% Achieved</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "85.7%" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubView === "territory_forecast" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Territory Demand & Forecast</h3>
              <p className="text-xs text-slate-500">Expected sales volume across industrial clusters and regional client accounts.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block mb-1">Domestic Zone A (Central)</span>
                  Forecast: ₹ 22.5 L • Confidence Score: 90%
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block mb-1">Domestic Zone B (Western Highway)</span>
                  Forecast: ₹ 16.0 L • Confidence Score: 78%
                </div>
              </div>
            </div>
          )}

          {activeSubView === "team_leaderboard" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase">AE & SDR Performance Leaderboard</h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-bold block text-slate-900 mb-0.5">Top Account Closer This Month</span>
                {employee?.name} ({employee?.postTitle || "Sales Team Lead"}) — 12 Deals Closed • 104% Quota Met
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: LEAD_TELECALLING (Lead Pool & Telecalling Hub)
         ========================================================================= */}
      {tabId === "lead_telecalling" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Inbound & Cold Telecalling Pool</h3>
            <button
              onClick={() => setShowLeadModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Add Lead
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {leads.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <PhoneCall className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Zero pending leads in telecalling queue.</p>
                <p className="text-[11px] text-slate-400">Add an inquiry or import contacts to begin outreach calls.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                      <th className="pb-3 pl-2">Lead ID</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">Company</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Interest</th>
                      <th className="pb-3 pr-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/60">
                        <td className="py-3 pl-2 font-bold text-slate-900">{l.id}</td>
                        <td className="py-3 font-semibold text-slate-800">{l.contactName}</td>
                        <td className="py-3 text-slate-600">{l.companyName}</td>
                        <td className="py-3 font-mono text-slate-700">{l.phone}</td>
                        <td className="py-3 text-slate-600">{l.productInterest}</td>
                        <td className="py-3 pr-2 text-right">
                          <button
                            onClick={() => onNotify(`Initiating dialer for ${l.phone}...`)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
                          >
                            Call Now
                          </button>
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
          TAB 3: DEALS_QUOTES (Deals & Quotations)
         ========================================================================= */}
      {tabId === "deals_quotes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Active Deal Pipeline & Quotes</h3>
            <button
              onClick={() => setShowDealModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Create Deal
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {deals.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Handshake className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No active deals in pipeline.</p>
                <p className="text-[11px] text-slate-400">Create a deal to generate price estimates and track negotiations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {deals.map((d) => (
                  <div key={d.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{d.clientName}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {d.stage}
                      </span>
                    </div>
                    <p className="text-base font-black text-slate-900 font-mono">₹ {d.dealValue}</p>
                    <p className="text-[11px] text-slate-500">AE: {d.assignedAE} • Close: {d.expectedCloseDate || "This Month"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SALES_ORDERS (Sales Orders & Counter Desk)
         ========================================================================= */}
      {tabId === "sales_orders" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase">Confirmed Sales Orders (SO)</h3>
            <button
              onClick={() => setShowSoModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Book Sales Order
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            {salesOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No sales orders booked yet.</p>
                <p className="text-[11px] text-slate-400">Book customer counter orders or field sales contracts here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {salesOrders.map((so) => (
                  <div key={so.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{so.id} • {so.clientName}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {so.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{so.itemsSummary}</p>
                      <p className="text-[11px] text-slate-400">Terms: {so.paymentTerms} • Branch: {so.deliveryBranch}</p>
                    </div>
                    <p className="text-base font-black text-slate-900 font-mono">₹ {so.totalAmount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CAMPAIGNS_OPS (Campaigns & Sales Ops)
         ========================================================================= */}
      {tabId === "campaigns_ops" && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase">Sales Ops & Digital Campaigns</h3>
          <p className="text-xs text-slate-500">Track lead acquisition cost, marketing ROI, and commission disbursements.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-500 block mb-1">Active Ad Campaigns</span>
              <p className="text-lg font-black text-slate-900">Google Ads & Industry Expo</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-500 block mb-1">Blended CAC</span>
              <p className="text-lg font-black text-emerald-600">₹ 840 / Qualified Deal</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-500 block mb-1">CRM Hygiene Score</span>
              <p className="text-lg font-black text-slate-900">98.2% Accurate</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Log New Sales Lead</h3>
            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={leadForm.contactName}
                  onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Company / Store</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Hardware"
                    value={leadForm.companyName}
                    onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98765 43210"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Product Requirement</label>
                <input
                  type="text"
                  placeholder="e.g. 500 units Heavy-Duty Brackets"
                  value={leadForm.productInterest}
                  onChange={(e) => setLeadForm({ ...leadForm, productInterest: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Deal Modal */}
      {showDealModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Enter Deal into Pipeline</h3>
            <form onSubmit={handleCreateDeal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Builders Ltd"
                  value={dealForm.clientName}
                  onChange={(e) => setDealForm({ ...dealForm, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Deal Value (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 250000"
                    value={dealForm.dealValue}
                    onChange={(e) => setDealForm({ ...dealForm, dealValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pipeline Stage</label>
                  <select
                    value={dealForm.stage}
                    onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="QUALIFIED">Qualified</option>
                    <option value="DEMO_VISIT">Demo / Field Visit</option>
                    <option value="PRICE_NEGOTIATION">Negotiation</option>
                    <option value="WON">Closed Won</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDealModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Commit Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SO Modal */}
      {showSoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Book Confirmed Sales Order (SO)</h3>
            <form onSubmit={handleCreateSo} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Customer / Client</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Krishna Enterprises"
                  value={soForm.clientName}
                  onChange={(e) => setSoForm({ ...soForm, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Order Items & Quantities</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 200x Bracket A, 50x Fasteners"
                  value={soForm.itemsSummary}
                  onChange={(e) => setSoForm({ ...soForm, itemsSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 85000"
                    value={soForm.totalAmount}
                    onChange={(e) => setSoForm({ ...soForm, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Payment Terms</label>
                  <select
                    value={soForm.paymentTerms}
                    onChange={(e) => setSoForm({ ...soForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="IMMEDIATE_CASH">Cash / UPI Immediate</option>
                    <option value="NET_15">Net 15 Days</option>
                    <option value="NET_30">Net 30 Days</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSoModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Confirm Sales Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
