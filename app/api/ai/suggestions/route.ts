import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { getStaticSuggestions } from '@/lib/suggestions/rules';
import type { TaxSuggestion, SuggestionsRequest, SuggestionsResponse } from '@/types/ai';
import { v4 as uuidv4 } from 'uuid';

const client = new Anthropic();

// Request validation schema
const requestSchema = z.object({
  income: z.object({
    t4Total: z.number(),
    t4aTotal: z.number(),
    t4eTotal: z.number(),
    t5Total: z.number(),
    t3Total: z.number(),
    selfEmploymentIncome: z.number(),
    otherIncome: z.number(),
  }),
  deductions: z.object({
    rrspTotal: z.number(),
    donationsTotal: z.number(),
    medicalTotal: z.number(),
    childcareExpenses: z.number(),
    homeOfficeDays: z.number(),
    homeOfficeMethod: z.string(),
    movingExpenses: z.number(),
    studentLoanInterest: z.number(),
    professionalDues: z.number(),
  }),
  province: z.string(),
  hasSpouse: z.boolean(),
  hasDependents: z.boolean(),
  useAI: z.boolean().optional().default(true),
});

// System prompt for AI suggestions
const systemPrompt = `You are a Canadian tax optimization specialist. Analyze the provided tax filing summary and suggest potential deductions, credits, or optimizations the filer might have missed.

Guidelines:
1. Focus on practical, actionable suggestions
2. Consider 2024 Canadian tax rules
3. Be specific about potential dollar amounts when possible
4. Prioritize high-impact suggestions
5. Don't repeat obvious suggestions if the user has already claimed relevant deductions
6. Consider province-specific credits and deductions

For each suggestion, provide:
- type: "missing_deduction" | "optimization" | "warning" | "info"
- priority: "high" | "medium" | "low"
- title: Brief title (max 50 chars)
- description: Detailed explanation (2-3 sentences)
- estimatedImpact: Estimated tax savings in dollars (if applicable)
- affectedFields: Array of field paths this affects

Respond in JSON format:
{
  "suggestions": [
    {
      "type": "string",
      "priority": "string",
      "title": "string",
      "description": "string",
      "estimatedImpact": number or null,
      "affectedFields": ["string"]
    }
  ]
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

    const data = validationResult.data as SuggestionsRequest & { useAI?: boolean };

    // Get static rule-based suggestions
    const staticSuggestions = getStaticSuggestions(data);

    // If AI is disabled or no API key, return only static suggestions
    if (!data.useAI || !process.env.ANTHROPIC_API_KEY) {
      const response: SuggestionsResponse = {
        suggestions: staticSuggestions,
        lastUpdated: new Date().toISOString(),
      };
      return NextResponse.json(response);
    }

    // Calculate totals for context
    const totalIncome =
      data.income.t4Total +
      data.income.t4aTotal +
      data.income.t4eTotal +
      data.income.t5Total +
      data.income.t3Total +
      data.income.selfEmploymentIncome +
      data.income.otherIncome;

    const totalDeductions =
      data.deductions.rrspTotal +
      data.deductions.donationsTotal +
      data.deductions.medicalTotal +
      data.deductions.childcareExpenses +
      data.deductions.movingExpenses +
      data.deductions.professionalDues +
      data.deductions.studentLoanInterest;

    // Build user prompt
    const userPrompt = `Analyze this Canadian tax filing summary for tax year 2024:

**Income Summary:**
- Employment income (T4): $${data.income.t4Total.toLocaleString()}
- Pension/Other income (T4A): $${data.income.t4aTotal.toLocaleString()}
- EI Benefits (T4E): $${data.income.t4eTotal.toLocaleString()}
- Investment income (T5): $${data.income.t5Total.toLocaleString()}
- Trust income (T3): $${data.income.t3Total.toLocaleString()}
- Self-employment income: $${data.income.selfEmploymentIncome.toLocaleString()}
- Other income: $${data.income.otherIncome.toLocaleString()}
- **Total Income: $${totalIncome.toLocaleString()}**

**Deductions Claimed:**
- RRSP contributions: $${data.deductions.rrspTotal.toLocaleString()}
- Charitable donations: $${data.deductions.donationsTotal.toLocaleString()}
- Medical expenses: $${data.deductions.medicalTotal.toLocaleString()}
- Childcare expenses: $${data.deductions.childcareExpenses.toLocaleString()}
- Home office days: ${data.deductions.homeOfficeDays} (method: ${data.deductions.homeOfficeMethod || 'none'})
- Moving expenses: $${data.deductions.movingExpenses.toLocaleString()}
- Student loan interest: $${data.deductions.studentLoanInterest.toLocaleString()}
- Professional dues: $${data.deductions.professionalDues.toLocaleString()}
- **Total Deductions: $${totalDeductions.toLocaleString()}**

**Personal Details:**
- Province: ${data.province || 'Not specified'}
- Has spouse/partner: ${data.hasSpouse ? 'Yes' : 'No'}
- Has dependents: ${data.hasDependents ? 'Yes' : 'No'}

What tax optimization opportunities might this filer be missing? Provide 2-4 specific, actionable suggestions.`;

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    // Parse the response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      // Return static suggestions if AI fails
      return NextResponse.json({
        suggestions: staticSuggestions,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Extract JSON from response
    let jsonText = textContent.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Parse AI suggestions
    let aiSuggestions: TaxSuggestion[] = [];
    try {
      const parsed = JSON.parse(jsonText.trim());
      aiSuggestions = (parsed.suggestions || []).map((s: Partial<TaxSuggestion>) => ({
        id: uuidv4(),
        type: s.type || 'info',
        priority: s.priority || 'medium',
        title: s.title || 'Suggestion',
        description: s.description || '',
        affectedFields: s.affectedFields || [],
        estimatedImpact: s.estimatedImpact,
      }));
    } catch {
      // If parsing fails, use static suggestions only
      console.warn('Failed to parse AI suggestions');
    }

    // Combine and deduplicate suggestions
    const existingTitles = new Set(staticSuggestions.map((s) => s.title.toLowerCase()));
    const uniqueAISuggestions = aiSuggestions.filter(
      (s) => !existingTitles.has(s.title.toLowerCase())
    );

    const allSuggestions = [...staticSuggestions, ...uniqueAISuggestions];

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const responseData: SuggestionsResponse = {
      suggestions: allSuggestions,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Suggestions error:', error);

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
