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

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },

  // Strict reference to the Owner (Company)
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },

  // MANDATORY USER ROLE (Strict 6-Role SMB RBAC Taxonomy)
  role: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true,
    enum: USER_ROLES_LIST, 
    default: "BILLING_COUNTER",
    index: true
  },

  // Legacy compatibility fields
  roleInCompany: { 
    type: String, 
    enum: ["Admin", "Manager", "Data Entry", "Viewer"], 
    default: "Viewer" 
  },
  department: { 
    type: String, 
    trim: true, 
    uppercase: true,
    default: "GENERAL"
  },
  departmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Department"
  },

  // Security & Termination
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Compound indexes for rapid role and company lookups
EmployeeSchema.index({ companyId: 1, role: 1 });
EmployeeSchema.index({ email: 1, role: 1 });

EmployeeSchema.pre("validate", function () {
  if (this.companyId && !this.ownerId) {
    this.ownerId = this.companyId;
  } else if (this.ownerId && !this.companyId) {
    this.companyId = this.ownerId;
  }

  // Normalize role to strict 6-Role Taxonomy
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