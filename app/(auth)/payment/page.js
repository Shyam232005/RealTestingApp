"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Smartphone, ShieldCheck, 
  IndianRupee, CheckCircle2, Loader2, Lock, ChevronRight, Building
} from "lucide-react";
import LiveComplianceTicker from "@/components/dynamic/LiveComplianceTicker";

// Refined Spring Animations matching your SaaS theme
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

const fadeDown = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.05 }
    }
};

function PaymentCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL parameters se details fetch kar rahe hain
  const selectedPlan = searchParams.get("plan") || "Professional";
  const selectedCycle = searchParams.get("cycle") || "Yearly";
  const selectedPrice = searchParams.get("price") || "4999";

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("UPI");

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Mock Payment Gateway processing time
    setTimeout(() => {
      setIsProcessing(false);
      // Payment successful hote hi Signup page par bhej do
      router.push(`/signup?status=paid&plan=${encodeURIComponent(selectedPlan)}`); 
    }, 2000);
  };

  return (
    <div className="relative p-4 sm:p-8 max-w-6xl mx-auto w-full py-12 sm:py-20 z-10">
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-8 sm:space-y-12"
      >
        {/* HEADER SECTION */}
        <motion.div variants={fadeDown} className="text-center max-w-2xl mx-auto mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-700 shadow-sm backdrop-blur-sm mb-6">
            <Lock className="w-3.5 h-3.5" />
            256-Bit SSL Encrypted
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Secure Checkout
          </h1>
          <p className="text-base font-medium text-slate-500">
            Complete your payment to activate your <span className="font-bold text-slate-700">Crown Ecosystems</span> workspace.
          </p>
        </motion.div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT: ORDER SUMMARY */}
          <motion.div variants={fadeUp} className="lg:col-span-5 w-full">
            <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-blue-500"></div>

              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Selected Plan</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedPlan}</h3>
                  <p className="text-xs font-bold text-indigo-700 mt-2.5 bg-indigo-50 border border-indigo-100/50 inline-block px-3 py-1 rounded-md shadow-sm">
                    {selectedCycle} Billing
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                  <ShieldCheck className="w-7 h-7 text-indigo-600" />
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-4 text-sm font-medium text-slate-600">
                  <span>Plan Base Price</span>
                  <span className="flex items-center font-bold text-slate-900"><IndianRupee className="w-3.5 h-3.5 mr-0.5" /> {parseInt(selectedPrice).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center mb-6 text-sm font-medium text-slate-600">
                  <span>Taxes (GST 18%)</span>
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Included</span>
                </div>
                
                <div className="flex justify-between items-center bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 shadow-sm">
                  <span className="text-sm font-bold text-slate-900">Total Payable</span>
                  <span className="text-3xl font-black text-indigo-600 flex items-center tracking-tight">
                    <span className="text-2xl mr-1">₹</span>
                    {parseInt(selectedPrice).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mt-8 pt-8 border-t border-slate-100">
                {["100% Secure & Encrypted", "No hidden setup fees", "Instant Account Activation"].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* RIGHT: PAYMENT METHODS */}
          <motion.div variants={fadeUp} className="lg:col-span-7 flex flex-col h-full w-full">
            <div className="w-full bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-8 sm:p-10 flex flex-col h-full relative overflow-hidden">
              
              {/* Payment Tabs */}
              <div className="flex gap-2 sm:gap-3 border-b border-slate-100 pb-3 mb-8 overflow-x-auto hide-scrollbar">
                {["UPI", "Card", "Netbanking"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                      activeTab === tab ? "text-indigo-900" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {activeTab === tab && (
                      <motion.div 
                        layoutId="paymentTab" 
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        className="absolute inset-0 bg-indigo-50 border border-indigo-100 rounded-xl -z-10 shadow-sm" 
                      />
                    )}
                    {tab}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center text-center flex-1 py-4"
                >
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100 shadow-inner"
                  >
                    {activeTab === "UPI" && <Smartphone className="w-12 h-12 text-emerald-500" />}
                    {activeTab === "Card" && <CreditCard className="w-12 h-12 text-indigo-500" />}
                    {activeTab === "Netbanking" && <Building className="w-12 h-12 text-amber-500" />}
                  </motion.div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Pay securely via {activeTab}</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed">
                    Click below to launch the payment gateway. Your transaction is protected with military-grade encryption and processed instantly.
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Action Button */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment} 
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 text-base font-black text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-5 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-70 disabled:hover:translate-y-0 mt-auto cursor-pointer"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-200" />
                    Processing Payment...
                  </span>
                ) : (
                  <>
                    Pay Securely 
                    <span className="flex items-center mx-1 bg-indigo-700/50 px-2 py-0.5 rounded border border-indigo-500/50">
                      <IndianRupee className="w-4 h-4 mr-0.5" />
                      {parseInt(selectedPrice).toLocaleString("en-IN")} 
                    </span>
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </motion.button>

              {/* Security Footer */}
              <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <Lock className="w-3 h-3" /> Protected by Razorpay
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// Wrapping in Suspense is mandatory in Next.js 16 App Router when using useSearchParams
export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] relative selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      <LiveComplianceTicker />
      {/* Ambient Background Glow */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/4 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/4 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none"></div>

      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Initializing Secure Checkout...</p>
          </div>
        </div>
      }>
        <PaymentCheckoutContent />
      </Suspense>
    </div>
  );
}