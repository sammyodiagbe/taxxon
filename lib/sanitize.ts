// Data sanitization utilities for AI API calls
// Removes sensitive personal information before sending to Claude

import type { TaxFiling } from '@/types/tax-filing';
import type { ChatFilingContext, SuggestionsRequest } from '@/types/ai';

/**
 * Creates a sanitized summary of filing data for AI suggestions
 * Removes: SIN, full name, address, phone, email
 * Keeps: Aggregate numbers, province, marital status flags
 */
export function sanitizeForSuggestions(filing: TaxFiling): SuggestionsRequest {
  const { income, deductions, personalInfo } = filing;

  // Calculate totals from income slips
  const t4Total = income.t4Slips.reduce((sum, slip) => sum + slip.employmentIncome, 0);
  const t4aTotal = income.t4aSlips.reduce(
    (sum, slip) => sum + slip.pensionIncome + slip.lumpSumPayments + slip.selfEmployedCommissions + slip.otherIncome,
    0
  );
  const t4eTotal = income.t4eSlips.reduce((sum, slip) => sum + slip.eiBenefits, 0);
  const t5Total = income.t5Slips.reduce(
    (sum, slip) => sum + slip.actualDividends + slip.interestFromCanadianSources + slip.capitalGainsDividends,
    0
  );
  const t3Total = income.t3Slips.reduce(
    (sum, slip) => sum + slip.capitalGains * 0.5 + slip.eligibleDividends + slip.otherDividends + slip.otherIncome,
    0
  );

  // Calculate deduction totals
  const rrspTotal = deductions.rrspContributions.reduce((sum, c) => sum + c.contributionAmount, 0);
  const donationsTotal = deductions.charitableDonations.reduce((sum, d) => sum + d.donationAmount, 0);
  const medicalTotal = deductions.medicalExpenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    income: {
      t4Total,
      t4aTotal,
      t4eTotal,
      t5Total,
      t3Total,
      selfEmploymentIncome: income.selfEmploymentIncome,
      otherIncome: income.otherIncome,
    },
    deductions: {
      rrspTotal,
      donationsTotal,
      medicalTotal,
      childcareExpenses: deductions.childcareExpenses,
      homeOfficeDays: deductions.homeOfficeDays,
      homeOfficeMethod: deductions.homeOfficeMethod,
      movingExpenses: deductions.movingExpenses,
      studentLoanInterest: deductions.studentLoanInterest,
      professionalDues: deductions.professionalDues,
    },
    province: personalInfo.province,
    hasSpouse: personalInfo.maritalStatus === 'married' || personalInfo.maritalStatus === 'common-law',
    hasDependents: false, // Would need to add this to personalInfo
  };
}

/**
 * Creates a sanitized chat context from filing data
 * Only includes aggregate financial data needed for tax guidance
 */
export function sanitizeForChat(
  filing: TaxFiling,
  summary: { totalIncome: number; totalDeductions: number; refundOrOwing: number }
): ChatFilingContext {
  const { income, deductions } = filing;

  return {
    year: filing.year,
    province: filing.personalInfo.province,
    totalIncome: summary.totalIncome,
    totalDeductions: summary.totalDeductions,
    estimatedRefund: summary.refundOrOwing,
    hasT4: income.t4Slips.length > 0,
    hasT5: income.t5Slips.length > 0,
    hasRRSP: deductions.rrspContributions.length > 0,
    hasDonations: deductions.charitableDonations.length > 0,
    hasMedical: deductions.medicalExpenses.length > 0,
    hasHomeOffice: deductions.homeOfficeDays > 0,
  };
}

/**
 * Removes any potential SIN patterns from text
 * SIN format: XXX-XXX-XXX or XXXXXXXXX
 */
export function removeSINFromText(text: string): string {
  // Pattern for XXX-XXX-XXX
  const dashedPattern = /\b\d{3}-\d{3}-\d{3}\b/g;
  // Pattern for 9 consecutive digits
  const continuousPattern = /\b\d{9}\b/g;

  return text
    .replace(dashedPattern, '[SIN REDACTED]')
    .replace(continuousPattern, '[ID REDACTED]');
}

/**
 * Sanitizes extracted document text before sending for analysis
 * Removes names, addresses, SIN patterns
 */
export function sanitizeExtractedText(text: string, knownFields?: {
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
}): string {
  let sanitized = removeSINFromText(text);

  // Remove known personal identifiers if provided
  if (knownFields) {
    if (knownFields.firstName) {
      sanitized = sanitized.replace(new RegExp(knownFields.firstName, 'gi'), '[NAME]');
    }
    if (knownFields.lastName) {
      sanitized = sanitized.replace(new RegExp(knownFields.lastName, 'gi'), '[NAME]');
    }
    if (knownFields.street) {
      sanitized = sanitized.replace(new RegExp(knownFields.street, 'gi'), '[ADDRESS]');
    }
    if (knownFields.city) {
      sanitized = sanitized.replace(new RegExp(knownFields.city, 'gi'), '[CITY]');
    }
  }

  return sanitized;
}
