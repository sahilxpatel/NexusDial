import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(config.geminiKey);

const AIResponseSchema = z.object({
  name: z.string().nullable(),
  intent: z.string().max(150).nullable(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  callbackRequested: z.boolean(),
});

export type ExtractedData = z.infer<typeof AIResponseSchema>;

export const extractWithAI = async (transcript: string): Promise<ExtractedData> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
Extract structured data from this voicemail transcript.
Return ONLY a JSON object with these exact fields:
{
  "name": string or null,
  "intent": string (max 20 words) or null,
  "sentiment": "positive" | "neutral" | "negative",
  "callbackRequested": boolean
}
Do not include any other text, markdown, or explanation.
Transcript: """${transcript}"""
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedJson = JSON.parse(cleanedText);
    
    return AIResponseSchema.parse(parsedJson);
  } catch (error) {
    logger.error('extractWithAI error', error);
    throw new Error('AI extraction failed');
  }
};
