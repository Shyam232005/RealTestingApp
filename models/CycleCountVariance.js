import mongoose from "mongoose";

const CycleCountVarianceSchema = new mongoose.Schema(
  {
    auditCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    binLocation: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    skuCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    itemDescription: {
      type: String,
      required: true,
      trim: true,
    },
    systemRecordedQty: {
      type: Number,
      required: true,
      default: 0,
    },
    physicalCountedQty: {
      type: Number,
      required: true,
      default: 0,
    },
    varianceQty: {
      type: Number,
      required: true,
      default: 0,
    },
    variancePercentage: {
      type: Number,
      default: 0,
    },
    uom: {
      type: String,
      trim: true,
      default: "KG",
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    varianceValue: {
      type: Number,
      default: 0,
    },
    discrepancyReason: {
      type: String,
      enum: [
        "MISPLACED_BIN",
        "DAMAGED_UNRECORDED",
        "THEFT_PILFERAGE",
        "INWARD_OVERCOUNT",
        "PICKING_DISPATCH_LEAK",
        "DATA_ENTRY_SLIP",
      ],
      default: "MISPLACED_BIN",
    },
    reconciliationStatus: {
      type: String,
      enum: [
        "PENDING_AUDIT_REVIEW",
        "ADJUSTMENT_REQUESTED",
        "ADJUSTMENT_APPROVED",
        "WRITE_OFF_RECORDED",
        "RECONCILED",
      ],
      default: "PENDING_AUDIT_REVIEW",
      index: true,
    },
    supervisorNotes: {
      type: String,
      trim: true,
      default: "",
    },
    auditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    auditedByName: {
      type: String,
      trim: true,
      default: "Logistics Supervisor",
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

CycleCountVarianceSchema.index({ companyId: 1, reconciliationStatus: 1 });
CycleCountVarianceSchema.index({ binLocation: 1, companyId: 1 });

export default mongoose.models.CycleCountVariance ||
  mongoose.model("CycleCountVariance", CycleCountVarianceSchema);
