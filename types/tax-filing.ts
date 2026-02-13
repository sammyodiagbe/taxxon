// Canadian Tax Filing Types

export type Province =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

export const PROVINCES: Record<Province, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
};

export type MaritalStatus =
  | 'single'
  | 'married'
  | 'common-law'
  | 'separated'
  | 'divorced'
  | 'widowed';

export const MARITAL_STATUSES: Record<MaritalStatus, string> = {
  single: 'Single',
  married: 'Married',
  'common-law': 'Common-law',
  separated: 'Separated',
  divorced: 'Divorced',
  widowed: 'Widowed',
};

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  sin: string; // Social Insurance Number (format: XXX-XXX-XXX)
  dateOfBirth: string; // YYYY-MM-DD
  email: string;
  phone: string;
  province: Province | '';
  maritalStatus: MaritalStatus | '';
  address: {
    street: string;
    city: string;
    province: Province | '';
    postalCode: string; // Canadian format: A1A 1A1
  };
}

// T4 - Statement of Remuneration Paid
export interface T4Slip {
  id: string;
  employerName: string;
  employerAddress: string;
  employmentIncome: number; // Box 14
  incomeTaxDeducted: number; // Box 22
  cppContributions: number; // Box 16
  eiPremiums: number; // Box 18
  rppContributions: number; // Box 20
  unionDues: number; // Box 44
  charitableDonations: number; // Box 46
}

// T4A - Statement of Pension, Retirement, Annuity, and Other Income
export interface T4ASlip {
  id: string;
  payerName: string;
  pensionIncome: number; // Box 016
  lumpSumPayments: number; // Box 018
  selfEmployedCommissions: number; // Box 020
  incomeTaxDeducted: number; // Box 022
  otherIncome: number; // Box 028
}

// T4E - Statement of Employment Insurance and Other Benefits
export interface T4ESlip {
  id: string;
  eiBenefits: number; // Box 14
  incomeTaxDeducted: number; // Box 22
  amountRepaid: number; // Box 30
}

// T5 - Statement of Investment Income
export interface T5Slip {
  id: string;
  payerName: string;
  actualDividends: number; // Box 10
  interestFromCanadianSources: number; // Box 13
  capitalGainsDividends: number; // Box 18
  foreignIncome: number; // Box 15
  foreignTaxPaid: number; // Box 16
}

// T3 - Statement of Trust Income Allocations and Designations
export interface T3Slip {
  id: string;
  trustName: string;
  capitalGains: number; // Box 21
  eligibleDividends: number; // Box 23
  otherDividends: number; // Box 32
  foreignBusinessIncome: number; // Box 24
  foreignNonBusinessIncome: number; // Box 25
  otherIncome: number; // Box 26
}

// T2202 - Tuition and Enrolment Certificate
export interface T2202Slip {
  id: string;
  institutionName: string;
  eligibleTuitionFees: number; // Box A
  monthsPartTime: number; // Box B
  monthsFullTime: number; // Box C
}

// T4RSP - Statement of RRSP Income
export interface T4RSPSlip {
  id: string;
  payerName: string;
  rrspIncome: number; // Box 16 or 22
  incomeTaxDeducted: number; // Box 30
}

// T5008 - Statement of Securities Transactions
export interface T5008Slip {
  id: string;
  securityDescription: string;
  proceeds: number; // Box 21
  costBase: number; // Box 20
  gain: number; // Calculated
}

export interface RRSPContribution {
  id: string;
  institutionName: string;
  contributionAmount: number;
  contributorType: 'self' | 'spousal';
}

export interface CharitableDonation {
  id: string;
  charityName: string;
  registrationNumber: string;
  donationAmount: number;
  donationType: 'cash' | 'property' | 'ecogift';
}

export interface MedicalExpense {
  id: string;
  description: string;
  amount: number;
  forWhom: 'self' | 'spouse' | 'dependent';
}

export interface Deductions {
  rrspContributions: RRSPContribution[];
  charitableDonations: CharitableDonation[];
  medicalExpenses: MedicalExpense[];
  childcareExpenses: number;
  homeOfficeDays: number;
  homeOfficeMethod: 'flat-rate' | 'detailed' | '';
  movingExpenses: number;
  studentLoanInterest: number;
  professionalDues: number;
}

export interface IncomeData {
  t4Slips: T4Slip[];
  t4aSlips: T4ASlip[];
  t4eSlips: T4ESlip[];
  t5Slips: T5Slip[];
  t3Slips: T3Slip[];
  t2202Slips: T2202Slip[];
  t4rspSlips: T4RSPSlip[];
  t5008Slips: T5008Slip[];
  selfEmploymentIncome: number;
  otherIncome: number;
}

export type DocumentType =
  | 't4'
  | 't4a'
  | 't4e'
  | 't5'
  | 't3'
  | 't2202'
  | 't4rsp'
  | 't5008'
  | 'rrsp-receipt'
  | 'donation-receipt'
  | 'medical-receipt'
  | 'other';

export const DOCUMENT_TYPES: Record<DocumentType, string> = {
  t4: 'T4 - Employment Income',
  t4a: 'T4A - Pension/Other Income',
  t4e: 'T4E - EI Benefits',
  t5: 'T5 - Investment Income',
  t3: 'T3 - Trust Income',
  t2202: 'T2202 - Tuition',
  t4rsp: 'T4RSP - RRSP Income',
  t5008: 'T5008 - Securities',
  'rrsp-receipt': 'RRSP Contribution Receipt',
  'donation-receipt': 'Charitable Donation Receipt',
  'medical-receipt': 'Medical Expense Receipt',
  other: 'Other Document',
};

export interface TaxDocument {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  mimeType: string;
  uploadedAt: string;
  blob?: Blob;
}

export interface TaxSummary {
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  totalCredits: number;
  totalPaid: number;
  refundOrOwing: number; // Positive = refund, negative = owing
}

export type FilingStatus = 'not-started' | 'in-progress' | 'submitted' | 'accepted';

export interface TaxFiling {
  id: string;
  year: number;
  status: FilingStatus;
  personalInfo: PersonalInfo;
  income: IncomeData;
  deductions: Deductions;
  documents: TaxDocument[];
  summary: TaxSummary | null;
  confirmationNumber: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WizardStep =
  | 'personal-info'
  | 'income'
  | 'deductions'
  | 'documents'
  | 'review'
  | 'submit';

export const WIZARD_STEPS: { id: WizardStep; label: string; description: string }[] = [
  { id: 'personal-info', label: 'Personal Info', description: 'Your basic information' },
  { id: 'income', label: 'Income', description: 'Employment and investment income' },
  { id: 'deductions', label: 'Deductions', description: 'Deductions and credits' },
  { id: 'documents', label: 'Documents', description: 'Upload your tax slips' },
  { id: 'review', label: 'Review', description: 'Review your return' },
  { id: 'submit', label: 'Submit', description: 'File your taxes' },
];
