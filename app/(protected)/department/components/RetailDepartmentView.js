"use client";
import React, { useState } from "react";
import {
  ShoppingCart,
  Store,
  Receipt,
  ScanLine,
  TrendingUp,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Search,
  Users,
  Coins,
  Package,
  Boxes,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
} from "lucide-react";
import { DEPARTMENT_CONFIGS } from "./departmentConfig";

// Common quick-pick items (Haldiram's Sweets & D-Mart FMCG Essentials)
const QUICK_POS_ITEMS = [
  { name: "Kaju Katli (500g)", category: "Sweets", price: 460, unit: "Box", barcode: "8901234001" },
  { name: "Motichoor Ladoo (500g)", category: "Sweets", price: 280, unit: "Box", barcode: "8901234002" },
  { name: "Haldiram's Aloo Bhujia (400g)", category: "Snacks", price: 115, unit: "Pkt", barcode: "8901234003" },
  { name: "Gulab Jamun Tin (1kg)", category: "Sweets", price: 250, unit: "Tin", barcode: "8901234004" },
  { name: "Aashirvaad Shudh Chakki Atta (5kg)", category: "Groceries", price: 265, unit: "Bag", barcode: "8901234005" },
  { name: "Amul Butter (500g)", category: "Dairy", price: 275, unit: "Pkt", barcode: "8901234006" },
  { name: "Tata Salt Vacuum Evaporated (1kg)", category: "Groceries", price: 28, unit: "Pkt", barcode: "8901234007" },
  { name: "Fortune Sunlite Oil (1L Pouch)", category: "Edible Oil", price: 135, unit: "Pouch", barcode: "8901234008" },
];

