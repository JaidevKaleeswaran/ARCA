/**
 * Secret sanitizer to prevent upstream API error messages from leaking
 * sensitive keys, credentials, or tokens in HTTP responses.
 */

export function sanitizeError(err) {
  if (!err) return 'Unknown error';

  let msg = typeof err === 'string' ? err : (err?.message || 'Internal server error');

  // Strip exact values of known server-side environment secrets
  const secretEnvKeys = [
    'GEMINI_API_KEY',
    'ASSISTANT_API_KEY',
    'MANAGER_API_KEY',
    'RECEIPT_SCANNER_API_KEY',
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY',
    'ANTHROPIC_API_KEY',
  ];

  for (const envKey of secretEnvKeys) {
    const val = process.env[envKey];
    if (val && typeof val === 'string' && val.length > 5) {
      msg = msg.split(val).join('[REDACTED_SECRET]');
    }
  }

  // Regex sanitization for common API key signatures & query params
  return msg
    .replace(/AIzaSy[A-Za-z0-9_-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/sk-(?:proj-)?[A-Za-z0-9_-]{16,}/g, '[REDACTED_API_KEY]')
    .replace(/(?:key|apiKey|api_key|token|xi-api-key)=[^&\s]+/gi, 'key=[REDACTED]');
}
