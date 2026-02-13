import { z } from 'zod';

const positiveNumber = z.coerce.number().min(0, 'Amount must be 0 or greater');

export const rrspContributionSchema = z.object({
  id: z.string(),
  institutionName: z.string().min(1, 'Institution name is required'),
  contributionAmount: positiveNumber.refine((val) => val > 0, 'Contribution amount must be greater than 0'),
  contributorType: z.enum(['self', 'spousal']),
});

export const charitableDonationSchema = z.object({
  id: z.string(),
  charityName: z.string().min(1, 'Charity name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  donationAmount: positiveNumber.refine((val) => val > 0, 'Donation amount must be greater than 0'),
  donationType: z.enum(['cash', 'property', 'ecogift']),
});

export const medicalExpenseSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
  amount: positiveNumber.refine((val) => val > 0, 'Amount must be greater than 0'),
  forWhom: z.enum(['self', 'spouse', 'dependent']),
});

export const deductionsSchema = z.object({
  rrspContributions: z.array(rrspContributionSchema),
  charitableDonations: z.array(charitableDonationSchema),
  medicalExpenses: z.array(medicalExpenseSchema),
  childcareExpenses: positiveNumber,
  homeOfficeDays: z.coerce.number().min(0).max(365),
  homeOfficeMethod: z.enum(['flat-rate', 'detailed', '']),
  movingExpenses: positiveNumber,
  studentLoanInterest: positiveNumber,
  professionalDues: positiveNumber,
});

export type RRSPContributionFormData = z.infer<typeof rrspContributionSchema>;
export type CharitableDonationFormData = z.infer<typeof charitableDonationSchema>;
export type MedicalExpenseFormData = z.infer<typeof medicalExpenseSchema>;
export type DeductionsFormData = z.infer<typeof deductionsSchema>;
