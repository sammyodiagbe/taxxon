'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { formatCurrency } from '@/lib/utils';
import type { T4Slip, T5Slip, T4ASlip, T4ESlip } from '@/types/tax-filing';

export function IncomeForm() {
  const { currentFiling, updateIncome } = useTaxFiling();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    t4: true,
    t5: false,
    t4a: false,
    t4e: false,
    other: false,
  });

  const income = currentFiling?.income;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // T4 handlers
  const addT4 = () => {
    const newSlip: T4Slip = {
      id: uuidv4(),
      employerName: '',
      employerAddress: '',
      employmentIncome: 0,
      incomeTaxDeducted: 0,
      cppContributions: 0,
      eiPremiums: 0,
      rppContributions: 0,
      unionDues: 0,
      charitableDonations: 0,
    };
    updateIncome({ t4Slips: [...(income?.t4Slips || []), newSlip] });
  };

  const updateT4 = (id: string, updates: Partial<T4Slip>) => {
    updateIncome({
      t4Slips: income?.t4Slips.map((slip) =>
        slip.id === id ? { ...slip, ...updates } : slip
      ),
    });
  };

  const removeT4 = (id: string) => {
    updateIncome({ t4Slips: income?.t4Slips.filter((slip) => slip.id !== id) });
  };

  // T5 handlers
  const addT5 = () => {
    const newSlip: T5Slip = {
      id: uuidv4(),
      payerName: '',
      actualDividends: 0,
      interestFromCanadianSources: 0,
      capitalGainsDividends: 0,
      foreignIncome: 0,
      foreignTaxPaid: 0,
    };
    updateIncome({ t5Slips: [...(income?.t5Slips || []), newSlip] });
  };

  const updateT5 = (id: string, updates: Partial<T5Slip>) => {
    updateIncome({
      t5Slips: income?.t5Slips.map((slip) =>
        slip.id === id ? { ...slip, ...updates } : slip
      ),
    });
  };

  const removeT5 = (id: string) => {
    updateIncome({ t5Slips: income?.t5Slips.filter((slip) => slip.id !== id) });
  };

  // T4A handlers
  const addT4A = () => {
    const newSlip: T4ASlip = {
      id: uuidv4(),
      payerName: '',
      pensionIncome: 0,
      lumpSumPayments: 0,
      selfEmployedCommissions: 0,
      incomeTaxDeducted: 0,
      otherIncome: 0,
    };
    updateIncome({ t4aSlips: [...(income?.t4aSlips || []), newSlip] });
  };

  const updateT4A = (id: string, updates: Partial<T4ASlip>) => {
    updateIncome({
      t4aSlips: income?.t4aSlips.map((slip) =>
        slip.id === id ? { ...slip, ...updates } : slip
      ),
    });
  };

  const removeT4A = (id: string) => {
    updateIncome({ t4aSlips: income?.t4aSlips.filter((slip) => slip.id !== id) });
  };

  // T4E handlers
  const addT4E = () => {
    const newSlip: T4ESlip = {
      id: uuidv4(),
      eiBenefits: 0,
      incomeTaxDeducted: 0,
      amountRepaid: 0,
    };
    updateIncome({ t4eSlips: [...(income?.t4eSlips || []), newSlip] });
  };

  const updateT4E = (id: string, updates: Partial<T4ESlip>) => {
    updateIncome({
      t4eSlips: income?.t4eSlips.map((slip) =>
        slip.id === id ? { ...slip, ...updates } : slip
      ),
    });
  };

  const removeT4E = (id: string) => {
    updateIncome({ t4eSlips: income?.t4eSlips.filter((slip) => slip.id !== id) });
  };

  if (!income) return null;

  const totalT4Income = income.t4Slips.reduce((sum, slip) => sum + slip.employmentIncome, 0);
  const totalT5Income = income.t5Slips.reduce(
    (sum, slip) => sum + slip.actualDividends + slip.interestFromCanadianSources,
    0
  );

  return (
    <div className="space-y-4">
      {/* T4 - Employment Income */}
      <Card>
        <CardHeader
          className="cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('t4')}
        >
          <div>
            <CardTitle>T4 - Employment Income</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">
              {income.t4Slips.length} slip(s) · {formatCurrency(totalT4Income)}
            </p>
          </div>
          {expandedSections.t4 ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </CardHeader>
        {expandedSections.t4 && (
          <CardContent className="space-y-4">
            {income.t4Slips.map((slip, index) => (
              <div key={slip.id} className="rounded-md border border-neutral-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Slip {index + 1}</span>
                  <button
                    onClick={() => removeT4(slip.id)}
                    className="text-neutral-400 hover:text-black"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Employer name"
                    value={slip.employerName}
                    onChange={(e) => updateT4(slip.id, { employerName: e.target.value })}
                    placeholder="Company Name"
                  />
                  <Input
                    label="Box 14 - Employment income"
                    type="number"
                    value={slip.employmentIncome || ''}
                    onChange={(e) => updateT4(slip.id, { employmentIncome: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                  <Input
                    label="Box 22 - Income tax deducted"
                    type="number"
                    value={slip.incomeTaxDeducted || ''}
                    onChange={(e) => updateT4(slip.id, { incomeTaxDeducted: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                  <Input
                    label="Box 16 - CPP contributions"
                    type="number"
                    value={slip.cppContributions || ''}
                    onChange={(e) => updateT4(slip.id, { cppContributions: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                  <Input
                    label="Box 18 - EI premiums"
                    type="number"
                    value={slip.eiPremiums || ''}
                    onChange={(e) => updateT4(slip.id, { eiPremiums: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addT4} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add T4
            </Button>
          </CardContent>
        )}
      </Card>

      {/* T5 - Investment Income */}
      <Card>
        <CardHeader
          className="cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('t5')}
        >
          <div>
            <CardTitle>T5 - Investment Income</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">
              {income.t5Slips.length} slip(s) · {formatCurrency(totalT5Income)}
            </p>
          </div>
          {expandedSections.t5 ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </CardHeader>
        {expandedSections.t5 && (
          <CardContent className="space-y-4">
            {income.t5Slips.map((slip, index) => (
              <div key={slip.id} className="rounded-md border border-neutral-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Slip {index + 1}</span>
                  <button
                    onClick={() => removeT5(slip.id)}
                    className="text-neutral-400 hover:text-black"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Payer name"
                    value={slip.payerName}
                    onChange={(e) => updateT5(slip.id, { payerName: e.target.value })}
                    placeholder="Bank/Institution"
                  />
                  <Input
                    label="Box 10 - Dividends"
                    type="number"
                    value={slip.actualDividends || ''}
                    onChange={(e) => updateT5(slip.id, { actualDividends: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                  <Input
                    label="Box 13 - Interest"
                    type="number"
                    value={slip.interestFromCanadianSources || ''}
                    onChange={(e) => updateT5(slip.id, { interestFromCanadianSources: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addT5} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add T5
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Other Income */}
      <Card>
        <CardHeader
          className="cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('other')}
        >
          <div>
            <CardTitle>Other Income</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">Self-employment and other sources</p>
          </div>
          {expandedSections.other ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </CardHeader>
        {expandedSections.other && (
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Self-employment income"
                type="number"
                value={income.selfEmploymentIncome || ''}
                onChange={(e) => updateIncome({ selfEmploymentIncome: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              <Input
                label="Other income"
                type="number"
                value={income.otherIncome || ''}
                onChange={(e) => updateIncome({ otherIncome: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
