import mongoose from "mongoose";

const LogisticsCapexProjectSchema = new mongoose.Schema(
  {
    projectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "GREENFIELD_MEGA_HUB",
        "AMR_WAREHOUSE_AUTOMATION",
        "COLD_CHAIN_EXPANSION",
        "FLEET_ELECTRIFICATION",
        "CROSS_DOCK_FACILITY",
        "MULTI_MODAL_PORT_GATEWAY",
      ],
      default: "GREENFIELD_MEGA_HUB",
      index: true,
    },
    region: {
      type: String,
      default: "West Zone (JNPT / Navi Mumbai)",
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    allocatedCapex: {
      type: Number,
      required: true,
      min: 0,
    },
    spentCapex: {
      type: Number,
      default: 0,
      min: 0,
    },
    tenureYears: {
      type: Number,
      default: 3,
      min: 1,
    },
    projectedIrrPct: {
      type: Number,
      default: 18.5,
    },
    paybackYears: {
      type: Number,
      default: 4.2,
    },
    esgRating: {
      type: String,
      default: "A+",
      trim: true,
    },
    scope3ReductionPct: {
      type: Number,
      default: 24.0,
    },
    engineeringPartner: {
      type: String,
      default: "L&T Industrial Infrastructure",
      trim: true,
    },
    boardResolutionRef: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "PROPOSED",
        "UNDER_BOARD_REVIEW",
        "APPROVED_BY_CLO",
        "EXECUTION_PHASE",
        "COMMISSIONED",
        "DEFERRED",
      ],
      default: "APPROVED_BY_CLO",
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedByName: {
      type: String,
      trim: true,
      default: "",
    },
    approvedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    branchId: {
      type: String,
      default: "branch-1",
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

LogisticsCapexProjectSchema.index({ companyId: 1, status: 1 });
LogisticsCapexProjectSchema.index({ companyId: 1, category: 1 });

export default mongoose.models.LogisticsCapexProject ||
  mongoose.model("LogisticsCapexProject", LogisticsCapexProjectSchema);
