import mongoose from "mongoose";

const SuperAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "Shyam Sangani",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      default: "shyamsangani23@gmail.com",
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: "9723386344",
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "SUPERADMIN",
      immutable: true,
    },
    isSuperAdmin: {
      type: Boolean,
      default: true,
      immutable: true,
    },
    permissions: {
      type: [String],
      default: [
        "ALL",
        "UNIVERSAL_USER_MANAGEMENT",
        "ORGANIZATION_MANAGEMENT",
        "DATABASE_INSPECTION",
        "SYSTEM_CONTROLS",
      ],
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SuperAdmin ||
  mongoose.model("SuperAdmin", SuperAdminSchema);
