'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, WizardStep } from '@/types/tax-filing';

interface WizardProgressProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick?: (step: WizardStep) => void;
}

export function WizardProgress({ currentStep, completedSteps, onStepClick }: WizardProgressProps) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Filing progress" className="w-full">
      <ol className="flex items-center">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;
          const isClickable = isCompleted || isPast;

          return (
            <li
              key={step.id}
              className={cn('flex items-center', index !== WIZARD_STEPS.length - 1 && 'flex-1')}
            >
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  'group flex flex-col items-center',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                    isCompleted && 'border-black bg-black text-white',
                    isCurrent && !isCompleted && 'border-black bg-black text-white',
                    !isCompleted && !isCurrent && 'border-neutral-300 bg-white text-neutral-500',
                    isClickable && !isCurrent && 'group-hover:border-neutral-400'
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isCurrent && 'text-black',
                    !isCurrent && 'text-neutral-500'
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index !== WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1',
                    index < currentIndex || isCompleted ? 'bg-black' : 'bg-neutral-200'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
