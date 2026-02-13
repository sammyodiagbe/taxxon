// Static rule-based tax suggestions
// These run locally without AI for instant feedback

import { v4 as uuidv4 } from 'uuid';
import type { TaxSuggestion, SuggestionsRequest } from '@/types/ai';

type SuggestionRule = (data: SuggestionsRequest) => TaxSuggestion | null;

// 2024 RRSP contribution limit
const RRSP_LIMIT_2024 = 31560;
// RRSP deduction rate for suggestion purposes
const RRSP_RATE = 0.18;

/**
 * Check if user might benefit from RRSP contributions
 */
const checkRRSPOpportunity: SuggestionRule = (data) => {
  const totalIncome =
    data.income.t4Total +
    data.income.t4aTotal +
    data.income.selfEmploymentIncome;

  // If they have income but no RRSP contributions
  if (totalIncome > 30000 && data.deductions.rrspTotal === 0) {
    const maxContribution = Math.min(totalIncome * RRSP_RATE, RRSP_LIMIT_2024);
    const estimatedSavings = maxContribution * 0.25; // Assume ~25% marginal rate

    return {
      id: uuidv4(),
      type: 'missing_deduction',
      priority: 'high',
      title: 'RRSP Contribution Opportunity',
      description: `You haven't claimed any RRSP contributions. Based on your income, you may be able to contribute up to $${maxContribution.toLocaleString()} and potentially save around $${estimatedSavings.toLocaleString()} in taxes.`,
      affectedFields: ['deductions.rrspContributions'],
      actionLabel: 'Add RRSP',
      actionRoute: '/file/deductions',
      estimatedImpact: estimatedSavings,
    };
  }
  return null;
};

/**
 * Check for home office deduction opportunity
 */
const checkHomeOfficeOpportunity: SuggestionRule = (data) => {
  // If they have T4 income but no home office claimed
  if (data.income.t4Total > 0 && data.deductions.homeOfficeDays === 0) {
    const potentialDeduction = 250 * 2; // Max 250 days at $2/day flat rate

    return {
      id: uuidv4(),
      type: 'info',
      priority: 'medium',
      title: 'Home Office Deduction',
      description: 'If you worked from home during the tax year, you may be able to claim up to $500 using the flat rate method ($2/day for up to 250 days).',
      affectedFields: ['deductions.homeOfficeDays', 'deductions.homeOfficeMethod'],
      actionLabel: 'Add Home Office',
      actionRoute: '/file/deductions',
      estimatedImpact: potentialDeduction * 0.25,
    };
  }
  return null;
};

/**
 * Warn about high deduction ratio
 */
const checkHighDeductionRatio: SuggestionRule = (data) => {
  const totalIncome =
    data.income.t4Total +
    data.income.t4aTotal +
    data.income.t4eTotal +
    data.income.t5Total +
    data.income.t3Total +
    data.income.selfEmploymentIncome +
    data.income.otherIncome;

  const totalDeductions =
    data.deductions.rrspTotal +
    data.deductions.donationsTotal +
    data.deductions.medicalTotal +
    data.deductions.childcareExpenses +
    data.deductions.movingExpenses +
    data.deductions.professionalDues;

  // Warn if deductions exceed 40% of income (unusual ratio)
  if (totalIncome > 0 && totalDeductions / totalIncome > 0.4) {
    return {
      id: uuidv4(),
      type: 'warning',
      priority: 'high',
      title: 'High Deduction Ratio',
      description: `Your deductions (${((totalDeductions / totalIncome) * 100).toFixed(0)}% of income) are higher than typical. Please ensure you have documentation to support all claimed deductions.`,
      affectedFields: ['deductions'],
    };
  }
  return null;
};

/**
 * Check for medical expense threshold
 */
const checkMedicalExpenseThreshold: SuggestionRule = (data) => {
  const totalIncome =
    data.income.t4Total +
    data.income.t4aTotal +
    data.income.selfEmploymentIncome;

  // Medical expenses need to exceed 3% of net income or $2,635 (2024), whichever is less
  const threshold = Math.min(totalIncome * 0.03, 2635);

  if (data.deductions.medicalTotal > 0 && data.deductions.medicalTotal < threshold) {
    return {
      id: uuidv4(),
      type: 'info',
      priority: 'low',
      title: 'Medical Expense Threshold',
      description: `Your medical expenses ($${data.deductions.medicalTotal.toLocaleString()}) are below the claim threshold ($${threshold.toLocaleString()}). You won't receive a credit unless your total exceeds this amount.`,
      affectedFields: ['deductions.medicalExpenses'],
    };
  }
  return null;
};

/**
 * Check for donation credit optimization
 */
const checkDonationCredit: SuggestionRule = (data) => {
  if (data.deductions.donationsTotal > 0 && data.deductions.donationsTotal < 200) {
    return {
      id: uuidv4(),
      type: 'optimization',
      priority: 'low',
      title: 'Donation Credit Tip',
      description: 'Donations over $200 receive a higher tax credit (29% vs 15%). Consider combining this year\'s donations with next year\'s for a better credit.',
      affectedFields: ['deductions.charitableDonations'],
    };
  }
  return null;
};

/**
 * Check for missing professional dues
 */
const checkProfessionalDues: SuggestionRule = (data) => {
  // If they have significant T4 income but no professional dues
  if (data.income.t4Total > 60000 && data.deductions.professionalDues === 0) {
    return {
      id: uuidv4(),
      type: 'info',
      priority: 'low',
      title: 'Professional Dues',
      description: 'If you pay membership fees to a professional association required for your work (e.g., CPA, P.Eng), these may be deductible.',
      affectedFields: ['deductions.professionalDues'],
      actionLabel: 'Add Dues',
      actionRoute: '/file/deductions',
    };
  }
  return null;
};

/**
 * Check for student loan interest
 */
const checkStudentLoanInterest: SuggestionRule = (data) => {
  // This is just informational - can't detect if they have student loans
  // Only show if they have no income from RRSP (not retired) and low overall deductions
  const totalDeductions =
    data.deductions.rrspTotal +
    data.deductions.donationsTotal +
    data.deductions.studentLoanInterest;

  if (data.income.t4Total > 30000 && totalDeductions < 1000 && data.deductions.studentLoanInterest === 0) {
    return {
      id: uuidv4(),
      type: 'info',
      priority: 'low',
      title: 'Student Loan Interest',
      description: 'Interest paid on qualifying student loans is eligible for a 15% federal tax credit. Don\'t forget to claim it if applicable.',
      affectedFields: ['deductions.studentLoanInterest'],
    };
  }
  return null;
};

/**
 * Validate province is set
 */
const checkProvinceSet: SuggestionRule = (data) => {
  if (!data.province) {
    return {
      id: uuidv4(),
      type: 'validation_error',
      priority: 'high',
      title: 'Province Required',
      description: 'Please set your province of residence to calculate accurate provincial tax.',
      affectedFields: ['personalInfo.province'],
      actionLabel: 'Set Province',
      actionRoute: '/file/personal-info',
    };
  }
  return null;
};

// All rules to run
const rules: SuggestionRule[] = [
  checkProvinceSet,
  checkRRSPOpportunity,
  checkHomeOfficeOpportunity,
  checkHighDeductionRatio,
  checkMedicalExpenseThreshold,
  checkDonationCredit,
  checkProfessionalDues,
  checkStudentLoanInterest,
];

/**
 * Run all static suggestion rules against filing data
 */
export function getStaticSuggestions(data: SuggestionsRequest): TaxSuggestion[] {
  const suggestions: TaxSuggestion[] = [];

  for (const rule of rules) {
    const suggestion = rule(data);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
}
