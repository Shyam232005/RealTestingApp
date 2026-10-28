import mongoose from "mongoose";

const LedgerAccountSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Accounting Primary Classification
    type: {
      type: String,
      enum: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"],
      required: true,
      index: true,
    },
    // Sub-classification for automated Balance Sheet & P&L grouping
    subCategory: {
      type: String,
      enum: [
        "CURRENT_ASSET",
        "FIXED_ASSET",
        "NON_CURRENT_ASSET",
        "CURRENT_LIABILITY",
        "LONG_TERM_LIABILITY",
        "OWNER_EQUITY",
        "RETAINED_EARNINGS",
        "OPERATING_REVENUE",
        "OTHER_INCOME",
        "DIRECT_EXPENSE", // COGS items: Purchases, Freight In, Direct Labor
        "OPERATING_EXPENSE", // Opex: Rent, Salaries, Admin, Depreciation
        "FINANCIAL_EXPENSE", // Bank interest, finance charges
      ],
      required: true,
      index: true,
    },
    normalBalance: {
      type: String,
      enum: ["DEBIT", "CREDIT"],
      required: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    branchId: {
      type: String,
      default: "all",
      index: true,
    },
    isSystemAccount: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for instant account lookup per organization
LedgerAccountSchema.index({ organizationId: 1, code: 1 }, { unique: true });
LedgerAccountSchema.index({ organizationId: 1, type: 1, subCategory: 1 });
LedgerAccountSchema.index({ organizationId: 1, branchId: 1 });

export default mongoose.models.LedgerAccount ||
  mongoose.model("LedgerAccount", LedgerAccountSchema);
