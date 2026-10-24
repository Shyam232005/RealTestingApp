import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    // Account Type: Primary Commercial Bank or Physical Vault Cash
    accountType: {
      type: String,
      enum: ["BANK", "CASH"],
      default: "BANK",
      index: true,
    },
    // Transaction Type: CREDIT (Inflow / Money In), DEBIT (Outflow / Money Out)
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
      index: true,
    },
    branchId: {
      type: String,
      default: "all",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "CASH", "SYSTEM", "TRANSFER"],
      default: "SYSTEM",
    },
    status: {
      type: String,
      enum: ["COMPLETED", "PENDING", "FAILED"],
      default: "COMPLETED",
    },
    runningBalance: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for chronological ledger queries
TransactionSchema.index({ organizationId: 1, date: -1 });
TransactionSchema.index({ organizationId: 1, accountType: 1, date: -1 });

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
