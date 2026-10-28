"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  Camera,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  FileSpreadsheet,
  Layers,
  Thermometer,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  ArrowRight,
  TrendingUp,
  Tag,
  Hash,
} from "lucide-react";
import { ScannerLaserSkeleton } from "@/components/ui/CrownSkeletonLoader";
import { writeLocalRecord } from "@/lib/localCrdtSync";

export default function CrownSmartScanner({
  documentContext = "general",
  onScanComplete = () => {},
  onReset = () => {},
  title = "Crown Universal AI OCR Scanner",
  subtitle = "Zero-Mistake • Self-Learning • Indian MSME & GST Compliant",
}) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [telemetryStage, setTelemetryStage] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [learnedFieldToast, setLearnedFieldToast] = useState(null);
  const [fieldLockState, setFieldLockState] = useState({});

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const TELEMETRY_STAGES = [
    "Reading Document Optics & Multi-Script Text...",
    "Decoding GSTIN, HSN & Line Item Grids...",
    "Cross-Checking Math & Accounting Guardrails...",
    "Connecting Self-Learning Dictionary & Aliases...",
    "Locking Zero-Error Verified Entries...",
  ];

  // Execute scan pipeline
  const executeScan = async ({ sampleId, fileObj }) => {
    setIsScanning(true);
    setErrorMsg("");
    setScanResult(null);
    setTelemetryStage(0);

    const stageTimer = setInterval(() => {
      setTelemetryStage((prev) => (prev < TELEMETRY_STAGES.length - 1 ? prev + 1 : prev));
    }, 420);

    try {
      let payload = { documentContext };

      if (sampleId) {
        payload.sampleId = sampleId;
      } else if (fileObj) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fileObj);
        });

        payload.fileName = fileObj.name;
        payload.fileType = fileObj.type;
        payload.fileBase64 = base64;
      }

      const res = await fetch("/api/ocr/universal-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Document scan failed.");
      }

      clearInterval(stageTimer);
      setTelemetryStage(TELEMETRY_STAGES.length - 1);

      setTimeout(async () => {
        setScanResult(data);
        setIsScanning(false);

        // Optimistic local CRDT cache
        try {
          await writeLocalRecord("ocr_scans", {
            ...data,
            documentContext,
            scannedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Local CRDT scan cache fallback:", e);
        }

        // Notify parent with extracted data & dynamic fields
        onScanComplete(data);

        // Show toast if new fields were learned by the engine
        if (data.newFieldsLearned && data.newFieldsLearned.length > 0) {
          setLearnedFieldToast(data.newFieldsLearned[0]);
          setTimeout(() => setLearnedFieldToast(null), 6000);
        }
      }, 500);
    } catch (err) {
      clearInterval(stageTimer);
      setIsScanning(false);
      setErrorMsg(err.message || "Failed to process document.");
    }
  };

  const handleFileUpload = (e) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    if (uploaded.type.startsWith("image/")) {
      const url = URL.createObjectURL(uploaded);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }

    executeScan({ fileObj: uploaded });
  };

  const handleSampleClick = (sampleId) => {
    setFile({
      name: `${sampleId}.pdf`,
      type: "application/pdf",
      size: 384000,
    });
    setFilePreview(null);
    executeScan({ sampleId });
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview(null);
    setScanResult(null);
    setIsScanning(false);
    setErrorMsg("");
    setLearnedFieldToast(null);
    onReset();
  };

  const toggleFieldLock = (fieldId) => {
    setFieldLockState((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  return (
    <div className="relative w-full rounded-3xl bg-slate-950/80 border border-emerald-500/30 p-5 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden transition-all">
      {/* Decorative background glow mesh */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <ScanLine className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                {title}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                AI Vision 2.5
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                Self-Learning
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {scanResult && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="px-3 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{scanResult.confidenceScore}% Trust Score</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Scan new document"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Dynamic "New Field Learned" Toast */}
      <AnimatePresence>
        {learnedFieldToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="relative z-20 my-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-amber-400 block">
                  Adaptive AI Schema Evolution
                </span>
                <span>
                  Never-before-seen field learned permanently: <strong>"{learnedFieldToast.canonicalName}"</strong> (Alias: <em>{learnedFieldToast.rawKey}</em>)
                </span>
              </div>
            </div>
            <button
              onClick={() => setLearnedFieldToast(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      {errorMsg && (
        <div className="my-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* =========================================================================
          STATE 1: IDLE / DROPZONE (WITH MOBILE CAMERA & QUICK SAMPLES)
         ========================================================================= */}
      {!scanResult && !isScanning && (
        <div className="relative z-10 pt-5 space-y-5">
          {/* Main Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-3xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-8 sm:p-10 text-center transition-all cursor-pointer overflow-hidden"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-emerald-500/5">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-extrabold text-white">
              Drop Invoice, Delivery Challan, Bilty, or Kachcha Bill
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Supports <strong>Photos (PNG, JPG, WebP)</strong> and <strong>PDF Invoices</strong>. Zero typing required.
            </p>

            {/* Direct Mobile Camera Button for warehouse floor staff */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <label
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
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
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Select PDF / File</span>
              </button>
            </div>
          </div>

          {/* Quick-Scan Pre-loaded Vendor Delivery Documents */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Quick-Scan Sample Documents (1-Click Floor Test)
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Indian MSME Formats</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                {
                  id: "tata-steel-challan",
                  title: "Tata Steel Inward Challan",
                  badge: "Industrial",
                  desc: "Steel Coils, TMT Rods, Gate Pass & Seal",
                },
                {
                  id: "haldirams-coldchain",
                  title: "Haldiram's & Amul Cold-Chain",
                  badge: "FMCG / Sweets",
                  desc: "3.8°C Temp, Sweets, Butter & Driver Note",
                },
                {
                  id: "havells-invoice",
                  title: "Havells Industrial Tax Invoice",
                  badge: "Electronics",
                  desc: "MCBs, Wire, Serial #s & QC Stamp",
                },
                {
                  id: "kachcha-mandi-bilty",
                  title: "Mandi Bilty (Gujarati/Hindi)",
                  badge: "Trader / Mandi",
                  desc: "Jeera, Hamali, APMC Yard Bilty",
                },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSampleClick(s.id)}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                      {s.title}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STATE 2: ACTIVE SCANNING CHOREOGRAPHY (PULSING LASER SKELETON LOADER)
         ========================================================================= */}
      {isScanning && (
        <div className="relative z-10 py-4">
          <ScannerLaserSkeleton label={TELEMETRY_STAGES[telemetryStage]} />
        </div>
      )}

      {/* =========================================================================
          STATE 3: AUTO-FILLED VERIFICATION & COLOR-CODED TRUST BADGES
         ========================================================================= */}
      {scanResult && !isScanning && (
        <div className="relative z-10 pt-5 space-y-5">
          {/* Compliance & Audit Banner */}
          {scanResult.auditFlags?.humanReviewRequired && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-extrabold uppercase text-[10px] tracking-wider">
                  Human Verification Advised: Discrepancy / Handwritten Note Detected
                </span>
              </div>
              <p className="text-amber-200/90 pl-6 leading-relaxed">
                {scanResult.auditFlags.flagReason}
              </p>
            </div>
          )}

          {/* Extracted Dynamic Fields (Staggered Grid) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Extracted Bill & Ledger Parameters ({scanResult.dynamicFields?.length || 0} Fields)
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono">
                  All Inputs Auto-Populated
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Click lock to manually edit verified entries
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {scanResult.dynamicFields?.map((field, idx) => {
                const isLocked = fieldLockState[field.fieldId] !== false && field.confidenceScore >= 0.9;
                const isLowTrust = field.confidenceScore < 0.8 || field.isHandwritten;

                return (
                  <motion.div
                    key={field.fieldId || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isLowTrust
                        ? "bg-amber-950/20 border-amber-500/50 shadow-xs shadow-amber-500/10"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <span className="text-[11px] font-bold text-slate-300 truncate">
                          {field.canonicalName}
                        </span>
                        {field.isHandwritten && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Handwritten
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLowTrust ? (
                          <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            {Math.round(field.confidenceScore * 100)}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {Math.round(field.confidenceScore * 100)}%
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleFieldLock(field.fieldId)}
                          className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                          title={isLocked ? "Field locked (Verified). Click to edit." : "Field editable"}
                        >
                          {isLocked ? (
                            <Lock className="w-3 h-3 text-slate-400" />
                          ) : (
                            <Unlock className="w-3 h-3 text-amber-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-1">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={field.value !== undefined ? String(field.value) : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setScanResult((prev) => ({
                            ...prev,
                            dynamicFields: prev.dynamicFields.map((f, i) =>
                              i === idx ? { ...f, value: val } : f
                            ),
                          }));
                        }}
                        className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-medium outline-none transition-colors ${
                          isLocked
                            ? "bg-slate-950/70 border border-slate-800/80 text-white cursor-not-allowed"
                            : "bg-slate-950 border border-amber-500/60 text-white focus:border-amber-400"
                        }`}
                      />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="truncate">Raw: "{field.rawKey}"</span>
                      {isLocked && <span className="text-emerald-400/80">✓ Verified</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Tabular Line Items Display (If Present) */}
          {scanResult.dynamicTables?.[0]?.rows?.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Extracted Line Items ({scanResult.dynamicTables[0].rows.length} Rows)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Tabular Ledger Matched
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-3">HSN</th>
                      <th className="py-2.5 px-3">Batch</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Tax</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {scanResult.dynamicTables[0].rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-sans font-semibold text-white">
                          {row.itemDescription || row.description || row.name || `Item ${rIdx + 1}`}
                        </td>
                        <td className="py-2 px-3 text-slate-400">{row.hsn || "-"}</td>
                        <td className="py-2 px-3 text-purple-400">{row.batch || "-"}</td>
                        <td className="py-2 px-3 text-right text-amber-400 font-bold">{row.qty || row.quantity || 0}</td>
                        <td className="py-2 px-3 text-right">₹{row.rate || row.unitPrice || 0}</td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          ₹{(Number(row.cgst || 0) + Number(row.sgst || 0) + Number(row.igst || 0)) || 0}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-emerald-400">
                          ₹{row.lineTotal || row.total || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
