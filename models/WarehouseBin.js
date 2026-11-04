import mongoose from "mongoose";

const WarehouseBinSchema = new mongoose.Schema(
  {
    bin: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    item: {
      type: String,
      trim: true,
      default: "",
    },
    skuCode: {
      type: String,
      trim: true,
      default: "",
    },
    qty: {
      type: String,
      trim: true,
      default: "0",
    },
    uom: {
      type: String,
      trim: true,
      default: "Units",
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "HOLD"],
      default: "AVAILABLE",
      index: true,
    },
    zone: {
      type: String,
      trim: true,
      default: "Zone 1",
    },
    aisle: {
      type: String,
      trim: true,
      default: "Aisle A",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      index: true,
    },
    branchId: {
      type: String,
      default: "branch-1",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

WarehouseBinSchema.index({ companyId: 1, bin: 1 });

export default mongoose.models.WarehouseBin ||
  mongoose.model("WarehouseBin", WarehouseBinSchema);
