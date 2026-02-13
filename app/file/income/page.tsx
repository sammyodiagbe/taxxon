'use client';

import { useRouter } from 'next/navigation';
import { IncomeForm } from '@/components/forms/IncomeForm';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { Alert } from '@/components/ui/Alert';

export default function IncomePage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/file/personal-info');
  };

  const handleNext = () => {
    router.push('/file/deductions');
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Income</h1>
        <p className="text-slate-600">
          Enter your income from all sources for the tax year
        </p>
      </div>

      <Alert variant="info">
        Add each tax slip you received. Common slips include T4 (employment), T5 (investments),
        and T4A (pension/other income). Click on each section to expand and add your slips.
      </Alert>

      <IncomeForm />

      <WizardNavigation
        currentStep="income"
        onBack={handleBack}
        onNext={handleNext}
      />
    </div>
  );
}
