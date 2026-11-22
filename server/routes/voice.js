import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { sanitizeError } from '../utils/sanitize.js';
import { createRateLimiter, validateSpeakInput } from '../middleware/security.js';
import { getVoiceClient, callWithModelCascade, getNextMondayISO } from '../config/aiClients.js';

const uploadMemory = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Rate limiters for voice endpoints to prevent cost exhaustion
const speakLimiter = createRateLimiter({ windowMs: 60000, max: 20, message: 'Too many speech requests. Please wait a moment.' });
const transcribeLimiter = createRateLimiter({ windowMs: 60000, max: 15, message: 'Too many transcription requests. Please wait a moment.' });
const createAgentLimiter = createRateLimiter({ windowMs: 60000, max: 5, message: 'Too many agent creation requests.' });

// Cache the agent ID so we don't recreate it every time
let cachedAgentId = null;

const RECEIPT_AGENT_PROMPT = `You are a friendly receipt recording assistant for the ARCA personal finance app. Your job is to listen to the user describe their purchases and extract the key details.

When the user tells you about a purchase, extract:
1. WHAT they bought or WHERE they bought it (the merchant/store name or description)
2. HOW MUCH they spent (the dollar amount)
3. WHEN they bought it (the date - if they don't specify, assume today)

After the user describes a purchase, confirm back to them by saying something like:
"Got it! I'll add [amount] for [description] on [date] to your dashboard."

If the user's input is unclear, ask a brief clarifying question. Keep your responses short and conversational.

Examples:
- User: "I spent $10 on Taco Bell" → Confirm: Taco Bell, $10, today
- User: "Twenty bucks at Walmart yesterday" → Confirm: Walmart, $20, yesterday
- User: "Paid my internet bill, $59.99" → Confirm: Internet Bill, $59.99, today

Be natural and helpful. If the user wants to add multiple purchases, handle them one at a time.`;

/**
 * POST /api/voice/create-agent
 * Creates (or returns cached) an ElevenLabs Conversational AI agent
 */
router.post('/create-agent', createAgentLimiter, async (req, res) => {
  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'ELEVENLABS_API_KEY is not configured.',
    });
  }

  // Return cached agent if we already created one
  if (cachedAgentId) {
    return res.json({ agentId: cachedAgentId });
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

    const agent = await elevenlabs.conversationalAi.agents.create({
      name: 'ARCA Receipt Assistant',
      conversationConfig: {
        agent: {
          prompt: {
            prompt: RECEIPT_AGENT_PROMPT,
          },
        },
      },
    });

    cachedAgentId = agent.agent_id;

    return res.json({
      agentId: agent.agent_id,
      message: 'ElevenLabs conversational agent created successfully',
    });
  } catch (err) {
    console.error('ElevenLabs agent creation error:', err);
    return res.status(502).json({
      error: 'Failed to create voice agent',
      message: sanitizeError(err),
    });
  }
});

/**
 * GET /api/voice/agent-id
 * Returns the cached agent ID if available
 */
router.get('/agent-id', (req, res) => {
  if (cachedAgentId) {
    return res.json({ agentId: cachedAgentId });
  }
  return res.status(404).json({ error: 'No agent created yet' });
});

/**
 * POST /api/voice/speak
 * Converts text to spoken audio using ElevenLabs Text-to-Speech API
 */
router.post('/speak', speakLimiter, validateSpeakInput, async (req, res) => {
  const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'ELEVENLABS_API_KEY is not configured on backend.',
    });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429 || /quota|credit|rate\s*limit|resource_exhausted|429/i.test(errText)) {
        return res.status(429).json({
          error: 'UPSTREAM_RATE_LIMIT',
          message: 'High demand: upgrade to ARCA Pro for priority dedicated bandwidth.',
          resetDate: getNextMondayISO(),
        });
      }
      throw new Error(`ElevenLabs API error (${response.status}): ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    console.error('ElevenLabs TTS error:', err);
    if (err.status === 429 || /quota|credit|rate\s*limit|resource_exhausted|429/i.test(err.message)) {
      return res.status(429).json({
        error: 'UPSTREAM_RATE_LIMIT',
        message: 'High demand: upgrade to ARCA Pro for priority dedicated bandwidth.',
        resetDate: getNextMondayISO(),
      });
    }
    return res.status(502).json({
      error: 'Failed to generate speech audio',
      message: sanitizeError(err),
    });
  }
});

/**
 * POST /api/voice/transcribe
 * Transcribes recorded microphone audio using Gemini AI with model cascade
 */
router.post('/transcribe', transcribeLimiter, uploadMemory.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const client = getVoiceClient();
    if (!client) {
      return res.status(500).json({ error: 'No Gemini API key configured for audio transcription' });
    }

    const base64Audio = req.file.buffer.toString('base64');
    // Normalize MIME type for Gemini: strip codec parameters (e.g. "audio/mp4;codecs=mp4a.40.2" -> "audio/mp4")
    // and infer from filename if browser sent application/octet-stream
    const rawMime = (req.file.mimetype || '').split(';')[0].trim().toLowerCase();
    const ext = (req.file.originalname || '').split('.').pop()?.toLowerCase();
    const extToMime = {
      m4a: 'audio/mp4',
      mp4: 'audio/mp4',
      aac: 'audio/aac',
      webm: 'audio/webm',
      ogg: 'audio/ogg',
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
    };
    const mimeType =
      rawMime && rawMime !== 'application/octet-stream' && rawMime.startsWith('audio/')
        ? (rawMime === 'audio/x-m4a' ? 'audio/mp4' : rawMime)
        : (extToMime[ext] || 'audio/webm');

    const mode = req.body.mode || 'receipt';
    const isPromptMode = mode === 'prompt';

    const prompt = isPromptMode
      ? 'Transcribe this spoken question into plain text. Return ONLY the transcribed text, with no JSON, commentary, quotes, or markdown formatting.'
      : `Listen carefully to this spoken receipt audio recording.
Extract what the user bought, the total amount spent, and the date of purchase.
Return ONLY valid JSON (no markdown formatting) in this exact structure:
{
  "transcript": "Exact spoken text",
  "merchant": "Merchant or Store Name or Description",
  "amount": 0.00,
  "date": "YYYY-MM-DD"
}

If the year/date is not mentioned, use today's date (${new Date().toISOString().split('T')[0]}).`;

    const response = await callWithModelCascade(client, 'voice', {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],
    });

    const rawText = response.text?.trim() || '';

    if (isPromptMode) {
      return res.json({
        success: true,
        transcript: rawText.replace(/^["']|["']$/g, ''),
      });
    }

    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    let data = {};
    try {
      data = JSON.parse(cleaned);
    } catch {
      data = { transcript: rawText };
    }

    return res.json({
      success: true,
      transcript: data.transcript || '',
      merchant: data.merchant || 'Spoken Purchase',
      amount: Number(data.amount) || 0,
      date: data.date || new Date().toISOString().split('T')[0],
    });
  } catch (err) {
    console.error('Audio transcription error:', err);
    if (err.status === 429 || err.code === 'UPSTREAM_RATE_LIMIT') {
      return res.status(429).json(err.payload || {
        error: 'UPSTREAM_RATE_LIMIT',
        message: 'High demand: upgrade to ARCA Pro for priority dedicated bandwidth.',
        resetDate: getNextMondayISO(),
      });
    }
    return res.status(502).json({
      error: 'Failed to transcribe audio',
      message: sanitizeError(err),
    });
  }
});

export default router;


