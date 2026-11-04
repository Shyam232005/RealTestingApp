import mongoose from "mongoose";

const PoItemSchema = new mongoose.Schema(
  {
    skuCode: { type: String, default: "", trim: true },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    uom: { type: String, default: "KG", trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    asnNumber: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    vendorName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    vendorGstin: {
      type: String,
      trim: true,
      default: "27AABCV1234Q1Z2",
    },
    vendorAddress: {
      type: String,
      trim: true,
      default: "",
    },
    items: {
      type: [PoItemSchema],
      default: [],
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    expectedDeliveryDate: {
      type: Date,
      required: true,
      index: true,
    },
    dockAppointmentSlot: {
      type: String,
      default: "Bay 1 (Morning 09:00 - 12:00)",
      trim: true,
    },
    dockStatus: {
      type: String,
      enum: ["SCHEDULED", "DOCKED", "UNLOADED", "DEMURRAGE_RISK", "COMPLETED"],
      default: "SCHEDULED",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "APPROVED_BY_COORDINATOR",
        "DIRECTOR_APPROVED",
        "ISSUED_TO_VENDOR",
        "IN_TRANSIT",
        "RECEIVED",
        "CANCELLED",
      ],
      default: "APPROVED_BY_COORDINATOR",
      index: true,
    },
    directorSignOff: {
      type: Boolean,
      default: false,
    },
    directorSignOffByName: {
      type: String,
      default: "",
      trim: true,
    },
    directorSignOffAt: {
      type: Date,
    },
    directorNotes: {
      type: String,
      default: "",
      trim: true,
    },
    isMultiYearContract: {
      type: Boolean,
      default: false,
    },
    contractTenureYears: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    createdByName: {
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
    branchId: {
      type: String,
      default: "branch-1",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PurchaseOrderSchema.index({ companyId: 1, status: 1 });
PurchaseOrderSchema.index({ companyId: 1, expectedDeliveryDate: 1 });

export default mongoose.models.PurchaseOrder ||
  mongoose.model("PurchaseOrder", PurchaseOrderSchema);
