"use client";

import Navbar from "@/components/home/Navbar";
import Main from "@/components/home/Main";
import Footer from "@/components/home/Footer";
import LiveComplianceTicker from "@/components/dynamic/LiveComplianceTicker";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Real-time Dynamic Compliance Activity Ticker */}
      <LiveComplianceTicker />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex w-full flex-1 flex-col">
        <Navbar />
        
        {/* Main Content Animation */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          <Main />
        </motion.main>
      </div>

      {/* FOOTER */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <Footer />
      </motion.div>
      
    </div>
  );
}