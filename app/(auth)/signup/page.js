"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
    Building2, User, Mail, Phone, Lock, Award,
    RefreshCw, Loader2, AlertCircle, MapPin, CreditCard,
    Crown, ShieldCheck, CheckCircle2, Sparkles, ShieldAlert, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LiveComplianceTicker from "@/components/dynamic/LiveComplianceTicker";

// Custom Input Component - Styled for Premium SaaS Feel
const Input = ({ icon: Icon, isDark, as = "input", children, registration, ...props }) => (
    <div className="relative mb-4 w-full group">
        <Icon className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDark ? "text-slate-500 group-focus-within:text-emerald-400" : "text-slate-400 group-focus-within:text-indigo-500"}`} />
        {as === "select" ? (
            <select {...registration} {...props} className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all appearance-none cursor-pointer ${isDark ? "bg-slate-800 border border-slate-700 text-white focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" : "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"}`}>
                {children}
            </select>
        ) : (
            <input {...registration} {...props} className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all ${isDark ? "bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"}`} />
        )}
    </div>
);

function SignupFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const paymentStatus = searchParams.get("status");
    const isPaid = paymentStatus === "paid";
    const purchasedPlan = searchParams.get("plan") || "Free Trial";
    const rawCycle = searchParams.get("cycle") || "annual";
    const purchasedCycle = rawCycle.toLowerCase().includes("month") ? "monthly" : "annual";
    const inviteCodeParam = searchParams.get("invite");

    const isCaInvite = inviteCodeParam?.startsWith("CA-");
    const [isFlipped, setIsFlipped] = useState(isCaInvite ? true : false);
    const [apiError, setApiError] = useState("");

    const [manualCode, setManualCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState("");
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [verifiedEntityName, setVerifiedEntityName] = useState("");

    const {
        register: bizRegister, handleSubmit: handleBizSubmit, watch: bizWatch, setValue: setBizValue,
        formState: { isSubmitting: isBizSubmitting }
    } = useForm({
        defaultValues: {
            role: (!isPaid && inviteCodeParam) ? "Employee" : "Owner",
            inviteCode: inviteCodeParam || "",
            name: "", phoneNumber: "", email: "", password: "",
            planName: isPaid ? purchasedPlan : "Free Trial",
            cycle: isPaid ? purchasedCycle : "trial",
            paymentStatus: isPaid ? "paid" : "unpaid"
        }
    });
    const bizRole = bizWatch("role");

    // Automatically sync paid plan & cycle parameters when navigating or hydrating
    useEffect(() => {
        if (isPaid) {
            setBizValue("role", "Owner");
            setBizValue("planName", purchasedPlan);
            setBizValue("cycle", purchasedCycle);
            setBizValue("paymentStatus", "paid");
        }
    }, [isPaid, purchasedPlan, purchasedCycle, setBizValue]);

    const {
        register: caRegister, handleSubmit: handleCaSubmit, watch: caWatch, setValue: setCaValue,
        formState: { isSubmitting: isCaSubmitting }
    } = useForm({
        defaultValues: {
            role: isCaInvite ? "CA-Employee" : "CA",
            icaiNumber: "",
            inviteCode: inviteCodeParam || "",
            name: "", phoneNumber: "", email: "", password: ""
        }
    });
    const caRole = caWatch("role");

    const handleVerifyCode = async (roleType) => {
        setVerifyError("");
        if (!manualCode.trim()) return setVerifyError("Please enter a code");

        setIsVerifying(true);
        try {
            const type = (roleType === "CA-Employee") ? "ca" : "biz";

            const res = await fetch("/api/auth/verify-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: manualCode.trim(), type })
            });
            const data = await res.json();

            if (res.ok) {
                setIsCodeVerified(true);
                setVerifiedEntityName(data.entityName);
                if (roleType === "Employee") setBizValue("inviteCode", manualCode.trim());
                if (roleType === "CA" || roleType === "CA-Employee") setCaValue("inviteCode", manualCode.trim());
            } else {
                setVerifyError(data.error || "Invalid code");
            }
        } catch (err) {
            setVerifyError("Network error. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const switchRole = (portal, newRole) => {
        setApiError(""); setVerifyError(""); setManualCode(""); setIsCodeVerified(false);
        if (portal === "biz") setBizValue("role", newRole);
        else setCaValue("role", newRole);
    };

    const onSubmit = async (data, portalType) => {
        setApiError("");
        try {
            if (data.role === "CA") data.joinedViaCode = data.inviteCode;

            // Ensure paid subscription details are attached for Business Owner
            const payload = {
                ...data,
                ...(portalType === "business" && (bizRole === "Owner" || data.role === "Owner") ? {
                    role: "Owner",
                    planName: isPaid ? purchasedPlan : (data.planName || "Free Trial"),
                    cycle: isPaid ? purchasedCycle : (data.cycle || "trial"),
                    paymentStatus: isPaid ? "paid" : "unpaid"
                } : {})
            };

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            let result;
            try {
                result = await res.json();
            } catch (e) {
                result = { error: "Invalid server response." };
            }

            if (res.ok) {
                toast.success(result.message || "Account created successfully! Welcome to FineOps.");
                if (result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                    return;
                }
                router.push('/login');
            } else {
                const msg = result.error || "Registration failed.";
                setApiError(msg);
                toast.error(msg);
            }
        } catch (err) {
            console.error("Signup network error:", err);
            const msg = "Network error. Please check your connection.";
            setApiError(msg);
            toast.error(msg);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
            <LiveComplianceTicker />
            <div className="flex-1 flex flex-col md:flex-row overflow-x-hidden overflow-y-auto">

                {/* LEFT BRANDING PANEL */}
                <div className={`relative w-full md:min-h-screen md:w-5/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-between transition-colors duration-700 ease-in-out ${isFlipped ? 'bg-slate-950' : 'bg-slate-900'}`}>

                    {/* Premium Ambient Backgrounds */}
                    <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-60 -translate-y-1/2 translate-x-1/3 transition-colors duration-700 pointer-events-none ${isFlipped ? 'bg-emerald-600/30' : 'bg-indigo-600/40'}`}></div>
                    <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-40 translate-y-1/3 -translate-x-1/4 transition-colors duration-700 pointer-events-none ${isFlipped ? 'bg-emerald-900' : 'bg-blue-900'}`}></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <Link href="/" className={`inline-flex items-center gap-2.5 transition-colors group ${isFlipped ? 'text-emerald-50 hover:text-white' : 'text-indigo-50 hover:text-white'}`}>
                            <Crown className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            <span className="font-black tracking-widest text-sm uppercase">Crown.Ecosystems</span>
                        </Link>
                    </div>

                    <div className="relative z-10 my-16 md:my-0">
                        <AnimatePresence mode="wait">
                            {!isFlipped ? (
                                <motion.div key="biz" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                                    <div className="bg-indigo-500/20 border border-indigo-500/30 p-3.5 rounded-2xl backdrop-blur-sm w-max mb-6 shadow-sm">
                                        {inviteCodeParam || isCodeVerified ? <Sparkles className="w-8 h-8 text-indigo-300" /> : isPaid ? <CheckCircle2 className="w-8 h-8 text-indigo-300" /> : <Building2 className="w-8 h-8 text-indigo-300" />}
                                    </div>
                                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                                        {inviteCodeParam || isCodeVerified ? "You're invited!" : isPaid ? "Payment Successful!" : "Secure Workspace"}
                                    </h2>
                                    <p className="text-indigo-100/80 text-base font-medium max-w-sm mb-6 leading-relaxed">
                                        {inviteCodeParam || isCodeVerified
                                            ? `Set up your staff account to join ${verifiedEntityName || "the workspace"}.`
                                            : isPaid
                                                ? `You have purchased the "${purchasedPlan}" tier (${purchasedCycle === "monthly" ? "Monthly" : "Annual"} billing). Setup your digital headquarters.`
                                                : "A premium or invited account is required to access the FineOps platform."}
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div key="ca" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                                    <div className="bg-emerald-500/20 border border-emerald-500/30 p-3.5 rounded-2xl backdrop-blur-sm w-max mb-6 shadow-sm">
                                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                                        {inviteCodeParam || isCodeVerified ? "Partner Audit Invite" : "Auditor Portal"}
                                    </h2>
                                    <p className="text-emerald-100/80 text-base font-medium max-w-sm mb-6 leading-relaxed">
                                        {inviteCodeParam || isCodeVerified ? `Register to manage audits for ${verifiedEntityName || "the client"}.` : "An official invite code is required to register a CA firm or join as audit staff."}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* RIGHT FORM AREA */}
                <div className="w-full md:w-7/12 flex items-center justify-center p-4 py-12 sm:p-10 lg:p-12 min-h-screen [perspective:1000px] overflow-y-auto">
                    <div className={`w-full max-w-xl relative h-max min-h-[550px] transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>

                        {/* FRONT: BUSINESS SIGNUP */}
                        <div className={`w-full bg-white rounded-[2rem] shadow-2xl border-t-8 border-t-indigo-600 p-8 sm:p-10 [backface-visibility:hidden] absolute inset-0 h-max ${isFlipped ? 'pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Setup</h1>
                                <button onClick={() => { setIsFlipped(true); setApiError(""); setVerifyError(""); }} type="button" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 px-3.5 py-2 rounded-lg transition-colors cursor-pointer">
                                    <RefreshCw className="w-3.5 h-3.5" /> CA Portal
                                </button>
                            </div>

                            {/* Segmented Control */}
                            <div className="relative flex bg-slate-100 p-1 rounded-xl mb-8">
                                <div className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out" style={{ left: bizRole === 'Owner' ? '4px' : '50%', width: 'calc(50% - 4px)' }}></div>
                                <button type="button" onClick={() => switchRole("biz", "Owner")} className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${bizRole === "Owner" ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>Business Owner</button>
                                <button type="button" onClick={() => switchRole("biz", "Employee")} className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${bizRole === "Employee" ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>Join as Staff</button>
                            </div>

                            {apiError && !isFlipped && <div className="mb-6 p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {apiError}</div>}

                            {bizRole === "Owner" && !isPaid ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 mt-2">
                                    <ShieldAlert className="w-12 h-12 text-slate-400 mb-4" />
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Premium Account Required</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-2 mb-8 max-w-sm leading-relaxed">You must purchase a plan to register a new workspace and begin operations.</p>
                                    <Link href="/purchase" className="py-3.5 px-8 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20">View Pricing & Plans</Link>
                                </motion.div>
                            ) : bizRole === "Employee" && !inviteCodeParam && !isCodeVerified ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 mt-2">
                                    <Lock className="w-12 h-12 text-slate-400 mb-4" />
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Invite Code Required</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-2 mb-6 max-w-sm leading-relaxed">Please enter the security code provided by your organization administrator.</p>

                                    <div className="flex w-full max-w-sm gap-2">
                                        <input type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} placeholder="e.g. BIZ-XXXX" className="flex-1 px-4 py-3.5 rounded-xl text-sm font-bold bg-white border border-slate-200 focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/10 outline-none uppercase transition-all" />
                                        <button type="button" onClick={() => handleVerifyCode("Employee")} disabled={isVerifying} className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center min-w-[90px] cursor-pointer">
                                            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                                        </button>
                                    </div>
                                    {verifyError && <p className="text-rose-500 text-xs font-bold mt-4 flex items-center justify-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {verifyError}</p>}
                                </motion.div>
                            ) : (
                                <form onSubmit={handleBizSubmit((data) => onSubmit(data, "business"))}>
                                    <div className="animate-in fade-in zoom-in-95 duration-200 space-y-4">
                                        {bizRole === "Owner" ? (
                                            <>
                                                <input type="hidden" {...bizRegister("role")} />
                                                <input type="hidden" {...bizRegister("planName")} />
                                                <input type="hidden" {...bizRegister("cycle")} />
                                                <input type="hidden" {...bizRegister("paymentStatus")} />
                                                {isPaid && (
                                                    <div className="mb-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Active Plan</span>
                                                            <span className="text-sm font-black text-slate-900">{purchasedPlan}</span>
                                                            <span className="ml-2 text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                                                                {purchasedCycle === "monthly" ? "Monthly" : "Annual"}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                                            Paid
                                                        </span>
                                                    </div>
                                                )}
                                                <hr className="border-slate-100 my-4" />
                                            </>
                                        ) : (
                                            <div className="mb-6 bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Joining Workspace</p>
                                                    <p className="text-base font-black text-slate-900">{verifiedEntityName || "Verified Company"}</p>
                                                </div>
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <Check className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <input type="hidden" {...bizRegister("inviteCode", { required: true })} />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input isDark={false} icon={User} placeholder="Your Full Name" registration={bizRegister("name", { required: true })} />
                                            <Input
                                                isDark={false}
                                                icon={Phone}
                                                type="tel"
                                                maxLength={10}
                                                placeholder="Mobile Number"
                                                registration={bizRegister("phoneNumber", { required: true })}
                                                onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ""); }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input isDark={false} icon={Mail} type="email" placeholder="Email Address" registration={bizRegister("email", { required: true })} />
                                            <Input isDark={false} icon={Lock} type="password" minLength={8} placeholder="Create Password" registration={bizRegister("password", { required: true })} />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isBizSubmitting} className="w-full py-4 mt-6 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-70 cursor-pointer">
                                        {isBizSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Complete Registration"}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* BACK: CA FIRM SIGNUP */}
                        <div className={`w-full bg-slate-900 rounded-[2rem] shadow-2xl border-t-8 border-t-emerald-500 p-8 sm:p-10 [backface-visibility:hidden] absolute inset-0 h-max flex flex-col [transform:rotateY(180deg)] ${!isFlipped ? 'pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-2xl font-black text-white tracking-tight">Auditor Setup</h1>
                                <button onClick={() => { setIsFlipped(false); setApiError(""); setVerifyError(""); }} type="button" className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-slate-800 px-3.5 py-2 rounded-lg transition-colors hover:bg-slate-700 cursor-pointer">
                                    <RefreshCw className="w-3.5 h-3.5" /> Biz Portal
                                </button>
                            </div>

                            {/* Inverted Segmented Control */}
                            <div className="relative flex flex-row-reverse bg-slate-800 p-1 rounded-xl mb-8">
                                <div className="absolute top-1 bottom-1 bg-emerald-600 rounded-lg shadow-sm transition-all duration-300 ease-out" style={{ left: caRole === 'CA' ? 'calc(50% + 4px)' : '4px', width: 'calc(50% - 4px)' }}></div>
                                <button type="button" onClick={() => switchRole("ca", "CA")} className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${caRole === "CA" ? "text-white" : "text-slate-400 hover:text-slate-300"}`}>Register Firm</button>
                                <button type="button" onClick={() => switchRole("ca", "CA-Employee")} className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${caRole === "CA-Employee" ? "text-white" : "text-slate-400 hover:text-slate-300"}`}>Join as Staff</button>
                            </div>

                            {apiError && isFlipped && <div className="mb-6 p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-in fade-in"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {apiError}</div>}

                            {!inviteCodeParam && !isCodeVerified ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-slate-800/50 rounded-2xl border border-dashed border-slate-700 mt-2">
                                    <Lock className="w-12 h-12 text-slate-500 mb-4" />
                                    <h3 className="text-xl font-black text-white tracking-tight">Invite Code Required</h3>
                                    <p className="text-sm font-medium text-slate-400 mt-2 mb-6 max-w-sm leading-relaxed">Please enter your assigned invite code from the client or firm.</p>

                                    <div className="flex w-full max-w-sm gap-2">
                                        <input type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} placeholder={caRole === "CA" ? "e.g. BIZ-XXXX" : "e.g. CA-XXXX"} className="flex-1 px-4 py-3.5 rounded-xl text-sm font-bold bg-slate-900 border border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none uppercase transition-all" />
                                        <button type="button" onClick={() => handleVerifyCode(caRole)} disabled={isVerifying} className="px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors flex items-center justify-center min-w-[90px] cursor-pointer">
                                            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                                        </button>
                                    </div>
                                    {verifyError && <p className="text-rose-400 text-xs font-bold mt-4 flex items-center justify-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {verifyError}</p>}
                                </motion.div>
                            ) : (
                                <form onSubmit={handleCaSubmit((data) => onSubmit(data, "ca"))} className="flex-1 flex flex-col justify-center">
                                    <div className="animate-in fade-in zoom-in-95 duration-200 space-y-4">
                                        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">{caRole === "CA" ? "Linked Client" : "Firm Name"}</p>
                                                <p className="text-base font-black text-white">{verifiedEntityName || "Verified Entity"}</p>
                                            </div>
                                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                                <Check className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <input type="hidden" {...caRegister("inviteCode", { required: true })} />
                                        </div>

                                        {caRole === "CA" && (
                                            <>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Input isDark={true} icon={Award} placeholder="ICAI Memb. No." registration={caRegister("icaiNumber", { required: true })} />
                                                </div>
                                                <hr className="border-slate-800 my-6" />
                                            </>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input isDark={true} icon={User} placeholder="Full Name" registration={caRegister("name", { required: true })} />
                                            <Input
                                                isDark={true}
                                                icon={Phone}
                                                type="tel"
                                                maxLength={10}
                                                placeholder="Mobile Number"
                                                registration={caRegister("phoneNumber", { required: true })}
                                                onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ""); }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input isDark={true} icon={Mail} type="email" placeholder="Official Email" registration={caRegister("email", { required: true })} />
                                            <Input isDark={true} icon={Lock} type="password" minLength={8} placeholder="Secure Password" registration={caRegister("password", { required: true })} />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isCaSubmitting} className="w-full py-4 mt-6 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70 cursor-pointer">
                                        {isCaSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Complete Registration"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProfessionalSignup() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading secure workspace...</p>
                </div>
            </div>
        }>
            <SignupFormContent />
        </Suspense>
    );
}