/**
 * Voice Agent — Handles speech-to-structured-transaction via ElevenLabs
 * 
 * Uses the ElevenLabs Conversational AI widget for browser-based voice interaction.
 * The agent extracts receipt info from spoken input and returns structured data
 * for the Manager Agent to process.
 */

import { env } from '../../config/env';

// ── Agent Configuration ──────────────────────────────────────────────────────

/**
 * The conversational agent prompt that instructs ElevenLabs to extract receipt data.
 * The agent will conversationally guide the user and extract:
 * - What they bought (description/merchant)
 * - How much they spent (amount)
 * - When they bought it (date)
 */
export const VOICE_AGENT_PROMPT = `You are a friendly receipt recording assistant for the ARCA personal finance app. Your job is to listen to the user describe their purchases and extract the key details.

When the user tells you about a purchase, extract:
1. WHAT they bought or WHERE they bought it (the merchant/store name or description)
2. HOW MUCH they spent (the dollar amount)  
3. WHEN they bought it (the date - if they don't specify, assume today)

After the user describes a purchase, confirm back to them by saying something like:
"Got it! I'll add [amount] for [description] on [date] to your dashboard."

If the user's input is unclear, ask a brief clarifying question. Keep your responses short and conversational.

Examples:
- User: "I spent $10 on Taco Bell" → Extract: Taco Bell, $10, today's date
- User: "Twenty bucks at Walmart yesterday" → Extract: Walmart, $20, yesterday's date  
- User: "Paid my internet bill, $59.99" → Extract: Internet Bill, $59.99, today's date

Be natural and helpful. If the user wants to add multiple purchases, handle them one at a time.`;

// ── Parsing utilities ─────────────────────────────────────────────────────────

/**
 * Parse spoken text into structured transaction data
 * This is used when we have the transcript text from voice input
 */
export function parseSpokenReceipt(text) {
  if (!text || typeof text !== 'string') return null;

  const result = {
    raw_transcript: text,
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  };

  // Extract dollar amount: $10, $10.50, 10 dollars, ten bucks, etc.
  const amountPatterns = [
    /\$\s?([\d,]+\.?\d*)/i,                           // $10, $10.50
    /([\d,]+\.?\d*)\s*(?:dollars?|bucks?)/i,           // 10 dollars, 20 bucks
    /(?:spent|paid|cost|was)\s*\$?\s*([\d,]+\.?\d*)/i, // spent 10, paid $15
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.amount = parseFloat(match[1].replace(',', ''));
      break;
    }
  }

  // Word-to-number mapping for common amounts
  const wordNumbers = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'twenty-five': 25, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100,
  };

  if (result.amount === 0) {
    for (const [word, num] of Object.entries(wordNumbers)) {
      const wordPattern = new RegExp(`\\b${word}\\b\\s*(?:dollars?|bucks?)?`, 'i');
      if (wordPattern.test(text)) {
        result.amount = num;
        break;
      }
    }
  }

  // Extract date references
  const today = new Date();
  const datePatterns = [
    { pattern: /\byesterday\b/i, offset: -1 },
    { pattern: /\btoday\b/i, offset: 0 },
    { pattern: /\blast\s+(?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, offset: -7 },
    { pattern: /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/, handler: (m) => {
      const month = m[1].padStart(2, '0');
      const day = m[2].padStart(2, '0');
      const year = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : today.getFullYear();
      return `${year}-${month}-${day}`;
    }},
  ];

  for (const dp of datePatterns) {
    const match = text.match(dp.pattern);
    if (match) {
      if (dp.handler) {
        result.date = dp.handler(match);
      } else {
        const d = new Date(today);
        d.setDate(d.getDate() + dp.offset);
        result.date = d.toISOString().split('T')[0];
      }
      break;
    }
  }

  // Extract description (merchant/store name)
  // Remove amount and date references, what's left is the description
  let desc = text;

  // Remove common prefixes
  desc = desc.replace(/^(?:i\s+)?(?:spent|paid|bought|got|had|purchased)\s+/i, '');
  // Remove amount patterns
  desc = desc.replace(/\$\s?[\d,]+\.?\d*/g, '');
  desc = desc.replace(/[\d,]+\.?\d*\s*(?:dollars?|bucks?)/gi, '');
  // Remove date patterns
  desc = desc.replace(/\b(?:today|yesterday|last\s+\w+)\b/gi, '');
  // Remove filler words
  desc = desc.replace(/\b(?:at|on|for|from|the|a|an|some|to|in|of)\b/gi, '');
  // Clean up
  desc = desc.replace(/\s+/g, ' ').trim();

  // Capitalize first letter of each word
  if (desc) {
    result.description = desc.split(' ')
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // Fallback description
  if (!result.description) {
    result.description = 'Purchase';
  }

  return result;
}

/**
 * Check if voice output is supported (browser speechSynthesis or backend voice endpoint)
 */
export function isVoiceEnabled() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get the ElevenLabs widget config
 */
export function getElevenLabsConfig() {
  return {
    agentId: env.elevenLabs?.agentId || '',
    agentPrompt: VOICE_AGENT_PROMPT,
  };
}

/**
 * Use the browser's built-in Web Speech API as a fallback
 * when ElevenLabs is not available or for simple speech-to-text
 */
export function createWebSpeechRecognition(onResult, onError, onEnd) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) onError(new Error('Speech recognition not supported in this browser'));
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  let finalReceived = false;
  let lastTranscript = '';

  recognition.onresult = (event) => {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript;
    const isFinal = event.results[last].isFinal;
    lastTranscript = transcript;
    if (isFinal) {
      finalReceived = true;
    }
    if (onResult) onResult(transcript, isFinal);
  };

  recognition.onerror = (event) => {
    // 'no-speech' is not really an error, user just didn't say anything
    if (event.error === 'no-speech') {
      if (onError) onError(new Error('No speech detected. Please try again and speak clearly.'));
    } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      if (onError) onError(new Error('not-allowed'));
    } else {
      if (onError) onError(new Error(event.error));
    }
  };

  recognition.onend = () => {
    // If we got interim results but no final, treat last interim as final
    if (!finalReceived && lastTranscript) {
      if (onResult) onResult(lastTranscript, true);
    }
    if (onEnd) onEnd();
  };

  return recognition;
}

