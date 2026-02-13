import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTaxSummaryPDF } from '@/lib/pdf/generate-tax-summary';
import type { TaxFiling, TaxSummary } from '@/types/tax-filing';

// Request validation
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

    const { filing, summary } = validationResult.data as {
      filing: TaxFiling;
      summary: TaxSummary;
    };

    // Generate PDF
    const result = await generateTaxSummaryPDF(filing, summary);

    if (!result.success || !result.pdfBytes) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate PDF' },
        { status: 500 }
      );
    }

    // Return PDF as download
    const filename = `Tax_Return_${filing.year}_${filing.personalInfo.lastName || 'Summary'}.pdf`;

    // Convert Uint8Array to Buffer for NextResponse
    const buffer = Buffer.from(result.pdfBytes);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
