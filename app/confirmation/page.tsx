'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { formatCurrency } from '@/lib/utils';
import { Suspense } from 'react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentFiling } = useTaxFiling();

  const confirmationNumber = searchParams.get('confirmation') || currentFiling?.confirmationNumber;

  if (!confirmationNumber) {
    router.push('/dashboard');
    return null;
  }

  const summary = currentFiling?.summary;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-lg px-6 py-20">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-black mb-6">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-black mb-2">
            Filed Successfully
          </h1>
          <p className="text-neutral-600">
            Your tax return has been submitted to the CRA.
          </p>
        </div>

        <Card className="mb-8 border-2">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-neutral-500 mb-2">Confirmation Number</p>
            <p className="text-lg font-mono font-semibold text-black">
              {confirmationNumber}
            </p>
          </CardContent>
        </Card>

        {summary && (
          <Card className="mb-8">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-neutral-600 mb-1">
                {summary.refundOrOwing >= 0 ? 'Expected Refund' : 'Amount Owing'}
              </p>
              <p className="text-3xl font-semibold text-black">
                {formatCurrency(Math.abs(summary.refundOrOwing))}
              </p>
              {summary.refundOrOwing >= 0 ? (
                <p className="text-sm text-neutral-500 mt-3">
                  Direct deposit within 2-8 weeks
                </p>
              ) : (
                <p className="text-sm text-neutral-500 mt-3">
                  Due by April 30, {(currentFiling?.year || 2024) + 1}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-neutral-500">Next Steps</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="text-neutral-400">1.</span>
              <span className="text-neutral-700">Check your CRA My Account for status updates</span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400">2.</span>
              <span className="text-neutral-700">Keep your documents for at least 6 years</span>
            </li>
            <li className="flex gap-3">
              <span className="text-neutral-400">3.</span>
              <span className="text-neutral-700">Watch for your Notice of Assessment</span>
            </li>
          </ul>
        </div>

        <div className="mt-10">
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Back to Dashboard
          </Button>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-8">
          Thank you for using Taxxon
        </p>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
