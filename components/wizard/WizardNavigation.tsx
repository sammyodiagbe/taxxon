'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WIZARD_STEPS, WizardStep } from '@/types/tax-filing';

interface WizardNavigationProps {
  currentStep: WizardStep;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  nextLabel?: string;
}

export function WizardNavigation({
  currentStep,
  onBack,
  onNext,
  isNextDisabled,
  isLoading,
  nextLabel,
}: WizardNavigationProps) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === WIZARD_STEPS.length - 1;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isFirstStep}
        leftIcon={<ChevronLeft className="h-4 w-4" />}
      >
        Back
      </Button>
      <Button
        onClick={onNext}
        disabled={isNextDisabled}
        isLoading={isLoading}
        rightIcon={!isLastStep && !isLoading ? <ChevronRight className="h-4 w-4" /> : undefined}
      >
        {nextLabel || (isLastStep ? 'Submit' : 'Continue')}
      </Button>
    </div>
  );
}
