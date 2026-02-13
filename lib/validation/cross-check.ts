// Cross-validation between extracted documents and entered data
// Catches discrepancies and potential errors

import { v4 as uuidv4 } from 'uuid';
import type { TaxSuggestion } from '@/types/ai';
import type { TaxFiling, DocumentType, T4Slip, T5Slip } from '@/types/tax-filing';

interface ExtractedDocumentData {
  documentType: DocumentType;
  fields: Record<string, string | number>;
  documentName?: string;
}

interface ValidationResult {
  isValid: boolean;
  discrepancies: TaxSuggestion[];
  matches: string[];
}

// Tolerance for numeric comparisons (to handle rounding differences)
const NUMERIC_TOLERANCE = 0.01; // 1 cent
const PERCENTAGE_TOLERANCE = 0.02; // 2% difference for larger amounts

function valuesMatch(extracted: number, entered: number): boolean {
  if (extracted === entered) return true;

  const diff = Math.abs(extracted - entered);

  // For small amounts, use absolute tolerance
  if (Math.max(extracted, entered) < 100) {
    return diff <= NUMERIC_TOLERANCE;
  }

  // For larger amounts, use percentage tolerance
  return diff / Math.max(extracted, entered) <= PERCENTAGE_TOLERANCE;
}

function findMatchingT4(
  extractedData: Record<string, string | number>,
  t4Slips: T4Slip[]
): { slip: T4Slip | null; matchScore: number } {
  let bestMatch: T4Slip | null = null;
  let bestScore = 0;

  for (const slip of t4Slips) {
    let score = 0;

    // Check employer name similarity
    const extractedEmployer = String(extractedData.employerName || '').toLowerCase();
    const enteredEmployer = slip.employerName.toLowerCase();
    if (extractedEmployer && enteredEmployer) {
      if (extractedEmployer.includes(enteredEmployer) || enteredEmployer.includes(extractedEmployer)) {
        score += 3;
      }
    }

    // Check employment income
    const extractedIncome = Number(extractedData.employmentIncome) || 0;
    if (extractedIncome > 0 && valuesMatch(extractedIncome, slip.employmentIncome)) {
      score += 2;
    }

    // Check tax deducted
    const extractedTax = Number(extractedData.incomeTaxDeducted) || 0;
    if (extractedTax > 0 && valuesMatch(extractedTax, slip.incomeTaxDeducted)) {
      score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = slip;
    }
  }

  return { slip: bestMatch, matchScore: bestScore };
}

/**
 * Cross-check extracted T4 data against entered T4 slips
 */
