import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { DocumentExtractionResult, ExtractedField, ConfidenceLevel } from '@/types/ai';
import type { DocumentType } from '@/types/tax-filing';

const client = new Anthropic();

// Request validation schema
const requestSchema = z.object({
  imageData: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  expectedType: z.string().optional(),
});

// Map of document types to their expected fields
const documentFieldMap: Record<string, string[]> = {
  t4: [
    'employerName',
    'employmentIncome',
    'incomeTaxDeducted',
    'cppContributions',
    'eiPremiums',
    'rppContributions',
    'unionDues',
    'charitableDonations',
  ],
  t4a: [
    'payerName',
    'pensionIncome',
    'lumpSumPayments',
    'selfEmployedCommissions',
    'incomeTaxDeducted',
    'otherIncome',
  ],
  t4e: ['eiBenefits', 'incomeTaxDeducted', 'amountRepaid'],
  t5: [
    'payerName',
    'actualDividends',
    'interestFromCanadianSources',
    'capitalGainsDividends',
    'foreignIncome',
    'foreignTaxPaid',
  ],
  t3: [
    'trustName',
    'capitalGains',
    'eligibleDividends',
    'otherDividends',
    'foreignBusinessIncome',
    'foreignNonBusinessIncome',
    'otherIncome',
  ],
  t2202: ['institutionName', 'eligibleTuitionFees', 'monthsPartTime', 'monthsFullTime'],
  't4rsp': ['payerName', 'rrspIncome', 'incomeTaxDeducted'],
  't5008': ['securityDescription', 'proceeds', 'costBase'],
  'rrsp-receipt': ['institutionName', 'contributionAmount', 'contributorType'],
  'donation-receipt': ['charityName', 'registrationNumber', 'donationAmount'],
  'medical-receipt': ['description', 'amount'],
};

// System prompt for document extraction
const systemPrompt = `You are a Canadian tax document extraction specialist. Your task is to extract key tax-related information from uploaded documents.

For each field you extract:
1. Provide the field name exactly as specified
2. Provide the value (numbers should be numeric, not strings with $ or commas)
3. Assess your confidence level:
   - "high": Field is clearly visible and unambiguous
   - "medium": Field is present but partially obscured or unclear
   - "low": Field is inferred or barely legible

Common Canadian tax slip types:
- T4: Statement of Remuneration Paid (employment income)
- T4A: Statement of Pension, Retirement, Annuity, and Other Income
- T4E: Statement of Employment Insurance and Other Benefits
- T5: Statement of Investment Income
- T3: Statement of Trust Income Allocations
- T2202: Tuition and Enrolment Certificate
- T4RSP: Statement of RRSP Income
- T5008: Statement of Securities Transactions

IMPORTANT: Do NOT extract personal information like SIN numbers, names, or addresses. Focus only on financial figures and box numbers.

Respond in JSON format:
{
  "documentType": "t4" | "t4a" | "t4e" | "t5" | "t3" | "t2202" | "t4rsp" | "t5008" | "rrsp-receipt" | "donation-receipt" | "medical-receipt" | "other",
  "fields": [
    { "fieldName": "string", "value": number | string, "confidence": "high" | "medium" | "low", "originalText": "raw text if different from value" }
  ],
  "suggestions": ["any tips or notes about the extraction"]
}`;

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

    const { imageData, mimeType, expectedType } = validationResult.data;

    // Build the user prompt
    let userPrompt = 'Please extract all tax-relevant information from this document.';
    if (expectedType && documentFieldMap[expectedType]) {
      userPrompt += ` This appears to be a ${expectedType.toUpperCase()} slip. Please look for these fields: ${documentFieldMap[expectedType].join(', ')}.`;
    }

    // Determine media type for API
    const mediaType = mimeType === 'application/pdf' ? 'image/png' : mimeType;

    // Call Claude Vision API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                data: imageData,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      system: systemPrompt,
    });

    // Parse the response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from AI' },
        { status: 500 }
      );
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = textContent.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Parse the JSON response
    let parsedResponse: {
      documentType: string;
      fields: Array<{
        fieldName: string;
        value: string | number;
        confidence: string;
        originalText?: string;
      }>;
      suggestions: string[];
    };

    try {
      parsedResponse = JSON.parse(jsonText.trim());
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', rawResponse: textContent.text },
        { status: 500 }
      );
    }

    // Transform to our response format
    const result: DocumentExtractionResult = {
      documentType: parsedResponse.documentType as DocumentType,
      extractedData: parsedResponse.fields.map((field) => ({
        fieldName: field.fieldName,
        value: field.value,
        confidence: field.confidence as ConfidenceLevel,
        originalText: field.originalText,
      })),
      suggestions: parsedResponse.suggestions || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Document extraction error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: 'AI API error', message: error.message },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
