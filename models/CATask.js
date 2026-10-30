import mongoose from "mongoose";

const CATaskSchema = new mongoose.Schema(
  {
    caFirmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CA",
      required: true,
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CAStaff",
      required: true,
      index: true,
    },
    staffName: {
      type: String,
      required: true,
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "VOUCHER_AUDIT",
        "GST_RECONCILIATION",
        "BANK_RECONCILIATION",
        "TDS_CHECK",
        "STOCK_AUDIT",
        "TAX_AUDIT_3CD",
        "GENERAL_COMPLIANCE",
      ],
      default: "VOUCHER_AUDIT",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },
    dueDate: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ASSIGNED", "IN_PROGRESS", "WORK_COMPLETED", "REVIEWED_APPROVED"],
      default: "ASSIGNED",
      index: true,
    },
    vouchersChecked: {
      type: Number,
      default: 0,
    },
    discrepanciesCount: {
      type: Number,
      default: 0,
    },
    staffNotes: {
      type: String,
      default: "",
      trim: true,
    },
    partnerNotes: {
      type: String,
      default: "",
      trim: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

CATaskSchema.index({ caFirmId: 1, staffId: 1, status: 1 });
CATaskSchema.index({ staffId: 1, status: 1 });

export default mongoose.models.CATask || mongoose.model("CATask", CATaskSchema);
