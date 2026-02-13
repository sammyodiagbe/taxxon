'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { WIZARD_STEPS, WizardStep } from '@/types/tax-filing';
import { Button } from '@/components/ui/Button';
import { LivePreviewPanel } from '@/components/ai/LivePreviewPanel';
import { SuggestionsPanel } from '@/components/ai/SuggestionsPanel';
import { ChatPanel } from '@/components/ai/ChatPanel';

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentFiling, setStep, createFiling } = useTaxFiling();
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);

  const currentStep = pathname.split('/').pop() as WizardStep;

  useEffect(() => {
    if (!currentFiling) {
      const currentYear = new Date().getFullYear();
      createFiling(currentYear - 1);
    }
  }, [currentFiling, createFiling]);

  useEffect(() => {
    if (currentStep && WIZARD_STEPS.some((s) => s.id === currentStep)) {
      setStep(currentStep);
    }
  }, [currentStep, setStep]);

  useEffect(() => {
    if (!currentFiling) return;

    const completed: WizardStep[] = [];

    if (
      currentFiling.personalInfo.firstName &&
      currentFiling.personalInfo.lastName &&
      currentFiling.personalInfo.sin
    ) {
      completed.push('personal-info');
    }

    if (currentFiling.status !== 'not-started') {
      const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
      if (stepIndex > 1) completed.push('income');
      if (stepIndex > 2) completed.push('deductions');
      if (stepIndex > 3) completed.push('documents');
    }

    if (currentFiling.status === 'submitted') {
      completed.push('review', 'submit');
    }

    setCompletedSteps(completed);
  }, [currentFiling, currentStep]);

  const handleStepClick = (step: WizardStep) => {
    router.push(`/file/${step}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="font-semibold tracking-tight">
                Taxxon
              </Link>
              <span className="text-neutral-300">|</span>
              <span className="text-sm text-neutral-600">
                {currentFiling?.year || new Date().getFullYear() - 1} Return
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-neutral-200 py-6">
        <div className="mx-auto max-w-3xl px-6">
          <WizardProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Content with sidebar */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="w-full lg:w-[640px] lg:flex-shrink-0">
              {children}
            </div>

            {/* Right sidebar - AI panels (fills remaining horizontal space) */}
            <aside className="w-full lg:flex-1">
              <div className="lg:sticky lg:top-8 space-y-6 lg:max-h-[calc(100vh-6rem)] flex flex-col">
                <LivePreviewPanel />
                <SuggestionsPanel maxVisible={3} className="flex-1 min-h-0" />
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Chat panel (floating) */}
      <ChatPanel />
    </div>
  );
}
