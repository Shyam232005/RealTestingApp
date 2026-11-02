import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    leadCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    inquiryType: {
      type: String,
      enum: [
        "WALK_IN_RETAIL",
        "WHOLESALE_BULK",
        "PRODUCT_CATALOGUE",
        "PRICE_ESTIMATE",
        "DEALERSHIP_INQUIRY",
        "OTHER",
      ],
      default: "WALK_IN_RETAIL",
    },
    interest: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      enum: ["MANUAL_WALKIN", "WEBSITE", "TRADE_EXPO", "REFERRAL", "COLD_CALL", "OTHER"],
      default: "MANUAL_WALKIN",
    },
    status: {
      type: String,
      enum: ["unassigned", "claimed", "qualified", "disqualified"],
      default: "unassigned",
      index: true,
    },
    claimedBy: {
      type: String,
      default: "",
    },
    callAttempts: {
      type: Number,
      default: 0,
    },
    disposition: {
      type: String,
      default: "PENDING",
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

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
