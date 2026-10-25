import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      trim: true,
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
    postLevel: {
      type: String,
      trim: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    tasksCompleted: {
      type: [String],
      default: [],
    },
    blockers: {
      type: String,
      trim: true,
      default: "",
    },
    summary: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "ACKNOWLEDGED"],
      default: "SUBMITTED",
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    ownerFeedback: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

SubmissionSchema.index({ employeeId: 1, date: -1 });
SubmissionSchema.index({ ownerId: 1, date: -1 });

export default mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema);
