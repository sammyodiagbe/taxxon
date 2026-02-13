import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { crossCheckDocument } from '@/lib/validation/cross-check';
import type { DocumentType } from '@/types/tax-filing';

// Request validation schema
const requestSchema = z.object({
  documentType: z.string(),
  extractedFields: z.record(z.string(), z.union([z.string(), z.number()])),
  documentName: z.string().optional(),
  filing: z.object({
    income: z.object({
      t4Slips: z.array(z.any()),
      t4aSlips: z.array(z.any()),
      t4eSlips: z.array(z.any()),
      t5Slips: z.array(z.any()),
      t3Slips: z.array(z.any()),
      t2202Slips: z.array(z.any()),
      t4rspSlips: z.array(z.any()),
      t5008Slips: z.array(z.any()),
      selfEmploymentIncome: z.number(),
      otherIncome: z.number(),
    }),
    deductions: z.object({
      rrspContributions: z.array(z.any()),
      charitableDonations: z.array(z.any()),
      medicalExpenses: z.array(z.any()),
      childcareExpenses: z.number(),
      homeOfficeDays: z.number(),
      homeOfficeMethod: z.string(),
      movingExpenses: z.number(),
      studentLoanInterest: z.number(),
      professionalDues: z.number(),
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { documentType, extractedFields, documentName, filing } = validationResult.data;

    // Perform cross-validation
    const result = crossCheckDocument(
      {
        documentType: documentType as DocumentType,
        fields: extractedFields,
        documentName,
      },
      filing as any
    );

    return NextResponse.json({
      isValid: result.isValid,
      discrepancies: result.discrepancies,
      matches: result.matches,
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
