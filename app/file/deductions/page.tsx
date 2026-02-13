'use client';

import { useRouter } from 'next/navigation';
import { DeductionsForm } from '@/components/forms/DeductionsForm';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { Alert } from '@/components/ui/Alert';

export default function DeductionsPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/file/income');
  };

  const handleNext = () => {
    router.push('/file/documents');
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deductions & Credits</h1>
        <p className="text-slate-600">
          Enter your deductions and credits to reduce your tax owing
        </p>
      </div>

      <Alert variant="info">
        Deductions reduce your taxable income. Common deductions include RRSP contributions,
        charitable donations, and medical expenses. Make sure to keep receipts for all claims.
      </Alert>

      <DeductionsForm />

      <WizardNavigation
        currentStep="deductions"
        onBack={handleBack}
        onNext={handleNext}
      />
    </div>
  );
}
