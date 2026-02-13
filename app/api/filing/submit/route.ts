import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { submitToNetfile, validateForNetfile, getProviderName } from '@/lib/netfile/service';
import type { TaxFiling, TaxSummary } from '@/types/tax-filing';

// Request validation - accepts full filing and summary
const requestSchema = z.object({
  filing: z.any(), // TaxFiling object
  summary: z.object({
    totalIncome: z.number(),
    totalDeductions: z.number(),
    taxableIncome: z.number(),
    federalTax: z.number(),
    provincialTax: z.number(),
    totalTax: z.number(),
    totalCredits: z.number(),
    totalPaid: z.number(),
    refundOrOwing: z.number(),
  }),
  validateOnly: z.boolean().optional().default(false),
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

    const { filing, summary, validateOnly } = validationResult.data as {
      filing: TaxFiling;
      summary: TaxSummary;
      validateOnly: boolean;
    };

    // If validate only, just check without submitting
    if (validateOnly) {
      const validation = await validateForNetfile(filing, summary);
      return NextResponse.json({
        valid: validation.valid,
        errors: validation.errors,
        provider: getProviderName(),
      });
    }

    // Submit to NETFILE
    const result = await submitToNetfile(filing, summary);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errors: result.errors,
          provider: getProviderName(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      confirmationNumber: result.confirmationNumber,
      status: result.status,
      timestamp: result.timestamp,
      warnings: result.warnings,
      provider: getProviderName(),
    });
  } catch (error) {
    console.error('Filing submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