function validateT4(
  extractedData: Record<string, string | number>,
  filing: TaxFiling,
  documentName?: string
): TaxSuggestion[] {
  const suggestions: TaxSuggestion[] = [];
  const { slip: matchedSlip, matchScore } = findMatchingT4(extractedData, filing.income.t4Slips);

  const extractedIncome = Number(extractedData.employmentIncome) || 0;
  const extractedTax = Number(extractedData.incomeTaxDeducted) || 0;
  const extractedCPP = Number(extractedData.cppContributions) || 0;
  const extractedEI = Number(extractedData.eiPremiums) || 0;

  if (matchScore >= 3 && matchedSlip) {
    // Found a likely match - check for discrepancies
    const discrepancies: string[] = [];

    if (extractedIncome > 0 && !valuesMatch(extractedIncome, matchedSlip.employmentIncome)) {
      const diff = extractedIncome - matchedSlip.employmentIncome;
      discrepancies.push(
        `Employment income: Document shows $${extractedIncome.toLocaleString()}, you entered $${matchedSlip.employmentIncome.toLocaleString()} (difference: $${Math.abs(diff).toLocaleString()})`
      );
    }

    if (extractedTax > 0 && !valuesMatch(extractedTax, matchedSlip.incomeTaxDeducted)) {
      const diff = extractedTax - matchedSlip.incomeTaxDeducted;
      discrepancies.push(
        `Tax deducted: Document shows $${extractedTax.toLocaleString()}, you entered $${matchedSlip.incomeTaxDeducted.toLocaleString()} (difference: $${Math.abs(diff).toLocaleString()})`
      );
    }

    if (extractedCPP > 0 && !valuesMatch(extractedCPP, matchedSlip.cppContributions)) {
      discrepancies.push(
        `CPP contributions: Document shows $${extractedCPP.toLocaleString()}, you entered $${matchedSlip.cppContributions.toLocaleString()}`
      );
    }

    if (extractedEI > 0 && !valuesMatch(extractedEI, matchedSlip.eiPremiums)) {
      discrepancies.push(
        `EI premiums: Document shows $${extractedEI.toLocaleString()}, you entered $${matchedSlip.eiPremiums.toLocaleString()}`
      );
    }

    if (discrepancies.length > 0) {
      suggestions.push({
        id: uuidv4(),
        type: 'validation_error',
        priority: 'high',
        title: 'T4 Data Mismatch Detected',
        description: `The uploaded document${documentName ? ` (${documentName})` : ''} doesn't match your entered T4 for ${matchedSlip.employerName}:\n• ${discrepancies.join('\n• ')}`,
        affectedFields: ['income.t4Slips'],
        actionLabel: 'Review Income',
        actionRoute: '/file/income',
      });
    }
  } else if (extractedIncome > 0 && filing.income.t4Slips.length > 0) {
    // No matching slip found - might be a new T4 or duplicate
    const similarIncomeSlip = filing.income.t4Slips.find(
      (slip) => valuesMatch(extractedIncome, slip.employmentIncome)
    );

    if (similarIncomeSlip) {
      suggestions.push({
        id: uuidv4(),
        type: 'warning',
        priority: 'medium',
        title: 'Possible Duplicate T4',
        description: `This T4 shows $${extractedIncome.toLocaleString()} in employment income, which matches an existing T4 from ${similarIncomeSlip.employerName}. Please verify this isn't a duplicate entry.`,
        affectedFields: ['income.t4Slips'],
        actionLabel: 'Review T4s',
        actionRoute: '/file/income',
      });
    } else {
      suggestions.push({
        id: uuidv4(),
        type: 'info',
        priority: 'low',
        title: 'New T4 Detected',
        description: `This document contains a T4 with $${extractedIncome.toLocaleString()} in employment income that doesn't match any existing entries. Consider adding it to your return.`,
        affectedFields: ['income.t4Slips'],
        actionLabel: 'Add T4',
        actionRoute: '/file/income',
      });
    }
  }

  return suggestions;
}

/**
 * Cross-check extracted T5 data against entered T5 slips
 */
function validateT5(
  extractedData: Record<string, string | number>,
  filing: TaxFiling,
  documentName?: string
): TaxSuggestion[] {
  const suggestions: TaxSuggestion[] = [];

  const extractedDividends = Number(extractedData.actualDividends) || 0;
  const extractedInterest = Number(extractedData.interestFromCanadianSources) || 0;
  const totalExtracted = extractedDividends + extractedInterest;

  if (totalExtracted === 0) return suggestions;

  // Look for matching T5
  const matchedSlip = filing.income.t5Slips.find((slip) => {
    const slipTotal = slip.actualDividends + slip.interestFromCanadianSources;
    return valuesMatch(totalExtracted, slipTotal);
  });

  if (matchedSlip) {
    const discrepancies: string[] = [];

    if (extractedDividends > 0 && !valuesMatch(extractedDividends, matchedSlip.actualDividends)) {
      discrepancies.push(
        `Dividends: Document shows $${extractedDividends.toLocaleString()}, you entered $${matchedSlip.actualDividends.toLocaleString()}`
      );
    }

    if (extractedInterest > 0 && !valuesMatch(extractedInterest, matchedSlip.interestFromCanadianSources)) {
      discrepancies.push(
        `Interest: Document shows $${extractedInterest.toLocaleString()}, you entered $${matchedSlip.interestFromCanadianSources.toLocaleString()}`
      );
    }

    if (discrepancies.length > 0) {
      suggestions.push({
        id: uuidv4(),
        type: 'validation_error',
        priority: 'high',
        title: 'T5 Data Mismatch Detected',
        description: `The uploaded investment slip${documentName ? ` (${documentName})` : ''} doesn't match your entered data:\n• ${discrepancies.join('\n• ')}`,
        affectedFields: ['income.t5Slips'],
        actionLabel: 'Review T5',
        actionRoute: '/file/income',
      });
    }
  }

  return suggestions;
}

/**
 * Cross-check RRSP contribution receipt
 */
