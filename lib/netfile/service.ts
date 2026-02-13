// NETFILE Service - Manages partner integrations
// Configure NETFILE_PROVIDER env var to switch providers

import type {
  NetfileProvider,
  NetfileSubmissionRequest,
  NetfileSubmissionResponse,
  NetfileStatusResponse,
} from './types';
import { mockProvider } from './providers/mock-provider';
import type { TaxFiling, TaxSummary } from '@/types/tax-filing';

// Provider registry - add new partners here
// To add a real provider:
// 1. Create provider class in ./providers/ implementing NetfileProvider
// 2. Import and register below
// 3. Set NETFILE_PROVIDER env var to the provider key
const providers: Record<string, NetfileProvider> = {
  mock: mockProvider,
  // Example: Uncomment when you have real partner credentials
  // 'example-partner': new ExamplePartnerProvider(),
  // 'intuit': new IntuitProvider(),
  // 'thomson-reuters': new ThomsonReutersProvider(),
};

// Get the active provider based on environment
function getProvider(): NetfileProvider {
  const providerName = process.env.NETFILE_PROVIDER || 'mock';
  const provider = providers[providerName];

  if (!provider) {
    console.warn(`NETFILE provider "${providerName}" not found, falling back to mock`);
    return mockProvider;
  }

  return provider;
}

/**
 * Transform TaxFiling data into NETFILE submission format
 */
export function transformFilingToNetfile(
  filing: TaxFiling,
  summary: TaxSummary
): NetfileSubmissionRequest {
  const { personalInfo, income, deductions } = filing;

  // Calculate totals
  const totalEmploymentIncome = income.t4Slips.reduce(
    (sum, slip) => sum + slip.employmentIncome,
    0
  );
  const totalTaxWithheld = income.t4Slips.reduce(
    (sum, slip) => sum + slip.incomeTaxDeducted,
    0
  ) + income.t4aSlips.reduce(
    (sum, slip) => sum + slip.incomeTaxDeducted,
    0
  ) + income.t4eSlips.reduce(
    (sum, slip) => sum + slip.incomeTaxDeducted,
    0
  );
  const totalCPPContributions = income.t4Slips.reduce(
    (sum, slip) => sum + slip.cppContributions,
    0
  );
  const totalEIPremiums = income.t4Slips.reduce(
    (sum, slip) => sum + slip.eiPremiums,
    0
  );
  const investmentIncome = income.t5Slips.reduce(
    (sum, slip) => sum + slip.actualDividends + slip.interestFromCanadianSources,
    0
  ) + income.t3Slips.reduce(
    (sum, slip) => sum + slip.capitalGains * 0.5 + slip.eligibleDividends,
    0
  );

  const rrspContributions = deductions.rrspContributions.reduce(
    (sum, c) => sum + c.contributionAmount,
    0
  );
  const unionDues = income.t4Slips.reduce(
    (sum, slip) => sum + slip.unionDues,
    0
  );
  const charitableDonations = deductions.charitableDonations.reduce(
    (sum, d) => sum + d.donationAmount,
    0
  );
  const medicalExpenses = deductions.medicalExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );
  const tuitionFees = income.t2202Slips.reduce(
    (sum, slip) => sum + slip.eligibleTuitionFees,
    0
  );

  return {
    filingId: filing.id,
    taxYear: filing.year,
    personalInfo: {
      sin: personalInfo.sin,
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      dateOfBirth: personalInfo.dateOfBirth,
      email: personalInfo.email,
      province: personalInfo.province,
      postalCode: personalInfo.address.postalCode,
    },
    income: {
      totalEmploymentIncome,
      totalTaxWithheld,
      totalCPPContributions,
      totalEIPremiums,
      investmentIncome,
      selfEmploymentIncome: income.selfEmploymentIncome,
      otherIncome: income.otherIncome,
    },
    deductions: {
      rrspContributions,
      unionDues,
      childcareExpenses: deductions.childcareExpenses,
      movingExpenses: deductions.movingExpenses,
      otherDeductions: deductions.professionalDues,
    },
    credits: {
      basicPersonalAmount: 15705, // 2024 federal BPA
      charitableDonations,
      medicalExpenses,
      tuitionFees,
      studentLoanInterest: deductions.studentLoanInterest,
    },
    calculated: {
      totalIncome: summary.totalIncome,
      netIncome: summary.totalIncome - summary.totalDeductions,
      taxableIncome: summary.taxableIncome,
      federalTax: summary.federalTax,
      provincialTax: summary.provincialTax,
      totalTax: summary.totalTax,
      totalCredits: summary.totalCredits,
      refundOrOwing: summary.refundOrOwing,
    },
  };
}

/**
 * Submit a tax filing via NETFILE
 */
export async function submitToNetfile(
  filing: TaxFiling,
  summary: TaxSummary
): Promise<NetfileSubmissionResponse> {
  const provider = getProvider();
  const request = transformFilingToNetfile(filing, summary);

  console.log(`Submitting to NETFILE via ${provider.name}`);

  return provider.submitFiling(request);
}

/**
 * Check the status of a submitted filing
 */
export async function checkNetfileStatus(
  confirmationNumber: string
): Promise<NetfileStatusResponse> {
  const provider = getProvider();
  return provider.checkStatus(confirmationNumber);
}

/**
 * Validate a filing before submission
 */
export async function validateForNetfile(
  filing: TaxFiling,
  summary: TaxSummary
): Promise<{ valid: boolean; errors: string[] }> {
  const provider = getProvider();
  const request = transformFilingToNetfile(filing, summary);

  return provider.validateFiling(request);
}

/**
 * Get the current provider name
 */
export function getProviderName(): string {
  return getProvider().name;
}
