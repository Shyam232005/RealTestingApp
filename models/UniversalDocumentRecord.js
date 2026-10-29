import mongoose from "mongoose";

// EAV Dynamic Field Sub-Schema
const DynamicFieldSchema = new mongoose.Schema(
  {
    fieldId: { type: String, required: true, trim: true },
    canonicalName: { type: String, required: true, trim: true },
    rawKey: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
    confidenceScore: { type: Number, default: 0.95, min: 0, max: 1 },
    isHandwritten: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["verified", "flagged_human_review", "unverified"],
      default: "unverified",
    },
  },
  { _id: false }
);

// Dynamic Tabular Line-Item Sub-Schema (Variable Columns)
const DynamicTableSchema = new mongoose.Schema(
  {
    tableName: { type: String, default: "line_items", trim: true },
    rows: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

// Audit & Compliance Flags Sub-Schema
const AuditFlagsSchema = new mongoose.Schema(
  {
    mathCheckPassed: { type: Boolean, default: true },
    gstChecksumValid: { type: Boolean, default: true },
    vehicleFormatValid: { type: Boolean, default: true },
    ewayBillFormatValid: { type: Boolean, default: true },
    humanReviewRequired: { type: Boolean, default: false },
    flagReason: { type: String, default: "", trim: true },
    temperature: { type: String, default: "", trim: true },
    stampDetected: { type: Boolean, default: false },
    signatureDetected: { type: Boolean, default: false },
  },
  { _id: false }
);

const UniversalDocumentRecordSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: false,
      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: false,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
      index: true,
    },

    // Auto-detected document classification
    documentType: {
      type: String,
      default: "Tax Invoice",
      enum: [
        "Tax Invoice",
        "Delivery Challan",
        "Kachcha Bill",
        "Gate Pass",
        "E-Way Bill",
        "Weight Slip",
        "Purchase Order",
        "Goods Receipt Note (GRN)",
        "Payment Voucher",
        "Material Requisition",
        "Sales Order",
        "Other",
      ],
      index: true,
    },

    // Context / Workflow origin
    context: {
      type: String,
      default: "general",
      index: true,
    },

    originalFileName: { type: String, default: "", trim: true },
    fileType: { type: String, default: "application/pdf", trim: true },
    fileSize: { type: Number, default: 0 },
    fileUrl: { type: String, default: "", trim: true },

    // EAV Extracted Key-Value Fields
    dynamicFields: {
      type: [DynamicFieldSchema],
      default: [],
    },

    // Variable Column Table Grids (e.g. HSN, Batch, Qty, Free Qty, Rate, Disc%, CGST, SGST, IGST)
    dynamicTables: {
      type: [DynamicTableSchema],
      default: [],
    },

    // Guardrail Compliance Flags
    auditFlags: {
      type: AuditFlagsSchema,
      default: () => ({}),
    },

    // Full Raw Vision Extraction Payload for Audit History
    rawExtractedJson: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Processing Status
    status: {
      type: String,
      enum: ["DRAFT", "VERIFIED_ADMITTED", "REJECTED", "PENDING_REVIEW"],
      default: "DRAFT",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.UniversalDocumentRecord ||
  mongoose.model("UniversalDocumentRecord", UniversalDocumentRecordSchema);
