import mongoose from "mongoose";

const ApprovalRequestSchema = new mongoose.Schema(
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
    // Type of approval: CA data access, Employee PO exceeding limit, or general expense
    type: {
      type: String,
      enum: ["CA_DATA_ACCESS", "EMPLOYEE_PO", "EXPENSE_APPROVAL"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "REVOKED"],
      default: "PENDING",
      index: true,
    },

    // 1. CA Data Access Details
    caId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CA",
    },
    caName: { type: String, trim: true },
    caFirm: { type: String, trim: true },
    icaiNumber: { type: String, trim: true },
    caEmail: { type: String, trim: true },
    requestedAccounts: {
      type: [String],
      default: ["General Ledger & Bank Statements", "GST Invoices & ITC"],
    },
    requestReason: { type: String, trim: true },

    // 2. Employee Purchase Order Details
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    employeeName: { type: String, trim: true },
    employeeRole: { type: String, trim: true },
    employeeDepartment: { type: String, trim: true },
    poNumber: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    vendorName: { type: String, trim: true },
    poDescription: { type: String, trim: true },

    // 3. Approval Timeline & Decision Metadata
    requestedAt: { type: Date, default: Date.now, index: true },
    decidedAt: { type: Date },
    decidedBy: { type: String, default: "Founder / Owner" },
    decisionNotes: { type: String, trim: true },

    // 4. Report Delivery (Maintained when CA gives audit report)
    hasReport: { type: Boolean, default: false },
    reportTitle: { type: String, trim: true },
    reportSubmittedAt: { type: Date },
    reportStatus: {
      type: String,
      enum: ["NOT_SUBMITTED", "IN_PROGRESS", "SUBMITTED", "VERIFIED"],
      default: "NOT_SUBMITTED",
    },
    reportSummary: { type: String, trim: true },
    reportFindings: { type: [String], default: [] },
  },
  { timestamps: true }
);

ApprovalRequestSchema.index({ organizationId: 1, type: 1, status: 1 });
ApprovalRequestSchema.index({ organizationId: 1, requestedAt: -1 });

export default mongoose.models.ApprovalRequest ||
  mongoose.model("ApprovalRequest", ApprovalRequestSchema);
