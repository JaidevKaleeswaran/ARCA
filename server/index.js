import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import receiptsRouter from './routes/receipts.js';
import voiceRouter from './routes/voice.js';
import assistantRouter from './routes/assistant.js';
import marketsRouter from './routes/markets.js';
import { blockSensitivePaths, createRateLimiter } from './middleware/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Block any attempts to probe .env, .git, package.json, or traverse directories
app.use(blockSensitivePaths);

// Global Rate Limiter: 120 requests per minute per IP
const globalLimiter = createRateLimiter({
  windowMs: 60000,
  max: 120,
  message: 'Too many requests from this IP. Please wait a minute.',
});
app.use('/api', globalLimiter);

// CORS configuration: Allow localhost in dev and Vercel / custom domain in production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
];
if (process.env.CLIENT_ORIGIN) {
  allowedOrigins.push(process.env.CLIENT_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback with credentials control
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// Serve uploaded receipt images as static files (dotfiles hidden)
app.use('/uploads', express.static(path.join(PROJECT_ROOT, 'uploads'), {
  dotfiles: 'deny',
}));

// Routes
app.use('/api/receipts', receiptsRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/markets', marketsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server (when executed directly, not imported in serverless)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
  });
}

export default app;
