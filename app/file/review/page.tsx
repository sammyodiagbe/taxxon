'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { PROVINCES, MARITAL_STATUSES } from '@/types/tax-filing';

export default function ReviewPage() {
  const router = useRouter();
  const { currentFiling, calculateSummary } = useTaxFiling();

  const handleBack = () => {
    router.push('/file/documents');
  };

  const handleNext = () => {
    router.push('/file/submit');
  };

  if (!currentFiling) return null;

  const summary = calculateSummary();
  const { personalInfo, income, deductions, documents } = currentFiling;

  const totalT4Income = income.t4Slips.reduce((sum, slip) => sum + slip.employmentIncome, 0);
  const totalRRSP = deductions.rrspContributions.reduce((sum, c) => sum + c.contributionAmount, 0);
  const totalDonations = deductions.charitableDonations.reduce((sum, d) => sum + d.donationAmount, 0);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-black">Review</h1>
        <p className="text-neutral-600 mt-1">Review your information before submitting</p>
      </div>

      {/* Summary */}
      <Card className={summary.refundOrOwing >= 0 ? 'border-neutral-900' : 'border-neutral-900'}>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-neutral-600 mb-2">
            {summary.refundOrOwing >= 0 ? 'Estimated Refund' : 'Balance Owing'}
          </p>
          <p className="text-4xl font-semibold text-black">
            {formatCurrency(Math.abs(summary.refundOrOwing))}
          </p>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-600">Total Income</span>
            <span className="font-medium text-neutral-900">{formatCurrency(summary.totalIncome)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-600">Deductions</span>
            <span className="font-medium text-neutral-900">- {formatCurrency(summary.totalDeductions)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-600">Net Tax</span>
            <span className="font-medium text-neutral-900">{formatCurrency(summary.totalTax)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100">
            <span className="text-neutral-600">Tax Paid</span>
            <span className="font-medium text-neutral-900">- {formatCurrency(summary.totalPaid)}</span>
          </div>
          <div className="flex justify-between py-3 font-semibold text-neutral-900">
            <span>{summary.refundOrOwing >= 0 ? 'Refund' : 'Owing'}</span>
            <span>{formatCurrency(Math.abs(summary.refundOrOwing))}</span>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal Information</CardTitle>
          <button
            onClick={() => router.push('/file/personal-info')}
            className="text-sm text-neutral-500 hover:text-black flex items-center"
          >
            Edit <ChevronRight className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-neutral-500">Name</dt>
              <dd className="font-medium text-neutral-900">{personalInfo.firstName} {personalInfo.lastName}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">SIN</dt>
              <dd className="font-medium text-neutral-900">{personalInfo.sin}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Province</dt>
              <dd className="font-medium text-neutral-900">{personalInfo.province ? PROVINCES[personalInfo.province] : '-'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Marital Status</dt>
              <dd className="font-medium text-neutral-900">{personalInfo.maritalStatus ? MARITAL_STATUSES[personalInfo.maritalStatus] : '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Income</CardTitle>
          <button
            onClick={() => router.push('/file/income')}
            className="text-sm text-neutral-500 hover:text-black flex items-center"
          >
            Edit <ChevronRight className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">T4 Employment ({income.t4Slips.length})</dt>
              <dd className="font-medium text-neutral-900">{formatCurrency(totalT4Income)}</dd>
            </div>
            {income.selfEmploymentIncome > 0 && (
              <div className="flex justify-between">
                <dt className="text-neutral-600">Self-Employment</dt>
                <dd className="font-medium text-neutral-900">{formatCurrency(income.selfEmploymentIncome)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Deductions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Deductions</CardTitle>
          <button
            onClick={() => router.push('/file/deductions')}
            className="text-sm text-neutral-500 hover:text-black flex items-center"
          >
            Edit <ChevronRight className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            {totalRRSP > 0 && (
              <div className="flex justify-between">
                <dt className="text-neutral-600">RRSP Contributions</dt>
                <dd className="font-medium text-neutral-900">{formatCurrency(totalRRSP)}</dd>
              </div>
            )}
            {totalDonations > 0 && (
              <div className="flex justify-between">
                <dt className="text-neutral-600">Charitable Donations</dt>
                <dd className="font-medium text-neutral-900">{formatCurrency(totalDonations)}</dd>
              </div>
            )}
            {totalRRSP === 0 && totalDonations === 0 && (
              <p className="text-neutral-500">No deductions entered</p>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <button
            onClick={() => router.push('/file/documents')}
            className="text-sm text-neutral-500 hover:text-black flex items-center"
          >
            Edit <ChevronRight className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">{documents.length} document(s) uploaded</p>
        </CardContent>
      </Card>

      <WizardNavigation
        currentStep="review"
        onBack={handleBack}
        onNext={handleNext}
        nextLabel="Continue"
      />
    </div>
  );
}
