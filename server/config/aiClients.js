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

// ── Gemini Key Pool for High-Concurrency Automatic Failover ───────────────────

export class GeminiKeyPool {
  constructor(initialKeys = null) {
    this.keyEntries = new Map(); // key -> entry
    this.currentIndex = 0;
    if (initialKeys) {
      this.initKeys(initialKeys);
    } else {
      this.loadFromEnv();
    }
  }

  loadFromEnv() {
    const rawKeys = [];

    // 1. Comma/space/newline/semicolon separated GEMINI_API_KEYS
    if (process.env.GEMINI_API_KEYS) {
      process.env.GEMINI_API_KEYS.split(/[,\s\n;]+/).forEach(k => {
        if (k && k.trim()) rawKeys.push(k.trim());
      });
    }

    // 2. Dynamic indexed keys GEMINI_API_KEY_1 .. GEMINI_API_KEY_N
    Object.keys(process.env).forEach(envKey => {
      if (/^GEMINI_API_KEY_\d+$/i.test(envKey)) {
        const val = process.env[envKey];
        if (val && val.trim()) rawKeys.push(val.trim());
      }
    });

    for (let i = 1; i <= 50; i++) {
      const k = process.env[`GEMINI_API_KEY_${i}`];
      if (k && k.trim()) rawKeys.push(k.trim());
    }

    // 3. Singular & feature-specific keys
    const singulars = [
      process.env.GEMINI_API_KEY,
      process.env.ASSISTANT_API_KEY,
      process.env.RECEIPT_SCANNER_API_KEY,
      process.env.VOICE_SCANNER_API_KEY,
      process.env.MANAGER_API_KEY,
    ];
    singulars.forEach(k => {
      if (k && k.trim()) rawKeys.push(k.trim());
    });

    this.initKeys(rawKeys);
  }

  initKeys(keysArray) {
    const uniqueKeys = Array.from(new Set(keysArray.filter(Boolean)));
    const newMap = new Map();

    for (const key of uniqueKeys) {
      const clean = String(key).trim();
      if (!clean) continue;
      const existing = this.keyEntries.get(clean);
      if (existing) {
        newMap.set(clean, existing);
      } else {
        const masked = clean.length > 10
          ? `${clean.slice(0, 6)}...${clean.slice(-4)}`
          : '***';
        newMap.set(clean, {
          key: clean,
          masked,
          status: 'active',
          cooldownUntil: 0,
          failures: 0,
          successes: 0,
          client: new GoogleGenAI({ apiKey: clean }),
        });
      }
    }

    this.keyEntries = newMap;
  }

  addKey(key, customClient = null) {
    if (!key) return;
    const clean = String(key).trim();
    if (!clean || this.keyEntries.has(clean)) return;

    const masked = clean.length > 10
      ? `${clean.slice(0, 6)}...${clean.slice(-4)}`
      : '***';
    this.keyEntries.set(clean, {
      key: clean,
      masked,
      status: 'active',
      cooldownUntil: 0,
      failures: 0,
      successes: 0,
      client: customClient || new GoogleGenAI({ apiKey: clean }),
    });
  }

  getActiveEntries(taskType = null) {
    const now = Date.now();
    const active = [];

    for (const entry of this.keyEntries.values()) {
      if (entry.status === 'cooldown') {
        if (now >= entry.cooldownUntil) {
          entry.status = 'active';
          entry.cooldownUntil = 0;
          active.push(entry);
        }
      } else {
        active.push(entry);
      }
    }

    if (active.length <= 1) {
      return active;
    }

    // Role-specific key preference if designated
    let roleKey = null;
    if (taskType === 'chat' && process.env.ASSISTANT_API_KEY) roleKey = process.env.ASSISTANT_API_KEY;
    else if (taskType === 'vision' && process.env.RECEIPT_SCANNER_API_KEY) roleKey = process.env.RECEIPT_SCANNER_API_KEY;
    else if (taskType === 'voice' && process.env.VOICE_SCANNER_API_KEY) roleKey = process.env.VOICE_SCANNER_API_KEY;

    // Apply round-robin rotation to distribute load evenly across pooled keys
    const startIdx = this.currentIndex % active.length;
    this.currentIndex = (this.currentIndex + 1) % active.length;
    const rotated = [...active.slice(startIdx), ...active.slice(0, startIdx)];

    if (roleKey && rotated.some(e => e.key === roleKey)) {
      rotated.sort((a, b) => (a.key === roleKey ? -1 : b.key === roleKey ? 1 : 0));
    }

    return rotated;
  }

  markKeyRateLimited(key, cooldownSeconds = 60) {
    const clean = typeof key === 'object' && key?.key ? key.key : String(key || '');
    const entry = this.keyEntries.get(clean);
    if (entry) {
      entry.status = 'cooldown';
      entry.cooldownUntil = Date.now() + (cooldownSeconds * 1000);
      entry.failures = (entry.failures || 0) + 1;
    }
  }

  markKeySuccess(key) {
    const clean = typeof key === 'object' && key?.key ? key.key : String(key || '');
    const entry = this.keyEntries.get(clean);
    if (entry) {
      entry.status = 'active';
      entry.cooldownUntil = 0;
      entry.successes = (entry.successes || 0) + 1;
    }
  }

  getActiveClient(taskType = null) {
    const active = this.getActiveEntries(taskType);
    if (active.length > 0) {
      return active[0].client;
    }
    // Fallback if all are cooling down: return the first configured client
    const all = Array.from(this.keyEntries.values());
    return all.length > 0 ? all[0].client : null;
  }

  isPoolClient(client) {
    if (!client) return false;
    for (const entry of this.keyEntries.values()) {
      if (entry.client === client) return true;
    }
    return false;
  }

