import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY. Set it in your .env file.');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Sends a single prompt (system + user combined) to Groq and returns the
 * raw text. Markdown fences are stripped so callers can JSON.parse() safely.
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: fullPrompt }],
    temperature: 0.7,
  });

  const raw = response.choices[0]?.message?.content ?? '';
  return raw.replace(/```json|```/g, '').trim();
}

