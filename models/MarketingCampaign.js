import mongoose from "mongoose";

const MarketingCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    channel: {
      type: String,
      required: true,
      default: "Google Ads",
      trim: true,
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    spend: {
      type: Number,
      default: 0,
      min: 0,
    },
    leadsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dealsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenueGenerated: {
      type: Number,
      default: 0,
      min: 0,
    },
    roi: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "COMPLETED"],
      default: "ACTIVE",
      index: true,
    },
    startDate: {
      type: String,
      default: "",
    },
    endDate: {
      type: String,
      default: "",
    },
    branchId: {
      type: String,
      default: "all",
      index: true,
    },
    branchName: {
      type: String,
      default: "Main HQ",
    },
    createdBy: {
      type: String,
      default: "Sales Ops Analyst",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.MarketingCampaign ||
  mongoose.model("MarketingCampaign", MarketingCampaignSchema);
