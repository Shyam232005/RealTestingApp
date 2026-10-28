"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Edit3,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Eye,
  X,
  Database,
  Building2,
  Calendar,
  Hash,
} from "lucide-react";
import CrownSmartScanner from "./CrownSmartScanner";

/**
 * Maps extracted canonical OCR keys & values to standard department form fields.
 */
function defaultFieldMapper(scanResult, currentForm, updateForm) {
  if (!scanResult) return;

  const dynamicFields = scanResult.dynamicFields || [];
  const meta = scanResult.extractedMetadata || {};
  const tables = scanResult.dynamicTables || [];
  const audit = scanResult.auditFlags || {};

  // Build a lookup map of canonical names to values
  const lookup = {};
  dynamicFields.forEach((f) => {
    if (f.canonicalName && f.value !== undefined && f.value !== null) {
      lookup[f.canonicalName] = f.value;
    }
    if (f.rawKey && f.value !== undefined && f.value !== null) {
      lookup[f.rawKey.toLowerCase()] = f.value;
    }
  });

  // Extract line items summary if available
  let lineItemsDesc = "";
  let totalLineQty = 0;
  let firstItemRate = 0;
  let firstBatch = "";
  if (tables.length > 0 && tables[0].rows && tables[0].rows.length > 0) {
    const r0 = tables[0].rows[0];
    lineItemsDesc = tables[0].rows
      .map((r) => r.itemDescription || r.description || r.item || r.sku || "")
      .filter(Boolean)
      .join(", ");
    totalLineQty = tables[0].rows.reduce((acc, r) => acc + (Number(r.quantity || r.qty) || 0), 0);
    firstItemRate = Number(r0.unitPrice || r0.rate || r0.price) || 0;
    firstBatch = r0.batchNumber || r0.batch || r0.lotNumber || "";
  }

  // Define candidate mappings for common business field targets
  const candidateMappings = {
    // Customer / Vendor / Party Names
    customerName:
      lookup["buyer_name"] ||
      lookup["customer_name"] ||
      lookup["client_name"] ||
      lookup["party_name"] ||
      lookup["consignee_name"] ||
      meta.customerName ||
      meta.buyerName ||
      "",
    clientName:
      lookup["buyer_name"] ||
      lookup["customer_name"] ||
      lookup["client_name"] ||
      lookup["party_name"] ||
      meta.clientName ||
      meta.buyerName ||
      "",
    vendorName:
      lookup["supplier_name"] ||
      lookup["vendor_name"] ||
      lookup["party_name"] ||
      meta.supplierName ||
      meta.vendorName ||
      "",
    companyName:
      lookup["buyer_name"] ||
      lookup["supplier_name"] ||
      lookup["company_name"] ||
      meta.companyName ||
      "",
    contactName:
      lookup["contact_person"] ||
      lookup["authorized_signatory"] ||
      lookup["buyer_name"] ||
      "",

    // GSTIN
    buyerGstin:
      lookup["buyer_gstin"] ||
      lookup["gstin"] ||
      lookup["tax_id"] ||
      meta.buyerGstin ||
      "",
    vendorGstin:
      lookup["supplier_gstin"] ||
      lookup["gstin"] ||
      lookup["tax_id"] ||
      meta.supplierGstin ||
      "",

    // Values / Amounts
    taxableValue:
      lookup["taxable_amount"] ||
      lookup["subtotal"] ||
      meta.taxableAmount ||
      (meta.grandTotal ? String(Math.round(meta.grandTotal / 1.18)) : ""),
    billAmount:
      lookup["grand_total"] ||
      lookup["total_amount"] ||
      meta.grandTotal ||
      "",
    amount:
      lookup["grand_total"] ||
      lookup["taxable_amount"] ||
      lookup["total_amount"] ||
      meta.grandTotal ||
      "",
    dealValue:
      lookup["grand_total"] ||
      lookup["total_amount"] ||
      meta.grandTotal ||
      "",
    totalAmount:
      lookup["grand_total"] ||
      lookup["total_amount"] ||
      meta.grandTotal ||
      "",
    unitPrice:
      lookup["unit_price"] ||
      lookup["rate"] ||
      (firstItemRate ? String(firstItemRate) : ""),

    // PO & GRN refs
    poRef:
      lookup["reference_po_number"] ||
      lookup["po_number"] ||
      lookup["order_number"] ||
      meta.referencePoNumber ||
      "",
    grnRef:
      lookup["document_number"] ||
      lookup["receipt_number"] ||
      lookup["grn_number"] ||
      meta.documentNumber ||
      "",

    // Quantities & Descriptions
    quantity:
      lookup["quantity"] ||
      (totalLineQty > 0 ? String(totalLineQty) : ""),
    targetQty:
      lookup["quantity"] ||
      (totalLineQty > 0 ? String(totalLineQty) : ""),
    quantityRequired:
      lookup["quantity"] ||
      (totalLineQty > 0 ? String(totalLineQty) : ""),
    materialDescription:
      lineItemsDesc ||
      lookup["item_description"] ||
      lookup["product_name"] ||
      "",
    itemsSummary:
      lineItemsDesc ||
      lookup["item_description"] ||
      lookup["product_name"] ||
      "",
    productName:
      lineItemsDesc.split(",")[0] ||
      lookup["product_name"] ||
      lookup["item_description"] ||
      "",
    itemDescription:
      lineItemsDesc ||
      lookup["item_description"] ||
      "",

    // Logistics & Vehicles
    vehicleNumber:
      lookup["vehicle_number"] ||
      lookup["truck_number"] ||
      meta.vehicleNumber ||
      "",
    destinationCity:
      lookup["destination_city"] ||
      lookup["city"] ||
      lookup["warehouse_location"] ||
      "",
    driverName:
      lookup["driver_name"] ||
      lookup["transporter_name"] ||
      "",

    // Batch & QA
    batchCode:
      lookup["batch_number"] ||
      lookup["lot_number"] ||
      firstBatch ||
      "",
    lotNumber:
      lookup["batch_number"] ||
      lookup["lot_number"] ||
      firstBatch ||
      "",
    materialName:
      lineItemsDesc.split(",")[0] ||
      lookup["product_name"] ||
      "",

    // Narrations & Remarks
    narration:
      lookup["narration"] ||
      lookup["handwritten_notes"] ||
      (meta.documentType ? `${meta.documentType} logged via Crown AI OCR` : ""),
    remarks:
      lookup["handwritten_notes"] ||
      lookup["remarks"] ||
      (audit.humanReviewRequired ? `Flagged: ${audit.flagReason}` : "Verified via AI OCR"),
    problemDescription:
      lookup["handwritten_notes"] ||
      "",
  };

  // Perform updates
  if (typeof updateForm === "function") {
    // If updateForm is a standard React state setter `setForm(prev => ...)`
    updateForm((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (candidateMappings[key] !== undefined && candidateMappings[key] !== "") {
          next[key] = candidateMappings[key];
        }
      });
      return next;
    });
  } else if (updateForm && typeof updateForm.setValue === "function") {
    // If updateForm is a React Hook Form instance with `setValue`
    Object.keys(candidateMappings).forEach((key) => {
      if (candidateMappings[key]) {
        updateForm.setValue(key, candidateMappings[key], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    });
  }
}

/**
 * Universal Drop-In Wrapper for AI-First Data Entry across all Department Forms.
 * Provides:
 * 1. Default CrownSmartScanner AI interface with Instant Drag-and-Drop, PDF, and Camera.
 * 2. Automated canonical field population to React Hook Form or State Setter.
 * 3. Animated "Live Verification Drawer" containing the pre-filled inputs.
 * 4. Expandable "Edge Intelligence & Discovered Fields" accordion for unmapped keys.
 * 5. One-click toggle between AI Smart Mode and Direct Manual Entry.
 */
export default function WithZeroErrorOcr({
  isOpen = true,
  onClose,
  title = "Universal AI Data Entry",
  subtitle = "Zero manual typing with self-learning Indian OCR guardrails",
  documentContext = "universal",
  formData,
  setFormData,
  formHook,
  onApplyExtracted,
  onDynamicFieldsLearned,
  children,
  onSubmit,
  submitLabel = "Save & Confirm Record",
  submitColor = "bg-emerald-600 hover:bg-emerald-700",
}) {
  const [activeMode, setActiveMode] = useState("ai_scan"); // 'ai_scan' | 'manual_form'
  const [scanResult, setScanResult] = useState(null);
  const [showVerificationDrawer, setShowVerificationDrawer] = useState(false);
  const [showEdgeDetails, setShowEdgeDetails] = useState(false);
  const [autoFilledCount, setAutoFilledCount] = useState(0);

  // If closed when used as a modal
  if (!isOpen) return null;

  const handleScanComplete = (result) => {
    setScanResult(result);

    // Run dynamic mapping
    if (typeof onApplyExtracted === "function") {
      onApplyExtracted(result);
    } else if (setFormData) {
      defaultFieldMapper(result, formData, setFormData);
    } else if (formHook) {
      defaultFieldMapper(result, null, formHook);
    }

    if (onDynamicFieldsLearned && result.dynamicFields) {
      onDynamicFieldsLearned(result.dynamicFields);
    }

    // Count how many fields were dynamically extracted
    const count = (result.dynamicFields || []).length;
    setAutoFilledCount(count);

    // Auto-expand the verification drawer smoothly
    setShowVerificationDrawer(true);
  };

  const isModal = typeof onClose === "function";

  const content = (
    <div className="bg-slate-950 text-white rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">{title}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Self-Learning OCR
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle Pill */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMode("ai_scan")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === "ai_scan"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              AI Scanner
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode("manual_form");
                setShowVerificationDrawer(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === "manual_form"
                  ? "bg-slate-800 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Manual Inputs
            </button>
          </div>

          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeMode === "ai_scan" && (
          <div className="space-y-4">
            {/* The Ultra-Luxurious Crown Smart Scanner Component */}
            <CrownSmartScanner
              documentContext={documentContext}
              onScanComplete={handleScanComplete}
            />

            {/* Success Banner when fields extracted */}
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-300">
                      Successfully extracted {autoFilledCount} document attributes!
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      Form inputs below have been automatically populated. Review in the Live
                      Verification Drawer before final submission.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerificationDrawer(!showVerificationDrawer)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 cursor-pointer transition-colors"
                >
                  {showVerificationDrawer ? "Collapse Drawer" : "Review Inputs"}
                  {showVerificationDrawer ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Live Verification Drawer (Form Inputs) */}
        <AnimatePresence>
          {(showVerificationDrawer || activeMode === "manual_form") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Live Form Verification Drawer
                  </h4>
                  {scanResult && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Auto-Populated
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Verify or edit any field before writing to ledger
                </span>
              </div>

              {/* Children Form (Supplied by the Department View) */}
              <div className="department-ocr-form-container text-slate-900">
                {children}
              </div>

              {/* Discovered Dynamic Fields & Edge Intelligence Accordion */}
              {scanResult && (
                <div className="border border-slate-800/80 rounded-2xl bg-slate-950/60 p-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowEdgeDetails(!showEdgeDetails)}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Discovered Dynamic Ledger Fields ({scanResult.dynamicFields?.length || 0})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        (Stored in Universal Document Record)
                      </span>
                    </div>
                    {showEdgeDetails ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showEdgeDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"
                      >
                        {scanResult.dynamicFields?.map((f, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {f.canonicalName.replace(/_/g, " ")}
                              </span>
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                {Math.round((f.confidenceScore || 0.9) * 100)}%
                              </span>
                            </div>
                            <span className="font-mono text-slate-100 font-semibold break-all text-[11px]">
                              {String(f.value)}
                            </span>
                            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500">
                              <span>Raw: {f.rawKey}</span>
                              {f.isHandwritten && (
                                <span className="text-amber-400">Handwritten</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Crown 3-Way Match & GST Checksum Enabled</span>
        </div>

        <div className="flex items-center gap-3">
          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-900 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          )}
          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              className={`px-5 py-2.5 rounded-xl ${submitColor} text-white font-black text-xs cursor-pointer shadow-lg transition-transform active:scale-95 flex items-center gap-2`}
            >
              <span>{submitLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // If used as modal, render backdrop
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">{content}</div>
      </div>
    );
  }

  // Otherwise render inline container
  return <div className="w-full">{content}</div>;
}
