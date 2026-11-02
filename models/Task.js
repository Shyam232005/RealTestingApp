import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    assignedByName: {
      type: String,
      default: "Tier 2 Sales Coordinator",
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    assignedToName: {
      type: String,
      default: "Tier 1 Sales Assistant",
      trim: true,
    },
    customerId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      default: "",
      trim: true,
    },
    taskType: {
      type: String,
      enum: ["PAYMENT_FOLLOWUP", "DISPATCH"],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["HIGH", "NORMAL"],
      default: "NORMAL",
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: "",
      trim: true,
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

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
