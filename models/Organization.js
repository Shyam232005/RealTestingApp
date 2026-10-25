import mongoose from "mongoose";

// Sub-schema: Stock Item (manufactured or traded products)
const StockItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "Finished Goods", trim: true },
    sku: { type: String, trim: true, default: "" },
    quantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "Pcs", trim: true },
    unitPrice: { type: Number, default: 0, min: 0 },
    stockStatus: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Sub-schema: CRM Regular Customer for Branch
const CrmCustomerSchema = new mongoose.Schema(
  {
    customerId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    tier: {
      type: String,
      enum: ["Regular", "VIP", "Occasional"],
      default: "Regular",
    },
    totalPurchases: { type: Number, default: 0, min: 0 },
    lastVisit: { type: Date, default: Date.now },
    notes: { type: String, default: "", trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Sub-schema: Promotional Offer / Urgent Alert for Branch Customers
const BranchOfferSchema = new mongoose.Schema(
  {
    offerId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    offerType: {
      type: String,
      enum: ["regular_update", "limited_time_special"],
      default: "regular_update",
    },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true },
    broadcastChannel: { type: String, default: "WhatsApp / SMS", trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Sub-schema: Branch (Embedded under Organization)
const BranchSchema = new mongoose.Schema(
  {
    branchId: { type: String, required: true, trim: true }, // e.g. "branch-1", "branch-2"
    branchNumber: { type: Number, required: true }, // 1, 2, 3...
    name: { type: String, required: true, trim: true },
    location: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    staffCount: { type: Number, default: 0, min: 0 },
    lastMonthSales: { type: Number, default: 0, min: 0 },
    monthlySalesTarget: { type: Number, default: 0, min: 0 },
    currentMonthSales: { type: Number, default: 0, min: 0 },
    allocatedFunds: { type: Number, default: 0, min: 0 }, // Operational funds allotted by Owner
    stockItems: { type: [StockItemSchema], default: [] },
    customers: { type: [CrmCustomerSchema], default: [] },
    offers: { type: [BranchOfferSchema], default: [] },
    activatedAt: { type: Date, default: null },
  },
  { _id: false }
);

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
    branches: { type: Number, default: 1, min: 1 }, // Total branches count decided at setup
    
    // Embedded Branches Array (Dedicated records for Main HQ and Units)
    branchList: { type: [BranchSchema], default: [] },

    // Main Organization Stock Catalog
    stockCatalog: { type: [StockItemSchema], default: [] },

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
