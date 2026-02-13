'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTaxFiling } from '@/contexts/TaxFilingContext';
import { formatCurrency } from '@/lib/utils';
import type { RRSPContribution, CharitableDonation, MedicalExpense } from '@/types/tax-filing';

export function DeductionsForm() {
  const { currentFiling, updateDeductions } = useTaxFiling();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rrsp: true,
    donations: false,
    medical: false,
    other: false,
  });

  const deductions = currentFiling?.deductions;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // RRSP handlers
  const addRRSP = () => {
    const newContribution: RRSPContribution = {
      id: uuidv4(),
      institutionName: '',
      contributionAmount: 0,
      contributorType: 'self',
    };
    updateDeductions({ rrspContributions: [...(deductions?.rrspContributions || []), newContribution] });
  };

  const updateRRSP = (id: string, updates: Partial<RRSPContribution>) => {
    updateDeductions({
      rrspContributions: deductions?.rrspContributions.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const removeRRSP = (id: string) => {
    updateDeductions({ rrspContributions: deductions?.rrspContributions.filter((c) => c.id !== id) });
  };

  // Donation handlers
  const addDonation = () => {
    const newDonation: CharitableDonation = {
      id: uuidv4(),
      charityName: '',
      registrationNumber: '',
      donationAmount: 0,
      donationType: 'cash',
    };
    updateDeductions({ charitableDonations: [...(deductions?.charitableDonations || []), newDonation] });
  };

  const updateDonation = (id: string, updates: Partial<CharitableDonation>) => {
    updateDeductions({
      charitableDonations: deductions?.charitableDonations.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    });
  };

  const removeDonation = (id: string) => {
    updateDeductions({ charitableDonations: deductions?.charitableDonations.filter((d) => d.id !== id) });
  };

  // Medical expense handlers
  const addMedical = () => {
    const newExpense: MedicalExpense = {
      id: uuidv4(),
      description: '',
      amount: 0,
      forWhom: 'self',
    };
    updateDeductions({ medicalExpenses: [...(deductions?.medicalExpenses || []), newExpense] });
  };

  const updateMedical = (id: string, updates: Partial<MedicalExpense>) => {
    updateDeductions({
      medicalExpenses: deductions?.medicalExpenses.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    });
  };

  const removeMedical = (id: string) => {
    updateDeductions({ medicalExpenses: deductions?.medicalExpenses.filter((e) => e.id !== id) });
  };

  if (!deductions) return null;

  const totalRRSP = deductions.rrspContributions.reduce((sum, c) => sum + c.contributionAmount, 0);
  const totalDonations = deductions.charitableDonations.reduce((sum, d) => sum + d.donationAmount, 0);
  const totalMedical = deductions.medicalExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* RRSP Contributions */}
      <Card>
        <CardHeader
          className="cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('rrsp')}
        >
          <div>
            <CardTitle>RRSP Contributions</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">
              {deductions.rrspContributions.length} contribution(s) · {formatCurrency(totalRRSP)}
            </p>
          </div>
          {expandedSections.rrsp ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </CardHeader>
        {expandedSections.rrsp && (
          <CardContent className="space-y-4">
            {deductions.rrspContributions.map((contribution, index) => (
              <div key={contribution.id} className="rounded-md border border-neutral-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Contribution {index + 1}</span>
                  <button
                    onClick={() => removeRRSP(contribution.id)}
                    className="text-neutral-400 hover:text-black"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Institution"
                    value={contribution.institutionName}
                    onChange={(e) => updateRRSP(contribution.id, { institutionName: e.target.value })}
                    placeholder="Bank/Institution"
                  />
                  <Input
                    label="Amount"
                    type="number"
                    value={contribution.contributionAmount || ''}
                    onChange={(e) => updateRRSP(contribution.id, { contributionAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addRRSP} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add RRSP
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Charitable Donations */}
      <Card>
        <CardHeader
          className="cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('donations')}
        >
          <div>
            <CardTitle>Charitable Donations</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">
              {deductions.charitableDonations.length} donation(s) · {formatCurrency(totalDonations)}
            </p>
          </div>
          {expandedSections.donations ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </CardHeader>
        {expandedSections.donations && (
          <CardContent className="space-y-4">
            {deductions.charitableDonations.map((donation, index) => (
              <div key={donation.id} className="rounded-md border border-neutral-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Donation {index + 1}</span>
                  <button
                    onClick={() => removeDonation(donation.id)}
                    className="text-neutral-400 hover:text-black"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Charity name"
                    value={donation.charityName}
                    onChange={(e) => updateDonation(donation.id, { charityName: e.target.value })}
                    placeholder="Charity Name"
                  />
                  <Input
                    label="Amount"
                    type="number"
                    value={donation.donationAmount || ''}
                    onChange={(e) => updateDonation(donation.id, { donationAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addDonation} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Donation
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Medical Expenses */}
      <Card>
        <CardHeader
          className="cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('medical')}
        >
          <div>
            <CardTitle>Medical Expenses</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">
              {deductions.medicalExpenses.length} expense(s) · {formatCurrency(totalMedical)}
            </p>
          </div>
          {expandedSections.medical ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </CardHeader>
        {expandedSections.medical && (
          <CardContent className="space-y-4">
            {deductions.medicalExpenses.map((expense, index) => (
              <div key={expense.id} className="rounded-md border border-neutral-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Expense {index + 1}</span>
                  <button
                    onClick={() => removeMedical(expense.id)}
                    className="text-neutral-400 hover:text-black"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Description"
                    value={expense.description}
                    onChange={(e) => updateMedical(expense.id, { description: e.target.value })}
                    placeholder="Medical service/item"
                  />
                  <Input
                    label="Amount"
                    type="number"
                    value={expense.amount || ''}
                    onChange={(e) => updateMedical(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addMedical} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Medical Expense
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Other Deductions */}
      <Card>
        <CardHeader
          className="cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('other')}
        >
          <div>
            <CardTitle>Other Deductions</CardTitle>
            <p className="text-sm text-neutral-500 mt-1">Home office, childcare, etc.</p>
          </div>
          {expandedSections.other ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </CardHeader>
        {expandedSections.other && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Childcare expenses"
                type="number"
                value={deductions.childcareExpenses || ''}
                onChange={(e) => updateDeductions({ childcareExpenses: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              <Input
                label="Student loan interest"
                type="number"
                value={deductions.studentLoanInterest || ''}
                onChange={(e) => updateDeductions({ studentLoanInterest: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              <Input
                label="Home office days"
                type="number"
                value={deductions.homeOfficeDays || ''}
                onChange={(e) => updateDeductions({ homeOfficeDays: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
              <Select
                label="Home office method"
                options={[
                  { value: '', label: 'Select method' },
                  { value: 'flat-rate', label: 'Flat rate ($2/day)' },
                  { value: 'detailed', label: 'Detailed method' },
                ]}
                value={deductions.homeOfficeMethod}
                onChange={(e) => updateDeductions({ homeOfficeMethod: e.target.value as 'flat-rate' | 'detailed' | '' })}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
