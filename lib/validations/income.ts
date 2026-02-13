import { z } from 'zod';

const positiveNumber = z.coerce.number().min(0, 'Amount must be 0 or greater');

export const t4Schema = z.object({
  id: z.string(),
  employerName: z.string().min(1, 'Employer name is required'),
  employerAddress: z.string().optional().default(''),
  employmentIncome: positiveNumber,
  incomeTaxDeducted: positiveNumber,
  cppContributions: positiveNumber,
  eiPremiums: positiveNumber,
  rppContributions: positiveNumber.optional().default(0),
  unionDues: positiveNumber.optional().default(0),
  charitableDonations: positiveNumber.optional().default(0),
});

export const t4aSchema = z.object({
  id: z.string(),
  payerName: z.string().min(1, 'Payer name is required'),
  pensionIncome: positiveNumber.optional().default(0),
  lumpSumPayments: positiveNumber.optional().default(0),
  selfEmployedCommissions: positiveNumber.optional().default(0),
  incomeTaxDeducted: positiveNumber.optional().default(0),
  otherIncome: positiveNumber.optional().default(0),
});

export const t4eSchema = z.object({
  id: z.string(),
  eiBenefits: positiveNumber,
  incomeTaxDeducted: positiveNumber.optional().default(0),
  amountRepaid: positiveNumber.optional().default(0),
});

export const t5Schema = z.object({
  id: z.string(),
  payerName: z.string().min(1, 'Payer name is required'),
  actualDividends: positiveNumber.optional().default(0),
  interestFromCanadianSources: positiveNumber.optional().default(0),
  capitalGainsDividends: positiveNumber.optional().default(0),
  foreignIncome: positiveNumber.optional().default(0),
  foreignTaxPaid: positiveNumber.optional().default(0),
});

export const t3Schema = z.object({
  id: z.string(),
  trustName: z.string().min(1, 'Trust name is required'),
  capitalGains: positiveNumber.optional().default(0),
  eligibleDividends: positiveNumber.optional().default(0),
  otherDividends: positiveNumber.optional().default(0),
  foreignBusinessIncome: positiveNumber.optional().default(0),
  foreignNonBusinessIncome: positiveNumber.optional().default(0),
  otherIncome: positiveNumber.optional().default(0),
});

export const t2202Schema = z.object({
  id: z.string(),
  institutionName: z.string().min(1, 'Institution name is required'),
  eligibleTuitionFees: positiveNumber,
  monthsPartTime: z.coerce.number().min(0).max(12).optional().default(0),
  monthsFullTime: z.coerce.number().min(0).max(12).optional().default(0),
});

export const t4rspSchema = z.object({
  id: z.string(),
  payerName: z.string().min(1, 'Payer name is required'),
  rrspIncome: positiveNumber,
  incomeTaxDeducted: positiveNumber.optional().default(0),
});

export const t5008Schema = z.object({
  id: z.string(),
  securityDescription: z.string().min(1, 'Security description is required'),
  proceeds: positiveNumber,
  costBase: positiveNumber,
  gain: positiveNumber.optional().default(0),
});

export type T4FormData = z.infer<typeof t4Schema>;
export type T4AFormData = z.infer<typeof t4aSchema>;
export type T4EFormData = z.infer<typeof t4eSchema>;
export type T5FormData = z.infer<typeof t5Schema>;
export type T3FormData = z.infer<typeof t3Schema>;
export type T2202FormData = z.infer<typeof t2202Schema>;
export type T4RSPFormData = z.infer<typeof t4rspSchema>;
export type T5008FormData = z.infer<typeof t5008Schema>;
