import mongoose from "mongoose";

const JournalLineSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerAccount",
      required: true,
      index: true,
    },
    accountCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"],
      required: true,
      index: true,
    },
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
        "DIRECT_EXPENSE",
        "OPERATING_EXPENSE",
        "FINANCIAL_EXPENSE",
      ],
      required: true,
      index: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const JournalEntrySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    entryNumber: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    branchId: {
      type: String,
      default: "all",
      index: true,
    },
    entryType: {
      type: String,
      enum: [
        "OPENING_BALANCE",
        "MANUAL",
        "SALES",
        "PURCHASE",
        "PAYMENT",
        "RECEIPT",
        "CONTRA",
        "OCR_AUTO",
      ],
      default: "MANUAL",
      index: true,
    },
    reference: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    narration: {
      type: String,
      required: true,
      trim: true,
    },
    lines: {
      type: [JournalLineSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 2;
        },
        message: "A double-entry voucher must have at least 2 entry lines (Dr & Cr).",
      },
      required: true,
    },
    totalDebit: {
      type: Number,
      default: 0,
    },
    totalCredit: {
      type: Number,
      default: 0,
    },
    isOpeningBalance: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "POSTED", "VOID"],
      default: "POSTED",
      index: true,
    },
    createdBy: {
      type: String,
      default: "System",
      trim: true,
    },
    sourceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversalDocumentRecord",
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * STRICT PRE-SAVE DOUBLE ENTRY VALIDATION HOOK
 * Ensures total debits equal total credits within ₹0.01 tolerance before persistence.
 */
JournalEntrySchema.pre("validate", function () {
  if (this.lines && Array.isArray(this.lines)) {
    let sumDebit = 0;
    let sumCredit = 0;

    for (const line of this.lines) {
      sumDebit += Number(line.debit) || 0;
      sumCredit += Number(line.credit) || 0;
    }

    this.totalDebit = Math.round(sumDebit * 100) / 100;
    this.totalCredit = Math.round(sumCredit * 100) / 100;

    const discrepancy = Math.abs(this.totalDebit - this.totalCredit);
    if (discrepancy > 0.01) {
      throw new Error(
        `Double-entry accounting violation: Total Debits (₹${this.totalDebit}) must strictly equal Total Credits (₹${this.totalCredit}). Discrepancy: ₹${discrepancy.toFixed(2)}`
      );
    }
  }
});

// HIGH PERFORMANCE INDEXES FOR SUB-50MS FINANCIAL AGGREGATIONS
JournalEntrySchema.index({ organizationId: 1, date: -1 });
JournalEntrySchema.index({ organizationId: 1, branchId: 1, date: -1 });
JournalEntrySchema.index({ organizationId: 1, "lines.accountId": 1, date: -1 });
JournalEntrySchema.index({ organizationId: 1, "lines.accountCode": 1, date: -1 });
JournalEntrySchema.index({ organizationId: 1, "lines.accountType": 1, date: -1 });
JournalEntrySchema.index({ organizationId: 1, "lines.subCategory": 1, date: -1 });
JournalEntrySchema.index({ organizationId: 1, entryNumber: 1 }, { unique: true });

export default mongoose.models.JournalEntry ||
  mongoose.model("JournalEntry", JournalEntrySchema);