/**
 * Currently active Audio instance & object URL for stopping previous speech
 */
let activeAudio = null;
let activeAudioUrl = null;
let sharedAudioElement = null;

/**
 * Tiny valid silent WAV data URI used to synchronously unlock HTMLAudioElement
 * inside a mobile Safari/Chrome tap gesture before awaiting network TTS audio.
 */
const SILENT_AUDIO_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

function getOrUnlockAudioElement() {
  if (typeof Audio === 'undefined') return null;

  if (!sharedAudioElement) {
    sharedAudioElement = new Audio();
    sharedAudioElement.preload = 'auto';
    sharedAudioElement.setAttribute('playsinline', 'true');
  }

  // Synchronously unlock playback within the current user tap gesture (iOS Safari / mobile Chrome)
  try {
    sharedAudioElement.pause();
    sharedAudioElement.src = SILENT_AUDIO_DATA_URI;
    sharedAudioElement.muted = true;
    const unlockPromise = sharedAudioElement.play();
    if (unlockPromise && typeof unlockPromise.then === 'function') {
      unlockPromise
        .then(() => {
          if (sharedAudioElement && sharedAudioElement.src === SILENT_AUDIO_DATA_URI) {
            sharedAudioElement.pause();
            sharedAudioElement.muted = false;
          }
        })
        .catch(() => {
          if (sharedAudioElement) sharedAudioElement.muted = false;
        });
    } else {
      sharedAudioElement.pause();
      sharedAudioElement.muted = false;
    }
  } catch {
    if (sharedAudioElement) sharedAudioElement.muted = false;
  }

  return sharedAudioElement;
}

/**
 * Detect mobile / touch devices where simultaneous MediaRecorder + WebSpeech API
 * causes hardware microphone contention and audio quality degradation.
 */
export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isTouchMac = typeof document !== 'undefined' && /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || isTouchMac;
}

/**
 * Pick the best supported MediaRecorder MIME type & matching filename extension
 * across iOS Safari (audio/mp4), Android/Desktop Chrome (audio/webm), and Firefox (audio/ogg).
 */
export function getPreferredRecordingFormat() {
  const fallback = { mimeType: 'audio/webm', cleanMimeType: 'audio/webm', extension: 'webm' };
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return fallback;
  }

  const candidates = [
    { mimeType: 'audio/mp4;codecs=mp4a.40.2', cleanMimeType: 'audio/mp4', extension: 'm4a' },
    { mimeType: 'audio/mp4', cleanMimeType: 'audio/mp4', extension: 'm4a' },
    { mimeType: 'audio/webm;codecs=opus', cleanMimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/webm', cleanMimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/ogg;codecs=opus', cleanMimeType: 'audio/ogg', extension: 'ogg' },
  ];

  // Prefer webm/opus on non-Safari browsers, mp4/aac on iOS/Safari
  const isSafari =
    typeof navigator !== 'undefined' &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent || '');

  const ordered = isSafari
    ? candidates
    : [...candidates.slice(2), ...candidates.slice(0, 2)];

  for (const candidate of ordered) {
    try {
      if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
        return candidate;
      }
    } catch {
      // ignore unsupported check errors
    }
  }

  return fallback;
}

/**
 * High-quality microphone constraints that avoid aggressive telephony narrowband
 * filtering while keeping speech clear on phones and desktops.
 */
export function getHighQualityAudioConstraints() {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: { ideal: 1 },
      sampleRate: { ideal: 44100 },
    },
  };
}

/**
 * Speak text aloud using ElevenLabs Text-to-Speech API
 * Unlocks mobile audio synchronously inside the user tap gesture so iOS/Android
 * always plays studio ElevenLabs audio instead of falling back to robotic Web Speech.
 */
