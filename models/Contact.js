import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        workEmail: { type: String, required: true },
        phone: { type: String, required: true },
        role: { type: String, required: true },
        companyName: { type: String, required: true },
        gstin: { type: String, default: '' },
        cityState: { type: String, required: true },
        industrySector: { type: String, required: true },
        currentAccountingSoftware: { type: String, required: true },
        invoiceIntakeMethod: { type: String, required: true },
        monthlyInvoiceVolume: { type: String, required: true },
        annualTurnover: { type: String, required: true },
        primaryGoal: { type: String, required: true },
        detailedMessage: { type: String, default: '' },
    },
    { timestamps: true }
);

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);