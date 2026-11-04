import mongoose from "mongoose";

const LogisticsExceptionSchema = new mongoose.Schema(
  {
    exceptionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    awbNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    orderReference: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryPinCode: {
      type: String,
      required: true,
      trim: true,
    },
    destinationCity: {
      type: String,
      trim: true,
      default: "",
    },
    carrier: {
      type: String,
      required: true,
      trim: true,
    },
    exceptionType: {
      type: String,
      enum: [
        "NDR_CUSTOMER_UNAVAILABLE",
        "NDR_INCORRECT_ADDRESS",
        "NDR_REFUSED_DELIVERY",
        "NDR_DOOR_LOCKED",
        "RTO_INITIATED",
        "RTO_IN_TRANSIT",
        "RTO_DELIVERED_TO_GODOWN",
      ],
      default: "NDR_CUSTOMER_UNAVAILABLE",
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    actionTaken: {
      type: String,
      enum: [
        "PENDING_COORDINATOR_ACTION",
        "REATTEMPT_SCHEDULED",
        "ADDRESS_UPDATED",
        "RTO_APPROVED_BY_COORDINATOR",
        "CLOSED",
      ],
      default: "PENDING_COORDINATOR_ACTION",
      index: true,
    },
    rtoApprovalDate: {
      type: Date,
      default: null,
    },
    coordinatorNotes: {
      type: String,
      default: "",
      trim: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    handledByName: {
      type: String,
      default: "Logistics Coordinator",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

LogisticsExceptionSchema.index({ companyId: 1, actionTaken: 1 });
LogisticsExceptionSchema.index({ awbNumber: 1, companyId: 1 });

export default mongoose.models.LogisticsException ||
  mongoose.model("LogisticsException", LogisticsExceptionSchema);
