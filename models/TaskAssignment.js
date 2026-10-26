import mongoose from "mongoose";

const TaskAssignmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
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
      default: "Main HQ",
    },
    department: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
      index: true,
    },

    // Upper employee or Owner who created & assigned the work
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    isAssignedByOwner: {
      type: Boolean,
      default: false,
      index: true,
    },
    assignedByName: {
      type: String,
      required: true,
      trim: true,
    },
    assignedByPost: {
      type: String,
      trim: true,
      default: "",
    },

    // Lower employee who must perform the work
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    assignedToName: {
      type: String,
      required: true,
      trim: true,
    },
    assignedToPost: {
      type: String,
      trim: true,
      default: "",
    },

    // Task details
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },
    dueDate: {
      type: String, // Format: YYYY-MM-DD
      default: "",
    },

    // Progress and review lifecycle
    status: {
      type: String,
      enum: [
        "ASSIGNED",
        "IN_PROGRESS",
        "SUBMITTED",
        "APPROVED",
        "REVISION_REQUESTED",
      ],
      default: "ASSIGNED",
      index: true,
    },

    // Lower employee submission notes
    submissionNotes: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
    },

    // Upper employee review feedback
    reviewFeedback: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

TaskAssignmentSchema.index({ assignedTo: 1, status: 1 });
TaskAssignmentSchema.index({ assignedBy: 1, status: 1 });
TaskAssignmentSchema.index({ department: 1, branchId: 1 });

export default mongoose.models.TaskAssignment ||
  mongoose.model("TaskAssignment", TaskAssignmentSchema);
