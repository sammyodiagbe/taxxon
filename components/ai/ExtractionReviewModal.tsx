'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfidenceBadge } from './ConfidenceBadge';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import type { DocumentExtractionResult, TaxSuggestion } from '@/types/ai';
import type { DocumentType } from '@/types/tax-filing';

interface ExtractionReviewModalProps {
  isOpen: boolean;
  isLoading: boolean;
  result: DocumentExtractionResult | null;
  documentType: DocumentType;
  onClose: () => void;
  onApply: (data: Record<string, string | number>) => void;
}

// Field labels for display
const fieldLabels: Record<string, string> = {
  employerName: 'Employer Name',
  employmentIncome: 'Employment Income (Box 14)',
  incomeTaxDeducted: 'Income Tax Deducted (Box 22)',
  cppContributions: 'CPP Contributions (Box 16)',
  eiPremiums: 'EI Premiums (Box 18)',
  rppContributions: 'RPP Contributions (Box 20)',
  unionDues: 'Union Dues (Box 44)',
  charitableDonations: 'Charitable Donations (Box 46)',
  payerName: 'Payer Name',
  pensionIncome: 'Pension Income (Box 016)',
  lumpSumPayments: 'Lump Sum Payments (Box 018)',
  selfEmployedCommissions: 'Self-Employed Commissions (Box 020)',
  otherIncome: 'Other Income (Box 028)',
  eiBenefits: 'EI Benefits (Box 14)',
  amountRepaid: 'Amount Repaid (Box 30)',
  actualDividends: 'Actual Dividends (Box 10)',
  interestFromCanadianSources: 'Interest (Box 13)',
  capitalGainsDividends: 'Capital Gains Dividends (Box 18)',
  foreignIncome: 'Foreign Income (Box 15)',
  foreignTaxPaid: 'Foreign Tax Paid (Box 16)',
  trustName: 'Trust Name',
  capitalGains: 'Capital Gains (Box 21)',
  eligibleDividends: 'Eligible Dividends (Box 23)',
  otherDividends: 'Other Dividends (Box 32)',
  foreignBusinessIncome: 'Foreign Business Income (Box 24)',
  foreignNonBusinessIncome: 'Foreign Non-Business Income (Box 25)',
  institutionName: 'Institution Name',
  eligibleTuitionFees: 'Eligible Tuition Fees (Box A)',
  monthsPartTime: 'Months Part-Time (Box B)',
  monthsFullTime: 'Months Full-Time (Box C)',
  rrspIncome: 'RRSP Income',
  securityDescription: 'Security Description',
  proceeds: 'Proceeds (Box 21)',
  costBase: 'Cost Base (Box 20)',
  contributionAmount: 'Contribution Amount',
  contributorType: 'Contributor Type',
  charityName: 'Charity Name',
  registrationNumber: 'Registration Number',
  donationAmount: 'Donation Amount',
  description: 'Description',
  amount: 'Amount',
};

