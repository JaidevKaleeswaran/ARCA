/**
 * Security Middleware & Abuse Prevention
 * 
 * Provides:
 * 1. Sliding-window in-memory rate limiting (zero external dependencies)
 * 2. Sensitive path & dotfile blocker (.env*, .git*, package.json, traversal)
 * 3. Input length and payload size guards for costly AI endpoints
 */

/**
 * Creates an in-memory sliding-window rate limiter per IP address
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default 1 minute)
 * @param {number} options.max - Maximum requests allowed per window
 * @param {string} options.message - Error message when rate limit is exceeded
 */
export function createRateLimiter({
  windowMs = 60000,
  max = 30,
  message = 'Too many requests. Please slow down.',
} = {}) {
  const requests = new Map(); // ip -> Array of timestamps

  // Periodically clean up entries older than windowMs
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, valid);
      }
    }
  }, Math.max(windowMs, 30000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || '127.0.0.1';

    const now = Date.now();
    const timestamps = (requests.get(ip) || []).filter(t => now - t < windowMs);

    if (timestamps.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message,
      });
    }

    timestamps.push(now);
    requests.set(ip, timestamps);
    next();
  };
}

/**
 * Blocks sensitive files and directories (.env, .git, package.json, traversal, etc.)
 */
export function blockSensitivePaths(req, res, next) {
  const urlPath = decodeURIComponent(req.path.toLowerCase());

  const blockedPatterns = [
    /^\/\.env/i,
    /\/\.env/i,
    /^\/\.git/i,
    /\/\.git/i,
    /^\/package(?:-lock)?\.json/i,
    /^\/vercel\.json/i,
    /^\/vite\.config/i,
    /^\/server/i,
    /\.\./, // Directory traversal
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(urlPath)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access to the requested resource is denied.',
      });
    }
  }

  next();
}

/**
 * Input size guard for /api/voice/speak (ElevenLabs TTS cost protection)
 */
export function validateSpeakInput(req, res, next) {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "text" parameter' });
  }
  if (text.trim().length === 0) {
    return res.status(400).json({ error: '"text" cannot be empty' });
  }
  if (text.length > 500) {
    return res.status(400).json({
      error: 'Text too long',
      message: 'Maximum allowed speech length is 500 characters to prevent quota abuse.',
    });
  }
  next();
}

/**
 * Input size guard for /api/assistant/chat (Gemini token cost protection)
 */
export function validateChatInput(req, res, next) {
  const { question, history } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "question" parameter' });
  }
  if (question.trim().length === 0) {
    return res.status(400).json({ error: '"question" cannot be empty' });
  }
  if (question.length > 2000) {
    return res.status(400).json({
      error: 'Question too long',
      message: 'Maximum allowed question length is 2000 characters.',
    });
  }
  if (history && !Array.isArray(history)) {
    return res.status(400).json({ error: '"history" must be an array' });
  }
  if (Array.isArray(history) && history.length > 20) {
    req.body.history = history.slice(-20);
  }
  next();
}

/**
 * Input size guard for /api/assistant/categorize
 */
export function validateCategorizeInput(req, res, next) {
  const { description, categories } = req.body || {};
  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "description" parameter' });
  }
  if (description.length > 200) {
    return res.status(400).json({ error: 'Description too long (max 200 characters)' });
  }
  if (categories && (!Array.isArray(categories) || categories.length > 50)) {
    return res.status(400).json({ error: '"categories" must be an array of at most 50 items' });
  }
  next();
}
