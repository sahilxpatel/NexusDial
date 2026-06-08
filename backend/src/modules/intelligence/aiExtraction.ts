import Groq from 'groq-sdk';
import { z } from 'zod';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

const groq = new Groq({ apiKey: config.groqKey });

const AIResponseSchema = z.object({
  name: z.string().nullable(),
  intent: z.string().max(150).nullable(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  callbackRequested: z.boolean(),
});

export type ExtractedData = z.infer<typeof AIResponseSchema>;

export async function extractWithAI(transcript: string): Promise<ExtractedData> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 256,
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `You are a voicemail analysis assistant. Extract structured data from transcripts.
Return ONLY a valid JSON object — no markdown, no explanation, no extra text.
Required fields:
{
  "name": string or null (caller's name if mentioned),
  "intent": string (max 20 words) or null (purpose of the call),
  "sentiment": "positive" | "neutral" | "negative",
  "callbackRequested": boolean (true if caller explicitly asks to be called back)
}`,
      },
      {
        role: 'user',
        content: `Transcript:\n"""\n${transcript}\n"""`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '';

  const cleaned = raw.replace(/```json|```/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    logger.error({ event: 'AI_JSON_PARSE_FAILED', raw });
    throw new Error('AI returned invalid JSON');
  }

  return AIResponseSchema.parse(parsed);
}
