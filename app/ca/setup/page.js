"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  User,
  Award,
  MapPin,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Stamp,
  Sparkles,
  ArrowRight,
  Eye,
} from "lucide-react";

// Zod Schema Validation for CA Partner Onboarding
const caSetupSchema = z.object({
  firmName: z
    .string()
    .min(3, { message: "CA Firm Name must be at least 3 characters." })
    .max(120, { message: "Firm name cannot exceed 120 characters." }),
  partnerName: z
    .string()
    .min(3, { message: "Partner Name must be at least 3 characters." })
    .max(80, { message: "Partner name cannot exceed 80 characters." }),
  icaiNumber: z
    .string()
    .min(5, { message: "Valid ICAI Registration / Membership No. is required (e.g. FCA-048912)." })
    .max(30, { message: "ICAI number cannot exceed 30 characters." }),
  officeAddress: z
    .string()
    .min(10, { message: "Please enter your complete registered office address." }),
  digitalStampUrl: z
    .string()
    .min(10, { message: "Please upload or generate your official Digital Audit Stamp (PNG/SVG)." }),
});

export default function CaSetupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExistingSetup, setIsExistingSetup] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(caSetupSchema),
    defaultValues: {
      firmName: "Singhal & Associates, Chartered Accountants",
      partnerName: "CA Rajesh K. Singhal (FCA)",
      icaiNumber: "FCA-048912",
      officeAddress: "402, Trade Square, C.G. Road, Navrangpura, Ahmedabad, Gujarat - 380009",
      digitalStampUrl: "",
    },
  });

  useEffect(() => {
    let ignore = false;
    async function loadExistingSetup() {
      try {
        const res = await fetch("/api/ca/setup");
        const data = await res.json();
        if (!ignore && data?.success && data?.ca) {
          if (data.ca.firmName) setValue("firmName", data.ca.firmName);
          if (data.ca.partnerName) setValue("partnerName", data.ca.partnerName);
          if (data.ca.icaiNumber) setValue("icaiNumber", data.ca.icaiNumber);
          if (data.ca.officeAddress) setValue("officeAddress", data.ca.officeAddress);
          if (data.ca.digitalStampUrl) setValue("digitalStampUrl", data.ca.digitalStampUrl);
          if (data.ca.isSetupComplete) setIsExistingSetup(true);
        }
      } catch (err) {
        console.warn("Could not prefill CA details:", err);
      }
    }
    loadExistingSetup();
    return () => {
      ignore = true;
    };
  }, [setValue]);

  const digitalStamp = watch("digitalStampUrl");
  const firmNameVal = watch("firmName");
  const partnerNameVal = watch("partnerName");
  const icaiNumberVal = watch("icaiNumber");

  // Handle file drop & upload
  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.includes("image") && !file.name.endsWith(".svg")) {
      setServerError("Please upload a PNG or SVG image of your audit stamp.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setValue("digitalStampUrl", e.target.result, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  // Generate an official statutory SVG stamp preview
  const generateOfficialStamp = () => {
    const fName = (firmNameVal || "CHARTERED ACCOUNTANTS").toUpperCase();
    const pName = (partnerNameVal || "PARTNER").toUpperCase();
    const mNum = (icaiNumberVal || "M.NO. 048912").toUpperCase();

    // High-fidelity SVG rubber stamp with circular border, ICAI lettering, star accents
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">
      <circle cx="150" cy="150" r="140" fill="none" stroke="#047857" stroke-width="6" stroke-dasharray="2,2"/>
      <circle cx="150" cy="150" r="132" fill="none" stroke="#047857" stroke-width="4"/>
      <circle cx="150" cy="150" r="88" fill="none" stroke="#047857" stroke-width="2"/>
      
      <!-- Outer Curvature Text -->
      <path id="curveTop" d="M 30,150 A 120,120 0 0,1 270,150" fill="none" />
      <text fill="#047857" font-size="12" font-weight="900" font-family="monospace" letter-spacing="3.5">
        <textPath href="#curveTop" startOffset="50%" text-anchor="middle">
          ★ CHARTERED ACCOUNTANT ★
        </textPath>
      </text>

      <path id="curveBottom" d="M 270,150 A 120,120 0 0,1 30,150" fill="none" />
      <text fill="#047857" font-size="10.5" font-weight="900" font-family="monospace" letter-spacing="2">
        <textPath href="#curveBottom" startOffset="50%" text-anchor="middle">
          STATUTORY AUDIT &amp; TAXATION
        </textPath>
      </text>

      <!-- Center Box & Details -->
      <rect x="70" y="118" width="160" height="64" rx="6" fill="#ecfdf5" fill-opacity="0.4" stroke="#047857" stroke-width="1.5" stroke-dasharray="4,2"/>
      <text x="150" y="138" fill="#047857" font-size="11" font-weight="900" font-family="sans-serif" text-anchor="middle">
        ${pName.slice(0, 24)}
      </text>
      <text x="150" y="154" fill="#065f46" font-size="9.5" font-weight="800" font-family="monospace" text-anchor="middle">
        ${mNum}
      </text>
      <text x="150" y="170" fill="#047857" font-size="8" font-weight="700" font-family="sans-serif" text-anchor="middle">
        ${fName.slice(0, 28)}
      </text>
    </svg>`;

    const base64Svg = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    setValue("digitalStampUrl", base64Svg, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/ca/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to complete CA setup.");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = json.redirectUrl || "/ca";
      }, 1200);
    } catch (err) {
      setServerError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 font-sans p-4 sm:p-6 lg:p-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden"
      >
        {/* Top Institutional Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-indigo-300">
                  Crown Ecosystems • Institutional Portal
                </span>
                <h1 className="text-2xl font-black text-white">
                  Chartered Accountant Partner Onboarding
                </h1>
              </div>
            </div>
            {isExistingSetup && (
              <Link
                href="/ca"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
              >
                <span>Enter Audit Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Configure your registered auditing practice, verify ICAI credentials, and establish your official digital audit seal for statutory MSME sign-offs.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>CA Practice verified! Redirecting to your Audit Partner Dashboard...</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Field 1: Firm Name */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>CA Firm Name *</span>
              </label>
              <input
                type="text"
                {...register("firmName")}
                placeholder="e.g. Singhal & Associates, Chartered Accountants"
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.firmName ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                } text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 transition-colors shadow-2xs`}
              />
              {errors.firmName && (
                <p className="mt-1 text-[11px] font-bold text-rose-600">
                  {errors.firmName.message}
                </p>
              )}
            </div>

            {/* Field 2: Partner Name */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Managing Partner Name *</span>
              </label>
              <input
                type="text"
                {...register("partnerName")}
                placeholder="e.g. CA Rajesh K. Singhal (FCA)"
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.partnerName ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                } text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 transition-colors shadow-2xs`}
              />
              {errors.partnerName && (
                <p className="mt-1 text-[11px] font-bold text-rose-600">
                  {errors.partnerName.message}
                </p>
              )}
            </div>

            {/* Field 3: ICAI Registration Number */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>ICAI Registration / Membership Number *</span>
              </label>
              <input
                type="text"
                {...register("icaiNumber")}
                placeholder="e.g. FCA-048912 or FRN-012984W"
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.icaiNumber ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                } text-xs font-bold text-slate-900 font-mono focus:outline-hidden focus:border-indigo-600 transition-colors shadow-2xs uppercase`}
              />
              {errors.icaiNumber && (
                <p className="mt-1 text-[11px] font-bold text-rose-600">
                  {errors.icaiNumber.message}
                </p>
              )}
            </div>

            {/* Field 4: Registered Office Address */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Registered Office Address *</span>
              </label>
              <input
                type="text"
                {...register("officeAddress")}
                placeholder="e.g. 402, Trade Square, C.G. Road, Ahmedabad - 380009"
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.officeAddress ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                } text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 transition-colors shadow-2xs`}
              />
              {errors.officeAddress && (
                <p className="mt-1 text-[11px] font-bold text-rose-600">
                  {errors.officeAddress.message}
                </p>
              )}
            </div>
          </div>

          {/* Field 5: Digital Audit Stamp Upload Zone */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Stamp className="w-4 h-4 text-emerald-700" />
                <span>Digital Audit Stamp &amp; Signature Seal (PNG/SVG) *</span>
              </label>
              <button
                type="button"
                onClick={generateOfficialStamp}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Generate Official ICAI Stamp</span>
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-3xl p-6 transition-all text-center ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/40"
                  : digitalStamp
                  ? "border-emerald-400/80 bg-emerald-50/20"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              {digitalStamp ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  {/* Stamp Graphic Preview */}
                  <div className="w-36 h-36 rounded-2xl bg-white border border-emerald-200 p-2 shadow-sm flex items-center justify-center relative overflow-hidden group">
                    <img
                      src={digitalStamp}
                      alt="Digital Stamp Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                      Click to Replace
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div className="text-left space-y-1 max-w-md">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Digital Audit Stamp Loaded
                    </span>
                    <h4 className="text-xs font-black text-slate-800">
                      Tamper-Resistant Rubber Seal Ready
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      This official digital stamp will be encrypted and used to generate statutory UDIN endorsements on client ledger audits.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">
                      Drag &amp; drop your scanned physical rubber stamp or digital SVG
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Accepts transparent PNG or vector SVG (maximum 5MB)
                    </p>
                  </div>
                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept="image/png,image/svg+xml"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs"
                    >
                      Browse Local Files
                    </button>
                  </div>
                </div>
              )}
            </div>

            {errors.digitalStampUrl && (
              <p className="mt-1.5 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.digitalStampUrl.message}</span>
              </p>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">
              Secured under ICAI Section 44AB &amp; Statutory Guidelines
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-lg shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? "Verifying Practice..." : "Complete Setup & Enter Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
