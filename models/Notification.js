import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    // Recipient Targeting (Owner vs Employee Hierarchy)
    recipientType: {
      type: String,
      enum: ["OWNER", "EMPLOYEE"],
      default: "OWNER",
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },
    employeeName: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "ATTENDANCE_PUNCH_IN",
        "ATTENDANCE_PUNCH_OUT",
        "LEAVE_REQUEST",
        "LEAVE_REVIEW",
        "LEAVE_DECIDED",
        "DAILY_SUBMISSION",
        "WORK_FEEDBACK",
        "STAFF_REGISTRATION",
        "TASK_ASSIGNED",
        "TASK_SUBMITTED",
        "TASK_APPROVED",
        "TASK_REVISION",
        "PO_REQUEST",
        "SYSTEM",
        "DEPARTMENT_TRANSFER",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    linkTab: {
      type: String,
      default: "team", // "team", "approval", "dashboard", etc.
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ ownerId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
