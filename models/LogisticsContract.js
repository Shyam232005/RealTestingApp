import mongoose from "mongoose";

const LogisticsContractSchema = new mongoose.Schema(
  {
    contractCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    partnerName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    partnerType: {
      type: String,
      enum: ["3PL_CARRIER", "4PL_LEAD_LOGISTICS", "WAREHOUSE_LANDLORD", "MATERIAL_SUPPLIER"],
      default: "3PL_CARRIER",
    },
    contractType: {
      type: String,
      enum: [
        "3PL_MASTER_SERVICE_AGREEMENT",
        "4PL_MANAGED_LOGISTICS",
        "FACILITY_LEASE_ACQUISITION",
        "MULTI_YEAR_VENDOR_PO",
      ],
      default: "3PL_MASTER_SERVICE_AGREEMENT",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    annualValue: {
      type: Number,
      required: true,
      min: 0,
    },
    tenureYears: {
      type: Number,
      required: true,
      default: 3,
      min: 1,
    },
    totalContractValue: {
      type: Number,
      default: 0,
    },
    serviceRegions: {
      type: [String],
      default: ["Pan-India"],
    },
    committedThroughputTons: {
      type: Number,
      default: 1000,
    },
    slaCommitmentOtif: {
      type: Number,
      default: 98.0,
      min: 0,
      max: 100,
    },
    penaltyClause: {
      type: String,
      default: "Standard 2.5% billing penalty on OTIF breach below 95%.",
      trim: true,
    },
    governingLaw: {
      type: String,
      default: "Arbitration & Conciliation Act (Mumbai Commercial Jurisdiction)",
      trim: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_DIRECTOR_SIGN_OFF", "ACTIVE_APPROVED", "REJECTED", "TERMINATED"],
      default: "PENDING_DIRECTOR_SIGN_OFF",
      index: true,
    },
    authorizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    authorizedByName: {
      type: String,
      trim: true,
      default: "",
    },
    authorizedAt: {
      type: Date,
    },
    directorNotes: {
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

LogisticsContractSchema.index({ companyId: 1, status: 1 });
LogisticsContractSchema.index({ companyId: 1, contractType: 1 });

export default mongoose.models.LogisticsContract ||
  mongoose.model("LogisticsContract", LogisticsContractSchema);
