import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { ChatFilingContext } from '@/types/ai';

const client = new Anthropic();

// Request validation schema
const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  context: z.object({
    year: z.number(),
    province: z.string(),
    totalIncome: z.number(),
    totalDeductions: z.number(),
    estimatedRefund: z.number(),
    hasT4: z.boolean(),
    hasT5: z.boolean(),
    hasRRSP: z.boolean(),
    hasDonations: z.boolean(),
    hasMedical: z.boolean(),
    hasHomeOffice: z.boolean(),
  }),
});

// Build system prompt with filing context
function buildSystemPrompt(context: ChatFilingContext): string {
  return `You are a helpful Canadian tax assistant for Taxxon, a tax filing application. You help users understand their taxes and answer questions about Canadian tax law.

**Current User's Filing Context:**
- Tax Year: ${context.year}
- Province: ${context.province || 'Not specified'}
- Total Income: $${context.totalIncome.toLocaleString()}
- Total Deductions: $${context.totalDeductions.toLocaleString()}
- Estimated ${context.estimatedRefund >= 0 ? 'Refund' : 'Amount Owing'}: $${Math.abs(context.estimatedRefund).toLocaleString()}

**What they've filed:**
${context.hasT4 ? '✓ T4 employment income' : '○ No T4 slips'}
${context.hasT5 ? '✓ T5 investment income' : '○ No T5 slips'}
${context.hasRRSP ? '✓ RRSP contributions' : '○ No RRSP contributions'}
${context.hasDonations ? '✓ Charitable donations' : '○ No donations'}
${context.hasMedical ? '✓ Medical expenses' : '○ No medical expenses'}
${context.hasHomeOffice ? '✓ Home office deduction' : '○ No home office'}

**Guidelines:**
1. Be friendly, concise, and helpful
2. Reference the user's specific situation when relevant
3. For complex questions, suggest consulting a tax professional
4. Focus on Canadian federal and provincial tax rules
5. If asked about their refund/owing, reference the estimated amount above
6. Don't make assumptions about income or deductions beyond what's provided
7. For legal advice, always recommend consulting a professional

**Common Topics:**
- RRSP contribution room and deadlines
- Tax credits vs tax deductions
- Medical expense claims
- Home office deduction (flat rate vs detailed method)
- TFSA rules
- Employment expenses
- Provincial tax differences

Keep responses focused and actionable. Use simple language.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, context } = validationResult.data;

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            stream: true,
            system: systemPrompt,
            messages: messages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          });

          for await (const event of response) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if ('text' in delta) {
                // Send as SSE format
                const data = JSON.stringify({ type: 'content', content: delta.text });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
          }

          // Send done event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof Anthropic.APIError) {
      return new Response(
        JSON.stringify({ error: 'AI API error', message: error.message }),
        { status: error.status || 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
