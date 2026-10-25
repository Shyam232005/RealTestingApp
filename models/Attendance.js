import mongoose from "mongoose";

const ShiftSessionSchema = new mongoose.Schema(
  {
    sessionIndex: {
      type: Number,
      default: 1,
    },
    punchIn: {
      type: Date,
      required: true,
    },
    punchOut: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    shiftType: {
      type: String,
      default: "GENERAL",
    },
    punchInNotes: {
      type: String,
      default: "",
    },
    punchOutNotes: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const AttendanceSchema = new mongoose.Schema(
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
    postLevel: {
      type: String,
      trim: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    punchIn: {
      type: Date,
      required: true,
    },
    punchOut: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["PRESENT", "HALF_DAY", "COMPLETED"],
      default: "PRESENT",
      index: true,
    },
    shiftType: {
      type: String,
      enum: ["GENERAL", "MORNING", "EVENING", "NIGHT", "FIELD"],
      default: "GENERAL",
    },
    punchInNotes: {
      type: String,
      trim: true,
      default: "",
    },
    punchOutNotes: {
      type: String,
      trim: true,
      default: "",
    },
    sessions: {
      type: [ShiftSessionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ ownerId: 1, date: 1 });
AttendanceSchema.index({ branchId: 1, date: 1 });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
