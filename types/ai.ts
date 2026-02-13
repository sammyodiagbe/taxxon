// AI-related types for Taxxon

import type { DocumentType } from './tax-filing';

// Confidence level for extracted fields
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Extracted field from document OCR
export interface ExtractedField {
  fieldName: string;
  value: string | number;
  confidence: ConfidenceLevel;
  originalText?: string; // Raw text as recognized by OCR
}

// Result from document extraction API
export interface DocumentExtractionResult {
  documentType: DocumentType;
  extractedData: ExtractedField[];
  suggestions: string[];
  rawText?: string;
}

// Request for document extraction
export interface DocumentExtractionRequest {
  imageData: string; // Base64 encoded image
  mimeType: string;
  expectedType?: DocumentType;
}

// Tax suggestion types
export type SuggestionType =
  | 'missing_deduction'
  | 'validation_error'
  | 'optimization'
  | 'warning'
  | 'info';

// Individual tax suggestion
export interface TaxSuggestion {
  id: string;
  type: SuggestionType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedFields: string[];
  actionLabel?: string;
  actionRoute?: string;
  estimatedImpact?: number; // Potential tax savings/liability
}

// Request for suggestions
export interface SuggestionsRequest {
  income: {
    t4Total: number;
    t4aTotal: number;
    t4eTotal: number;
    t5Total: number;
    t3Total: number;
    selfEmploymentIncome: number;
    otherIncome: number;
  };
  deductions: {
    rrspTotal: number;
    donationsTotal: number;
    medicalTotal: number;
    childcareExpenses: number;
    homeOfficeDays: number;
    homeOfficeMethod: string;
    movingExpenses: number;
    studentLoanInterest: number;
    professionalDues: number;
  };
  province: string;
  hasSpouse: boolean;
  hasDependents: boolean;
}

// Response from suggestions API
export interface SuggestionsResponse {
  suggestions: TaxSuggestion[];
  lastUpdated: string;
}

// Chat message
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// Chat context for system prompt
export interface ChatFilingContext {
  year: number;
  province: string;
  totalIncome: number;
  totalDeductions: number;
  estimatedRefund: number;
  hasT4: boolean;
  hasT5: boolean;
  hasRRSP: boolean;
  hasDonations: boolean;
  hasMedical: boolean;
  hasHomeOffice: boolean;
}

// Chat request
export interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  context: ChatFilingContext;
}

// Streaming chat response chunk
export interface ChatStreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

// Live preview summary
export interface LivePreviewData {
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  estimatedTax: number;
  taxWithheld: number;
  refundOrOwing: number;
  isRefund: boolean;
  breakdown: {
    federalTax: number;
    provincialTax: number;
    credits: number;
  };
}

// Extraction review state
export interface ExtractionReviewState {
  isOpen: boolean;
  isLoading: boolean;
  result: DocumentExtractionResult | null;
  editedFields: Record<string, string | number>;
  documentId?: string;
}
