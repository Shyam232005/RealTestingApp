import mongoose from "mongoose";

const CAStaffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },

  // Link to the parent CA Firm
  caFirmId: { type: mongoose.Schema.Types.ObjectId, ref: "CA", required: true, index: true },
  caId: { type: mongoose.Schema.Types.ObjectId, ref: "CA", index: true },

  // Production Link: Client Isolation (Staff can only access assigned owners)
  assignedCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Owner" }],
  assignedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Owner" }],

  role: { type: String, default: "CA_STAFF" },

  // Production Link: Access Level within CA Firm
  roleInFirm: {
    type: String,
    enum: ["Senior Auditor", "Junior Auditor", "Article Assistant"],
    default: "Article Assistant"
  },

  // Production Link: Security
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

CAStaffSchema.pre("validate", function () {
  if (this.caFirmId && !this.caId) {
    this.caId = this.caFirmId;
  } else if (this.caId && !this.caFirmId) {
    this.caFirmId = this.caId;
  }
  if (this.assignedCompanies && (!this.assignedClients || !this.assignedClients.length)) {
    this.assignedClients = this.assignedCompanies;
  } else if (this.assignedClients && (!this.assignedCompanies || !this.assignedCompanies.length)) {
    this.assignedCompanies = this.assignedClients;
  }
});

export default mongoose.models.CAStaff || mongoose.model("CAStaff", CAStaffSchema);