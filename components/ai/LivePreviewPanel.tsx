'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calculator, CreditCard, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaxFiling } from '@/contexts/TaxFilingContext';

interface BreakdownItem {
  label: string;
  value: number;
  icon: React.ReactNode;
}

export function LivePreviewPanel() {
  const { currentFiling, calculateSummary } = useTaxFiling();

  const summary = useMemo(() => {
    if (!currentFiling) return null;
    return calculateSummary();
  }, [currentFiling, calculateSummary]);

  if (!summary || !currentFiling) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm text-neutral-500 text-center">
          Enter your tax information to see your estimated refund
        </p>
      </div>
    );
  }

  const isRefund = summary.refundOrOwing >= 0;
  const amount = Math.abs(summary.refundOrOwing);

  const breakdownItems: BreakdownItem[] = [
    {
      label: 'Total Income',
      value: summary.totalIncome,
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Deductions',
      value: summary.totalDeductions,
      icon: <Minus className="h-4 w-4" />,
    },
    {
      label: 'Tax Calculated',
      value: summary.totalTax,
      icon: <Calculator className="h-4 w-4" />,
    },
    {
      label: 'Tax Withheld',
      value: summary.totalPaid,
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Main refund/owing display */}
      <div
        className={cn(
          'p-6 text-center',
          isRefund ? 'bg-green-50' : 'bg-amber-50'
        )}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          {isRefund ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-amber-600" />
          )}
          <span
            className={cn(
              'text-sm font-medium',
              isRefund ? 'text-green-600' : 'text-amber-600'
            )}
          >
            {isRefund ? 'Estimated Refund' : 'Estimated Owing'}
          </span>
        </div>
        <div
          className={cn(
            'text-4xl font-bold tracking-tight',
            isRefund ? 'text-green-700' : 'text-amber-700'
          )}
        >
          ${amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Based on your {currentFiling.year} tax return
        </p>
      </div>

      {/* Breakdown */}
      <div className="p-4 space-y-3">
        <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          Breakdown
        </h3>
        <div className="space-y-2">
          {breakdownItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="text-neutral-400">{item.icon}</span>
                {item.label}
              </div>
              <span className="font-medium text-neutral-900">
                ${item.value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>

        {/* Tax breakdown */}
        <div className="pt-3 mt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Federal: ${summary.federalTax.toLocaleString('en-CA', { minimumFractionDigits: 0 })}</span>
            <span>Provincial: ${summary.provincialTax.toLocaleString('en-CA', { minimumFractionDigits: 0 })}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
            <span>Credits: -${summary.totalCredits.toLocaleString('en-CA', { minimumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-neutral-400 text-center">
          This is an estimate. Actual amounts may vary.
        </p>
      </div>
    </div>
  );
}