export function ExtractionReviewModal({
  isOpen,
  isLoading,
  result,
  documentType,
  onClose,
  onApply,
}: ExtractionReviewModalProps) {
  const { currentFiling } = useTaxFiling();
  const [editedValues, setEditedValues] = useState<Record<string, string | number>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    discrepancies: TaxSuggestion[];
  } | null>(null);

  // Initialize edited values when result changes
  useEffect(() => {
    if (result) {
      const initial: Record<string, string | number> = {};
      result.extractedData.forEach((field) => {
        initial[field.fieldName] = field.value;
      });
      setEditedValues(initial);
      setValidationResult(null);
    }
  }, [result]);

  // Run cross-validation when extraction completes
  useEffect(() => {
    if (!result || !currentFiling || isLoading) return;

    const validateExtraction = async () => {
      setIsValidating(true);
      try {
        const response = await fetch('/api/ai/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentType: result.documentType,
            extractedFields: editedValues,
            filing: {
              income: currentFiling.income,
              deductions: currentFiling.deductions,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setValidationResult(data);
        }
      } catch (error) {
        console.error('Validation error:', error);
      } finally {
        setIsValidating(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateExtraction, 300);
    return () => clearTimeout(timeoutId);
  }, [result, currentFiling, editedValues, isLoading]);

  const handleValueChange = (fieldName: string, value: string) => {
    const parsed = parseFloat(value);
    setEditedValues((prev) => ({
      ...prev,
      [fieldName]: isNaN(parsed) ? value : parsed,
    }));
  };

  const handleApply = () => {
    onApply(editedValues);
    onClose();
  };

  if (!isOpen) return null;

  const hasErrors = validationResult?.discrepancies.some(d => d.type === 'validation_error');
  const hasWarnings = validationResult?.discrepancies.some(d => d.type === 'warning');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium">Review Extracted Data</h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-4" />
              <p className="text-sm text-neutral-500">Extracting document data...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Document type detected */}
              <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  Detected as: <span className="font-medium">{result.documentType.toUpperCase()}</span>
                </span>
              </div>

              {/* Cross-validation results */}
              {isValidating ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700">Validating against your entered data...</span>
                </div>
              ) : validationResult ? (
                <>
                  {validationResult.isValid && validationResult.discrepancies.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        Data validated successfully - no discrepancies found
                      </span>
                    </div>
                  ) : (
                    validationResult.discrepancies.map((discrepancy, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-3 rounded-lg',
                          discrepancy.type === 'validation_error' && 'bg-red-50',
                          discrepancy.type === 'warning' && 'bg-amber-50',
                          discrepancy.type === 'info' && 'bg-blue-50',
                          discrepancy.type === 'missing_deduction' && 'bg-green-50'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {discrepancy.type === 'validation_error' ? (
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          ) : discrepancy.type === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className={cn(
                              'text-sm font-medium',
                              discrepancy.type === 'validation_error' && 'text-red-800',
                              discrepancy.type === 'warning' && 'text-amber-800',
                              discrepancy.type === 'info' && 'text-blue-800',
                              discrepancy.type === 'missing_deduction' && 'text-green-800'
                            )}>
                              {discrepancy.title}
                            </p>
                            <p className={cn(
                              'mt-1 text-sm whitespace-pre-line',
                              discrepancy.type === 'validation_error' && 'text-red-700',
                              discrepancy.type === 'warning' && 'text-amber-700',
                              discrepancy.type === 'info' && 'text-blue-700',
                              discrepancy.type === 'missing_deduction' && 'text-green-700'
                            )}>
                              {discrepancy.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : null}

              {/* Extraction notes */}
              {result.suggestions.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Extraction Notes</p>
                      <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                        {result.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted fields */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-700">
                  Review and correct the extracted values:
                </p>
                {result.extractedData.map((field) => (
                  <div key={field.fieldName} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-neutral-600">
                        {fieldLabels[field.fieldName] || field.fieldName}
                      </label>
                      <ConfidenceBadge confidence={field.confidence} />
                    </div>
                    <Input
                      type={typeof field.value === 'number' ? 'number' : 'text'}
                      value={editedValues[field.fieldName] ?? field.value}
                      onChange={(e) => handleValueChange(field.fieldName, e.target.value)}
                      className={cn(
                        field.confidence === 'low' && 'border-amber-300 bg-amber-50'
                      )}
                    />
                    {field.originalText && field.originalText !== String(field.value) && (
                      <p className="text-xs text-neutral-400">
                        Original: "{field.originalText}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-neutral-300 mb-4" />
              <p className="text-sm text-neutral-500">No data extracted</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <div className="text-xs text-neutral-500">
            {hasErrors && (
              <span className="text-red-600">Review discrepancies before applying</span>
            )}
            {!hasErrors && hasWarnings && (
              <span className="text-amber-600">Check warnings above</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={isLoading || !result || result.extractedData.length === 0}
              className={cn(hasErrors && 'bg-amber-600 hover:bg-amber-700')}
            >
              {hasErrors ? 'Apply Anyway' : 'Apply Data'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
