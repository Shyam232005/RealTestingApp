"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Camera,
  FileText,
  ScanLine,
  X,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

/**
 * AIDocumentScannerModal - Production Opt-In AI Document Scanner
 * Enterprise SaaS design: defaults to standard manual form entry.
 * Users opt-in by toggling "AI Scanner" to reveal a clean, minimalist dropzone.
 */
export default function AIDocumentScannerModal({
  isOpen = true,
  onClose,
  title = "Book Confirmed Sales Order (SO)",
  subtitle = "Enter customer order details manually or opt-in to scan a paper bill/invoice.",
  documentContext = "sales_order",
  formData,
  setFormData,
  onSubmit,
  submitLabel = "Confirm Sales Order",
  children,
}) {
  // Step 3: Default isScannerActive to false (opt-in architecture)
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState("");
  const [scanErrorMessage, setScanErrorMessage] = useState("");

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  // Process uploaded document file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanErrorMessage("");
    setScanSuccessMessage("");

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/ocr/universal-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentContext,
          fileData: base64,
          fileName: file.name,
          fileType: file.type,
        }),
      });

      const data = await response.json();

      if (data?.success && data?.scanResult) {
        const meta = data.scanResult.extractedMetadata || {};
        const tables = data.scanResult.dynamicTables || [];

        let lineItemsDesc = "";
        if (tables.length > 0 && tables[0].rows && tables[0].rows.length > 0) {
          lineItemsDesc = tables[0].rows
            .map((r) => r.itemDescription || r.description || r.item || "")
            .filter(Boolean)
            .join(", ");
        }

        // Auto-fill form data if state setter provided
        if (typeof setFormData === "function") {
          setFormData((prev) => ({
            ...prev,
            clientName:
              meta.customerName ||
              meta.buyerName ||
              meta.clientName ||
              prev?.clientName ||
              "",
            itemsSummary:
              lineItemsDesc ||
              meta.itemsSummary ||
              prev?.itemsSummary ||
              "Scanned Line Items",
            totalAmount:
              meta.totalAmount ||
              meta.grandTotal ||
              prev?.totalAmount ||
              0,
            paymentTerms:
              meta.paymentTerms ||
              prev?.paymentTerms ||
              "NET_30",
          }));
        }

        setScanSuccessMessage(
          `Document scanned successfully. Form fields auto-populated from ${file.name}.`
        );
        // Switch back to manual view so user can review/edit populated fields
        setIsScannerActive(false);
      } else {
        setScanErrorMessage(
          data?.error || "Unable to extract fields from this document. Please enter details manually."
        );
      }
    } catch (err) {
      console.error("Scan error:", err);
      setScanErrorMessage("Error processing file upload. Please enter details manually.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Step 3: Minimalist Toggle Switch between Manual Inputs and AI Scanner */}
            <div className="p-1 rounded-xl bg-slate-200/70 border border-slate-300/80 inline-flex items-center">
              <button
                type="button"
                onClick={() => setIsScannerActive(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isScannerActive
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Manual Inputs
              </button>
              <button
                type="button"
                onClick={() => setIsScannerActive(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isScannerActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>AI Scanner</span>
              </button>
            </div>

            {typeof onClose === "function" && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scan Status Banners */}
        {scanSuccessMessage && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{scanSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setScanSuccessMessage("")}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {scanErrorMessage && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{scanErrorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setScanErrorMessage("")}
              className="text-rose-700 hover:text-rose-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isScannerActive ? (
            /* Step 1 & 2: Clean, Minimalist Enterprise Dropzone (No Demo Cruft / Samples) */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-3xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 p-8 sm:p-10 text-center transition-all cursor-pointer"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <UploadCloud className="w-7 h-7 text-blue-600" />
                </div>

                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  Drop Invoice, Delivery Challan, Bilty, or Kachcha Bill
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Supports Photos (PNG, JPG) and PDF files. Fields will be automatically read into the manual form.
                </p>

                {/* Two Clean Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Bill / Challan (Camera)</span>
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Select PDF / File</span>
                  </button>
                </div>

                {isScanning && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 animate-pulse">
                    <ScanLine className="w-4 h-4 animate-spin" />
                    <span>Scanning document &amp; extracting line items...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Default View: Standard Manual Form */
            <div className="space-y-4">
              {children}
            </div>
          )}
        </div>

        {/* Standard SaaS Footer */}
        <div className="px-6 py-4 border-t border-slate-200/90 bg-slate-50/70 flex items-center justify-end gap-3">
          {typeof onClose === "function" && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          {typeof onSubmit === "function" && (
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <span>{submitLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
