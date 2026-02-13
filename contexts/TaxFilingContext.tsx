'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  getUserFilings,
  saveUserFilings,
  getCurrentFilingId,
  setCurrentFilingId,
} from '@/lib/storage';

// Default user ID for non-auth mode
const DEFAULT_USER_ID = 'default-user';
import type {
  TaxFiling,
  PersonalInfo,
  IncomeData,
  Deductions,
  TaxDocument,
  TaxSummary,
  WizardStep,
} from '@/types/tax-filing';

interface TaxFilingState {
  filings: TaxFiling[];
  currentFiling: TaxFiling | null;
  currentStep: WizardStep;
  isLoading: boolean;
  isSaving: boolean;
}

interface TaxFilingContextType extends TaxFilingState {
  createFiling: (year: number) => TaxFiling;
  loadFiling: (id: string) => void;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  updateIncome: (income: Partial<IncomeData>) => void;
  updateDeductions: (deductions: Partial<Deductions>) => void;
  addDocument: (document: TaxDocument) => void;
  removeDocument: (id: string) => void;
  setStep: (step: WizardStep) => void;
  calculateSummary: () => TaxSummary;
  submitFiling: () => string;
  deleteFiling: (id: string) => void;
}

type TaxFilingAction =
  | { type: 'SET_FILINGS'; payload: TaxFiling[] }
  | { type: 'SET_CURRENT_FILING'; payload: TaxFiling | null }
  | { type: 'UPDATE_CURRENT_FILING'; payload: Partial<TaxFiling> }
  | { type: 'SET_STEP'; payload: WizardStep }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean };

