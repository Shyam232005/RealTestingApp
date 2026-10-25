import mongoose from "mongoose";

const LeaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      index: true,
    },
    branchId: {
      type: String,
      trim: true,
      default: "branch-1",
      index: true,
    },
    branchName: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    employeeName: {
      type: String,
      trim: true,
    },
    leaveType: {
      type: String,
      enum: ["CASUAL", "SICK", "EMERGENCY", "PLANNED", "UNPAID"],
      default: "CASUAL",
      index: true,
    },
    startDate: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    endDate: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    handoverNote: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

LeaveSchema.index({ employeeId: 1, status: 1 });
LeaveSchema.index({ ownerId: 1, status: 1 });

export default mongoose.models.Leave || mongoose.model("Leave", LeaveSchema);
