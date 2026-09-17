import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import receiptsRouter from './routes/receipts.js';
import voiceRouter from './routes/voice.js';
import assistantRouter from './routes/assistant.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded receipt images as static files
app.use('/uploads', express.static(path.join(PROJECT_ROOT, 'uploads')));

// Routes
app.use('/api/receipts', receiptsRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/assistant', assistantRouter);

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
