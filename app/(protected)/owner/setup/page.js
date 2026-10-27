"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Lock,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";

const INDUSTRY_OPTIONS = [
  "Manufacturing & Engineering",
  "Wholesale & Distribution",
  "Retail & FMCG",
  "Textile & Apparels",
  "Chemicals & Pharmaceuticals",
  "Logistics & Warehousing",
  "Services & IT",
  "Other",
];

const AVAILABLE_DEPARTMENTS = [
  { id: "operations", label: "Operations" },
  { id: "sales&marketing", label: "Sales & Marketing" },
  { id: "supplies&logistics", label: "Supplies & Logistics" },
  { id: "finance&accounts", label: "Finance & Accounts" },
];

export default function OrganizationSetupPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // STRICT EMPTY STATE: Every field starts completely empty
  const [formData, setFormData] = useState({
    // Meta / Subscription
    planName: "MSME Starter",
    billingCycle: "annual",
    paymentStatus: "paid",

    // Step 1: Legal & Business Info (Empty)
    RegisterName: "",
    GST: "",
    location: "",
    industry: "",
    branches: "",
    employeeCount: "",

    // Step 2: Banking & Operational Architecture (Empty)
    BankName: "",
    IFSC: "",
    AccNo: "",
    primaryWarehouse: "",
    activeDepartments: [],

    // Step 3: Opening Balances & Target Metrics (Empty)
    openingBalance: "",
    openingCash: "",
    currentStockValue: "",
    stockItems: [],
    monthlyRevenueTarget: "",
    monthlyProductionTarget: "",

    // Step 4: FinOps Guardrails & MCA Compliance (Empty)
    defaultCreditDays: "",
    poApprovalLimit: "",
    maxDiscountPercent: "",
    minCashReserveAlert: "",
    lowStockThresholdPercent: "",
    inventoryValuationMethod: "",
    mcaAuditLog: false,
  });

  // Check existing status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/owner/organization");
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (data.isSetupComplete && data.organization) {
          // If setup is already finished, redirect directly to dashboard
          router.push("/owner/dashboard");
          return;
        }

        if (data.owner?.subscription) {
          setFormData((prev) => ({
            ...prev,
            planName: data.owner.subscription.planName || prev.planName,
            billingCycle: data.owner.subscription.cycle || prev.billingCycle,
            paymentStatus:
              data.owner.subscription.status === "active" ? "paid" : "trialing",
          }));
        }
      } catch (err) {
        console.error("Failed to load owner status:", err);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, [router]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
  };

  const toggleDepartment = (deptId) => {
    setFormData((prev) => {
      const exists = prev.activeDepartments.includes(deptId);
      const updated = exists
        ? prev.activeDepartments.filter((d) => d !== deptId)
        : [...prev.activeDepartments, deptId];
      return { ...prev, activeDepartments: updated };
    });
    setErrorMsg("");
  };

  // Stock items builder states (Main Branch / Catalog)
  const [newStockName, setNewStockName] = useState("");
  const [newStockCategory, setNewStockCategory] = useState("Finished Goods");
  const [newStockQty, setNewStockQty] = useState("");
  const [newStockUnit, setNewStockUnit] = useState("Pcs");
  const [newStockPrice, setNewStockPrice] = useState("");

  const handleAddStockItem = () => {
    if (!newStockName.trim()) {
      setErrorMsg("Please enter the product/goods name.");
      return;
    }
    const qty = Math.max(0, Number(newStockQty) || 0);
    const price = Math.max(0, Number(newStockPrice) || 0);

    const item = {
      itemId: `item-${Date.now()}`,
      name: newStockName.trim(),
      category: newStockCategory,
      quantity: qty,
      unit: newStockUnit,
      unitPrice: price,
      stockStatus: qty > 10 ? "in_stock" : qty > 0 ? "low_stock" : "out_of_stock",
    };

    const updated = [...(formData.stockItems || []), item];
    const totalEstVal = updated.reduce(
      (sum, cur) => sum + cur.quantity * cur.unitPrice,
      0
    );

    setFormData((prev) => ({
      ...prev,
      stockItems: updated,
      // Auto-suggest stock valuation if empty or 0
      currentStockValue:
        !prev.currentStockValue || Number(prev.currentStockValue) === 0
          ? totalEstVal.toString()
          : prev.currentStockValue,
    }));

    setNewStockName("");
    setNewStockQty("");
    setNewStockPrice("");
    setErrorMsg("");
  };

  const handleRemoveStockItem = (index) => {
    setFormData((prev) => {
      const updated = prev.stockItems.filter((_, i) => i !== index);
      return { ...prev, stockItems: updated };
    });
  };

  // STEP-BY-STEP RIGID VALIDATION WITH MIN/MAX ENFORCEMENT
  const validateStep = (step) => {
    setErrorMsg("");

    // Step 1 Validation
    if (step === 1) {
      const name = formData.RegisterName.trim();
      if (!name || name.length < 3) {
        setErrorMsg("Business Registered Name must be at least 3 characters.");
        return false;
      }
      if (name.length > 120) {
        setErrorMsg("Business Registered Name cannot exceed 120 characters.");
        return false;
      }

      const gst = formData.GST.trim().toUpperCase();
      if (!gst || gst.length !== 15) {
        setErrorMsg("GSTIN must be exactly 15 alphanumeric characters (Current: " + gst.length + "/15).");
        return false;
      }

      const loc = formData.location.trim();
      if (!loc || loc.length < 2) {
        setErrorMsg("Operating Location must be at least 2 characters.");
        return false;
      }
      if (loc.length > 100) {
        setErrorMsg("Operating Location cannot exceed 100 characters.");
        return false;
      }

      if (!formData.industry) {
        setErrorMsg("Please select your Industry Sector.");
        return false;
      }

      const branchesNum = Number(formData.branches);
      if (
        formData.branches === "" ||
        isNaN(branchesNum) ||
        branchesNum < 1 ||
        branchesNum > 1000
      ) {
        setErrorMsg("Branches must be a valid number between 1 and 1,000.");
        return false;
      }

      if (formData.employeeCount !== "" && (isNaN(Number(formData.employeeCount)) || Number(formData.employeeCount) < 0)) {
        setErrorMsg("Staff count must be a valid number (0 or greater).");
        return false;
      }
    }

    // Step 2 Validation
    if (step === 2) {
      const bank = formData.BankName.trim();
      if (!bank || bank.length < 2) {
        setErrorMsg("Bank Name must be at least 2 characters.");
        return false;
      }
      if (bank.length > 80) {
        setErrorMsg("Bank Name cannot exceed 80 characters.");
        return false;
      }

      const ifsc = formData.IFSC.trim().toUpperCase();
      if (!ifsc || ifsc.length !== 11) {
        setErrorMsg("Bank IFSC Code must be exactly 11 characters (Current: " + ifsc.length + "/11).");
        return false;
      }

      const acc = formData.AccNo.trim();
      if (!acc || acc.length < 9 || acc.length > 18 || !/^\d+$/.test(acc)) {
        setErrorMsg("Account Number must be between 9 and 18 digits (numbers only).");
        return false;
      }

      const warehouse = formData.primaryWarehouse.trim();
      if (!warehouse || warehouse.length < 2) {
        setErrorMsg("Primary Warehouse / Godown Name must be at least 2 characters.");
        return false;
      }
      if (warehouse.length > 100) {
        setErrorMsg("Warehouse Name cannot exceed 100 characters.");
        return false;
      }

      if (formData.activeDepartments.length === 0) {
        setErrorMsg("Please select at least one active Operational Department.");
        return false;
      }
    }

    // Step 3 Validation
    if (step === 3) {
      if (
        formData.openingBalance === "" ||
        isNaN(Number(formData.openingBalance)) ||
        Number(formData.openingBalance) < 0
      ) {
        setErrorMsg("Please enter a valid Opening Bank Balance (0 or greater).");
        return false;
      }

      if (
        formData.openingCash === "" ||
        isNaN(Number(formData.openingCash)) ||
        Number(formData.openingCash) < 0
      ) {
        setErrorMsg("Please enter a valid Opening Physical Cash Balance (0 or greater).");
        return false;
      }

      if (
        formData.currentStockValue === "" ||
        isNaN(Number(formData.currentStockValue)) ||
        Number(formData.currentStockValue) < 0
      ) {
        setErrorMsg("Please enter a valid Current Stock Valuation (0 or greater).");
        return false;
      }

      if (
        formData.monthlyRevenueTarget === "" ||
        isNaN(Number(formData.monthlyRevenueTarget)) ||
        Number(formData.monthlyRevenueTarget) < 0
      ) {
        setErrorMsg("Please enter a valid Monthly Revenue Target (0 or greater).");
        return false;
      }

      if (
        formData.monthlyProductionTarget === "" ||
        isNaN(Number(formData.monthlyProductionTarget)) ||
        Number(formData.monthlyProductionTarget) < 0
      ) {
        setErrorMsg("Please enter a valid Monthly Production/Unit Target (0 or greater).");
        return false;
      }
    }

    // Step 4 Validation
    if (step === 4) {
      const creditDays = Number(formData.defaultCreditDays);
      if (
        formData.defaultCreditDays === "" ||
        isNaN(creditDays) ||
        creditDays < 1 ||
        creditDays > 90
      ) {
        setErrorMsg("Default Vendor Credit Days must be between 1 and 90 days.");
        return false;
      }

      const poLimit = Number(formData.poApprovalLimit);
      if (
        formData.poApprovalLimit === "" ||
        isNaN(poLimit) ||
        poLimit < 1 ||
        poLimit > 1000000000
      ) {
        setErrorMsg("PO Approval Limit must be between ₹1 and ₹1,00,00,00,000.");
        return false;
      }

      const discount = Number(formData.maxDiscountPercent);
      if (
        formData.maxDiscountPercent === "" ||
        isNaN(discount) ||
        discount < 0 ||
        discount > 100
      ) {
        setErrorMsg("Max Sales Discount must be between 0% and 100%.");
        return false;
      }

      const minReserve = Number(formData.minCashReserveAlert);
      if (
        formData.minCashReserveAlert === "" ||
        isNaN(minReserve) ||
        minReserve < 0
      ) {
        setErrorMsg("Minimum Cash Reserve Alert must be 0 or greater.");
        return false;
      }

      const lowStock = Number(formData.lowStockThresholdPercent);
      if (
        formData.lowStockThresholdPercent === "" ||
        isNaN(lowStock) ||
        lowStock < 1 ||
        lowStock > 100
      ) {
        setErrorMsg("Low Stock Alert Threshold must be between 1% and 100%.");
        return false;
      }

      if (!formData.inventoryValuationMethod) {
        setErrorMsg("Please select an Inventory Valuation Method.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setErrorMsg("");
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrorMsg("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/owner/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to initialize organization.");
      }

      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      setTimeout(() => {
        router.push(result.redirectUrl || "/owner/dashboard");
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Verifying your Crown Ecosystems workspace...
        </p>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Entity & Legal", icon: Building2 },
    { number: 2, title: "Banking & Infrastructure", icon: Landmark },
    { number: 3, title: "Financials & Targets", icon: TrendingUp },
    { number: 4, title: "FinOps Guardrails", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight">Crown</span>
              <span className="font-extrabold text-emerald-500 ml-1">Ecosystems</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {formData.planName} Tier
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
        {/* Progress Bar & Steps Tracker */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Initial Workspace Onboarding
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Configure Your Business Organization
              </h1>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">
              Step {currentStep} of 4
            </span>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = s.number === currentStep;
              const isDone = s.number < currentStep;

              return (
                <div
                  key={s.number}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-sm"
                      : isDone
                      ? "bg-slate-900 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-900/60 border-slate-800 text-slate-500"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? "bg-emerald-500 text-slate-950"
                        : isDone
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                  </div>
                  <span className="text-xs font-semibold truncate">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Form Container */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* CRITICAL: onSubmit prevented & onKeyDown prevents accidental enter-key submission */}
          <form
            onSubmit={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (currentStep < 4) handleNext();
              }
            }}
          >
            <AnimatePresence mode="wait">
              {/* STEP 1: ENTITY & LEGAL */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-800 pb-4 mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                      Legal Identity & Company Profile
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Provide statutory details for balanced double-entry vouchers and GSTR compliance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Registered Business / Entity Name *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min 3, Max 120 chars ({formData.RegisterName.length}/120)
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={120}
                        value={formData.RegisterName}
                        onChange={(e) => updateField("RegisterName", e.target.value)}
                        placeholder="Enter registered business name"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          GSTIN Number *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Exact 15 chars ({formData.GST.length}/15)
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={15}
                        value={formData.GST}
                        onChange={(e) =>
                          updateField(
                            "GST",
                            e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15)
                          )
                        }
                        placeholder="e.g. 24ZAAAAA0245AAA"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono tracking-wider uppercase transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Operating Location (City, State) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min 2, Max 100 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={100}
                        value={formData.location}
                        onChange={(e) => updateField("location", e.target.value)}
                        placeholder="e.g. Surat, Gujarat"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Industry Sector *
                      </label>
                      <select
                        value={formData.industry}
                        onChange={(e) => updateField("industry", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                      >
                        <option value="" disabled className="bg-slate-900 text-slate-500">
                          Select industry sector...
                        </option>
                        {INDUSTRY_OPTIONS.map((ind) => (
                          <option key={ind} value={ind} className="bg-slate-900 text-white">
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Operating Branches / Units *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min 1, Max 1,000
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.branches}
                        onChange={(e) => updateField("branches", e.target.value)}
                        placeholder="e.g. 1"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Staff Capacity Limit (Main HQ)
                        </label>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          (Fewer is OK)
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.employeeCount}
                        onChange={(e) => updateField("employeeCount", e.target.value)}
                        placeholder="e.g. 8 (max allowed staff)"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: BANKING & INFRASTRUCTURE */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-800 pb-4 mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-emerald-400" />
                      Banking & Operational Hierarchy
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Set up your primary ledger bank accounts and configure department RBAC modules.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Primary Bank Name *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min 2, Max 80 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={80}
                        value={formData.BankName}
                        onChange={(e) => updateField("BankName", e.target.value)}
                        placeholder="e.g. State Bank of India"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Bank IFSC Code *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Exact 11 chars ({formData.IFSC.length}/11)
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={11}
                        value={formData.IFSC}
                        onChange={(e) =>
                          updateField(
                            "IFSC",
                            e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11)
                          )
                        }
                        placeholder="e.g. SBIIF25451S"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono tracking-wider uppercase transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Account Number *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          9 to 18 digits ({formData.AccNo.length}/18)
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={18}
                        value={formData.AccNo}
                        onChange={(e) =>
                          updateField(
                            "AccNo",
                            e.target.value.replace(/\D/g, "").slice(0, 18)
                          )
                        }
                        placeholder="e.g. 44772142255225"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono tracking-wider transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Primary Warehouse / Godown Name *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min 2, Max 100 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={100}
                        value={formData.primaryWarehouse}
                        onChange={(e) => updateField("primaryWarehouse", e.target.value)}
                        placeholder="e.g. Main Factory Warehouse"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                      />
                    </div>

                    {/* Active Departments Selector */}
                    <div className="sm:col-span-2 pt-2">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Active Operational Departments *
                        </label>
                        <span className="text-[10px] text-slate-500">
                          Select at least one ({formData.activeDepartments.length} selected)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {AVAILABLE_DEPARTMENTS.map((dept) => {
                          const isSelected = formData.activeDepartments.includes(dept.id);
                          return (
                            <button
                              key={dept.id}
                              type="button"
                              onClick={() => toggleDepartment(dept.id)}
                              className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-300"
                                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              <span className="text-xs font-semibold">{dept.label}</span>
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center border text-[10px] ${
                                  isSelected
                                    ? "bg-emerald-500 border-emerald-500 text-slate-950 font-bold"
                                    : "border-slate-700 bg-slate-900"
                                }`}
                              >
                                {isSelected ? "✓" : ""}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: FINANCIAL BALANCES & OPERATIONAL TARGETS */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-800 pb-4 mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Opening Balances & Performance Targets
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Set baseline general ledger opening values (₹) and periodic business targets.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Opening Bank (₹) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Min ₹0</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.openingBalance}
                        onChange={(e) => updateField("openingBalance", e.target.value)}
                        placeholder="Enter opening bank balance"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Opening Cash (₹) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Min ₹0</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.openingCash}
                        onChange={(e) => updateField("openingCash", e.target.value)}
                        placeholder="Enter physical cash in hand"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Stock Valuation (₹) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Min ₹0</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.currentStockValue}
                        onChange={(e) => updateField("currentStockValue", e.target.value)}
                        placeholder="Enter current stock value"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>

                    {/* Multi-item Stock Goods Builder (Main Branch / Catalog) */}
                    <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Products & Stock Items (Main Branch)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formData.stockItems?.length || 0} items added
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        List the items your business manufactures, stocks, or sells so we and your team know your inventory catalog from day one.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Product / Item name *"
                            value={newStockName}
                            onChange={(e) => setNewStockName(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <select
                            value={newStockCategory}
                            onChange={(e) => setNewStockCategory(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:border-emerald-500 outline-none"
                          >
                            <option value="Finished Goods">Finished Goods</option>
                            <option value="Raw Materials">Raw Materials</option>
                            <option value="Trading Goods">Trading Goods</option>
                            <option value="Semi-Finished">Semi-Finished</option>
                            <option value="Packaging">Packaging</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            value={newStockQty}
                            onChange={(e) => setNewStockQty(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Unit ₹"
                            value={newStockPrice}
                            onChange={(e) => setNewStockPrice(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <button
                            type="button"
                            onClick={handleAddStockItem}
                            className="w-full h-full min-h-[34px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Add item to stock"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Added Stock Items List */}
                      {formData.stockItems && formData.stockItems.length > 0 && (
                        <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {formData.stockItems.map((stk, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-bold text-white truncate">{stk.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/50">
                                  {stk.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                                <span>{stk.quantity} {stk.unit}</span>
                                <span className="text-emerald-400">@ ₹{stk.unitPrice}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStockItem(idx)}
                                  className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Monthly Revenue Target (₹) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Min ₹0</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.monthlyRevenueTarget}
                        onChange={(e) => updateField("monthlyRevenueTarget", e.target.value)}
                        placeholder="e.g. 2500000"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Production Target (Units) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Min 0 Units</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.monthlyProductionTarget}
                        onChange={(e) => updateField("monthlyProductionTarget", e.target.value)}
                        placeholder="e.g. 25000"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: FINOPS GUARDRAILS & STATUTORY COMPLIANCE */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-800 pb-4 mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      FinOps Guardrails & MCA Audit Policies
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure automated controls to prevent cash leakages, unauthorized POs, and stockouts.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Vendor Credit Days *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min 1, Max 90 (Sec 43B max: 45)
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={formData.defaultCreditDays}
                        onChange={(e) => updateField("defaultCreditDays", e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Purchase Order (PO) Approval Limit (₹) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min ₹1, Max ₹100 Cr
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="1000000000"
                        value={formData.poApprovalLimit}
                        onChange={(e) => updateField("poApprovalLimit", e.target.value)}
                        placeholder="e.g. 25000"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Max Sales Discount (%) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min 0%, Max 100%
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.maxDiscountPercent}
                        onChange={(e) => updateField("maxDiscountPercent", e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Min Cash Reserve Alert (₹) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min ₹0
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.minCashReserveAlert}
                        onChange={(e) => updateField("minCashReserveAlert", e.target.value)}
                        placeholder="e.g. 100000"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Low Stock Alert Level (%) *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Min 1%, Max 100%
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.lowStockThresholdPercent}
                        onChange={(e) => updateField("lowStockThresholdPercent", e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-mono transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Inventory Valuation Method *
                      </label>
                      <select
                        value={formData.inventoryValuationMethod}
                        onChange={(e) => updateField("inventoryValuationMethod", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                      >
                        <option value="" disabled className="bg-slate-900 text-slate-500">
                          Select valuation method...
                        </option>
                        <option value="lot_wise" className="bg-slate-900 text-white">
                          Lot-Wise (Batch Costing)
                        </option>
                        <option value="fifo" className="bg-slate-900 text-white">
                          FIFO (First-In, First-Out)
                        </option>
                        <option value="weighted_average" className="bg-slate-900 text-white">
                          Weighted Average Cost
                        </option>
                      </select>
                    </div>

                    {/* MCA Audit Trail Toggle */}
                    <div className="sm:col-span-2 pt-2">
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">
                              MCA Statutory Audit Trail & Hash-Chaining
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Enforce immutable edit logs for journal entries and vouchers per Ministry of Corporate Affairs rules.
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.mcaAuditLog}
                          onChange={(e) => updateField("mcaAuditLog", e.target.checked)}
                          className="w-5 h-5 accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  Save & Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Provisioning FinOps Organization...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Setup & Launch Dashboard
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
