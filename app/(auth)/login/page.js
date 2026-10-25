"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  Building2, Mail, Lock, Phone, MessageSquare,
  RefreshCw, Loader2, AlertCircle,
  Crown, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LiveComplianceTicker from "@/components/dynamic/LiveComplianceTicker";

// ✨ EXTERNALLY DEFINED INPUT COMPONENT (Maintains Focus & Prevents Re-renders)
// Upgraded with premium SaaS focus-within ring and sleek transition colors.
const Input = ({ icon: Icon, isDark, registration, disabled, ...props }) => (
  <div className="relative mb-4 w-full group">
    <Icon className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDark ? "text-slate-500 group-focus-within:text-emerald-400" : "text-slate-400 group-focus-within:text-indigo-500"}`} />
    <input
      {...registration} {...props} disabled={disabled}
      className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isDark
          ? "bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        }`}
    />
  </div>
);

export default function ProfessionalLogin() {
  // UI States
  const [isFlipped, setIsFlipped] = useState(false); 
  const [apiError, setApiError] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  // --- BUSINESS LOGIN STATE ---
  const [bizMethod, setBizMethod] = useState("email"); 
  const [bizOtpSent, setBizOtpSent] = useState(false);

  const {
    register: bizRegister, handleSubmit: handleBizSubmit, watch: bizWatch, setValue: setBizValue,
    formState: { isSubmitting: isBizSubmitting }
  } = useForm({
    defaultValues: { role: "Owner", email: "", password: "", phone: "", otp: "" }
  });
  const bizRole = bizWatch("role");
  const bizPhone = bizWatch("phone");

  // --- CA LOGIN STATE ---
  const [caMethod, setCaMethod] = useState("email"); 
  const [caOtpSent, setCaOtpSent] = useState(false);

  const {
    register: caRegister, handleSubmit: handleCaSubmit, watch: caWatch, setValue: setCaValue,
    formState: { isSubmitting: isCaSubmitting }
  } = useForm({
    defaultValues: { role: "CA", email: "", password: "", phone: "", otp: "" }
  });
  const caRole = caWatch("role");
  const caPhone = caWatch("phone");

  // Handlers
  const handleSendOtp = (portal) => {
    const phone = portal === "biz" ? bizPhone : caPhone;
    if (!phone || phone.length < 10) {
      setApiError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setApiError("");
    setIsOtpLoading(true);

    setTimeout(() => {
      setIsOtpLoading(false);
      const mockOtp = Math.floor(100000 + Math.random() * 900000);
      alert(`[TESTING MODE] \nYour OTP for ${phone} is: ${mockOtp}`);

      if (portal === "biz") setBizOtpSent(true);
      else setCaOtpSent(true);
    }, 1200);
  };

 const onSubmit = async (data, portalType) => {
        setApiError("");
        const method = portalType === "business" ? bizMethod : caMethod;
        
        // --- OTP LOGIN LOGIC ---
        if (method === "otp") {
            try {
                const res = await fetch("/api/auth/login-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        phone: data.phone,
                        otp: data.otp,
                        role: data.role
                    })
                });

                let result;
                try { result = await res.json(); } catch(e) { result = { error: "Invalid server response." }; }

                if (res.ok) {
                    document.cookie = `fineops_user_id=${result.user?.id || result.userId}; path=/; max-age=86400`;
                    document.cookie = `fineops_role=${data.role}; path=/; max-age=86400`;
                    
                    const roleMap = {
                        OWNER: "/owner/dashboard",
                        CA: "/ca",
                        BILLING_COUNTER: "/billing",
                        GODOWN_STOCKS: "/godown",
                        FIELD_SALES: "/sales",
                        ACCOUNTS: "/accounts"
                    };
                    const targetRole = (result.user?.role || data.role || "").toUpperCase();
                    const redirectPath = result.redirectUrl || (data.role === "Owner" ? "/owner/dashboard" : data.role === "CA" ? "/ca" : "/department/onboarding");
                    
                    window.location.href = redirectPath;
                } else {
                    setApiError(result.error || "OTP verification failed.");
                }
            } catch (err) {
                setApiError("Network error. Please check your connection.");
            }
            return; 
        }

        // --- EMAIL LOGIN LOGIC ---
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    role: data.role
                })
            });

            let result;
            try { result = await res.json(); } catch(e) { result = { error: "Invalid server response." }; }

            if (res.ok) {
                document.cookie = `fineops_role=${data.role}; path=/; max-age=86400`;
                document.cookie = `fineops_user_id=${result.user?.id || result.userId}; path=/; max-age=86400`;

                if (result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                    return;
                }
                if (result.user?.isSuperAdmin || result.user?.role === "Admin") {
                    window.location.href = "/console";
                    return;
                }

                document.cookie = `fineops_role=${data.role}; path=/; max-age=86400`; 
                document.cookie = `fineops_user_id=${result.user?.id || result.userId}; path=/; max-age=86400`;
                
                const roleMap = {
                    OWNER: "/owner/dashboard",
                    CA: "/ca",
                    BILLING_COUNTER: "/billing",
                    GODOWN_STOCKS: "/godown",
                    FIELD_SALES: "/sales",
                    ACCOUNTS: "/accounts"
                };
                const targetRole = (result.user?.role || data.role || "").toUpperCase();
                const redirectPath = result.redirectUrl || (data.role === "Owner" ? "/owner/dashboard" : data.role === "CA" ? "/ca" : "/department/onboarding");
                
                window.location.href = redirectPath;
            } else {
                setApiError(result.error || "Invalid Credentials.");
            }
        } catch (err) {
            setApiError("Network error. Please check your internet connection.");
        }
    };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <LiveComplianceTicker />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-x-hidden overflow-y-auto">
        {/* ========================================= */}
        {/* LEFT SIDE: DYNAMIC BRANDING PANEL         */}
        {/* ========================================= */}
        <div className={`relative w-full md:w-5/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-between transition-colors duration-700 ease-in-out ${isFlipped ? 'bg-slate-950' : 'bg-slate-900'}`}>
          {/* Ambient Background Glows */}
          <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/3 transition-colors duration-700 pointer-events-none ${isFlipped ? 'bg-emerald-600/30' : 'bg-indigo-600/40'}`}></div>
          <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-40 translate-y-1/3 -translate-x-1/4 transition-colors duration-700 pointer-events-none ${isFlipped ? 'bg-emerald-900' : 'bg-blue-900'}`}></div>

          <div className="relative z-10">
            <Link href="/" className={`inline-flex items-center gap-2.5 transition-colors w-max group ${isFlipped ? 'text-emerald-50 hover:text-white' : 'text-indigo-50 hover:text-white'}`}>
              <Crown className="w-7 h-7 group-hover:scale-110 transition-transform" />
              <span className="font-black tracking-widest text-sm uppercase">Crown.Ecosystems</span>
            </Link>
          </div>

          <div className="relative z-10 my-16 md:my-0">
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                <motion.div key="biz" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                  <div className="bg-indigo-500/20 border border-indigo-500/30 p-3.5 rounded-2xl backdrop-blur-sm w-max mb-6 shadow-sm">
                    <Building2 className="w-8 h-8 text-indigo-300" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                    Welcome back to<br />your workspace.
                  </h2>
                  <p className="text-indigo-100/80 text-base font-medium max-w-sm mb-8 leading-relaxed">
                    Log in to access your enterprise ledgers, pending approvals, and real-time operational insights.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="ca" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                  <div className="bg-emerald-500/20 border border-emerald-500/30 p-3.5 rounded-2xl backdrop-blur-sm w-max mb-6 shadow-sm">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                    Access your audit<br />dashboard.
                  </h2>
                  <p className="text-emerald-100/80 text-base font-medium max-w-sm mb-8 leading-relaxed">
                    Secure login for Chartered Accountants and staff to review client vouchers, verify ITC, and export data.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE: 3D FLIPPING FORM AREA         */}
        {/* ========================================= */}
        <div className="w-full md:w-7/12 flex items-center justify-center p-4 py-12 sm:p-10 lg:p-12 min-h-[calc(100vh-40px)] [perspective:1000px]">
          <div className={`w-full max-w-md relative transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>

            {/* FRONT: BUSINESS LOGIN (Indigo Theme) */}
            <div className={`w-full bg-white rounded-[2rem] shadow-2xl shadow-indigo-900/5 border-t-8 border-t-indigo-600 p-8 sm:p-10 [backface-visibility:hidden] ${isFlipped ? 'pointer-events-none' : ''}`}>
              
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Login</h1>
                <button onClick={() => { setIsFlipped(true); setApiError(""); }} type="button" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 px-3.5 py-2 rounded-lg transition-colors cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" /> CA Portal
                </button>
              </div>

              {/* Animated Segmented Control - Roles */}
              <div className="relative flex bg-slate-100 p-1 rounded-xl mb-8">
                <div className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out" style={{ left: bizRole === 'Owner' ? '4px' : '50%', width: 'calc(50% - 4px)' }}></div>
                <button type="button" onClick={() => { setBizValue("role", "Owner"); setApiError(""); }} className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${bizRole === "Owner" ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>Business Owner</button>
                <button type="button" onClick={() => { setBizValue("role", "Employee"); setApiError(""); }} className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${bizRole === "Employee" ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>Staff Member</button>
              </div>

              {/* Animated Method Tabs */}
              <div className="flex gap-6 mb-8 border-b border-slate-100 relative">
                <button type="button" onClick={() => { setBizMethod("email"); setApiError(""); }} className={`text-xs font-bold uppercase tracking-widest pb-3 transition-colors cursor-pointer ${bizMethod === "email" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>
                  Email Password
                  {bizMethod === "email" && <motion.div layoutId="bizMethodTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" style={{ width: "115px" }} />}
                </button>
                <button type="button" onClick={() => { setBizMethod("otp"); setApiError(""); }} className={`text-xs font-bold uppercase tracking-widest pb-3 transition-colors cursor-pointer ${bizMethod === "otp" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>
                  Mobile OTP
                  {bizMethod === "otp" && <motion.div layoutId="bizMethodTab" className="absolute bottom-[-1px] left-[139px] h-0.5 bg-indigo-600 rounded-t-full" style={{ width: "95px" }} />}
                </button>
              </div>

              {apiError && !isFlipped && (
                <div className="mb-6 p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {apiError}</div>
              )}

              <form onSubmit={handleBizSubmit((data) => onSubmit(data, "business"))}>
                <AnimatePresence mode="wait">
                  {bizMethod === "email" ? (
                    <motion.div key="email-biz" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-1">
                      <Input isDark={false} icon={Mail} type="email" placeholder="Registered Email" registration={bizRegister("email", { required: bizMethod === "email" })} />
                      <Input isDark={false} icon={Lock} type="password" placeholder="Enter Password" registration={bizRegister("password", { required: bizMethod === "email" })} />
                      <div className="flex justify-end mb-8">
                        <Link href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Forgot password?</Link>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="otp-biz" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-1 mb-8">
                      <div className="flex gap-3 mb-4">
                        <Input 
                          isDark={false} icon={Phone} type="tel" maxLength={10} disabled={bizOtpSent} placeholder="10-Digit Mobile" 
                          registration={bizRegister("phone", { required: bizMethod === "otp" })} 
                          onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ""); }} 
                        />
                        {!bizOtpSent && (
                          <button type="button" onClick={() => handleSendOtp("biz")} disabled={isOtpLoading} className="h-[52px] px-5 bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-100 transition-colors shrink-0 flex items-center justify-center min-w-[100px] cursor-pointer">
                            {isOtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get OTP"}
                          </button>
                        )}
                      </div>
                      {bizOtpSent && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                          <Input isDark={false} icon={MessageSquare} type="text" maxLength={6} placeholder="Enter 6-Digit OTP" registration={bizRegister("otp", { required: bizMethod === "otp" })} />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isBizSubmitting || (bizMethod === "otp" && !bizOtpSent)} 
                  className="w-full py-4 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isBizSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Login"}
                </motion.button>
              </form>

              <div className="mt-8 text-center text-sm font-medium text-slate-500">
                Don't have an account? <Link href="/signup" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Create workspace</Link>
              </div>
            </div>

            {/* BACK: CA FIRM LOGIN (Emerald Theme) */}
            <div className={`w-full bg-slate-900 rounded-[2rem] shadow-2xl border-t-8 border-t-emerald-500 p-8 sm:p-10 [backface-visibility:hidden] absolute top-0 left-0 h-full [transform:rotateY(180deg)] flex flex-col ${!isFlipped ? 'pointer-events-none' : ''}`}>
              
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-black text-white tracking-tight">Auditor Login</h1>
                <button onClick={() => { setIsFlipped(false); setApiError(""); }} type="button" className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-slate-800 px-3.5 py-2 rounded-lg transition-colors hover:bg-slate-700 cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" /> Biz Portal
                </button>
              </div>

              {/* Animated Segmented Control - Roles (Inverted for logic) */}
              <div className="relative flex flex-row-reverse bg-slate-800 p-1 rounded-xl mb-8">
                <div className="absolute top-1 bottom-1 bg-emerald-600 rounded-lg shadow-sm transition-all duration-300 ease-out" style={{ left: caRole === 'CA' ? 'calc(50% + 4px)' : '4px', width: 'calc(50% - 4px)' }}></div>
                <button type="button" onClick={() => { setCaValue("role", "CA"); setApiError(""); }} className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${caRole === "CA" ? "text-white" : "text-slate-400 hover:text-slate-300"}`}>Firm Admin</button>
                <button type="button" onClick={() => { setCaValue("role", "CA-Employee"); setApiError(""); }} className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${caRole === "CA-Employee" ? "text-white" : "text-slate-400 hover:text-slate-300"}`}>Audit Staff</button>
              </div>

              {/* Animated Method Tabs */}
              <div className="flex gap-6 mb-8 border-b border-slate-800 relative">
                <button type="button" onClick={() => { setCaMethod("email"); setApiError(""); }} className={`text-xs font-bold uppercase tracking-widest pb-3 transition-colors cursor-pointer ${caMethod === "email" ? "text-emerald-400" : "text-slate-500 hover:text-slate-400"}`}>
                  Email Password
                  {caMethod === "email" && <motion.div layoutId="caMethodTab" className="absolute bottom-[-1px] left-0 h-0.5 bg-emerald-500 rounded-t-full" style={{ width: "115px" }} />}
                </button>
                <button type="button" onClick={() => { setCaMethod("otp"); setApiError(""); }} className={`text-xs font-bold uppercase tracking-widest pb-3 transition-colors cursor-pointer ${caMethod === "otp" ? "text-emerald-400" : "text-slate-500 hover:text-slate-400"}`}>
                  Mobile OTP
                  {caMethod === "otp" && <motion.div layoutId="caMethodTab" className="absolute bottom-[-1px] left-[139px] h-0.5 bg-emerald-500 rounded-t-full" style={{ width: "95px" }} />}
                </button>
              </div>

              {apiError && isFlipped && (
                <div className="mb-6 p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-in fade-in"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {apiError}</div>
              )}

              <form onSubmit={handleCaSubmit((data) => onSubmit(data, "ca"))} className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {caMethod === "email" ? (
                    <motion.div key="email-ca" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-1">
                      <Input isDark={true} icon={Mail} type="email" placeholder="Official Email Address" registration={caRegister("email", { required: caMethod === "email" })} />
                      <Input isDark={true} icon={Lock} type="password" placeholder="Enter Password" registration={caRegister("password", { required: caMethod === "email" })} />
                      <div className="flex justify-end mb-8">
                        <Link href="#" className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors">Forgot password?</Link>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="otp-ca" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-1 mb-8">
                      <div className="flex gap-3 mb-4">
                        <Input 
                          isDark={true} icon={Phone} type="tel" maxLength={10} disabled={caOtpSent} placeholder="10-Digit Mobile" 
                          registration={caRegister("phone", { required: caMethod === "otp" })}
                          onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ""); }} 
                        />
                        {!caOtpSent && (
                          <button type="button" onClick={() => handleSendOtp("ca")} disabled={isOtpLoading} className="h-[52px] px-5 bg-slate-800/80 text-emerald-400 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-700 transition-colors shrink-0 flex items-center justify-center min-w-[100px] border border-slate-700 cursor-pointer">
                            {isOtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get OTP"}
                          </button>
                        )}
                      </div>
                      {caOtpSent && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                          <Input isDark={true} icon={MessageSquare} type="text" maxLength={6} placeholder="Enter 6-Digit OTP" registration={caRegister("otp", { required: caMethod === "otp" })} />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isCaSubmitting || (caMethod === "otp" && !caOtpSent)} 
                  className="w-full py-4 mt-auto bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCaSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Login"}
                </motion.button>
              </form>

              <div className="mt-8 text-center text-sm font-medium text-slate-400">
                Don't have an account? <Link href="/signup" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Register firm</Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}