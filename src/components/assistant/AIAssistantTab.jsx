import { useState, useEffect, useRef } from 'react';
import {
  Send, RefreshCw, Mic, MicOff,
  Bot, ShieldCheck
} from 'lucide-react';
import { env } from '../../config/env';
import { answerQuery } from '../../services/agents/assistantAgent';
import { buildFinancialSnapshot } from '../../services/agents/managerAgent';
import {
  createWebSpeechRecognition,
  isMobileDevice,
  getPreferredRecordingFormat,
  getHighQualityAudioConstraints,
} from '../../services/agents/voiceAgent';
import { useBudget } from '../../contexts/BudgetContext';
import { useAuth } from '../../contexts/AuthContext';
import VoiceAuditLogModal from './VoiceAuditLogModal';
import Reveal from '../ui/Reveal';
import { toast } from 'react-hot-toast';
import { checkAndIncrementQuota, QUOTA_LIMITS, getNextMondayCountdown } from '../../utils/quotaManager';

// ── Markdown rendering helpers ──────────────────────────────────────────────

function formatInlineMarkdown(str) {
  if (!str) return '';
  return String(str)
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-zinc-400 font-normal">$1</em>');
}

function renderMarkdownText(text) {
  if (!text) return null;
  const paragraphs = String(text).split('\n\n');

  return (
    <div className="space-y-3 text-sm text-zinc-200 leading-relaxed font-sans">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              if (line.startsWith('• ') || line.startsWith('- ')) {
                const content = line.substring(2);
                return (
                  <div key={lIdx} className="flex items-start space-x-2 pl-2 my-1 text-xs text-zinc-300">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
                  </div>
                );
              }
              if (/^\d+\.\s/.test(line)) {
                const content = line.replace(/^\d+\.\s/, '');
                const num = line.match(/^(\d+)\./)[1];
                return (
                  <div key={lIdx} className="flex items-start space-x-2 pl-2 my-1 text-xs text-zinc-300">
                    <span className="text-accent font-bold mt-0.5 min-w-[16px]">{num}.</span>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
                  </div>
                );
              }
              if (line.startsWith('**') && line.endsWith(':**')) {
                return (
                  <h4 key={lIdx} className="font-semibold text-accent text-xs uppercase tracking-wider pt-2 border-t border-zinc-800/60 mt-2">
                    {line.replace(/\*\*/g, '')}
                  </h4>
                );
              }
              if (line.startsWith('###') || line.startsWith('##')) {
                return (
                  <h4 key={lIdx} className="font-semibold text-text text-sm pt-1">
                    {line.replace(/^#+\s*/, '')}
                  </h4>
                );
              }
              return (
                <p key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Agent Pipeline Indicator ────────────────────────────────────────────────

function AgentPipelineBadge({ metrics }) {
  if (!metrics?.sources || metrics.sources.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-text-muted">
      <span className="font-semibold text-accent">Sources:</span>
      {metrics.sources.slice(0, 3).map((s, i) => (
        <a
          key={i}
          href={s.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-accent underline truncate max-w-[200px]"
        >
          {s.title || s.uri}
        </a>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AIAssistantTab() {
  const budgetState = useBudget();
  const { user } = useAuth();

  const { dispatch } = budgetState;
  const messages = budgetState.chatMessages || [];

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVoiceAuditLog, setShowVoiceAuditLog] = useState(false);
  const [isVoicePrompting, setIsVoicePrompting] = useState(false);
  const [isTranscribingPrompt, setIsTranscribingPrompt] = useState(false);

  const assistantUsed = budgetState.quotaUsage?.assistantUsed ?? 0;
  const remainingQueries = Math.max(0, (QUOTA_LIMITS.assistant || 10) - assistantUsed);

  const chatEndRef = useRef(null);
  const promptMediaRecorderRef = useRef(null);
  const promptMediaStreamRef = useRef(null);
  const promptRecordingFormatRef = useRef({ mimeType: 'audio/webm', cleanMimeType: 'audio/webm', extension: 'webm' });
  const promptAudioChunksRef = useRef([]);
  const promptRecognitionRef = useRef(null);
  const welcomeDispatchedRef = useRef(false);
  const hasUserSubmittedRef = useRef(false);

  // Release microphone tracks if tab unmounts while recording
  useEffect(() => {
    return () => {
      if (promptRecognitionRef.current) {
        try { promptRecognitionRef.current.stop(); } catch (_) {}
      }
      if (promptMediaRecorderRef.current && promptMediaRecorderRef.current.state !== 'inactive') {
        try { promptMediaRecorderRef.current.stop(); } catch (_) {}
      }
      if (promptMediaStreamRef.current) {
        promptMediaStreamRef.current.getTracks().forEach((track) => track.stop());
        promptMediaStreamRef.current = null;
      }
    };
  }, []);

  const handleStartPromptVoice = async () => {
    // Pre-validate voice quota before starting recording
    const quotaCheck = await checkAndIncrementQuota(user?.uid, 'voice', budgetState.quotaUsage, {
      skipIncrement: true,
    });
    if (!quotaCheck.allowed) {
      budgetState.openProModal({
        reason: 'QUOTA_EXHAUSTED',
        feature: 'voice',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        resetCountdown: quotaCheck.resetCountdown,
      });
      return;
    }

    promptAudioChunksRef.current = [];
    const onMobile = isMobileDevice();
    const preferredFormat = getPreferredRecordingFormat();
    promptRecordingFormatRef.current = preferredFormat;

    // 1. Native MediaRecorder for full audio recording + transcription (mobile-safe MIME format)
    let recorderStarted = false;
    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(getHighQualityAudioConstraints());
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        promptMediaStreamRef.current = stream;

        let mediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: preferredFormat.mimeType,
            audioBitsPerSecond: 128000,
          });
        } catch {
          mediaRecorder = new MediaRecorder(stream);
        }
        promptMediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            promptAudioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          if (promptMediaStreamRef.current === stream) {
            promptMediaStreamRef.current = null;
          }
          const rawMime = mediaRecorder.mimeType || preferredFormat.cleanMimeType || 'audio/webm';
          const cleanMime = rawMime.split(';')[0].trim();
          const audioBlob = new Blob(promptAudioChunksRef.current, { type: cleanMime });
          await handleTranscribeAndPromptAI(audioBlob);
        };

        mediaRecorder.start(onMobile ? 250 : 100);
        setIsVoicePrompting(true);
        recorderStarted = true;
      } catch (err) {
        console.warn('[AI Prompt Voice] Mic access error:', err);
      }
    }

    // 2. Only run Web Speech simultaneously on desktop; on mobile use it only as fallback
    //    so iOS/Android never have two APIs fighting over the hardware microphone
    if (!onMobile || !recorderStarted) {
      try {
        const recognition = createWebSpeechRecognition(
          (text, isFinal) => {
            if (text) {
              setInputQuery(text);
              if (isFinal && !recorderStarted) {
                setIsVoicePrompting(false);
                handleSendQuery(text);
              }
            }
          },
          (err) => {
            console.warn('[AI Prompt Voice] WebSpeech event warning:', err);
            if (!recorderStarted) {
              setIsVoicePrompting(false);
              toast.error('Microphone busy or unavailable. Try again or type your question.');
            }
          },
          () => {
            if (!recorderStarted) {
              setIsVoicePrompting(false);
            }
          }
        );
        if (recognition) {
          promptRecognitionRef.current = recognition;
          recognition.start();
          if (!recorderStarted) {
            setIsVoicePrompting(true);
          }
        } else if (!recorderStarted) {
          setIsVoicePrompting(false);
          toast.error('Microphone permission denied or busy. Please allow mic access or type below.');
        }
      } catch (_) {
        if (!recorderStarted) {
          setIsVoicePrompting(false);
          toast.error('Microphone permission denied or busy. Please allow mic access or type below.');
        }
      }
    }
  };

  const handleStopPromptVoice = () => {
    setIsVoicePrompting(false);

    if (promptRecognitionRef.current) {
      try { promptRecognitionRef.current.stop(); } catch (_) {}
    }

    if (promptMediaRecorderRef.current && promptMediaRecorderRef.current.state !== 'inactive') {
      try {
        if (typeof promptMediaRecorderRef.current.requestData === 'function') {
          promptMediaRecorderRef.current.requestData();
        }
        promptMediaRecorderRef.current.stop();
      } catch (_) {}
    }
  };

  const handleTranscribeAndPromptAI = async (audioBlob) => {
    let capturedText = '';

    if (audioBlob && audioBlob.size > 100) {
      setIsTranscribingPrompt(true);
      try {
        const ext = promptRecordingFormatRef.current?.extension || (audioBlob.type.includes('mp4') ? 'm4a' : 'webm');
        const formData = new FormData();
        formData.append('audio', audioBlob, `prompt-recording.${ext}`);
        formData.append('mode', 'prompt');

        const apiBase = env.apiBaseUrl || '';
        const response = await fetch(`${apiBase}/api/voice/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          if (response.status === 429 || errJson.error === 'UPSTREAM_RATE_LIMIT') {
            budgetState.openProModal({
              reason: 'UPSTREAM_RATE_LIMIT',
              feature: 'voice',
              used: budgetState.quotaUsage?.voiceUsed ?? QUOTA_LIMITS.voice,
              limit: QUOTA_LIMITS.voice,
              resetCountdown: getNextMondayCountdown(),
            });
            return;
          }
        }

        if (response.ok) {
          const data = await response.json();
          await budgetState.updateQuota('voice');
          if (data.transcript) {
            capturedText = data.transcript;
          }
        }
      } catch (err) {
        console.warn('[Voice Prompt] Audio transcription error:', err);
      } finally {
        setIsTranscribingPrompt(false);
      }
    }

    // Fallback to WebSpeech live text if audio transcription didn't return text
    if (!capturedText && inputQuery.trim()) {
      capturedText = inputQuery.trim();
    }

    if (capturedText) {
      setInputQuery(capturedText);
      toast.success('Voice prompt transcribed!');
      handleSendQuery(capturedText);
    } else {
      toast.error('Could not transcribe audio. Please try speaking again or type your question.');
    }
  };

  // Build financial snapshot for the AI Assistant
  const financialSnapshot = buildFinancialSnapshot(budgetState);

  // Clean, concise greeting if chat history is empty
  useEffect(() => {
    const hasWelcome = messages.some((m) => m.id === 'msg_welcome' || m.text?.includes("financial assistant") || m.text?.includes("AI Financial Assistant"));
    if (messages.length === 0 && !welcomeDispatchedRef.current && !hasWelcome) {
      welcomeDispatchedRef.current = true;
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          id: 'msg_welcome',
          sender: 'assistant',
          source: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Hello! What would you like to review in your budget today?',
        }
      });
    }
  }, [messages, dispatch, user?.displayName]);

  // Smooth scroll to bottom ONLY when user actively sends a message or receives an AI answer
  useEffect(() => {
    if (hasUserSubmittedRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isProcessing]);

  // ── Handle text question ────────────────────────────────────────────────

  const handleSendQuery = async (queryToRun) => {
    const query = (queryToRun || inputQuery).trim();
    if (!query || isProcessing) return;

    // Pre-validate assistant quota
    const quotaCheck = await checkAndIncrementQuota(user?.uid, 'assistant', budgetState.quotaUsage, {
      skipIncrement: true,
    });
    if (!quotaCheck.allowed) {
      budgetState.openProModal({
        reason: 'QUOTA_EXHAUSTED',
        feature: 'assistant',
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        resetCountdown: quotaCheck.resetCountdown,
      });
      return;
    }

    hasUserSubmittedRef.current = true;
    setInputQuery('');
    const userMsgId = `user_${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Append user message
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });

    setIsProcessing(true);

    try {
      const result = await answerQuery(query, financialSnapshot);

      // Intercept 429 rate limit or quota exhaustion from upstream
      if (result.isRateLimit || result.status === 429) {
        budgetState.openProModal({
          reason: 'UPSTREAM_RATE_LIMIT',
          feature: 'assistant',
          used: budgetState.quotaUsage?.assistantUsed ?? QUOTA_LIMITS.assistant,
          limit: QUOTA_LIMITS.assistant,
          resetCountdown: getNextMondayCountdown(),
        });
        return;
      }

      await budgetState.updateQuota('assistant');

      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        source: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: result.answer,
        metrics: result.metrics,
      };

      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiMsg });
    } catch (error) {
      console.error('Assistant query error:', error);
      if (error.status === 429 || error?.data?.error === 'UPSTREAM_RATE_LIMIT' || error?.message?.includes('429')) {
        budgetState.openProModal({
          reason: 'UPSTREAM_RATE_LIMIT',
          feature: 'assistant',
          used: budgetState.quotaUsage?.assistantUsed ?? QUOTA_LIMITS.assistant,
          limit: QUOTA_LIMITS.assistant,
          resetCountdown: getNextMondayCountdown(),
        });
        return;
      }
      toast.error('Failed to process your question.');
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          id: `error_${Date.now()}`,
          sender: 'assistant',
          source: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'I apologize, but I encountered an error. Please try again.',
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Voice Audit Log Inspector Modal */}
      <VoiceAuditLogModal
        isOpen={showVoiceAuditLog}
        onClose={() => setShowVoiceAuditLog(false)}
      />

      {/* ── Minimal Hairline Header ── */}
      <div
        data-tutorial="ai-header-tools"
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]"
      >
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-100">Assistant</h1>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() =>
              budgetState.openProModal({
                reason: 'QUOTA_EXHAUSTED',
                feature: 'assistant',
                used: assistantUsed,
                limit: QUOTA_LIMITS.assistant,
                resetCountdown: getNextMondayCountdown(),
              })
            }
            className="py-1 text-xs font-medium text-zinc-400 tabular-nums transition-colors hover:text-[#c8a24e] cursor-pointer"
            title="Weekly AI Assistant Quota"
          >
            {remainingQueries}/{QUOTA_LIMITS.assistant} left
          </button>

          <button
            type="button"
            onClick={() => setShowVoiceAuditLog(true)}
            className="inline-flex items-center gap-1 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
            title="Inspect voice logs"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-500 shrink-0" strokeWidth={1.5} />
            <span>Logs</span>
          </button>

          <button
            type="button"
            onClick={() => dispatch({ type: 'CLEAR_CHAT_MESSAGES' })}
            title="Clear chat"
            className="py-1 text-xs text-zinc-500 transition-colors hover:text-zinc-200 cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Open Chat Workspace */}
      <div className="mt-4 flex min-h-[calc(100vh-16rem)] sm:min-h-[500px] flex-col justify-between">
        <div className="space-y-5 overflow-y-auto max-h-[580px] pr-1">
          {messages.map((msg) => (
            <div key={msg.id} className="animate-step-enter">
              {msg.sender === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-lg rounded-lg border border-[#E7B956]/25 bg-[#E7B956]/[0.08] px-3.5 py-2.5 text-sm text-zinc-100">
                    <p>{msg.text}</p>
                    <span className="mt-1 block text-right text-[10px] text-zinc-500 tabular-nums">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-l border-white/[0.1] pl-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="font-medium text-zinc-300">ARCA Assistant</span>
                    <span className="tabular-nums">{msg.timestamp}</span>
                  </div>

                  {msg.metrics && <AgentPipelineBadge metrics={msg.metrics} />}

                  <div>{renderMarkdownText(msg.text)}</div>
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 pl-4 text-xs text-zinc-500">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#E7B956]" strokeWidth={1.5} />
              <span>Analyzing your numbers...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Voice Prompt Recording Status Banner */}
        {isVoicePrompting && (
          <div className="mt-3 flex items-center justify-between rounded-md border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Recording voice prompt...</span>
            </div>
            <button
              type="button"
              onClick={handleStopPromptVoice}
              className="rounded border border-rose-400/30 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-500/20 cursor-pointer"
            >
              Done / Send
            </button>
          </div>
        )}

        {isTranscribingPrompt && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-[#E7B956]/30 bg-[#E7B956]/10 px-3.5 py-2 text-xs text-[#E7B956]">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
            <span>Transcribing voice prompt...</span>
          </div>
        )}

        {/* Input Bar */}
        <div
          data-tutorial="ai-input-bar"
          className="mt-4 flex items-center gap-2.5 border-t border-white/[0.08] pt-3.5"
        >
          <button
            type="button"
            data-tutorial="ai-voice-mic"
            onClick={isVoicePrompting ? handleStopPromptVoice : handleStartPromptVoice}
            disabled={isProcessing || isTranscribingPrompt}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isVoicePrompting
                ? 'bg-rose-500/15 text-rose-400'
                : isTranscribingPrompt
                ? 'text-[#c8a24e]'
                : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
            }`}
            title={isVoicePrompting ? 'Stop recording & send prompt' : 'Speak prompt'}
          >
            {isTranscribingPrompt ? (
              <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={1.5} />
            ) : isVoicePrompting ? (
              <MicOff className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Mic className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder={
              isVoicePrompting
                ? 'Listening...'
                : isTranscribingPrompt
                ? 'Transcribing...'
                : 'Ask about your budget...'
            }
            disabled={isTranscribingPrompt}
            className="h-10 flex-1 rounded-lg border border-white/[0.09] bg-[#131311] px-3.5 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#c8a24e] focus:outline-none transition-colors"
          />

          <button
            type="button"
            onClick={() => {
              if (isVoicePrompting) handleStopPromptVoice();
              else handleSendQuery();
            }}
            disabled={
              (!inputQuery.trim() && !isVoicePrompting) || isProcessing || isTranscribingPrompt
            }
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#272724] px-3.5 text-xs font-semibold text-[#c8a24e] transition-colors hover:bg-[#30302c] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Send message"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
