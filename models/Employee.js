import mongoose from "mongoose";

export const UserRole = {
  OWNER: "OWNER",
  CA: "CA",
  BILLING_COUNTER: "BILLING_COUNTER",
  GODOWN_STOCKS: "GODOWN_STOCKS",
  FIELD_SALES: "FIELD_SALES",
  ACCOUNTS: "ACCOUNTS"
};

export const USER_ROLES_LIST = [
  "OWNER",
  "CA",
  "BILLING_COUNTER",
  "GODOWN_STOCKS",
  "FIELD_SALES",
  "ACCOUNTS"
];

export const DEPARTMENT_LIST = [
  "OPERATIONS",
  "SALES",
  "LOGISTICS",
  "FINANCIAL"
];

export const POST_HIERARCHY_LEVELS = [
  "CHIEF_OFFICER",
  "DIRECTOR",
  "MANAGER",
  "SUPERVISOR",
  "ANALYST",
  "COORDINATOR",
  "ASSISTANT",
  "OTHER"
];

export const HIERARCHY_RANK_MAP = {
  CHIEF_OFFICER: 7,
  DIRECTOR: 6,
  MANAGER: 5,
  SUPERVISOR: 4,
  ANALYST: 3,
  COORDINATOR: 2,
  ASSISTANT: 1,
  OTHER: 0,
};

export const APPROVAL_STATUS_LIST = [
  "PENDING_PROFILE",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED"
];

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },

  // Strict reference to the Owner (Company) and Branch
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
  branchId: { type: String, trim: true, default: "branch-1", index: true }, // e.g. "branch-1", "branch-2"
  branchName: { type: String, trim: true },

  // 4 Business Departments: Operations, Sales, Logistics, Financial
  department: { 
    type: String, 
    trim: true, 
    uppercase: true,
    enum: DEPARTMENT_LIST,
    default: "OPERATIONS",
    index: true
  },

  // 8-Level Post Hierarchy
  postLevel: {
    type: String,
    trim: true,
    uppercase: true,
    enum: POST_HIERARCHY_LEVELS,
    default: "ASSISTANT",
    index: true
  },
  postTitle: { type: String, trim: true },
  workDescription: { type: String, trim: true },

  // Corporate Hierarchy Reporting Relationship
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    default: null,
    index: true,
  },
  reportsToName: { type: String, trim: true, default: "" },
  reportsToRole: { type: String, trim: true, default: "" },

  // Onboarding & Approval Lifecycle
  approvalStatus: {
    type: String,
    trim: true,
    uppercase: true,
    enum: APPROVAL_STATUS_LIST,
    default: "PENDING_PROFILE",
    index: true
  },
  isApproved: { type: Boolean, default: false },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Owner" },
  rejectionReason: { type: String, trim: true },

  // Role Compatibility
  role: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true,
    enum: USER_ROLES_LIST, 
    default: "BILLING_COUNTER",
    index: true
  },

  roleInCompany: { 
    type: String, 
    enum: ["Admin", "Manager", "Data Entry", "Viewer"], 
    default: "Viewer" 
  },
  departmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Department"
  },

  // Security & Termination
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Compound indexes
EmployeeSchema.index({ companyId: 1, role: 1 });
EmployeeSchema.index({ email: 1, role: 1 });
EmployeeSchema.index({ companyId: 1, approvalStatus: 1 });
EmployeeSchema.index({ companyId: 1, branchId: 1 });

EmployeeSchema.pre("validate", function () {
  if (this.companyId && !this.ownerId) {
    this.ownerId = this.companyId;
  } else if (this.ownerId && !this.companyId) {
    this.companyId = this.ownerId;
  }

  // Normalize role
  if (this.role) {
    const rawRole = this.role.toString().trim().toUpperCase();
    const roleMapping = {
      "BILLING": "BILLING_COUNTER",
      "POS": "BILLING_COUNTER",
      "INVOICE": "BILLING_COUNTER",
      "BILLING_COUNTER": "BILLING_COUNTER",
      "GODOWN": "GODOWN_STOCKS",
      "STOCKS": "GODOWN_STOCKS",
      "OPERATIONS": "GODOWN_STOCKS",
      "INVENTORY": "GODOWN_STOCKS",
      "GODOWN_STOCKS": "GODOWN_STOCKS",
      "SALES": "FIELD_SALES",
      "CRM": "FIELD_SALES",
      "FIELD_SALES": "FIELD_SALES",
      "FINANCE": "ACCOUNTS",
      "ACCOUNTANT": "ACCOUNTS",
      "ACCOUNTS": "ACCOUNTS",
      "CA": "CA",
      "CHARTERED_ACCOUNTANT": "CA",
      "OWNER": "OWNER",
      "ADMIN": "OWNER"
    };

    if (USER_ROLES_LIST.includes(rawRole)) {
      this.role = rawRole;
    } else if (roleMapping[rawRole]) {
      this.role = roleMapping[rawRole];
    } else {
      this.role = "BILLING_COUNTER";
    }
  } else {
    this.role = "BILLING_COUNTER";
  }
});

export default mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);
