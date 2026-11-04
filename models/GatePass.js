import mongoose from "mongoose";

const GatePassSchema = new mongoose.Schema(
  {
    gatePassNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    orderReferences: [
      {
        type: String,
        trim: true,
      },
    ],
    carrier: {
      type: String,
      required: true,
      trim: true,
      default: "BlueDart Express",
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhone: {
      type: String,
      trim: true,
      default: "",
    },
    driverLicense: {
      type: String,
      trim: true,
      default: "",
    },
    destinationHub: {
      type: String,
      trim: true,
      default: "Central Distribution Hub",
    },
    totalQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    grossWeightKg: {
      type: Number,
      required: true,
      default: 100,
    },
    tareWeightKg: {
      type: Number,
      default: 15,
    },
    netWeightKg: {
      type: Number,
      default: 85,
    },
    sealNumber: {
      type: String,
      required: true,
      trim: true,
      default: "SEAL-CRW-001",
    },
    loadAuditChecklist: {
      strappingVerified: { type: Boolean, default: true },
      labelingVerified: { type: Boolean, default: true },
      weighbridgeMatches: { type: Boolean, default: true },
      tarpaulinSecured: { type: Boolean, default: true },
      sealIntact: { type: Boolean, default: true },
    },
    supervisorNotes: {
      type: String,
      trim: true,
      default: "",
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    issuedByName: {
      type: String,
      trim: true,
      default: "Logistics Supervisor",
    },
    status: {
      type: String,
      enum: ["ISSUED", "GATE_OUT", "COMPLETED", "REVOKED"],
      default: "ISSUED",
      index: true,
    },
    gateOutAt: {
      type: Date,
      default: null,
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

GatePassSchema.index({ companyId: 1, status: 1 });
GatePassSchema.index({ vehicleNumber: 1, createdAt: -1 });

export default mongoose.models.GatePass ||
  mongoose.model("GatePass", GatePassSchema);
