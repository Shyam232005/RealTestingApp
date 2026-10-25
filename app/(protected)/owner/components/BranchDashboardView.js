"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Users,
  TrendingUp,
  Package,
  Plus,
  Trash2,
  Tag,
  Sparkles,
  Zap,
  Clock,
  Phone,
  MessageSquare,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function BranchDashboardView({
  organization,
  selectedBranchId,
  onOrganizationUpdate,
  showToast,
}) {
  const branchList = organization?.branchList || [];
  const currentBranch =
    branchList.find((b) => b.branchId === selectedBranchId) ||
    branchList[0] || {
      name: "Main Branch",
      location: organization?.location || "Primary Location",
      status: "active",
      staffCount: 0,
      monthlySalesTarget: organization?.monthlyRevenueTarget || 0,
      currentMonthSales: 0,
      allocatedFunds: 0,
      stockItems: organization?.stockCatalog || [],
      customers: [],
      offers: [],
    };

  // Modals
  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  // Form states for modals
  const [fundAmount, setFundAmount] = useState("");
  const [fundSource, setFundSource] = useState("Bank");
  const [fundNotes, setFundNotes] = useState("");
  const [isSubmittingFund, setIsSubmittingFund] = useState(false);

  const [stockName, setStockName] = useState("");
  const [stockCategory, setStockCategory] = useState("Finished Goods");
  const [stockQty, setStockQty] = useState("");
  const [stockUnit, setStockUnit] = useState("Pcs");
  const [stockPrice, setStockPrice] = useState("");
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custTier, setCustTier] = useState("Regular");
  const [custPurchase, setCustPurchase] = useState("");
  const [isSubmittingCust, setIsSubmittingCust] = useState(false);

  const [offerTitle, setOfferTitle] = useState("");
  const [offerDesc, setOfferDesc] = useState("");
  const [offerType, setOfferType] = useState("limited_time_special");
  const [offerDiscount, setOfferDiscount] = useState("");
  const [offerHours, setOfferHours] = useState("48");
  const [offerChannel, setOfferChannel] = useState("WhatsApp / SMS");
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // Active CRM Tab: "customers" or "offers"
  const [crmActiveTab, setCrmActiveTab] = useState("customers");

  // Calculations
  const target = Number(currentBranch.monthlySalesTarget || 0);
  const currentSales = Number(currentBranch.currentMonthSales || 0);
  const targetProgress =
    target > 0 ? Math.min(100, Math.round((currentSales / target) * 100)) : 0;

  const stockItems = currentBranch.stockItems || [];
  const totalStockValue = stockItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const customers = currentBranch.customers || [];
  const offers = currentBranch.offers || [];

  // 1. Allot Funds Handler
  const handleAllotFunds = async (e) => {
    e.preventDefault();
    if (!fundAmount || Number(fundAmount) <= 0) return;
    setIsSubmittingFund(true);

    try {
      const res = await fetch(`/api/owner/branches/${currentBranch.branchId}/funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(fundAmount),
          source: fundSource,
          notes: fundNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to allot funds.");

      // Refresh organization
      const orgRes = await fetch("/api/owner/organization");
      const orgData = await orgRes.json();
      if (orgData.organization && onOrganizationUpdate) {
        onOrganizationUpdate(orgData.organization);
      }

      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      if (showToast) showToast(data.message);
      setIsFundsModalOpen(false);
      setFundAmount("");
      setFundNotes("");
    } catch (err) {
      if (showToast) showToast(err.message || "Failed to allot funds.");
    } finally {
      setIsSubmittingFund(false);
    }
  };

  // 2. Add Stock Item Handler
  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!stockName.trim()) return;
    setIsSubmittingStock(true);

    try {
      const res = await fetch(`/api/owner/branches/${currentBranch.branchId}/crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_stock_item",
          name: stockName.trim(),
          category: stockCategory,
          quantity: Number(stockQty) || 0,
          unit: stockUnit,
          unitPrice: Number(stockPrice) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add stock item.");

      const orgRes = await fetch("/api/owner/organization");
      const orgData = await orgRes.json();
      if (orgData.organization && onOrganizationUpdate) {
        onOrganizationUpdate(orgData.organization);
      }

      if (showToast) showToast(data.message);
      setIsStockModalOpen(false);
      setStockName("");
      setStockQty("");
      setStockPrice("");
    } catch (err) {
      if (showToast) showToast(err.message || "Failed to add stock.");
    } finally {
      setIsSubmittingStock(false);
    }
  };

  // 3. Add CRM Customer Handler
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) return;
    setIsSubmittingCust(true);

    try {
      const res = await fetch(`/api/owner/branches/${currentBranch.branchId}/crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_customer",
          name: custName.trim(),
          phone: custPhone.trim(),
          email: custEmail.trim(),
          tier: custTier,
          initialPurchase: Number(custPurchase) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add customer.");

      const orgRes = await fetch("/api/owner/organization");
      const orgData = await orgRes.json();
      if (orgData.organization && onOrganizationUpdate) {
        onOrganizationUpdate(orgData.organization);
      }

      if (showToast) showToast(data.message);
      setIsCustomerModalOpen(false);
      setCustName("");
      setCustPhone("");
      setCustEmail("");
      setCustPurchase("");
    } catch (err) {
      if (showToast) showToast(err.message || "Failed to add customer.");
    } finally {
      setIsSubmittingCust(false);
    }
  };

  // 4. Broadcast Offer Handler (Urgent / Regular)
  const handleBroadcastOffer = async (e) => {
    e.preventDefault();
    if (!offerTitle.trim()) return;
    setIsSubmittingOffer(true);

    try {
      const res = await fetch(`/api/owner/branches/${currentBranch.branchId}/crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_offer",
          title: offerTitle.trim(),
          description: offerDesc.trim(),
          offerType: offerType,
          discountPercent: Number(offerDiscount) || 0,
          validHours: Number(offerHours) || 48,
          broadcastChannel: offerChannel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to broadcast offer.");

      const orgRes = await fetch("/api/owner/organization");
      const orgData = await orgRes.json();
      if (orgData.organization && onOrganizationUpdate) {
        onOrganizationUpdate(orgData.organization);
      }

      try {
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      if (showToast) showToast(data.message);
      setIsOfferModalOpen(false);
      setOfferTitle("");
      setOfferDesc("");
      setOfferDiscount("");
    } catch (err) {
      if (showToast) showToast(err.message || "Failed to broadcast offer.");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // Delete offer
  const handleDeleteOffer = async (offerId) => {
    try {
      const res = await fetch(`/api/owner/branches/${currentBranch.branchId}/crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_offer", offerId }),
      });
      if (res.ok) {
        const orgRes = await fetch("/api/owner/organization");
        const orgData = await orgRes.json();
        if (orgData.organization && onOrganizationUpdate) {
          onOrganizationUpdate(orgData.organization);
        }
        if (showToast) showToast("Offer removed from broadcast list.");
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* 1. Branch Hero Card with Quick Owner Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                Unit #{currentBranch.branchNumber || 1}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Branch
              </span>
              {currentBranch.staffCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-500" />
                  {currentBranch.staffCount} Employees
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {currentBranch.name}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentBranch.location || "Branch Address / City"}</span>
            </p>
          </div>
        </div>

        {/* Owner Branch Command Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsFundsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200/80 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-purple-600" />
            <span>Allot Funds</span>
          </button>

          <button
            type="button"
            onClick={() => setIsStockModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Package className="w-4 h-4 text-slate-600" />
            <span>Add Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOfferModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Broadcast Offer</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Culters Template Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Sales Target Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Monthly Sales Goal
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono">
              {targetProgress}% Achieved
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">In Progress</p>
                <p className="text-lg font-black text-slate-900 font-mono">
                  ₹{currentSales.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Target</p>
                <p className="text-sm font-bold text-slate-600 font-mono">
                  ₹{target.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Revenue Card (Blue filled in template) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-md shadow-blue-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Branch Revenue
            </span>
            <ArrowUpRight className="w-4 h-4 text-blue-200" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tracking-tight font-mono">
              ₹{Number(currentSales || 0).toLocaleString("en-IN")}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-blue-100 font-semibold mt-1">
              {currentSales > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-300 font-bold">Live Recorded Sales</span>
                </>
              ) : (
                <span>Zero State — Ready for Billing</span>
              )}
            </div>
          </div>
        </div>

        {/* Total Regular Customers Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Branch Customers (CRM)
            </span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {customers.length.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {customers.filter((c) => c.tier === "VIP").length} VIP •{" "}
              {customers.filter((c) => c.tier === "Regular").length} Regular
            </p>
          </div>
        </div>

        {/* Branch Allocated Cash/Bank Budget */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Allocated Funds
            </span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 tracking-tight font-mono text-emerald-700">
              ₹{Number(currentBranch.allocatedFunds || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Operational balance allotted by Owner
            </p>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Sales Trend & Promotion Campaign Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Performance Trend Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Sales & Demand Trends
              </h3>
              <p className="text-xs text-slate-500">
                Monthly revenue performance vs target for this unit
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Target
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Sales
              </span>
            </div>
          </div>

          {/* Trend Content: Real Data or Strict Zero State */}
          {currentSales > 0 ? (
            <>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 h-36 items-end pt-4 border-b border-slate-100">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                  (mo) => (
                    <div key={mo} className="flex flex-col items-center gap-1.5 group h-full justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-purple-500/80 to-indigo-500 rounded-t-lg transition-all group-hover:from-purple-600 group-hover:to-indigo-600"
                        style={{ height: `${targetProgress}%` }}
                      />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700">
                        {mo}
                      </span>
                    </div>
                  )
                )}
              </div>
              <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Avg Monthly Bill: ₹{Math.round(currentSales / Math.max(1, customers.length)).toLocaleString("en-IN")}</span>
                <span className="text-purple-700 font-bold">Active Store Movement</span>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 sm:p-8 text-center space-y-2 my-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">No Sales Records Logged Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                When your billing counter operators or salesmen create customer invoices for this branch, monthly demand curves and average bill metrics will plot here automatically.
              </p>
              <div className="pt-2 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-mono">
                <span>Monthly Invoices: 0</span>
                <span>•</span>
                <span>Avg Bill Value: ₹0</span>
              </div>
            </div>
          )}
        </div>

        {/* Promotional Campaign Banner (Culters "Increase your sales" Gradient Banner) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-purple-600/30 blur-2xl pointer-events-none" />
          
          <div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black tracking-tight text-white leading-tight">
              Boost Branch Footfall
            </h3>
            <p className="text-xs text-purple-200 mt-2 leading-relaxed">
              Broadcast festive discounts or special flash offers to your {customers.length} regular customers in 1 click.
            </p>
          </div>

          <div className="pt-5">
            <button
              type="button"
              onClick={() => setIsOfferModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-black shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Broadcast New Offer</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Current Stock Inventory Table + Dedicated Branch CRM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stock Inventory Table (Culters Product Popular Table Style) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Stocked Products & Items ({stockItems.length})
              </h3>
              <p className="text-xs text-slate-500">
                Current goods and manufactured units held at this branch
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsStockModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>

          {stockItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No stock items added yet</p>
              <p className="text-[11px] text-slate-400">
                Add products or items this branch sells so your store staff and accountants know inventory levels.
              </p>
              <button
                type="button"
                onClick={() => setIsStockModalOpen(true)}
                className="mt-2 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                + Add First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="pb-3 pl-1">Product</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Stock Qty</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockItems.map((item, idx) => {
                    const isLow = (Number(item.quantity) || 0) <= 5;
                    return (
                      <tr key={item.itemId || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pl-1 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-3 text-slate-500 font-medium">
                          {item.category || "General"}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-900">
                          ₹{Number(item.unitPrice || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 font-mono text-slate-700">
                          {item.quantity} {item.unit || "Pcs"}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              isLow
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Dedicated Branch CRM (Customer List & Urgent Offers) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Branch Customer CRM
              </h3>
              <p className="text-xs text-slate-500">
                Regular clients & timely promotional alerts
              </p>
            </div>

            {/* Sub-tab toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCrmActiveTab("customers")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  crmActiveTab === "customers"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Clients ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setCrmActiveTab("offers")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  crmActiveTab === "offers"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Offers ({offers.length})
              </button>
            </div>
          </div>

          {/* CRM Tab A: Customer Directory */}
          {crmActiveTab === "customers" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Registered Regular Customers
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Client</span>
                </button>
              </div>

              {customers.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                  <Users className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No customers registered yet</p>
                  <p className="text-[11px] text-slate-400">
                    Add loyal or regular buyers to notify them of special stock arrivals and urgent offers.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer"
                  >
                    + Register Customer
                  </button>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {customers.map((cust, idx) => (
                    <div
                      key={cust.customerId || idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 truncate">{cust.name}</p>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                              cust.tier === "VIP"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {cust.tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-slate-900">
                          ₹{Number(cust.totalPurchases || 0).toLocaleString("en-IN")}
                        </p>
                        <a
                          href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5 justify-end mt-0.5"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CRM Tab B: Active Promotional Offers & Flash Alerts */}
          {crmActiveTab === "offers" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Active Promotions & Alerts
                </span>
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Offer</span>
                </button>
              </div>

              {offers.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                  <Zap className="w-7 h-7 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No active promotional offers</p>
                  <p className="text-[11px] text-slate-400">
                    Broadcast a limited-time flash discount or seasonal stock update to regular clients.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOfferModalOpen(true)}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer"
                  >
                    + Create First Offer
                  </button>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {offers.map((off, idx) => {
                    const isUrgent = off.offerType === "limited_time_special";
                    return (
                      <div
                        key={off.offerId || idx}
                        className={`p-3.5 rounded-2xl border text-xs relative ${
                          isUrgent
                            ? "bg-amber-50/70 border-amber-200 text-amber-950"
                            : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                  isUrgent
                                    ? "bg-amber-400 text-slate-900 flex items-center gap-1"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {isUrgent && <Zap className="w-2.5 h-2.5" />}
                                {isUrgent ? "Limited Time Special" : "Seasonal Update"}
                              </span>
                              {off.discountPercent > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                                  {off.discountPercent}% OFF
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                              {off.title}
                            </h4>
                            {off.description && (
                              <p className="text-slate-600 text-[11px] mt-0.5">
                                {off.description}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteOffer(off.offerId)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                            title="Delete offer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Valid until:{" "}
                            {off.validUntil
                              ? new Date(off.validUntil).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "Limited Time"}
                          </span>
                          <span className="font-bold text-purple-700">
                            {off.broadcastChannel || "WhatsApp / SMS"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Allot Operational Funds (Owner Only) */}
      <AnimatePresence>
        {isFundsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Allot Funds to {currentBranch.name}
                    </h3>
                    <p className="text-[10px] text-slate-400">Owner treasury fund transfer</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFundsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAllotFunds} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Fund Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50000"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Debit Source Account
                  </label>
                  <select
                    value={fundSource}
                    onChange={(e) => setFundSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-purple-600"
                  >
                    <option value="Bank">Commercial Bank Account</option>
                    <option value="Cash">Physical Cash in Hand</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Purpose / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly petty cash & electricity budget"
                    value={fundNotes}
                    onChange={(e) => setFundNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFundsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFund}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {isSubmittingFund ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Transfer Budget</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Add Stock Item */}
      <AnimatePresence>
        {isStockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Add Stock to {currentBranch.name}
                    </h3>
                    <p className="text-[10px] text-slate-400">Inventory SKU Registration</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsStockModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddStock} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Product / Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cotton Shirt - M"
                    value={stockName}
                    onChange={(e) => setStockName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Category
                    </label>
                    <select
                      value={stockCategory}
                      onChange={(e) => setStockCategory(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-purple-600"
                    >
                      <option value="Finished Goods">Finished Goods</option>
                      <option value="Trading Goods">Trading Goods</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Apparel / Retail">Apparel / Retail</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Unit
                    </label>
                    <select
                      value={stockUnit}
                      onChange={(e) => setStockUnit(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-purple-600"
                    >
                      <option value="Pcs">Pcs</option>
                      <option value="Boxes">Boxes</option>
                      <option value="Kg">Kg</option>
                      <option value="Meters">Meters</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 50"
                      value={stockQty}
                      onChange={(e) => setStockQty(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Unit Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 850"
                      value={stockPrice}
                      onChange={(e) => setStockPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStockModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingStock}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {isSubmittingStock ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Add Item</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Add Regular Customer to Branch CRM */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Register Regular Client
                    </h3>
                    <p className="text-[10px] text-slate-400">Branch CRM directory</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Customer Tier
                    </label>
                    <select
                      value={custTier}
                      onChange={(e) => setCustTier(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-purple-600"
                    >
                      <option value="Regular">Regular Buyer</option>
                      <option value="VIP">VIP Patron</option>
                      <option value="Occasional">Occasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Initial Purchase (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 15000"
                      value={custPurchase}
                      onChange={(e) => setCustPurchase(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCust}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {isSubmittingCust ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Save Client</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Broadcast Promotional Offer (Owner Only) */}
      <AnimatePresence>
        {isOfferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Broadcast Offer to {currentBranch.name} Clients
                    </h3>
                    <p className="text-[10px] text-slate-400">Owner Promotional Broadcast</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOfferModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBroadcastOffer} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Promotion Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOfferType("limited_time_special")}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left flex items-center gap-2 cursor-pointer ${
                        offerType === "limited_time_special"
                          ? "bg-amber-50 border-amber-300 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Zap className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="leading-tight font-extrabold">Urgent Flash Alert</p>
                        <p className="text-[10px] text-slate-500">24-48 hr special sale</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType("regular_update")}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left flex items-center gap-2 cursor-pointer ${
                        offerType === "regular_update"
                          ? "bg-purple-50 border-purple-300 text-purple-900"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Tag className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="leading-tight font-extrabold">Seasonal Offer</p>
                        <p className="text-[10px] text-slate-500">General discount</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Offer Title / Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20% Off Weekend Clearance Sale!"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Offer Message / Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe the discount, eligible products, or promo conditions..."
                    value={offerDesc}
                    onChange={(e) => setOfferDesc(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Discount %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 15"
                      value={offerDiscount}
                      onChange={(e) => setOfferDiscount(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Valid For (Hours)
                    </label>
                    <select
                      value={offerHours}
                      onChange={(e) => setOfferHours(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 outline-none focus:border-purple-600"
                    >
                      <option value="24">24 Hours (1 Day Flash)</option>
                      <option value="48">48 Hours (Weekend)</option>
                      <option value="72">72 Hours</option>
                      <option value="168">7 Days (1 Week)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOfferModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOffer}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                  >
                    {isSubmittingOffer ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Broadcast Now</span>
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
