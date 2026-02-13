// NETFILE Partner Integration Types

export type FilingStatus =
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'error';

export interface NetfileSubmissionRequest {
  filingId: string;
  taxYear: number;
  personalInfo: {
    sin: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    province: string;
    postalCode: string;
  };
  income: {
    totalEmploymentIncome: number;
    totalTaxWithheld: number;
    totalCPPContributions: number;
    totalEIPremiums: number;
    investmentIncome: number;
    selfEmploymentIncome: number;
    otherIncome: number;
  };
  deductions: {
    rrspContributions: number;
    unionDues: number;
    childcareExpenses: number;
    movingExpenses: number;
    otherDeductions: number;
  };
  credits: {
    basicPersonalAmount: number;
    charitableDonations: number;
    medicalExpenses: number;
    tuitionFees: number;
    studentLoanInterest: number;
  };
  calculated: {
    totalIncome: number;
    netIncome: number;
    taxableIncome: number;
    federalTax: number;
    provincialTax: number;
    totalTax: number;
    totalCredits: number;
    refundOrOwing: number;
  };
}

export interface NetfileSubmissionResponse {
  success: boolean;
  confirmationNumber?: string;
  status: FilingStatus;
  timestamp: string;
  errors?: {
    code: string;
    message: string;
    field?: string;
  }[];
  warnings?: string[];
}

export interface NetfileStatusResponse {
  filingId: string;
  confirmationNumber?: string;
  status: FilingStatus;
  lastUpdated: string;
  craAssessmentDate?: string;
  noticeOfAssessment?: string;
}

// Provider interface - implement this for each NETFILE partner
export interface NetfileProvider {
  name: string;
  submitFiling(request: NetfileSubmissionRequest): Promise<NetfileSubmissionResponse>;
  checkStatus(confirmationNumber: string): Promise<NetfileStatusResponse>;
  validateFiling(request: NetfileSubmissionRequest): Promise<{ valid: boolean; errors: string[] }>;
}
