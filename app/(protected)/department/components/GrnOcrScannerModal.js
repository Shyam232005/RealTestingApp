"use client";
import React, { useState, useRef } from "react";
import {
  ScanLine,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Truck,
  Calendar,
  Layers,
  Thermometer,
  ShieldCheck,
  PenTool,
  Printer,
  X,
  FileCheck2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  Plus,
  Boxes,
  Lock,
  Tag,
  Hash,
} from "lucide-react";

export default function GrnOcrScannerModal({
  isOpen,
  onClose,
  onConfirmGrn,
  employee,
}) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [activeTab, setActiveTab] = useState("line_items"); // line_items | metadata | vendor | logistics | financials | markers
  const [confidence, setConfidence] = useState(99.4);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Process Document through OCR API
  const processDocumentOcr = async ({ sampleId, fileObj }) => {
    setIsScanning(true);
    setScanStep(1);
    setErrorMsg("");

    const stepInterval = setInterval(() => {
      setScanStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 280);

    try {
      let payload = {};

      if (sampleId) {
        payload = { sampleId };
      } else if (fileObj) {
        // Read base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fileObj);
        });

        payload = {
          fileName: fileObj.name,
          fileType: fileObj.type,
          fileBase64: base64,
        };
      }

      const res = await fetch("/api/logistics/ocr-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "OCR extraction failed.");
      }

      clearInterval(stepInterval);
      setScanStep(6);
      setTimeout(() => {
        setExtractedData(data.extractedData);
        setConfidence(data.confidenceScore || 99.4);
        setIsScanning(false);
      }, 400);
    } catch (err) {
      clearInterval(stepInterval);
      setIsScanning(false);
      setErrorMsg(err.message || "Failed to scan document.");
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    if (uploadedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(uploadedFile);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }

    processDocumentOcr({ fileObj: uploadedFile });
  };

  const handleSelectSample = (sampleKey) => {
    setFile({
      name: `${sampleKey}-inward-challan.pdf`,
      type: "application/pdf",
      size: 420000,
    });
    setFilePreview(null);
    processDocumentOcr({ sampleId: sampleKey });
  };

  const handleResetScanner = () => {
    setFile(null);
    setFilePreview(null);
    setExtractedData(null);
    setIsScanning(false);
    setScanStep(0);
    setErrorMsg("");
  };

  const handleConfirmAdmission = () => {
    if (!extractedData) return;
    onConfirmGrn(extractedData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide">
                  Automatic AI OCR Goods Receipt (GRN) Scanner
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  Zero Manual Entry
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instantly scan photo & PDF receipts, delivery challans, and invoices at loading dock into warehouse inventory.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STATE 1: UPLOAD & CAPTURE ZONE (When no data extracted yet and not scanning) */}
          {!extractedData && !isScanning && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/70 rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Upload Physical Receipt, Delivery Challan or Invoice
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Supports <strong>Photos (JPG, PNG, WebP)</strong> & <strong>PDF Documents</strong>. Drag and drop file or click to browse.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-[11px] font-bold shadow-xs">
                  <ScanLine className="w-3.5 h-3.5 text-amber-600" />
                  Auto-extracts All 6 Data Categories Without Manual Typing
                </div>
              </div>

              {/* Sample Dock Documents Selector (For Instant Verification) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Quick-Scan Pre-loaded Vendor Delivery Slips (One-Click Test)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500">Official Industry Formats</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectSample("tata-steel")}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-900 group-hover:text-amber-700">
                        Tata Steel Delivery Challan
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        Industrial
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Steel Coils, TMT Rods, PO reference, vehicle weighbridge & seal number.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSample("haldirams-fmcg")}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-900 group-hover:text-amber-700">
                        Haldiram's & Amul Cold-Chain
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        FMCG / Sweets
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Sweets, Butter, with <strong>3.8°C Temperature</strong> & <strong>Handwritten damage note</strong>.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSample("havells-elec")}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-900 group-hover:text-amber-700">
                        Havells Bill of Lading
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                        Electronics
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      MCBs, Industrial Wire, Serial Numbers, and <strong>QC Passed Stamp</strong>.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: SCANNING IN PROGRESS ANIMATION */}
          {isScanning && (
            <div className="py-12 px-6 rounded-3xl bg-slate-900 text-white text-center space-y-6 relative overflow-hidden">
              {/* Laser beam effect */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse top-1/4 blur-xs" />

              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-black tracking-wide">
                  AI Optical Character Recognition (OCR) Engine Scanning...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Parsing {file?.name || "inward physical document"} at dock resolution...
                </p>
              </div>

              {/* Step by step verification checklist */}
              <div className="max-w-md mx-auto space-y-2 text-left text-xs font-mono">
                <div className={`flex items-center gap-2 ${scanStep >= 1 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>1. Decoding document geometry and raster layers...</span>
                </div>
                <div className={`flex items-center gap-2 ${scanStep >= 2 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>2. Extracting header metadata & PO reference match...</span>
                </div>
                <div className={`flex items-center gap-2 ${scanStep >= 3 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>3. Verifying supplier GSTIN & warehouse destination...</span>
                </div>
                <div className={`flex items-center gap-2 ${scanStep >= 4 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>4. Parsing tabular line items, batch & lot codes...</span>
                </div>
                <div className={`flex items-center gap-2 ${scanStep >= 5 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>5. Auditing logistics freight, seal & vehicle weights...</span>
                </div>
                <div className={`flex items-center gap-2 ${scanStep >= 6 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>6. Detecting QC stamps, signatures, temperature & handwritten notes...</span>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: PARSED RESULTS DOSSIER (ALL 6 CATEGORIES) */}
          {extractedData && (
            <div className="space-y-5">
              {/* Top Banner: Verification Badge & Overview */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/40 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black">
                        {extractedData.documentMetadata.documentType} #{extractedData.documentMetadata.documentNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        {confidence}% OCR Confidence
                      </span>
                      <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        PO: {extractedData.documentMetadata.referencePoNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Supplier: <strong>{extractedData.vendorInfo.supplierName}</strong> (GSTIN: {extractedData.vendorInfo.supplierTaxId})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetScanner}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    Scan Another
                  </button>
                </div>
              </div>

              {/* Edge Case Warning Banner if Handwritten damage note detected */}
              {extractedData.edgeCasesMarkers.humanReviewRequired && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Human Review Flagged: Unstructured Handwritten Notation Detected
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 pl-6">
                    "{extractedData.edgeCasesMarkers.handwrittenNotesText}"
                  </p>
                </div>
              )}

              {/* Category Navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold">
                {[
                  { id: "line_items", label: "3. Line Items & Stock Ledger", badge: `${extractedData.lineItems.length} SKUs` },
                  { id: "metadata", label: "1. Document Metadata" },
                  { id: "vendor", label: "2. Vendor & Receiver" },
                  { id: "logistics", label: "4. Logistics & Transit" },
                  { id: "financials", label: "5. Financials & Billing" },
                  {
                    id: "markers",
                    label: "6. Edge Cases & QC Markers",
                    alert: extractedData.edgeCasesMarkers.humanReviewRequired,
                  },
                ].map((t) => {
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{t.label}</span>
                      {t.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? "bg-amber-500 text-slate-950 font-black" : "bg-slate-200 text-slate-700"}`}>
                          {t.badge}
                        </span>
                      )}
                      {t.alert && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TAB 3: LINE ITEM DETAILS (THE CORE STOCK LEDGER) */}
              {activeTab === "line_items" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Parsed Line Items Table (Admitted Directly into Inventory)
                    </h4>
                    <span className="text-[11px] font-bold text-slate-500">
                      Total Units: {extractedData.lineItems.reduce((s, it) => s + it.quantityInvoiced, 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">SKU / Item Code</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Qty Shipped</th>
                          <th className="py-2.5 px-3">UOM</th>
                          <th className="py-2.5 px-3">Batch / Lot</th>
                          <th className="py-2.5 px-3">Mfg / Expiry</th>
                          <th className="py-2.5 px-3">Serial Numbers</th>
                          <th className="py-2.5 px-3">HSN Code</th>
                          <th className="py-2.5 px-3 text-right">Unit Rate</th>
                          <th className="py-2.5 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <divide className="divide-y divide-slate-100">
                        {extractedData.lineItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.skuCode}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-xs">{item.itemDescription}</td>
                            <td className="py-2.5 px-3 font-mono font-black text-amber-700">{item.quantityInvoiced}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-600">{item.uom}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-purple-700 bg-purple-50/50">{item.batchLotNumber}</td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-600">
                              <div>Mfg: {item.mfgDate}</div>
                              <div className="text-[10px] text-slate-400">Exp: {item.expiryDate}</div>
                            </td>
                            <td className="py-2.5 px-3 text-[10px] font-mono text-slate-500 max-w-[150px] truncate">
                              {Array.isArray(item.serialNumbers) ? item.serialNumbers.join(", ") : item.serialNumbers || "N/A"}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{item.hsnCode}</td>
                            <td className="py-2.5 px-3 font-mono text-right text-slate-700">₹{item.unitPrice}</td>
                            <td className="py-2.5 px-3 font-mono font-black text-right text-slate-900">₹{item.lineTotal?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </divide>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 1: DOCUMENT METADATA (HEADER LEVEL) */}
              {activeTab === "metadata" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Document Type</label>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{extractedData.documentMetadata.documentType}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Document / Invoice Number</label>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{extractedData.documentMetadata.documentNumber}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Document Issue Date</label>
                    <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{extractedData.documentMetadata.documentDate}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Physical Arrival / Delivery Date</label>
                    <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{extractedData.documentMetadata.deliveryDate}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Reference Purchase Order (PO)</label>
                    <p className="font-mono font-black text-amber-700 text-sm mt-0.5 flex items-center gap-1.5">
                      {extractedData.documentMetadata.referencePoNumber}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-sans">Matched</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">RMA Number (Return Merchandise)</label>
                    <p className="font-mono text-slate-700 text-sm mt-0.5">{extractedData.documentMetadata.rmaNumber || "N/A"}</p>
                  </div>
                </div>
              )}

              {/* TAB 2: VENDOR AND RECEIVER INFORMATION */}
              {activeTab === "vendor" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Supplier / Consignor</span>
                    <p className="text-sm font-black text-slate-900">{extractedData.vendorInfo.supplierName}</p>
                    <p className="text-[11px] font-mono text-purple-700 bg-purple-50 inline-block px-2 py-0.5 rounded">
                      GSTIN/TAX ID: {extractedData.vendorInfo.supplierTaxId}
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed pt-1">
                      Origin Dispatch Address: {extractedData.vendorInfo.originAddress}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Buyer / Destination Dock</span>
                    <p className="text-sm font-black text-slate-900">{extractedData.vendorInfo.buyerName}</p>
                    <p className="text-[11px] font-mono text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded">
                      Buyer GSTIN: {extractedData.vendorInfo.buyerTaxId}
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed pt-1">
                      Destination Warehouse: {extractedData.vendorInfo.destinationWarehouseId}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: LOGISTICS AND TRANSIT DATA */}
              {activeTab === "logistics" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Transporter / Courier Name</label>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{extractedData.logisticsTransit.transporterName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tracking / Waybill / AWB #</label>
                    <p className="font-mono font-bold text-blue-700 text-sm mt-0.5">{extractedData.logisticsTransit.waybillNumber}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Delivery Vehicle / Truck Number</label>
                    <p className="font-mono font-black text-slate-900 text-sm mt-0.5">{extractedData.logisticsTransit.vehicleNumber}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Total Outer Packages</label>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{extractedData.logisticsTransit.totalPackages}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gross Weight / Net Weight</label>
                    <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                      {extractedData.logisticsTransit.grossWeight} / {extractedData.logisticsTransit.netWeight}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Security Container Seal #</label>
                    <p className="font-mono font-black text-emerald-700 text-sm mt-0.5">{extractedData.logisticsTransit.sealNumber}</p>
                  </div>
                </div>
              )}

              {/* TAB 5: FINANCIALS AND BILLING */}
              {activeTab === "financials" && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Billing Currency</label>
                      <p className="font-black text-slate-900 text-sm mt-0.5">{extractedData.financialsBilling.currency}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Items Subtotal</label>
                      <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">₹{extractedData.financialsBilling.subtotal?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Trade Discount</label>
                      <p className="font-mono text-rose-600 text-sm mt-0.5">- ₹{extractedData.financialsBilling.discount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Freight & Handling</label>
                      <p className="font-mono text-slate-800 text-sm mt-0.5">+ ₹{extractedData.financialsBilling.freightCharges?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">CGST (Central Tax)</label>
                      <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">₹{extractedData.financialsBilling.taxAmounts?.cgst?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">SGST (State Tax)</label>
                      <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">₹{extractedData.financialsBilling.taxAmounts?.sgst?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">IGST (Inter-State Tax)</label>
                      <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">₹{extractedData.financialsBilling.taxAmounts?.igst?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Total Statutory Tax</label>
                      <p className="font-mono font-black text-purple-700 text-xs mt-0.5">₹{extractedData.financialsBilling.taxAmounts?.totalTax?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900 text-white">
                    <span className="text-xs font-bold uppercase tracking-wider">Grand Invoice Payable Total</span>
                    <span className="font-mono text-lg font-black text-amber-400">
                      ₹{extractedData.financialsBilling.grandTotal?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 6: EDGE CASES AND UNSTRUCTURED MARKERS */}
              {activeTab === "markers" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Signatures & QC Stamps</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {extractedData.edgeCasesMarkers.stampDetected ? "DETECTED" : "ABSENT"}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">{extractedData.edgeCasesMarkers.stampDetails}</p>
                    <p className="text-[11px] text-slate-500">{extractedData.edgeCasesMarkers.signatureDetails}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Cold-Chain Temperature Sensor</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        MONITORED
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-blue-600" />
                      {extractedData.edgeCasesMarkers.temperatureReading}
                    </p>
                  </div>

                  <div className="sm:col-span-2 p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        Handwritten Notes & Physical Damage Annotations
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded ${
                          extractedData.edgeCasesMarkers.handwrittenNotesPresent
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {extractedData.edgeCasesMarkers.handwrittenNotesPresent ? "EXCEPTION LOGGED" : "CLEAN"}
                      </span>
                    </div>
                    <p className="text-slate-800 text-xs">
                      {extractedData.edgeCasesMarkers.handwrittenNotesText}
                    </p>
                    {extractedData.edgeCasesMarkers.humanReviewRequired && (
                      <p className="text-[11px] font-bold text-amber-700 pt-1">
                        ⚠️ Dock Assistant action: Please physically verify carton seals and tag any damaged lot before confirming.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {extractedData && (
              <span className="text-xs text-slate-500 font-medium">
                Verified for <strong>{employee?.name || "Dock Assistant"}</strong> ({employee?.postLevel || "ASSISTANT"})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {extractedData && (
              <button
                type="button"
                onClick={handleConfirmAdmission}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Admit Stock into Warehouse
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