export async function speakTextWithElevenLabs(text, options = {}) {
  const {
    voiceId = '21m00Tcm4TlvDq8ikWAM',
    onStart,
    onEnd,
    onError,
  } = options;

  if (!text) return;

  // Stop any currently playing speech
  stopSpeech();

  // Synchronously unlock shared Audio element BEFORE any await so mobile Safari/Chrome
  // preserves the user-gesture media playback permission after the fetch resolves.
  const audioEl = getOrUnlockAudioElement();

  if (onStart) onStart();

  try {
    // 1. Try server backend endpoint first
    let audioUrl = null;
    let response;

    try {
      const apiBase = env.apiBaseUrl || '';
      response = await fetch(`${apiBase}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });
    } catch {
      response = null;
    }

    if (response && response.ok) {
      const blob = await response.blob();
      if (blob && blob.size > 0) {
        audioUrl = URL.createObjectURL(blob);
      }
    }

    // 2. Play ElevenLabs Audio if URL was created successfully
    if (audioUrl && audioEl) {
      activeAudio = audioEl;
      activeAudioUrl = audioUrl;

      return new Promise((resolve) => {
        const cleanup = () => {
          audioEl.onended = null;
          audioEl.onerror = null;
          if (activeAudioUrl === audioUrl) {
            URL.revokeObjectURL(audioUrl);
            activeAudioUrl = null;
          }
          if (activeAudio === audioEl) {
            activeAudio = null;
          }
        };

        audioEl.onended = () => {
          cleanup();
          if (onEnd) onEnd();
          resolve();
        };

        audioEl.onerror = (e) => {
          console.warn('ElevenLabs audio play error, falling back to Web Speech:', e);
          cleanup();
          fallbackWebSpeech(text, onEnd, onError, resolve);
        };

        audioEl.muted = false;
        audioEl.volume = 1.0;
        audioEl.src = audioUrl;
        audioEl.load();

        const playPromise = audioEl.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((err) => {
            console.warn('Audio play blocked/failed, falling back to Web Speech:', err);
            cleanup();
            fallbackWebSpeech(text, onEnd, onError, resolve);
          });
        }
      });
    } else {
      // 3. Fallback to Web Speech API
      return new Promise((resolve) => {
        fallbackWebSpeech(text, onEnd, onError, resolve);
      });
    }
  } catch (err) {
    console.error('Speech error:', err);
    return new Promise((resolve) => {
      fallbackWebSpeech(text, onEnd, onError, resolve);
    });
  }
}

/**
 * Fallback Web Speech Synthesis
 */
function fallbackWebSpeech(text, onEnd, onError, resolve) {
  if (!('speechSynthesis' in window)) {
    if (onError) onError(new Error('Speech synthesis not supported'));
    if (onEnd) onEnd();
    resolve();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    if (onEnd) onEnd();
    resolve();
  };

  utterance.onerror = (e) => {
    if (onError) onError(e);
    if (onEnd) onEnd();
    resolve();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Convert a transaction or receipt object into natural spoken text and speak it with ElevenLabs
 */
export function speakTransactionDetails(tx, categoryName = '', options = {}) {
  if (!tx) return;

  try {
    const rawAmount = Number(tx.amount || 0);
    const amount = isNaN(rawAmount) ? '0.00' : rawAmount.toFixed(2);
    const desc = tx.description || tx.merchant || 'Transaction';
    const categoryStr = categoryName ? ` under category ${categoryName}` : '';
    
    let dateStr = '';
    if (tx.date) {
      try {
        const parsedDate = new Date(tx.date);
        if (!isNaN(parsedDate.getTime())) {
          dateStr = ` on ${parsedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`;
        } else {
          dateStr = ` on ${tx.date}`;
        }
      } catch {
        dateStr = ` on ${tx.date}`;
      }
    }

    const phrase = `Transaction details: ${desc}, amount $${amount}${categoryStr}${dateStr}.`;

    return speakTextWithElevenLabs(phrase, options);
  } catch (err) {
    console.error('speakTransactionDetails error:', err);
  }
}

/**
 * Stop any current speech playback
 */
export function stopSpeech() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.onended = null;
      activeAudio.onerror = null;
    } catch {
      // ignore pause errors
    }
    activeAudio = null;
  }
  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Create a structured voice interaction log entry for Option 2 Voice Audit Store
 */
export function createVoiceLogEntry(rawTranscript, parsedData, transactionId = null) {
  return {
    id: `vlog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    rawTranscript: rawTranscript || parsedData?.raw_transcript || '',
    extracted: {
      merchant: parsedData?.description || parsedData?.merchant || 'Unknown',
      amount: Number(parsedData?.amount || 0),
      date: parsedData?.date || new Date().toISOString().split('T')[0],
    },
    transactionId: transactionId || null,
    source: 'elevenlabs_conversational_voice',
  };
}

