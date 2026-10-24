import mongoose from "mongoose";
import crypto from "crypto";

const CASchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },

  icaiNumber: { type: String, required: true, unique: true, uppercase: true },
  
  // CA platform onboarding & invite codes
  joinedViaCode: { type: String, default: "" },
  caInviteCode: { type: String, unique: true, index: true }, // Format: CA-XXXXXX
  staffInviteCode: { type: String, unique: true, index: true }, // Format: STF-XXXXXX
  inviteCode: { type: String, unique: true, index: true }, // legacy alias to staffInviteCode / caInviteCode

  isVerifiedICAI: { type: Boolean, default: false },
  clients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Owner" }],
  clientCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Owner" }],
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: "CAStaff" }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

CASchema.pre("validate", function () {
  if (!this.caInviteCode) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    this.caInviteCode = `CA-${code}`;
  }
  if (!this.staffInviteCode) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    this.staffInviteCode = `STF-${code}`;
  }
  if (!this.inviteCode) {
    this.inviteCode = this.staffInviteCode || this.caInviteCode;
  }
  if (this.clientCompanies && (!this.clients || !this.clients.length)) {
    this.clients = this.clientCompanies;
  } else if (this.clients && (!this.clientCompanies || !this.clientCompanies.length)) {
    this.clientCompanies = this.clients;
  }
});

CASchema.pre("save", function () {
  if (!this.caInviteCode) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    this.caInviteCode = `CA-${code}`;
  }
  if (!this.staffInviteCode) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    this.staffInviteCode = `STF-${code}`;
  }
  if (!this.inviteCode) {
    this.inviteCode = this.staffInviteCode || this.caInviteCode;
  }
  if (this.clientCompanies && (!this.clients || !this.clients.length)) {
    this.clients = this.clientCompanies;
  } else if (this.clients && (!this.clientCompanies || !this.clientCompanies.length)) {
    this.clientCompanies = this.clients;
  }
});

export default mongoose.models.CA || mongoose.model("CA", CASchema);