function validateRRSP(
  extractedData: Record<string, string | number>,
  filing: TaxFiling,
  documentName?: string
): TaxSuggestion[] {
  const suggestions: TaxSuggestion[] = [];

  const extractedAmount = Number(extractedData.contributionAmount) || 0;
  if (extractedAmount === 0) return suggestions;

  const totalEntered = filing.deductions.rrspContributions.reduce(
    (sum, c) => sum + c.contributionAmount,
    0
  );

  // Check if this contribution is already entered
  const matchedContribution = filing.deductions.rrspContributions.find(
    (c) => valuesMatch(extractedAmount, c.contributionAmount)
  );

  if (!matchedContribution && totalEntered > 0) {
    suggestions.push({
      id: uuidv4(),
      type: 'info',
      priority: 'medium',
      title: 'Additional RRSP Contribution Found',
      description: `This receipt shows a $${extractedAmount.toLocaleString()} RRSP contribution that may not be included in your current total of $${totalEntered.toLocaleString()}.`,
      affectedFields: ['deductions.rrspContributions'],
      actionLabel: 'Review RRSPs',
      actionRoute: '/file/deductions',
      estimatedImpact: extractedAmount * 0.25, // Approximate tax savings
    });
  } else if (!matchedContribution && totalEntered === 0) {
    suggestions.push({
      id: uuidv4(),
      type: 'missing_deduction',
      priority: 'high',
      title: 'RRSP Contribution Not Claimed',
      description: `You uploaded an RRSP receipt for $${extractedAmount.toLocaleString()} but haven't entered any RRSP contributions. Don't miss this deduction!`,
      affectedFields: ['deductions.rrspContributions'],
      actionLabel: 'Add RRSP',
      actionRoute: '/file/deductions',
      estimatedImpact: extractedAmount * 0.25,
    });
  }

  return suggestions;
}

/**
 * Cross-check donation receipt
 */
function validateDonation(
  extractedData: Record<string, string | number>,
  filing: TaxFiling,
  documentName?: string
): TaxSuggestion[] {
  const suggestions: TaxSuggestion[] = [];

  const extractedAmount = Number(extractedData.donationAmount) || 0;
  if (extractedAmount === 0) return suggestions;

  const totalEntered = filing.deductions.charitableDonations.reduce(
    (sum, d) => sum + d.donationAmount,
    0
  );

  const matchedDonation = filing.deductions.charitableDonations.find(
    (d) => valuesMatch(extractedAmount, d.donationAmount)
  );

  if (!matchedDonation && totalEntered === 0) {
    suggestions.push({
      id: uuidv4(),
      type: 'missing_deduction',
      priority: 'high',
      title: 'Donation Not Claimed',
      description: `You uploaded a donation receipt for $${extractedAmount.toLocaleString()} but haven't claimed any charitable donations.`,
      affectedFields: ['deductions.charitableDonations'],
      actionLabel: 'Add Donation',
      actionRoute: '/file/deductions',
    });
  }

  return suggestions;
}

/**
 * Main cross-validation function
 * Compares extracted document data against the current filing
 */
export function crossCheckDocument(
  extracted: ExtractedDocumentData,
  filing: TaxFiling
): ValidationResult {
  const discrepancies: TaxSuggestion[] = [];
  const matches: string[] = [];

  switch (extracted.documentType) {
    case 't4':
      discrepancies.push(...validateT4(extracted.fields, filing, extracted.documentName));
      break;
    case 't5':
      discrepancies.push(...validateT5(extracted.fields, filing, extracted.documentName));
      break;
    case 'rrsp-receipt':
      discrepancies.push(...validateRRSP(extracted.fields, filing, extracted.documentName));
      break;
    case 'donation-receipt':
      discrepancies.push(...validateDonation(extracted.fields, filing, extracted.documentName));
      break;
    // Add more document types as needed
  }

  return {
    isValid: discrepancies.filter((d) => d.type === 'validation_error').length === 0,
    discrepancies,
    matches,
  };
}

/**
 * Validate all uploaded documents against entered data
 * Call this when user completes a section or before review
 */
export function validateAllDocuments(
  extractedDocuments: ExtractedDocumentData[],
  filing: TaxFiling
): TaxSuggestion[] {
  const allSuggestions: TaxSuggestion[] = [];

  for (const doc of extractedDocuments) {
    const result = crossCheckDocument(doc, filing);
    allSuggestions.push(...result.discrepancies);
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return allSuggestions.filter((s) => {
    if (seen.has(s.title)) return false;
    seen.add(s.title);
    return true;
  });
}
