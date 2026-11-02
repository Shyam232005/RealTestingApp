import mongoose from "mongoose";

const DealSchema = new mongoose.Schema(
  {
    dealCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    dealValue: {
      type: Number,
      required: true,
      min: 0,
    },
    stage: {
      type: String,
      enum: ["requirement_gathering", "negotiation", "won", "lost"],
      default: "requirement_gathering",
      index: true,
    },
    expectedCloseDate: {
      type: String,
      default: "",
    },
    assignedAE: {
      type: String,
      default: "Sales Representative",
    },
    marginPercent: {
      type: Number,
      default: 22,
      min: 18, // Owner mandated 18% floor
    },
    sourceLeadId: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
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

export default mongoose.models.Deal || mongoose.model("Deal", DealSchema);
