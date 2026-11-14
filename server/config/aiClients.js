import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

/**
 * Returns the upcoming Monday at 00:00:00.000 UTC in ISO 8601 format
 */
export function getNextMondayISO() {
  const now = new Date();
  const day = now.getUTCDay();
  // Monday is day 1. If today is Monday (1), next Monday is 7 days away.
  // If today is Sunday (0), next Monday is 1 day away.
  const daysUntilNextMonday = ((8 - day) % 7) || 7;
  const nextMonday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilNextMonday,
    0, 0, 0, 0
  ));
  return nextMonday.toISOString();
}

/**
 * Returns the Monday of the current week at 00:00:00.000 UTC
 */
export function getCurrentMondayISO() {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const currentMonday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + diffToMonday,
    0, 0, 0, 0
  ));
  return currentMonday.toISOString();
}

// ── Client Getters with Multi-Key Hierarchy ──────────────────────────────────

export function getReceiptClient() {
  const apiKey = process.env.RECEIPT_SCANNER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export function getVoiceClient() {
  const apiKey = process.env.VOICE_SCANNER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export function getAssistantClient() {
  const apiKey = process.env.ASSISTANT_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// Export singleton/proxy instances for direct import
export const receiptClient = getReceiptClient();
export const voiceClient = getVoiceClient();
export const assistantClient = getAssistantClient();

// ── Model Cascade Definitions ────────────────────────────────────────────────

export const INTERACTIVE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

export const CATEGORIZATION_MODELS = [
  'gemini-2.0-flash-lite',
];

/**
 * Determines whether an error is caused by rate limiting or resource exhaustion
 */
export function isRateLimitError(err) {
  if (!err) return false;
  if (err.status === 429 || err.statusCode === 429) return true;
  const msg = String(err.message || err.toString() || '').toLowerCase();
  return msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests');
}

/**
 * Executes a Gemini request with automatic fallback cascade across models.
 * If all tiers fail due to 429 / RESOURCE_EXHAUSTED, throws a normalized 429 error.
 *
 * @param {GoogleGenAI} client - Google GenAI client instance
 * @param {'chat' | 'vision' | 'voice' | 'categorization'} taskType - Type of task
 * @param {Object} requestPayload - Payload passed to generateContent (contents, config, tools, etc.)
 * @returns {Promise<Object>} Result from generateContent
 */
export async function callWithModelCascade(client, taskType = 'chat', requestPayload = {}) {
  const activeClient = client || (
    taskType === 'vision' ? getReceiptClient() :
    taskType === 'voice' ? getVoiceClient() :
    getAssistantClient()
  );

  if (!activeClient) {
    const missingErr = new Error(`No Gemini API key configured for ${taskType}. Set corresponding environment variables.`);
    missingErr.code = 'MISSING_API_KEY';
    missingErr.status = 500;
    throw missingErr;
  }

  const models = taskType === 'categorization' ? CATEGORIZATION_MODELS : INTERACTIVE_MODELS;
  let lastError = null;
  let hadRateLimit = false;

  for (const model of models) {
    try {
      const response = await activeClient.models.generateContent({
        model,
        ...requestPayload,
      });

      if (response) {
        return response;
      }
    } catch (err) {
      lastError = err;
      if (isRateLimitError(err)) {
        hadRateLimit = true;
        console.warn(`[ModelCascade] Model ${model} encountered rate limit for ${taskType}:`, err.message);
      } else {
        console.warn(`[ModelCascade] Model ${model} failed for ${taskType}:`, err.message);
      }
      // Continue to next model in cascade
    }
  }

  // If all models failed and rate limit was encountered (or last error was 429)
  if (hadRateLimit || isRateLimitError(lastError)) {
    const resetDate = getNextMondayISO();
    const rateLimitError = new Error('High demand: upgrade to Stacked Pro for priority dedicated bandwidth.');
    rateLimitError.status = 429;
    rateLimitError.code = 'UPSTREAM_RATE_LIMIT';
    rateLimitError.payload = {
      error: 'UPSTREAM_RATE_LIMIT',
      message: 'High demand: upgrade to Stacked Pro for priority dedicated bandwidth.',
      resetDate,
    };
    throw rateLimitError;
  }

  throw lastError || new Error(`All Gemini models failed for ${taskType}`);
}
