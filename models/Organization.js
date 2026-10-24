import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      unique: true,
      index: true,
    },

    // 1. Subscription & Plan Context
    planName: { type: String, default: "MSME Starter", trim: true },
    billingCycle: { type: String, default: "annual", trim: true },
    paymentStatus: { type: String, default: "paid", trim: true },

    // 2. Business Identification & Legal
    RegisterName: { type: String, required: true, trim: true },
    GST: { type: String, required: true, uppercase: true, trim: true },
    location: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    branches: { type: Number, default: 1, min: 1 },

    // 3. Banking Details
    BankName: { type: String, required: true, trim: true },
    IFSC: { type: String, required: true, uppercase: true, trim: true },
    AccNo: { type: String, required: true, trim: true },

    // 4. Organizational Structure
    activeDepartments: {
      type: [String],
      default: [
        "operations",
        "sales&marketing",
        "supplies&logistics",
        "finance&accounts",
      ],
    },
    primaryWarehouse: { type: String, default: "Main Factory", trim: true },

    // 5. Opening Balances & Stock Valuation
    openingBalance: { type: Number, default: 0 },
    openingCash: { type: Number, default: 0 },
    currentStockValue: { type: Number, default: 0 },

    // 6. Revenue & Production Targets
    monthlyRevenueTarget: { type: Number, default: 0 },
    monthlyProductionTarget: { type: Number, default: 0 },

    // 7. FinOps Guardrails & MCA Statutory Compliance
    defaultCreditDays: { type: Number, default: 30 },
    poApprovalLimit: { type: Number, default: 25000 },
    maxDiscountPercent: { type: Number, default: 10 },
    minCashReserveAlert: { type: Number, default: 100000 },
    lowStockThresholdPercent: { type: Number, default: 15 },
    inventoryValuationMethod: {
      type: String,
      enum: ["lot_wise", "fifo", "weighted_average"],
      default: "lot_wise",
    },
    mcaAuditLog: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Organization ||
  mongoose.model("Organization", OrganizationSchema);