export default function RetailDepartmentView({
  tabId = "pos_terminal",
  employee,
  company,
  onNotify = () => {},
}) {
  const deptConfig = DEPARTMENT_CONFIGS.RETAIL;
  const currentTab = deptConfig.tabs.find((t) => t.id === tabId) || deptConfig.tabs[0];
  const [activeSubView, setActiveSubView] = useState(currentTab.subViews[0]?.id);

  // 1. POS Terminal States
  const [cart, setCart] = useState([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [paymentMode, setPaymentMode] = useState("CASH"); // CASH | UPI | CARD | SPLIT
  const [cashTendered, setCashTendered] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [posSuccessMsg, setPosSuccessMsg] = useState("");
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [selectedReceiptPreview, setSelectedReceiptPreview] = useState(null);

  // Custom Item Form
  const [customItem, setCustomItem] = useState({
    name: "",
    category: "Sweets & Snacks",
    price: "",
    quantity: "1",
    unit: "Pcs",
  });

  // 2. Cash Register & Float States
  const [openingFloat, setOpeningFloat] = useState(2000);
  const [cashDropHistory, setCashDropHistory] = useState([]);
  const [dropAmount, setDropAmount] = useState("");
  const [dropNotes, setDropNotes] = useState("");

  // 3. Store Inventory & Restock States
  const [shelfStock, setShelfStock] = useState([
    { id: "SKU-01", name: "Kaju Katli (500g)", shelfQty: 18, godownQty: 140, status: "HEALTHY", unit: "Box" },
    { id: "SKU-02", name: "Motichoor Ladoo (500g)", shelfQty: 4, godownQty: 60, status: "LOW", unit: "Box" },
    { id: "SKU-03", name: "Haldiram's Bhujia (400g)", shelfQty: 32, godownQty: 300, status: "HEALTHY", unit: "Pkt" },
    { id: "SKU-04", name: "Amul Butter (500g)", shelfQty: 6, godownQty: 45, status: "LOW", unit: "Pkt" },
    { id: "SKU-05", name: "Fortune Sunflower Oil (1L)", shelfQty: 22, godownQty: 180, status: "HEALTHY", unit: "Pouch" },
  ]);
  const [wastageLogs, setWastageLogs] = useState([]);

  // 4. Walk-in Footfall & Loyalty States
  const [footfallCount, setFootfallCount] = useState(48);
  const [walkinDirectory, setWalkinDirectory] = useState([
    { phone: "9825012345", name: "Anand Shah", visits: 6, totalSpent: 4250, lastVisit: "Today 14:15" },
    { phone: "9426098765", name: "Pooja Mehta", visits: 3, totalSpent: 1820, lastVisit: "Today 12:40" },
  ]);

  // Calculations for POS Cart
  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subTotal * (Number(discountPercent) || 0)) / 100);
  const taxableAmount = Math.max(0, subTotal - discountAmount);
  const gstAmount = Math.round(taxableAmount * 0.05); // Standard 5% composite for sweets/FMCG
  const grandTotal = taxableAmount + gstAmount;
  const changeDue = Math.max(0, (Number(cashTendered) || 0) - grandTotal);

  // Cart Actions
  const handleAddItemToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + (Number(item.quantity) || 1) } : i
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          name: item.name,
          category: item.category || "FMCG",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "Pcs",
        },
      ];
    });
    setPosSuccessMsg("");
  };

  const handleRemoveFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCartQty = (index, delta) => {
    setCart((prev) =>
      prev
        .map((item, i) => {
          if (i === index) {
            const nextQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customItem.name.trim() || Number(customItem.price) <= 0) return;
    handleAddItemToCart({
      name: customItem.name.trim(),
      category: customItem.category,
      price: Number(customItem.price),
      quantity: Math.max(1, Number(customItem.quantity) || 1),
      unit: customItem.unit,
    });
    setCustomItem({
      name: "",
      category: "Sweets & Snacks",
      price: "",
      quantity: "1",
      unit: "Pcs",
    });
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const receiptId = `RCP-POS-${Date.now().toString().slice(-6)}`;
    const newReceipt = {
      id: receiptId,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toLocaleDateString(),
      customerName: customerName || "Walk-in Customer",
      customerPhone: customerPhone || "N/A",
      items: [...cart],
      subTotal,
      discountAmount,
      gstAmount,
      grandTotal,
      paymentMode,
      cashTendered: paymentMode === "CASH" ? Number(cashTendered) || grandTotal : grandTotal,
      changeDue: paymentMode === "CASH" ? changeDue : 0,
      cashier: employee?.name || "Counter Cashier",
      counterNo: "Counter 1 (Main)",
    };

    setRecentReceipts([newReceipt, ...recentReceipts]);
    setSelectedReceiptPreview(newReceipt);
    setPosSuccessMsg(`Payment recorded! Thermal receipt #${receiptId} generated successfully.`);
    setFootfallCount((prev) => prev + 1);

    if (customerPhone && customerPhone.length >= 10) {
      setWalkinDirectory((prev) => {
        const found = prev.find((c) => c.phone === customerPhone);
        if (found) {
          return prev.map((c) =>
            c.phone === customerPhone
              ? { ...c, visits: c.visits + 1, totalSpent: c.totalSpent + grandTotal, lastVisit: "Just now" }
              : c
          );
        }
        return [
          {
            phone: customerPhone,
            name: customerName !== "Walk-in Customer" ? customerName : "Walk-in Buyer",
            visits: 1,
            totalSpent: grandTotal,
            lastVisit: "Just now",
          },
          ...prev,
        ];
      });
    }

    // Reset checkout fields
    setCart([]);
    setCustomerPhone("");
    setCustomerName("Walk-in Customer");
    setCashTendered("");
    setDiscountPercent(0);

    onNotify({
      type: "SUCCESS",
      title: "Walk-in Sale Completed",
      message: `Receipt #${receiptId} (₹${grandTotal}) billed via ${paymentMode}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Store Model & POS Counter Context */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-white">
                Retail Store, POS & Counter Desk
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300">
                D-Mart & Haldiram's Model
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Till 1 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapid barcode scanning, instant spot billing for walk-in customers, and daily cash drawer management.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Footfall</p>
            <p className="text-lg font-black text-rose-400">{footfallCount} Customers</p>
          </div>
          <button
            onClick={() => setFootfallCount((c) => c + 1)}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Increment walk-in customer counter"
          >
            <Plus className="w-3.5 h-3.5" />
            +1 Walk-in
          </button>
        </div>
      </div>

      {/* Sub-view Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        {currentTab.subViews.map((sub) => {
          const isActive = activeSubView === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubView(sub.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: POS TERMINAL */}
      {tabId === "pos_terminal" && (
        <>
          {activeSubView === "counter_checkout" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Quick Pick Items & Barcode Catalog (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Fast Scan / Item Quick Buttons */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ScanLine className="w-4 h-4 text-rose-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Fast-Moving Counter Items (One-Click Add)
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-500">Haldiram's & D-Mart Best-Sellers</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {QUICK_POS_ITEMS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddItemToCart(item)}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-rose-50 hover:border-rose-300 text-left transition-all group cursor-pointer"
                      >
                        <p className="text-xs font-bold text-slate-900 group-hover:text-rose-700 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500">{item.category}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-600">₹{item.price}</span>
                          <span className="text-[9px] font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform">
                            + ADD
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Item Builder / Loose Sweet Weighing Desk */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Add Loose Sweets / Custom SKU by Barcode or Weight
                    </h3>
                  </div>

                  <form onSubmit={handleAddCustomItem} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Item name (e.g. Rasgulla 1kg)"
                        value={customItem.name}
                        onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <select
                        value={customItem.category}
                        onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                        className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:border-rose-500 outline-none"
                      >
                        <option value="Sweets & Mithai">Sweets & Mithai</option>
                        <option value="FMCG & Groceries">FMCG & Groceries</option>
                        <option value="Snacks & Namkeen">Snacks & Namkeen</option>
                        <option value="Beverages & Dairy">Beverages & Dairy</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Price ₹"
                        value={customItem.price}
                        onChange={(e) => setCustomItem({ ...customItem, price: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full h-full min-h-[36px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Live Walk-in Cart & Payment Drawer (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-rose-600" />
                      <h3 className="text-sm font-black text-slate-900">Current Walk-in Cart</h3>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      {cart.length} {cart.length === 1 ? "Item" : "Items"}
                    </span>
                  </div>

                  {/* Customer Quick Capture */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none"
                        placeholder="Walk-in Customer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Phone (For Loyalty)</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 outline-none"
                        placeholder="e.g. 9825012345"
                      />
                    </div>
                  </div>

                  {/* Cart Items List */}
                  <div className="min-h-[160px] max-h-[240px] overflow-y-auto space-y-2 pr-1">
                    {cart.length === 0 ? (
                      <div className="py-8 text-center space-y-2 text-slate-400">
                        <Store className="w-8 h-8 mx-auto opacity-30 text-rose-400" />
                        <p className="text-xs font-medium">Cart is empty.</p>
                        <p className="text-[11px] text-slate-400">
                          Click fast-pick items on the left or scan a product barcode to begin.
                        </p>
                      </div>
                    ) : (
                      cart.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="truncate pr-2">
                            <p className="font-bold text-slate-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              ₹{item.price} / {item.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(idx, -1)}
                                className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-black text-slate-800 font-mono">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(idx, 1)}
                                className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-mono font-bold text-slate-900 min-w-[50px] text-right">
                              ₹{item.price * item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(idx)}
                              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  {cart.length > 0 && (
                    <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span className="font-mono font-semibold text-slate-800">₹{subTotal}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3 text-rose-500" /> Store Discount (%)
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                          className="w-16 px-1.5 py-0.5 text-right font-mono rounded bg-slate-50 border border-slate-200 text-xs"
                        />
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Discount Deduction</span>
                          <span className="font-mono">- ₹{discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>GST (Composite 5%)</span>
                        <span className="font-mono font-semibold text-slate-800">+ ₹{gstAmount}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                        <span>Grand Total</span>
                        <span className="text-rose-600 font-mono text-base">₹{grandTotal}</span>
                      </div>

                      {/* Payment Mode Selector */}
                      <div className="pt-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Payment Mode
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "CASH", label: "Cash", icon: Banknote },
                            { id: "UPI", label: "UPI QR", icon: QrCode },
                            { id: "CARD", label: "Card", icon: CreditCard },
                          ].map((pm) => {
                            const Icon = pm.icon;
                            const isSel = paymentMode === pm.id;
                            return (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => setPaymentMode(pm.id)}
                                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  isSel
                                    ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {pm.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cash Tendered Calculator (If Cash selected) */}
                      {paymentMode === "CASH" && (
                        <div className="grid grid-cols-2 gap-2 pt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Cash Given (₹)</label>
                            <input
                              type="number"
                              min={grandTotal}
                              value={cashTendered}
                              onChange={(e) => setCashTendered(e.target.value)}
                              placeholder={`e.g. ${grandTotal}`}
                              className="w-full mt-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Change Due (₹)</label>
                            <p className="mt-2 text-sm font-black font-mono text-emerald-600">
                              ₹{changeDue}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Button: Complete Sale */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleCompleteSale}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          Print Receipt & Complete Sale
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {posSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{posSuccessMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubView === "recent_receipts" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Recent POS Thermal Receipts</h3>
                  <p className="text-xs text-slate-500">All customer receipts issued at this billing counter today.</p>
                </div>
                <span className="text-xs font-bold text-slate-600">{recentReceipts.length} Receipts</span>
              </div>

              {recentReceipts.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No receipts issued yet today</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When walk-in customers make purchases at the counter, their itemized bills and payment slips will appear here.
                  </p>
                  <button
                    onClick={() => setActiveSubView("counter_checkout")}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 cursor-pointer"
                  >
                    Open Counter Billing
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentReceipts.map((rcp) => (
                    <div key={rcp.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{rcp.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {rcp.paymentMode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {rcp.customerName} • {rcp.items.length} items • {rcp.timestamp}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-slate-900 text-sm">₹{rcp.grandTotal}</span>
                        <button
                          onClick={() => setSelectedReceiptPreview(rcp)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          View Slip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubView === "barcode_lookup" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Fast Barcode & SKU Directory</h3>
                <p className="text-xs text-slate-500">Scan or look up prices, GST slabs, and shelf inventory for retail items.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_POS_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Barcode: {item.barcode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-black text-emerald-600 text-sm">₹{item.price}</p>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddItemToCart(item);
                          setActiveSubView("counter_checkout");
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Add to Till →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: CASH REGISTER & TILL CLOSE */}
      {tabId === "daily_cash_register" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Cash Register & Till Close</h3>
              <p className="text-xs text-slate-500">Shift drawer opening float, total cash collected, and end-of-day reconciliation.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              Counter 1 Register
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500">Shift Opening Float</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">₹{openingFloat}</p>
              <p className="text-[10px] text-slate-400 mt-1">Allocated at shift start</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Cash Sales Collected</span>
              <p className="text-xl font-black text-emerald-700 font-mono mt-1">
                ₹{recentReceipts.filter((r) => r.paymentMode === "CASH").reduce((s, r) => s + r.grandTotal, 0)}
              </p>
              <p className="text-[10px] text-emerald-600 mt-1">Direct walk-in physical cash</p>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[10px] font-bold uppercase text-purple-700">Digital Collections (UPI / Card)</span>
              <p className="text-xl font-black text-purple-700 font-mono mt-1">
                ₹{recentReceipts.filter((r) => r.paymentMode !== "CASH").reduce((s, r) => s + r.grandTotal, 0)}
              </p>
              <p className="text-[10px] text-purple-600 mt-1">Directly credited to ledger bank</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-800">Drop Cash to Safe / Bank Handover</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="number"
                min="0"
                placeholder="Amount to drop (₹)"
                value={dropAmount}
                onChange={(e) => setDropAmount(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none"
              />
              <input
                type="text"
                placeholder="Handover notes (e.g. Owner safe handover)"
                value={dropNotes}
                onChange={(e) => setDropNotes(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!dropAmount || Number(dropAmount) <= 0) return;
                  setCashDropHistory([
                    {
                      id: `DROP-${Date.now()}`,
                      amount: Number(dropAmount),
                      time: new Date().toLocaleTimeString(),
                      notes: dropNotes || "Mid-day safe drop",
                    },
                    ...cashDropHistory,
                  ]);
                  setDropAmount("");
                  setDropNotes("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Record Cash Drop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STORE INVENTORY & SHELVES */}
      {tabId === "store_inventory" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Store Shelves & FMCG Racks</h3>
              <p className="text-xs text-slate-500">Live shelf inventory vs godown stock for fast-moving items.</p>
            </div>
            <button
              onClick={() => {
                onNotify({
                  type: "INFO",
                  title: "Restock Requisition Sent",
                  message: "Warehouse team notified to replenish low shelf stock.",
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
            >
              Request Shelf Restock
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {shelfStock.map((sku) => (
              <div key={sku.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{sku.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sku.status === "LOW"
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {sku.status === "LOW" ? "Restock Needed" : "In Stock"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Godown Storage: {sku.godownQty} {sku.unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-slate-900 text-sm">
                    {sku.shelfQty} {sku.unit} on shelf
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WALKIN CUSTOMERS & FOOTFALL */}
      {tabId === "walkin_customers" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Walk-in Customers & Footfall Directory</h3>
              <p className="text-xs text-slate-500">Phone numbers captured at checkout for repeat visits and loyalty promos.</p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-xl">
              {walkinDirectory.length} Registered Buyers
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {walkinDirectory.map((cust, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{cust.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      +91 {cust.phone}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {cust.visits} Store Visits • Last seen {cust.lastVisit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-emerald-600 text-sm">₹{cust.totalSpent}</p>
                  <span className="text-[10px] text-slate-400">Total Purchases</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thermal Receipt Preview Modal */}
      {selectedReceiptPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white text-slate-900 p-5 shadow-2xl space-y-4 font-mono text-xs border border-slate-200">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="text-sm font-black tracking-wider uppercase">
                {company?.name || "RETAIL STORE"}
              </h3>
              <p className="text-[10px] text-slate-500">WALK-IN COUNTER THERMAL RECEIPT</p>
              <p className="text-[10px] text-slate-500">{selectedReceiptPreview.counterNo}</p>
            </div>

            <div className="text-[10px] space-y-0.5 text-slate-600">
              <p>Receipt: {selectedReceiptPreview.id}</p>
              <p>Date: {selectedReceiptPreview.date} {selectedReceiptPreview.timestamp}</p>
              <p>Customer: {selectedReceiptPreview.customerName} ({selectedReceiptPreview.customerPhone})</p>
              <p>Cashier: {selectedReceiptPreview.cashier}</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
              {selectedReceiptPreview.items.map((it, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="truncate pr-2">{it.name} x{it.quantity}</span>
                  <span className="font-bold">₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right text-[11px]">
              <p>Subtotal: ₹{selectedReceiptPreview.subTotal}</p>
              {selectedReceiptPreview.discountAmount > 0 && (
                <p className="text-rose-600">Discount: -₹{selectedReceiptPreview.discountAmount}</p>
              )}
              <p>GST: +₹{selectedReceiptPreview.gstAmount}</p>
              <p className="text-sm font-black pt-1 border-t border-slate-200">
                TOTAL: ₹{selectedReceiptPreview.grandTotal}
              </p>
              <p className="text-[10px] text-slate-500">Paid via: {selectedReceiptPreview.paymentMode}</p>
            </div>

            <div className="border-t border-dashed border-slate-300 pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedReceiptPreview(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
