import mongoose from "mongoose";
import crypto from "crypto";

const OwnerSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },

  // Business Details
  inviteCode: { type: String, unique: true, index: true },

  // PRODUCTION-LEVEL: Subscription & Validation Tracking
  subscriptionExpiry: { type: Date },
  subscription: {
    planName: { 
      type: String, 
      enum: ["Free Trial", "MSME Starter", "Manufacturing & Growth", "Enterprise Multi-Unit"], 
      default: "Free Trial" 
    },
    cycle: { 
      type: String, 
      enum: ["monthly", "annual", "trial"], 
      default: "trial" 
    },
    status: { 
      type: String, 
      enum: ["active", "trialing", "past_due", "expired", "canceled"], 
      default: "trialing" 
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }, 
    paymentCustomerId: { type: String, default: null }, 
    paymentSubscriptionId: { type: String, default: null },
    hasUsedTrial: { type: Boolean, default: false } 
  },

  // Account State
  isActive: { type: Boolean, default: true },
  isSetupComplete: { type: Boolean, default: false, index: true },
  organizationId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null }],

  // Relationships & Vault State (Updated for Vercel Serverless & 1-to-1 Mapping)
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  linkedCA: { type: mongoose.Schema.Types.ObjectId, ref: "CA", default: null, index: true },
  dataSharingStatus: { 
    type: String, 
    enum: ["NONE", "PENDING", "CONNECTED", "REVOKED"], 
    default: "NONE",
    index: true 
  },
  lastDataSyncAt: { type: Date },
  linkedCaFirm: [{ type: mongoose.Schema.Types.ObjectId, ref: "CA" }],
  linkedCAs: [{ type: mongoose.Schema.Types.ObjectId, ref: "CA" }],
  vaultStatus: { 
    type: String, 
    enum: ["Locked", "Requested", "Unlocked"], 
    default: "Locked" 
  }
}, { timestamps: true });

OwnerSchema.pre("validate", function () {
  if (!this.inviteCode) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.inviteCode = `BIZ-${randomHex}`;
  }
  if (this.linkedCA) {
    if (!this.linkedCaFirm) this.linkedCaFirm = [];
    if (!this.linkedCaFirm.some(id => id.toString() === this.linkedCA.toString())) {
      this.linkedCaFirm.push(this.linkedCA);
    }
    if (!this.linkedCAs) this.linkedCAs = [];
    if (!this.linkedCAs.some(id => id.toString() === this.linkedCA.toString())) {
      this.linkedCAs.push(this.linkedCA);
    }
    if (this.dataSharingStatus === "NONE") {
      this.dataSharingStatus = "CONNECTED";
    }
  } else if (this.linkedCaFirm && this.linkedCaFirm.length > 0 && !this.linkedCA) {
    this.linkedCA = this.linkedCaFirm[0];
    if (this.dataSharingStatus === "NONE") {
      this.dataSharingStatus = "CONNECTED";
    }
  }
});

OwnerSchema.pre("save", function () {
  if (!this.inviteCode) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.inviteCode = `BIZ-${randomHex}`;
  }

  if (this.linkedCA) {
    if (!this.linkedCaFirm) this.linkedCaFirm = [];
    if (!this.linkedCaFirm.some(id => id.toString() === this.linkedCA.toString())) {
      this.linkedCaFirm.push(this.linkedCA);
    }
    if (!this.linkedCAs) this.linkedCAs = [];
    if (!this.linkedCAs.some(id => id.toString() === this.linkedCA.toString())) {
      this.linkedCAs.push(this.linkedCA);
    }
    if (this.dataSharingStatus === "NONE") {
      this.dataSharingStatus = "CONNECTED";
    }
  }

  if (this.isModified('subscription.status') && this.subscription?.status === 'trialing') {
    this.subscription.hasUsedTrial = true;
  }
});

export default mongoose.models.Owner || mongoose.model("Owner", OwnerSchema);