import mongoose from "mongoose";

const DispatchLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesOrder",
      required: true,
      index: true,
    },
    orderReference: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    coordinatorName: {
      type: String,
      default: "Sales Coordinator",
      trim: true,
    },
    dispatchStatus: {
      type: String,
      enum: ["PENDING_PICKUP", "DISPATCHED"],
      default: "PENDING_PICKUP",
      index: true,
    },
    shippingProvider: {
      type: String,
      required: true,
      trim: true,
    },
    trackingNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      default: "",
      trim: true,
    },
    driverContact: {
      type: String,
      default: "",
      trim: true,
    },
    dispatchNotes: {
      type: String,
      default: "",
      trim: true,
    },
    scheduledDispatchDate: {
      type: Date,
      required: true,
      index: true,
    },
    actualDispatchDate: {
      type: Date,
      default: null,
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

export default mongoose.models.DispatchLog ||
  mongoose.model("DispatchLog", DispatchLogSchema);
