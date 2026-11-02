import mongoose from "mongoose";

const SalesOrderItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "Commercial Product / Service",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    allocationStatus: {
      type: String,
      enum: ["UNALLOCATED", "RESERVED_IN_INVENTORY", "ALLOCATED", "DISPATCHED"],
      default: "UNALLOCATED",
    },
  },
  { _id: false }
);

const SalesOrderSchema = new mongoose.Schema(
  {
    orderReference: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    orderNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    dealId: {
      type: String,
      default: "",
      index: true,
    },
    estimateId: {
      type: String,
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED", "PENDING", "CONFIRMED"],
      default: "PENDING_APPROVAL",
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    approvedByName: {
      type: String,
      default: "",
    },
    paymentTerms: {
      type: String,
      default: "NET_30",
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    advanceCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMode: {
      type: String,
      enum: ["UPI", "CASH", "CARD", "NEFT", "RTGS", "CHEQUE", "CREDIT"],
      default: "NEFT",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID"],
      default: "PENDING",
      index: true,
    },
    items: {
      type: [SalesOrderItemSchema],
      default: () => [
        {
          itemId: "DEFAULT_SKU",
          name: "Standard MSME Package Item",
          quantity: 1,
          unitPrice: 0,
          total: 0,
          allocationStatus: "UNALLOCATED",
        },
      ],
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    itemsSummary: {
      type: String,
      default: "",
      trim: true,
    },
    ledgerSyncStatus: {
      type: String,
      enum: ["SYNCED", "PENDING", "ERROR"],
      default: "SYNCED",
      index: true,
    },
    journalEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalEntry",
    },
    deliveryBranch: {
      type: String,
      default: "Main (HQ) Warehouse",
    },
    ownerId: {
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
      default: "all",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure orderReference / orderNumber consistency
SalesOrderSchema.pre("save", function (next) {
  if (!this.orderReference && this.orderNumber) {
    this.orderReference = this.orderNumber;
  } else if (!this.orderNumber && this.orderReference) {
    this.orderNumber = this.orderReference;
  }
  if (!this.balanceDue && this.totalAmount) {
    this.balanceDue = Math.max(0, this.totalAmount - (this.advanceCollected || 0));
  }
  next();
});

export default mongoose.models.SalesOrder || mongoose.model("SalesOrder", SalesOrderSchema);
