import mongoose from "mongoose";

const FreightAuditLogSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    awbNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    orderReference: {
      type: String,
      trim: true,
      default: "",
    },
    carrier: {
      type: String,
      required: true,
      trim: true,
    },
    destinationZone: {
      type: String,
      default: "Zone North (DEL/NCR)",
      trim: true,
    },
    actualWeightKg: {
      type: Number,
      required: true,
      min: 0,
    },
    billedWeightKg: {
      type: Number,
      required: true,
      min: 0,
    },
    variancePercent: {
      type: Number,
      required: true,
    },
    billedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    expectedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    differenceAmount: {
      type: Number,
      required: true,
    },
    auditStatus: {
      type: String,
      enum: ["PENDING_AUDIT", "APPROVED_WITHIN_TOLERANCE", "DISPUTED_OVER_5_PERCENT", "SETTLED"],
      default: "PENDING_AUDIT",
      index: true,
    },
    disputeReason: {
      type: String,
      default: "",
      trim: true,
    },
    auditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    auditedByName: {
      type: String,
      default: "Logistics Coordinator",
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
  },
  {
    timestamps: true,
  }
);

FreightAuditLogSchema.index({ companyId: 1, auditStatus: 1 });
FreightAuditLogSchema.index({ awbNumber: 1, carrier: 1 });

export default mongoose.models.FreightAuditLog ||
  mongoose.model("FreightAuditLog", FreightAuditLogSchema);
