import { z } from 'zod';

export const contactSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
    role: z.string().min(1, 'Please select a role.'),
    workEmail: z.string().email('Please enter a valid email address.'),
    phone: z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits.'),

    companyName: z.string().min(2, 'Company name is required.'),
    cityState: z.string().min(2, 'City & State are required.'),
    gstin: z.string().optional(),
    industrySector: z.string().min(1, 'Please select an industry.'),

    currentAccountingSoftware: z.string().min(1, 'Please select your current software.'),
    invoiceIntakeMethod: z.string().min(1, 'Please select an intake method.'),
    monthlyInvoiceVolume: z.string().min(1, 'Please select your invoice volume.'),
    annualTurnover: z.string().min(1, 'Please select your annual turnover.'),

    primaryGoal: z.string().min(1, 'Please select your primary goal.'),
    detailedMessage: z.string().optional(),
});