  getKeyPoolStats() {
    const now = Date.now();
    let active = 0;
    let cooldown = 0;
    const details = [];

    for (const entry of this.keyEntries.values()) {
      const isCool = entry.status === 'cooldown' && now < entry.cooldownUntil;
      if (isCool) {
        cooldown++;
      } else {
        active++;
      }
      details.push({
        masked: entry.masked,
        status: isCool ? 'cooldown' : 'active',
        cooldownRemainingSec: isCool ? Math.max(0, Math.ceil((entry.cooldownUntil - now) / 1000)) : 0,
        failures: entry.failures,
        successes: entry.successes,
      });
    }

    return {
      total: this.keyEntries.size,
      active,
      cooldown,
      keys: details,
    };
  }
}

export const geminiKeyPool = new GeminiKeyPool();

// ── Client Getters ────────────────────────────────────────────────────────────

export function getReceiptClient() {
  return geminiKeyPool.getActiveClient('vision');
}

export function getVoiceClient() {
  return geminiKeyPool.getActiveClient('voice');
}

export function getAssistantClient() {
  return geminiKeyPool.getActiveClient('chat');
}

// Export references for backwards compatibility
export const receiptClient = getReceiptClient();
export const voiceClient = getVoiceClient();
export const assistantClient = getAssistantClient();

// ── Model Cascade Definitions ────────────────────────────────────────────────

export const INTERACTIVE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

export const CATEGORIZATION_MODELS = [
  'gemini-3.5-flash-lite',
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
 * Executes a Gemini request with automatic key rotation and model fallback cascade.
 * If all tiers and keys fail due to 429 / RESOURCE_EXHAUSTED, throws a normalized 429 error.
 *
 * @param {GoogleGenAI|null} client - Google GenAI client instance (or null to use key pool)
 * @param {'chat' | 'vision' | 'voice' | 'categorization'} taskType - Type of task
 * @param {Object} requestPayload - Payload passed to generateContent (contents, config, tools, etc.)
 * @returns {Promise<Object>} Result from generateContent
 */
export async function callWithModelCascade(client, taskType = 'chat', requestPayload = {}) {
  const targetPool = (client instanceof GeminiKeyPool) ? client : geminiKeyPool;

  // Determine candidate entries to attempt
  let entries = [];

  if (client instanceof GeminiKeyPool) {
    entries = client.getActiveEntries(taskType);
  } else if (client && !geminiKeyPool.isPoolClient(client)) {
    // Custom or mock client passed explicitly (e.g. in test suites)
    entries = [{
      key: 'custom_client',
      masked: 'custom_client',
      client,
      status: 'active',
      cooldownUntil: 0,
    }];
  } else {
    // Retrieve active keys from pool
    entries = targetPool.getActiveEntries(taskType);
  }

  if (entries.length === 0) {
    if (targetPool.keyEntries.size > 0) {
      // All keys in pool are in cooldown due to upstream rate limits
      const resetDate = getNextMondayISO();
      const rateLimitError = new Error('High demand: upgrade to ARCA Pro for priority dedicated bandwidth.');
      rateLimitError.status = 429;
      rateLimitError.code = 'UPSTREAM_RATE_LIMIT';
      rateLimitError.payload = {
        error: 'UPSTREAM_RATE_LIMIT',
        message: 'High demand: upgrade to ARCA Pro for priority dedicated bandwidth.',
        resetDate,
      };
      throw rateLimitError;
    }

    const missingErr = new Error(`No Gemini API key configured for ${taskType}. Set corresponding environment variables.`);
    missingErr.code = 'MISSING_API_KEY';
    missingErr.status = 500;
    throw missingErr;
  }

  const models = taskType === 'categorization' ? CATEGORIZATION_MODELS : INTERACTIVE_MODELS;
  let lastError = null;
  let hadRateLimit = false;

  for (let keyIdx = 0; keyIdx < entries.length; keyIdx++) {
    const entry = entries[keyIdx];
    const hasNextKey = keyIdx < entries.length - 1;

    for (const model of models) {
      try {
        const response = await entry.client.models.generateContent({
          model,
          ...requestPayload,
        });

        if (response) {
          targetPool.markKeySuccess(entry.key);
          return response;
        }
      } catch (err) {
        lastError = err;
        if (isRateLimitError(err)) {
          hadRateLimit = true;
          targetPool.markKeyRateLimited(entry.key, 60);
          console.warn(`[GeminiKeyPool] Key ${entry.masked} encountered rate limit on ${model}.`);
          if (hasNextKey) {
            console.warn(`[GeminiKeyPool] Immediately switching to next API key in pool...`);
            break; // Stop trying models on this exhausted key, switch immediately to next key!
          } else {
            console.warn(`[ModelCascade] Model ${model} encountered rate limit for ${taskType}:`, err.message);
            // No next key in pool, continue trying fallback models on this key
          }
        } else {
          console.warn(`[ModelCascade] Model ${model} failed for ${taskType}:`, err.message);
        }
      }
    }
  }

  // If all keys and models failed and rate limit was encountered
  if (hadRateLimit || isRateLimitError(lastError)) {
    const resetDate = getNextMondayISO();
    const rateLimitError = new Error('High demand: upgrade to ARCA Pro for priority dedicated bandwidth.');
    rateLimitError.status = 429;
    rateLimitError.code = 'UPSTREAM_RATE_LIMIT';
    rateLimitError.payload = {
      error: 'UPSTREAM_RATE_LIMIT',
      message: 'High demand: upgrade to ARCA Pro for priority dedicated bandwidth.',
      resetDate,
    };
    throw rateLimitError;
  }

  throw lastError || new Error(`All Gemini models failed for ${taskType}`);
}
