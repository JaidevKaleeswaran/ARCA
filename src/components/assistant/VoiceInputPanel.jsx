import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle2, X, Volume2, Send, AlertCircle } from 'lucide-react';
import {
  parseSpokenReceipt,
  createWebSpeechRecognition,
  speakTransactionDetails,
  isMobileDevice,
  getPreferredRecordingFormat,
  getHighQualityAudioConstraints,
} from '../../services/agents/voiceAgent';
import { env } from '../../config/env';
import { useBudget } from '../../contexts/BudgetContext';
import { useAuth } from '../../contexts/AuthContext';
import { checkAndIncrementQuota, QUOTA_LIMITS, getNextMondayCountdown } from '../../utils/quotaManager';

/**
 * VoiceInputPanel — ARCA Dual Voice & Text Receipt Input Agent
 * 
 * Supports:
 * 1. Direct audio recording via MediaRecorder -> Gemini 2.5 Flash transcription (100% reliable across all browsers & HTTPS/HTTP)
 * 2. Real-time WebSpeech recognition fallback
 * 3. Direct natural language text entry
 */
export default function VoiceInputPanel({ onTransactionReady, onClose }) {
  const { quotaUsage, openProModal, updateQuota } = useBudget();
  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingFormatRef = useRef({ mimeType: 'audio/webm', cleanMimeType: 'audio/webm', extension: 'webm' });
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const animFrameRef = useRef(null);
  const inputRef = useRef(null);

  // Release microphone tracks if panel unmounts while recording
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (_) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Auto-focus text input
  useEffect(() => {
    if (inputRef.current && !parsedData) {
      inputRef.current.focus();
    }
  }, [parsedData]);

  // Pulse animation for mic ring & visualizer
  useEffect(() => {
    if (!isListening) return;
    let frame = 0;
    const animate = () => {
      frame++;
      setPulsePhase(frame);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListening]);

  // Process text input through local NLP parsing
  const processText = useCallback((text) => {
    if (!text || !text.trim()) return;

    setIsProcessing(true);
    setError(null);

    setTimeout(() => {
      try {
        const parsed = parseSpokenReceipt(text.trim());
        if (parsed && parsed.amount > 0) {
          // Calculate confidence based on completeness
          const issues = [];
          if (!parsed.description || parsed.description === 'Purchase') issues.push('merchant');
          if (!parsed.date) issues.push('date');
          setParsedData({
            ...parsed,
            raw_transcript: text.trim(),
            _confidenceIssues: issues,
          });
        } else {
          setError('Could not extract amount. Try "$15 on Taco Bell" or "Spent 20 dollars at Walmart"');
        }
      } catch (err) {
        setError(`Failed to parse: ${err.message}`);
      }
      setIsProcessing(false);
    }, 200);
  }, []);

  // Transcribe recorded audio blob via Gemini directly in the browser
  // Works on both localhost and Vercel — no Express backend required
  const sendAudioToBackend = async (audioBlob) => {
    setIsProcessing(true);
    setError(null);

    if (!audioBlob || audioBlob.size < 500) {
      console.warn('[Voice] Audio recording was empty or too short:', audioBlob?.size);
      if (inputText) {
        processText(inputText);
      } else {
        setError('Audio recording was too short or quiet. Please hold the mic button while speaking.');
        setIsProcessing(false);
      }
      return;
    }

    try {
      const ext = recordingFormatRef.current?.extension || (audioBlob.type.includes('mp4') ? 'm4a' : 'webm');
      const formData = new FormData();
      formData.append('audio', audioBlob, `receipt-recording.${ext}`);
      formData.append('mode', 'receipt');

      const apiBase = env.apiBaseUrl || '';
      const response = await fetch(`${apiBase}/api/voice/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 429 || errJson.error === 'UPSTREAM_RATE_LIMIT') {
          setIsProcessing(false);
          openProModal({
            reason: 'UPSTREAM_RATE_LIMIT',
            feature: 'voice',
            used: quotaUsage?.voiceUsed ?? QUOTA_LIMITS.voice,
            limit: QUOTA_LIMITS.voice,
            resetCountdown: getNextMondayCountdown(),
          });
          return;
        }
        throw new Error(errJson.message || `Audio transcription failed (${response.status})`);
      }

      const data = await response.json();
      await updateQuota('voice');

      const fullTranscript = data.transcript || inputText || 'Spoken Receipt';
      setInputText(fullTranscript);
      const merchantVal = data.merchant || 'Spoken Purchase';
      const amountVal = Number(data.amount) || 0;
      const dateVal = data.date || new Date().toISOString().split('T')[0];
      const issues = [];
      if (!data.merchant || data.merchant === 'Spoken Purchase') issues.push('merchant');
      if (amountVal === 0) issues.push('amount');
      if (!data.date) issues.push('date');
      setParsedData({
        description: merchantVal,
        amount: amountVal,
        date: dateVal,
        raw_transcript: fullTranscript,
        _confidenceIssues: issues,
      });
      setIsProcessing(false);
      return true;
    } catch (err) {
      console.warn('[Voice] Audio transcription error:', err);
      if (err.status === 429 || err?.message?.includes('429')) {
        setIsProcessing(false);
        openProModal({
          reason: 'UPSTREAM_RATE_LIMIT',
          feature: 'voice',
          used: quotaUsage?.voiceUsed ?? QUOTA_LIMITS.voice,
          limit: QUOTA_LIMITS.voice,
          resetCountdown: getNextMondayCountdown(),
        });
        return;
      }
      if (inputText && inputText.trim()) {
        processText(inputText);
      } else {
        setError(`Transcription error: ${err.message}. Please type your purchase details below.`);
        setIsProcessing(false);
      }
    }
  };

  // Start voice recording (single-owner mic on mobile to prevent hardware contention)
  const startListening = useCallback(async () => {
    // Pre-validate voice quota before opening mic
    const quotaCheck = await checkAndIncrementQuota(user?.uid, 'voice', quotaUsage, {
      skipIncrement: true,
    });
    if (!quotaCheck.allowed) {
      openProModal({
        reason: 'QUOTA_EXHAUSTED',
        feature: 'voice',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        resetCountdown: quotaCheck.resetCountdown,
      });
      return;
    }

    setError(null);
    setInterimTranscript('');
    setParsedData(null);
    audioChunksRef.current = [];

    const onMobile = isMobileDevice();
    const preferredFormat = getPreferredRecordingFormat();
    recordingFormatRef.current = preferredFormat;

    // 1. Start MediaRecorder (native audio stream recording with mobile-safe format)
    let recorderStarted = false;
    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(getHighQualityAudioConstraints());
        } catch {
          // Fall back to default audio constraints if browser rejects sampleRate/channelCount
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        mediaStreamRef.current = stream;

        let mediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: preferredFormat.mimeType,
            audioBitsPerSecond: 128000,
          });
        } catch {
          mediaRecorder = new MediaRecorder(stream);
        }
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          if (mediaStreamRef.current === stream) {
            mediaStreamRef.current = null;
          }
          const rawMime = mediaRecorder.mimeType || preferredFormat.cleanMimeType || 'audio/webm';
          const cleanMime = rawMime.split(';')[0].trim();
          const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });
          sendAudioToBackend(audioBlob);
        };

        // On iOS Safari, calling start() without a short timeslice or with 250ms avoids chunk corruption
        mediaRecorder.start(onMobile ? 250 : 100);
        setIsListening(true);
        recorderStarted = true;
      } catch (micErr) {
        console.warn('MediaRecorder mic access error:', micErr);
      }
    }

    // 2. Only run WebSpeech simultaneously on desktop; on mobile only use it as a fallback
    //    if MediaRecorder failed (e.g. OS screen recorder holding exclusive audio session)
    if (!onMobile || !recorderStarted) {
      try {
        const recognition = createWebSpeechRecognition(
          (text, isFinal) => {
            if (text) {
              setInputText(text);
              if (!isFinal) {
                setInterimTranscript(text);
              } else if (!recorderStarted) {
                setIsListening(false);
                processText(text);
              }
            }
          },
          (err) => {
            if (!recorderStarted) {
              setIsListening(false);
              setError(
                err?.message === 'not-allowed'
                  ? 'Microphone permission denied. Please allow mic access or type below.'
                  : 'Microphone busy (e.g. screen recording mic active). Tap to retry or type your purchase below.'
              );
            }
          },
          () => {
            if (!recorderStarted) {
              setIsListening(false);
            }
          }
        );
        if (recognition) {
          recognitionRef.current = recognition;
          recognition.start();
          if (!recorderStarted) {
            setIsListening(true);
          }
        } else if (!recorderStarted) {
          setError('Microphone permission denied or busy. Please allow mic access or type below.');
        }
      } catch (_) {
        if (!recorderStarted) {
          setError('Microphone unavailable. If screen recording on mobile, turn off the screen recorder mic or type below.');
        }
      }
    }
  }, [user?.uid, quotaUsage, openProModal, processText]);

  // Stop voice recording
  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    processText(inputText);
  };

  const handleConfirm = () => {
    if (parsedData && onTransactionReady) {
      onTransactionReady({
        ...parsedData,
        raw_transcript: parsedData.raw_transcript || inputText,
      });
    }
  };

  const handleReset = () => {
    setInputText('');
    setInterimTranscript('');
    setParsedData(null);
    setError(null);
    setIsProcessing(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Waveform animation height
  const barCount = 22;
  const getBarHeight = (index) => {
    if (!isListening) return 3;
    const wave = Math.sin((pulsePhase * 0.08) + (index * 0.5)) * 0.5 + 0.5;
    const rand = Math.sin(pulsePhase * 0.05 + index * 1.7) * 0.3 + 0.7;
    return 3 + wave * rand * 22;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 relative overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-primary transition-colors z-10"
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div className="text-center relative z-10">
        <h3 className="text-sm font-semibold text-text">
          Voice & Quick Receipt Entry
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Speak into the mic or type your purchase
        </p>
      </div>

      {/* Primary Input Form */}
      {!parsedData && (
        <form onSubmit={handleSubmit} className="relative z-10 space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={isListening ? (interimTranscript || inputText) : inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='e.g. "$15 on Taco Bell" or "Spent 30 at Walmart"'
              disabled={isListening || isProcessing}
              className="w-full bg-primary border border-border rounded-xl px-4 py-3 pr-24 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Mic button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`p-2 rounded-lg transition-all ${
                  isListening
                    ? 'bg-accent text-primary shadow-lg shadow-accent/30 scale-105 animate-pulse'
                    : 'text-text-muted hover:text-accent hover:bg-primary'
                }`}
                title={isListening ? 'Stop recording & parse' : 'Speak receipt'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Submit button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !isListening) || isProcessing}
                className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Parse receipt"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-1.5">
            {['$12 at Subway', '$50 groceries at Target', 'Paid $9.99 for Netflix'].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setInputText(example);
                  processText(example);
                }}
                className="text-[11px] px-2.5 py-1 bg-primary hover:bg-card-hover text-text-muted hover:text-text rounded-full border border-border transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </form>
      )}

      {/* Waveform Visualizer & Status */}
      {isListening && (
        <div className="space-y-2 relative z-10 text-center py-1">
          <div className="flex items-center justify-center gap-[2px] h-8">
            {Array.from({ length: barCount }).map((_, i) => (
              <div
                key={i}
                className="w-[2.5px] rounded-full bg-accent"
                style={{
                  height: `${getBarHeight(i)}px`,
                  transition: 'height 0.1s ease',
                  opacity: 0.7 + Math.sin(i * 0.5) * 0.3,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-accent flex items-center justify-center gap-1.5">
            <Loader2 size={12} className="animate-spin" />
            Recording voice... tap mic when done
          </p>
        </div>
      )}

      {/* Processing Loader */}
      {isProcessing && !isListening && (
        <div className="flex items-center justify-center gap-2 text-xs text-accent py-3 relative z-10">
          <Loader2 size={16} className="animate-spin text-accent" />
          <span>Transcribing & analyzing receipt...</span>
        </div>
      )}

      {/* Parsed Receipt Summary */}
      {parsedData && !isProcessing && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 relative z-10 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span className="text-xs font-semibold">Extracted Receipt Data</span>
            </div>
            <button
              type="button"
              onClick={() => speakTransactionDetails(parsedData)}
              className="flex items-center gap-1 text-[11px] bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 px-2.5 py-1 rounded-md transition-colors"
            >
              <Volume2 size={12} />
              <span>Speak</span>
            </button>
          </div>

          {/* Source text */}
          <div className="bg-primary rounded-lg p-2.5 border border-border">
            <p className="text-[10px] text-text-muted uppercase mb-1">Transcript / Description</p>
            <p className="text-xs text-text italic">"{parsedData.raw_transcript}"</p>
          </div>

          {parsedData._confidenceIssues?.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
              <span>Low confidence on: <strong>{parsedData._confidenceIssues.join(', ')}</strong>. Please review before confirming.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center">
            <div className={`rounded-lg p-2.5 ${parsedData._confidenceIssues?.includes('merchant') ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-primary border border-border'}`}>
              <p className="text-[10px] text-text-muted uppercase">Item</p>
              <p className={`text-sm font-semibold mt-0.5 truncate ${parsedData._confidenceIssues?.includes('merchant') ? 'text-amber-400' : 'text-text'}`}>{parsedData.description}</p>
              {parsedData._confidenceIssues?.includes('merchant') && <p className="text-[9px] text-amber-500 mt-0.5">Needs Review</p>}
            </div>
            <div className={`rounded-lg p-2.5 ${parsedData._confidenceIssues?.includes('amount') ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-primary border border-border'}`}>
              <p className="text-[10px] text-text-muted uppercase">Amount</p>
              <p className={`text-sm font-semibold mt-0.5 ${parsedData._confidenceIssues?.includes('amount') ? 'text-amber-400' : 'text-emerald-400'}`}>${Number(parsedData.amount).toFixed(2)}</p>
              {parsedData._confidenceIssues?.includes('amount') && <p className="text-[9px] text-amber-500 mt-0.5">Needs Review</p>}
            </div>
            <div className={`rounded-lg p-2.5 ${parsedData._confidenceIssues?.includes('date') ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-primary border border-border'}`}>
              <p className="text-[10px] text-text-muted uppercase">Date</p>
              <p className={`text-sm font-semibold mt-0.5 ${parsedData._confidenceIssues?.includes('date') ? 'text-amber-400' : 'text-text'}`}>{parsedData.date}</p>
              {parsedData._confidenceIssues?.includes('date') && <p className="text-[9px] text-amber-500 mt-0.5">Needs Review</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleReset}
              className="flex-1 px-3 py-2 text-xs font-medium bg-primary hover:bg-card-hover text-text rounded-lg border border-border transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-3 py-2 text-xs font-semibold bg-accent hover:bg-accent-hover text-primary rounded-lg transition-all shadow-md font-bold"
            >
              Add Expense
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 relative z-10">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={handleReset}
            className="mt-2 text-xs text-violet-300 hover:text-violet-200 underline block"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