const createEmptyFiling = (year: number): TaxFiling => ({
  id: uuidv4(),
  year,
  status: 'not-started',
  personalInfo: {
    firstName: '',
    lastName: '',
    sin: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    province: '',
    maritalStatus: '',
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
    },
  },
  income: {
    t4Slips: [],
    t4aSlips: [],
    t4eSlips: [],
    t5Slips: [],
    t3Slips: [],
    t2202Slips: [],
    t4rspSlips: [],
    t5008Slips: [],
    selfEmploymentIncome: 0,
    otherIncome: 0,
  },
  deductions: {
    rrspContributions: [],
    charitableDonations: [],
    medicalExpenses: [],
    childcareExpenses: 0,
    homeOfficeDays: 0,
    homeOfficeMethod: '',
    movingExpenses: 0,
    studentLoanInterest: 0,
    professionalDues: 0,
  },
  documents: [],
  summary: null,
  confirmationNumber: null,
  submittedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function taxFilingReducer(state: TaxFilingState, action: TaxFilingAction): TaxFilingState {
  switch (action.type) {
    case 'SET_FILINGS':
      return { ...state, filings: action.payload, isLoading: false };
    case 'SET_CURRENT_FILING':
      return { ...state, currentFiling: action.payload };
    case 'UPDATE_CURRENT_FILING':
      if (!state.currentFiling) return state;
      const updated = {
        ...state.currentFiling,
        ...action.payload,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        currentFiling: updated,
        filings: state.filings.map((f) => (f.id === updated.id ? updated : f)),
      };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    default:
      return state;
  }
}

const initialState: TaxFilingState = {
  filings: [],
  currentFiling: null,
  currentStep: 'personal-info',
  isLoading: true,
  isSaving: false,
};

const TaxFilingContext = createContext<TaxFilingContextType | undefined>(undefined);

export function TaxFilingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taxFilingReducer, initialState);

  // Load filings on mount
  useEffect(() => {
    const filings = getUserFilings(DEFAULT_USER_ID);
    dispatch({ type: 'SET_FILINGS', payload: filings });

    const currentFilingId = getCurrentFilingId();
    if (currentFilingId) {
      const filing = filings.find((f) => f.id === currentFilingId);
      if (filing) {
        dispatch({ type: 'SET_CURRENT_FILING', payload: filing });
      }
    }
  }, []);

  // Auto-save filings when they change
  useEffect(() => {
    if (state.filings.length > 0) {
      saveUserFilings(DEFAULT_USER_ID, state.filings);
    }
  }, [state.filings]);

  const createFiling = useCallback((year: number) => {
    const filing = createEmptyFiling(year);
    dispatch({ type: 'SET_FILINGS', payload: [...state.filings, filing] });
    dispatch({ type: 'SET_CURRENT_FILING', payload: filing });
    setCurrentFilingId(filing.id);
    return filing;
  }, [state.filings]);

  const loadFiling = useCallback((id: string) => {
    const filing = state.filings.find((f) => f.id === id);
    if (filing) {
      dispatch({ type: 'SET_CURRENT_FILING', payload: filing });
      setCurrentFilingId(id);
    }
  }, [state.filings]);

  const updatePersonalInfo = useCallback((info: Partial<PersonalInfo>) => {
    if (!state.currentFiling) return;
    dispatch({
      type: 'UPDATE_CURRENT_FILING',
      payload: {
        personalInfo: { ...state.currentFiling.personalInfo, ...info },
        status: state.currentFiling.status === 'not-started' ? 'in-progress' : state.currentFiling.status,
      },
    });
  }, [state.currentFiling]);

  const updateIncome = useCallback((income: Partial<IncomeData>) => {
    if (!state.currentFiling) return;
    dispatch({
      type: 'UPDATE_CURRENT_FILING',
      payload: {
        income: { ...state.currentFiling.income, ...income },
      },
    });
  }, [state.currentFiling]);

  const updateDeductions = useCallback((deductions: Partial<Deductions>) => {
    if (!state.currentFiling) return;
    dispatch({
      type: 'UPDATE_CURRENT_FILING',
      payload: {
        deductions: { ...state.currentFiling.deductions, ...deductions },
      },
    });
  }, [state.currentFiling]);

  const addDocument = useCallback((document: TaxDocument) => {
    if (!state.currentFiling) return;
    dispatch({
      type: 'UPDATE_CURRENT_FILING',
      payload: {
        documents: [...state.currentFiling.documents, document],
      },
    });
  }, [state.currentFiling]);

  const removeDocument = useCallback((id: string) => {
    if (!state.currentFiling) return;
    dispatch({
      type: 'UPDATE_CURRENT_FILING',
      payload: {
        documents: state.currentFiling.documents.filter((d) => d.id !== id),
      },
    });
  }, [state.currentFiling]);

  const setStep = useCallback((step: WizardStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const calculateSummary = useCallback((): TaxSummary => {
    if (!state.currentFiling) {
      return {
        totalIncome: 0,
        totalDeductions: 0,
        taxableIncome: 0,
        federalTax: 0,
        provincialTax: 0,
        totalTax: 0,
        totalCredits: 0,
        totalPaid: 0,
        refundOrOwing: 0,
      };
    }

    const { income, deductions } = state.currentFiling;

    // Calculate total income
    const t4Income = income.t4Slips.reduce((sum, slip) => sum + slip.employmentIncome, 0);
    const t4aIncome = income.t4aSlips.reduce(
      (sum, slip) => sum + slip.pensionIncome + slip.lumpSumPayments + slip.selfEmployedCommissions + slip.otherIncome,
      0
    );
    const t4eIncome = income.t4eSlips.reduce((sum, slip) => sum + slip.eiBenefits, 0);
    const t5Income = income.t5Slips.reduce(
      (sum, slip) => sum + slip.actualDividends + slip.interestFromCanadianSources + slip.capitalGainsDividends,
      0
    );
    const t3Income = income.t3Slips.reduce(
      (sum, slip) =>
        sum + slip.capitalGains * 0.5 + slip.eligibleDividends + slip.otherDividends + slip.otherIncome,
      0
    );
    const t4rspIncome = income.t4rspSlips.reduce((sum, slip) => sum + slip.rrspIncome, 0);
    const t5008Gains = income.t5008Slips.reduce((sum, slip) => sum + Math.max(0, slip.proceeds - slip.costBase) * 0.5, 0);

    const totalIncome =
      t4Income + t4aIncome + t4eIncome + t5Income + t3Income + t4rspIncome + t5008Gains +
      income.selfEmploymentIncome + income.otherIncome;

    // Calculate deductions
    const rrspDeductions = deductions.rrspContributions.reduce((sum, c) => sum + c.contributionAmount, 0);
    const homeOfficeDeduction =
      deductions.homeOfficeMethod === 'flat-rate' ? deductions.homeOfficeDays * 2 : 0; // $2/day flat rate

    const totalDeductions =
      rrspDeductions +
      deductions.childcareExpenses +
      homeOfficeDeduction +
      deductions.movingExpenses +
      deductions.professionalDues;

    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    // Simplified Canadian federal tax brackets (2024)
    let federalTax = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 55867) {
        federalTax = taxableIncome * 0.15;
      } else if (taxableIncome <= 111733) {
        federalTax = 8380 + (taxableIncome - 55867) * 0.205;
      } else if (taxableIncome <= 173205) {
        federalTax = 19833 + (taxableIncome - 111733) * 0.26;
      } else if (taxableIncome <= 246752) {
        federalTax = 35816 + (taxableIncome - 173205) * 0.29;
      } else {
        federalTax = 57144 + (taxableIncome - 246752) * 0.33;
      }
    }

    // Simplified provincial tax (using Ontario rates as example)
    let provincialTax = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 51446) {
        provincialTax = taxableIncome * 0.0505;
      } else if (taxableIncome <= 102894) {
        provincialTax = 2598 + (taxableIncome - 51446) * 0.0915;
      } else if (taxableIncome <= 150000) {
        provincialTax = 7307 + (taxableIncome - 102894) * 0.1116;
      } else if (taxableIncome <= 220000) {
        provincialTax = 12563 + (taxableIncome - 150000) * 0.1216;
      } else {
        provincialTax = 21075 + (taxableIncome - 220000) * 0.1316;
      }
    }

    // Calculate credits
    const basicPersonalAmount = 15705; // 2024 federal BPA
    const basicPersonalCredit = basicPersonalAmount * 0.15;
    const donationCredits = deductions.charitableDonations.reduce((sum, d) => {
      const amount = d.donationAmount;
      if (amount <= 200) return sum + amount * 0.15;
      return sum + 30 + (amount - 200) * 0.29;
    }, 0);
    const medicalCredits = Math.max(
      0,
      (deductions.medicalExpenses.reduce((sum, e) => sum + e.amount, 0) - totalIncome * 0.03) * 0.15
    );
    const tuitionCredits = income.t2202Slips.reduce((sum, slip) => sum + slip.eligibleTuitionFees * 0.15, 0);
    const studentLoanCredit = deductions.studentLoanInterest * 0.15;

    const totalCredits = basicPersonalCredit + donationCredits + medicalCredits + tuitionCredits + studentLoanCredit;

    const totalTax = Math.max(0, federalTax + provincialTax - totalCredits);

    // Calculate taxes already paid
    const t4TaxPaid = income.t4Slips.reduce((sum, slip) => sum + slip.incomeTaxDeducted, 0);
    const t4aTaxPaid = income.t4aSlips.reduce((sum, slip) => sum + slip.incomeTaxDeducted, 0);
    const t4eTaxPaid = income.t4eSlips.reduce((sum, slip) => sum + slip.incomeTaxDeducted, 0);
    const t4rspTaxPaid = income.t4rspSlips.reduce((sum, slip) => sum + slip.incomeTaxDeducted, 0);

    const totalPaid = t4TaxPaid + t4aTaxPaid + t4eTaxPaid + t4rspTaxPaid;

    const refundOrOwing = totalPaid - totalTax;

    return {
      totalIncome,
      totalDeductions,
      taxableIncome,
      federalTax,
      provincialTax,
      totalTax,
      totalCredits,
      totalPaid,
      refundOrOwing,
    };
  }, [state.currentFiling]);

  const submitFiling = useCallback(() => {
    if (!state.currentFiling) return '';

    const confirmationNumber = `CRA-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const summary = calculateSummary();

    dispatch({
      type: 'UPDATE_CURRENT_FILING',
      payload: {
        status: 'submitted',
        summary,
        confirmationNumber,
        submittedAt: new Date().toISOString(),
      },
    });

    return confirmationNumber;
  }, [state.currentFiling, calculateSummary]);

  const deleteFiling = useCallback((id: string) => {
    const newFilings = state.filings.filter((f) => f.id !== id);
    dispatch({ type: 'SET_FILINGS', payload: newFilings });

    if (state.currentFiling?.id === id) {
      dispatch({ type: 'SET_CURRENT_FILING', payload: null });
      setCurrentFilingId(null);
    }
  }, [state.filings, state.currentFiling]);

  return (
    <TaxFilingContext.Provider
      value={{
        ...state,
        createFiling,
        loadFiling,
        updatePersonalInfo,
        updateIncome,
        updateDeductions,
        addDocument,
        removeDocument,
        setStep,
        calculateSummary,
        submitFiling,
        deleteFiling,
      }}
    >
      {children}
    </TaxFilingContext.Provider>
  );
}

export function useTaxFiling() {
  const context = useContext(TaxFilingContext);
  if (!context) {
    throw new Error('useTaxFiling must be used within a TaxFilingProvider');
  }
  return context;
}
