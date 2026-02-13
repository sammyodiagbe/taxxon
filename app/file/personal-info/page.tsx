'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PersonalInfoForm } from '@/components/forms/PersonalInfoForm';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';

export default function PersonalInfoPage() {
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);

  const handleValidationChange = useCallback((valid: boolean) => {
    setIsValid(valid);
  }, []);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleNext = () => {
    router.push('/file/income');
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Personal Information</h1>
        <p className="text-slate-600">
          Enter your personal details exactly as they appear on your government ID
        </p>
      </div>

      <PersonalInfoForm onValidationChange={handleValidationChange} />

      <WizardNavigation
        currentStep="personal-info"
        onBack={handleBack}
        onNext={handleNext}
        isNextDisabled={!isValid}
      />
    </div>
  );
}
