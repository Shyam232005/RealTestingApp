import mongoose from "mongoose";

const DiscrepancyMemoSchema = new mongoose.Schema(
  {
    memoNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    quarantineLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuarantineLog",
      index: true,
    },
    cartonId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    skuCode: {
      type: String,
      trim: true,
      default: "",
    },
    itemDescription: {
      type: String,
      required: true,
      trim: true,
    },
    batchLotNumber: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    uom: {
      type: String,
      trim: true,
      default: "Units",
    },
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    vendorGstin: {
      type: String,
      trim: true,
      default: "",
    },
    referencePoNumber: {
      type: String,
      trim: true,
      default: "",
    },
    referenceLrNumber: {
      type: String,
      trim: true,
      default: "",
    },
    discrepancyType: {
      type: String,
      enum: [
        "CRUSHED_CARTON",
        "BROKEN_INNER_PACK",
        "LEAKAGE",
        "SEAL_TAMPERED",
        "TEMPERATURE_BREACH",
        "MOISTURE_DAMAGE",
        "OTHER",
      ],
      default: "CRUSHED_CARTON",
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "HIGH",
    },
    quarantineCageLocation: {
      type: String,
      required: true,
      trim: true,
      default: "Cage Q-Locked-01 (High Security)",
    },
    vendorDebitNoteRequested: {
      type: Boolean,
      default: true,
    },
    estimatedLossAmount: {
      type: Number,
      default: 0,
    },
    damageAssessmentNotes: {
      type: String,
      trim: true,
      default: "",
    },
    authorizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    authorizedByName: {
      type: String,
      trim: true,
      default: "Logistics Supervisor",
    },
    status: {
      type: String,
      enum: [
        "LOCKED_IN_QUARANTINE",
        "DEBIT_NOTE_ISSUED",
        "VENDOR_CREDIT_SETTLED",
        "SCRAPPED",
        "RETURNED_TO_VENDOR",
      ],
      default: "LOCKED_IN_QUARANTINE",
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    branchId: {
      type: String,
      default: "branch-1",
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

DiscrepancyMemoSchema.index({ companyId: 1, status: 1 });
DiscrepancyMemoSchema.index({ memoNumber: 1, companyId: 1 });

export default mongoose.models.DiscrepancyMemo ||
  mongoose.model("DiscrepancyMemo", DiscrepancyMemoSchema);
