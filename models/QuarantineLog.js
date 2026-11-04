import mongoose from "mongoose";

const QuarantineLogSchema = new mongoose.Schema(
  {
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
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
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
      index: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "HIGH",
    },
    quarantineBay: {
      type: String,
      default: "Quarantine Bay Q-1 (Dock Hold)",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "QUARANTINED",
        "PENDING_QC_INSPECTION",
        "SCRAPPED",
        "RETURNED_TO_VENDOR",
        "RELEASED",
      ],
      default: "QUARANTINED",
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    reportedByName: {
      type: String,
      default: "Logistics Assistant",
      trim: true,
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

QuarantineLogSchema.index({ companyId: 1, status: 1 });
QuarantineLogSchema.index({ cartonId: 1, companyId: 1 });

export default mongoose.models.QuarantineLog ||
  mongoose.model("QuarantineLog", QuarantineLogSchema);
